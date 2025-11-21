require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');
const busboy = require('busboy');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// --- 1. IMPORT LIBRARY MIDTRANS ---
const midtransClient = require('midtrans-client');

// Impor Model (Pastikan path model Anda sudah benar)
const Sparepart = require('./models/sparepart'); 
const Service = require('./models/service'); 
const User = require('./models/User'); 
const Otp = require('./models/Otp'); 
const Cart = require('./models/Cart'); 
const StoreConfig = require('./models/StoreConfig');
const Order = require('./models/Order');
const Message = require('./models/Message'); // Pastikan model Message ada

// Variabel Lingkungan
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI; 

console.log('--- Server Start Info ---');
console.log(`Port: ${PORT}`);
console.log('MongoDB URI Status:', MONGO_URI ? 'LOADED' : 'NOT FOUND.');
console.log('-------------------------');

// Konfigurasi Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});
console.log('✅ Cloudinary configured successfully!');

// Konfigurasi Nodemailer (FIX TIMEOUT: Pakai Port 587 + IPv4)
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com', // Host Brevo
    port: 587,                    // Gunakan Port 587 (Lebih stabil dibanding 465)
    secure: false,                // Port 587 pakai secure: false
    auth: {
        user: process.env.SMTP_USER, // Pastikan variables ini ada di Railway
        pass: process.env.SMTP_PASS, 
    },
    // --- BAGIAN INI YANG MEMPERBAIKI ERROR TIMEOUT ---
    tls: {
        rejectUnauthorized: false, // Mencegah error sertifikat
        ciphers: 'SSLv3'
    },
    family: 4,              // <--- WAJIB ADA: Memaksa pakai IPv4 agar tidak macet
    connectionTimeout: 10000, // Waktu tunggu maksimal 10 detik
    greetingTimeout: 5000,
    debug: true,            // Nyalakan log debug
    logger: true
});

transporter.verify((error, success) => {
    if (error) { console.error('❌ Nodemailer Config Error:', error.message); }
    else { console.log('✅ Nodemailer (Email) siap digunakan!'); }
});

// --- 2. INISIALISASI MIDTRANS SNAP & CORE API ---
const snap = new midtransClient.Snap({
    isProduction : false, 
    serverKey : process.env.MIDTRANS_SERVER_KEY,
    clientKey : process.env.MIDTRANS_CLIENT_KEY
});

// Core API untuk Webhook
const coreApi = new midtransClient.CoreApi({
    isProduction : false, 
    serverKey : process.env.MIDTRANS_SERVER_KEY,
    clientKey : process.env.MIDTRANS_CLIENT_KEY
});

console.log('✅ Midtrans Snap configured in Sandbox mode!');

// Koneksi ke MongoDB
const connectDB = async () => {
    if (!MONGO_URI) {
        console.error('❌ MongoDB connection failed: MONGO_URI is undefined.');
        process.exit(1);
    }
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB successfully!');
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1); 
    }
};

// Helper untuk mengekstrak Public ID dari URL Cloudinary
const getPublicIdFromUrl = (imageUrl) => {
    if (!imageUrl) return null;
    try {
        const urlSegment = imageUrl.split('/upload/')[1]; 
        const publicIdWithVersion = urlSegment.substring(urlSegment.indexOf('/') + 1); 
        const public_id = publicIdWithVersion.split('.').slice(0, -1).join('.'); 
        return public_id;
    } catch (error) {
        return null;
    }
}

// Fungsi utilitas (sendResponse & getRequestBody)
const sendResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end(JSON.stringify(data));
};

const getRequestBody = (req) => {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {}); 
            } catch (error) {
                resolve({}); 
            }
        });
    });
};

// Logika Utama Server
const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const path = parsedUrl.pathname; 
    const method = req.method;
    
    // Handle CORS Preflight
    if (method === 'OPTIONS') {
        res.writeHead(204, { 
            'Access-Control-Allow-Origin': '*', 
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        });
        res.end();
        return;
    }

    // --- ROUTING ---

    // DELETE SPAREPART
    if (method === 'DELETE' && path.startsWith('/api/spareparts/')) {
        const id = path.split('/')[3];
        try {
            const productToDelete = await Sparepart.findById(id);
            if (!productToDelete) return sendResponse(res, 404, { success: false, message: 'Produk tidak ditemukan' });
            
            const public_id = getPublicIdFromUrl(productToDelete.imageUrl);
            if (public_id) {
                try {
                    await cloudinary.uploader.destroy(public_id);
                } catch (cldError) {
                    console.warn(`[Cloudinary] Gagal hapus gambar: ${public_id}`);
                }
            }
            await Sparepart.findByIdAndDelete(id);
            return sendResponse(res, 200, { success: true, message: 'Produk dihapus' });
        } catch (error) {
            return sendResponse(res, 500, { success: false, message: 'Gagal menghapus produk' });
        }
    }
    
    // STORE STATUS
    else if (path === '/api/store/status') {
        if (method === 'GET') {
            try {
                let config = await StoreConfig.findOne();
                if (!config) config = await StoreConfig.create({ isStoreOpen: true });
                return sendResponse(res, 200, { success: true, isStoreOpen: config.isStoreOpen });
            } catch (error) {
                return sendResponse(res, 500, { success: false, message: 'Gagal ambil status' });
            }
        } else if (method === 'PUT') {
            try {
                const body = await getRequestBody(req);
                const config = await StoreConfig.findOneAndUpdate({}, { isStoreOpen: body.isStoreOpen }, { new: true, upsert: true });
                return sendResponse(res, 200, { success: true, isStoreOpen: config.isStoreOpen });
            } catch (error) {
                return sendResponse(res, 500, { success: false, message: 'Gagal update status' });
            }
        }
    }

    // SPAREPARTS
    else if (path.startsWith('/api/spareparts')) {
        if (path === '/api/spareparts' && method === 'GET') {
            try {
                const spareparts = await Sparepart.find({});
                sendResponse(res, 200, { success: true, count: spareparts.length, data: spareparts });
            } catch (error) {
                sendResponse(res, 500, { success: false, message: 'Server error' });
            }
        } 
        else if (path === '/api/spareparts' && method === 'POST') {
            try {
                const body = await getRequestBody(req);
                const newSparepart = await Sparepart.create(body);
                sendResponse(res, 201, { success: true, message: 'Created', data: newSparepart });
            } catch (error) {
                sendResponse(res, 400, { success: false, message: error.message });
            }
        } 
        else if (method === 'PUT' && path.split('/').length === 4) {
            try {
                const id = path.split('/')[3];
                const body = await getRequestBody(req);
                const updatedSparepart = await Sparepart.findByIdAndUpdate(id, body, { new: true, runValidators: true });
                if (!updatedSparepart) return sendResponse(res, 404, { success: false, message: 'Not Found' });
                sendResponse(res, 200, { success: true, message: 'Updated', data: updatedSparepart });
            } catch (error) {
                sendResponse(res, 400, { success: false, message: error.message });
            }
        }
        else if (method === 'GET' && path.split('/').length === 4) {
            const id = path.split('/')[3];
            try {
                const sparepart = await Sparepart.findById(id);
                if (!sparepart) return sendResponse(res, 404, { success: false });
                sendResponse(res, 200, { success: true, data: sparepart });
            } catch (error) {
                sendResponse(res, 500, { success: false });
            }
        }
    } 
    
    // SERVICES
    else if (path.startsWith('/api/services')) {
        if (path === '/api/services' && method === 'GET') {
            try {
                const services = await Service.find({});
                sendResponse(res, 200, { success: true, count: services.length, data: services });
            } catch (error) {
                sendResponse(res, 500, { success: false });
            }
        } 
        else if (path === '/api/services' && method === 'POST') {
            try {
                const body = await getRequestBody(req);
                const newService = await Service.create(body);
                sendResponse(res, 201, { success: true, data: newService });
            } catch (error) {
                sendResponse(res, 400, { success: false, message: error.message });
            }
        }
        else if (method === 'GET' && path.split('/').length === 4) {
            const id = path.split('/')[3];
            try {
                const service = await Service.findById(id);
                if (!service) return sendResponse(res, 404, { success: false });
                sendResponse(res, 200, { success: true, data: service });
            } catch (error) {
                sendResponse(res, 500, { success: false });
            }
        }
    }

    // UPLOAD
    else if (path === '/api/upload' && method === 'POST') {
        if (!req.headers['content-type'] || !req.headers['content-type'].startsWith('multipart/form-data')) {
            return sendResponse(res, 400, { success: false, message: 'Must be multipart/form-data' });
        }
        try {
            const bb = busboy({ headers: req.headers });
            bb.on('file', (name, fileStream, info) => {
                const { filename } = info;
                const uniqueFilename = filename.split('.').slice(0, -1).join('.');
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: "ponti_jaya_motor", public_id: uniqueFilename, overwrite: true },
                    (error, result) => {
                        if (error) return sendResponse(res, 500, { success: false, message: 'Upload failed' });
                        sendResponse(res, 201, { success: true, url: result.secure_url, public_id: result.public_id });
                    }
                );
                fileStream.pipe(uploadStream);
            });
            req.pipe(bb);
        } catch (error) {
            sendResponse(res, 500, { success: false });
        }
    }

    // OTP
    else if (path === '/api/send-otp' && method === 'POST') {
        try {
            const { email } = await getRequestBody(req);
            if (!email) return sendResponse(res, 400, { success: false, message: 'Email wajib' });
            
            const existingUser = await User.findOne({ email });
            if (existingUser) return sendResponse(res, 400, { success: false, message: 'Email sudah terdaftar' });
            
            await Otp.deleteMany({ email });
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            
            await transporter.sendMail({
                from: `"Ponti Jaya Motor" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Kode Verifikasi - Ponti Jaya Motor',
                text: `Kode verifikasi: ${otp}`,
                html: `<b>Kode verifikasi: ${otp}</b><br><p>Berlaku 5 menit.</p>` 
            });
            
            await Otp.create({ email, otp });
            console.log(`[OTP] Terkirim ke ${email}`);
            sendResponse(res, 200, { success: true, message: `OTP terkirim ke ${email}` });
        } catch (error) {
            console.error('[OTP Error]', error);
            sendResponse(res, 500, { success: false, message: 'Gagal kirim OTP' });
        }
    }

    // DAFTAR
    else if (path === '/api/daftar' && method === 'POST') {
        try {
            const { username, email, password, otp } = await getRequestBody(req);
            if (!username || !email || !password || !otp) return sendResponse(res, 400, { success: false, message: 'Semua field wajib' });
            
            const fiveMinutesAgo = new Date(Date.now() - 300 * 1000); 
            const validOtp = await Otp.findOne({ email, otp, createdAt: { $gte: fiveMinutesAgo } });
            if (!validOtp) return sendResponse(res, 400, { success: false, message: 'OTP salah/expired' });
            
            const existingUser = await User.findOne({ $or: [{ email }, { username }] });
            if (existingUser) return sendResponse(res, 400, { success: false, message: 'User/Email sudah ada' });
            
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const newUser = await User.create({ username, email, password: hashedPassword });
            await Cart.create({ user: newUser._id, items: [] });
            await Otp.deleteMany({ email });
            
            sendResponse(res, 201, { success: true, data: { userId: newUser._id, username: newUser.username } });
        } catch (error) {
            sendResponse(res, 400, { success: false, message: error.message });
        }
    }

    // LOGIN
    else if (path === '/api/login' && method === 'POST') {
        try {
            const { identifier, password } = await getRequestBody(req);
            if (!identifier || !password) return sendResponse(res, 400, { success: false, message: 'Lengkapi data login' });
            
            const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
            if (!user) return sendResponse(res, 404, { success: false, message: 'User tidak ditemukan' });
            
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return sendResponse(res, 400, { success: false, message: 'Password salah' });
            
            sendResponse(res, 200, { 
                success: true, 
                message: 'Login berhasil', 
                data: { userId: user._id, username: user.username, email: user.email, role: user.role } 
            });
        } catch (error) {
            sendResponse(res, 500, { success: false, message: 'Server error' });
        }
    }
    
    // PROFIL
    else if (path === '/api/users/profile') {
        if (method === 'GET') {
            try {
                const userId = parsedUrl.searchParams.get('userId');
                const user = await User.findById(userId).select('-password');
                if (!user) return sendResponse(res, 404, { success: false });
                sendResponse(res, 200, { success: true, data: user });
            } catch (error) { sendResponse(res, 500, { success: false }); }
        } else if (method === 'PUT') {
            try {
                const { userId, username, telpon, alamat } = await getRequestBody(req);
                const existingUser = await User.findOne({ username, _id: { $ne: userId } });
                if (existingUser) return sendResponse(res, 400, { success: false, message: 'Username terpakai' });
                
                const updatedUser = await User.findByIdAndUpdate(userId, { username, telpon, alamat }, { new: true, runValidators: true }).select('-password');
                sendResponse(res, 200, { success: true, data: updatedUser });
            } catch (error) { sendResponse(res, 500, { success: false }); }
        }
    }

    // USERS LIST
    else if (path === '/api/users' && method === 'GET') {
        try {
            const users = await User.find({}).select('-password');
            sendResponse(res, 200, { success: true, count: users.length, data: users });
        } catch (error) { sendResponse(res, 500, { success: false }); }
    }

    // CART (Simple Routes)
    else if (path.startsWith('/api/cart')) {
        try {
            if (path === '/api/cart' && method === 'GET') {
                const userId = parsedUrl.searchParams.get('userId');
                const cart = await Cart.findOne({ user: userId });
                sendResponse(res, 200, { success: true, data: cart || { user: userId, items: [] } });
            } 
            else if (path === '/api/cart/add' && method === 'POST') {
                const { userId, productId, name, price, image, itemType, quantity = 1 } = await getRequestBody(req);
                let cart = await Cart.findOne({ user: userId });
                if (!cart) cart = await Cart.create({ user: userId, items: [] });
                
                const existingItem = cart.items.find(item => item.productId === productId);
                if (existingItem) existingItem.quantity += quantity;
                else cart.items.push({ productId, nama: name, harga: price, image, itemType, quantity });
                
                await cart.save();
                sendResponse(res, 200, { success: true, data: cart });
            }
            else if (path === '/api/cart/update' && method === 'PUT') {
                const { userId, cartItemId, quantity } = await getRequestBody(req);
                const cart = await Cart.findOne({ user: userId });
                if (cart) {
                    const item = cart.items.id(cartItemId);
                    if (item) { item.quantity = quantity; await cart.save(); }
                }
                sendResponse(res, 200, { success: true, data: cart });
            }
            else if (path === '/api/cart/remove' && method === 'POST') {
                const { userId, cartItemId } = await getRequestBody(req);
                const cart = await Cart.findOneAndUpdate({ user: userId }, { $pull: { items: { _id: cartItemId } } }, { new: true });
                sendResponse(res, 200, { success: true, data: cart });
            }
        } catch (e) { sendResponse(res, 500, { success: false }); }
    }

    // ORDERS (GET ALL & STATUS)
    else if (path === '/api/orders/all' && method === 'GET') {
        try {
            const orders = await Order.find({}).populate('user', 'username email').sort({ createdAt: -1 });
            sendResponse(res, 200, { success: true, data: orders });
        } catch (e) { sendResponse(res, 500, { success: false }); }
    }
    else if (path === '/api/orders/status' && method === 'PUT') {
        try {
            const { orderId, newStatus } = await getRequestBody(req);
            const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });
            sendResponse(res, 200, { success: true, data: updatedOrder });
        } catch (e) { sendResponse(res, 500, { success: false }); }
    }
    else if (path === '/api/orders' && method === 'GET') {
        try {
            const userId = parsedUrl.searchParams.get('userId');
            const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
            sendResponse(res, 200, { success: true, data: orders || [] });
        } catch (e) { sendResponse(res, 500, { success: false }); }
    }

    // DASHBOARD STATS
    else if (path === '/api/admin/dashboard-stats' && method === 'GET') {
        try {
            const [rev, sold, carts, lowStock, top] = await Promise.all([
                Order.aggregate([{ $match: { status: 'Selesai' } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
                Order.aggregate([{ $match: { status: 'Selesai' } }, { $unwind: '$items' }, { $group: { _id: null, total: { $sum: "$items.quantity" } } }]),
                Cart.aggregate([{ $unwind: '$items' }, { $group: { _id: null, total: { $sum: "$items.quantity" } } }]),
                Sparepart.find({ stok: { $lt: 10 } }).sort({ stok: 1 }),
                Order.aggregate([
                    { $match: { status: 'Selesai' } }, { $unwind: '$items' },
                    { $group: { _id: '$items.productId', totalSold: { $sum: '$items.quantity' } } },
                    { $sort: { totalSold: -1 } }, { $limit: 6 },
                    { $addFields: { "productIdObj": { "$toObjectId": "$_id" } } },
                    { $lookup: { from: 'Sparepart', localField: 'productIdObj', foreignField: '_id', as: 'productInfo' } },
                    { $unwind: '$productInfo' },
                    { $project: { _id: 0, nama: '$productInfo.nama', imageUrl: '$productInfo.imageUrl', totalSold: '$totalSold' } }
                ])
            ]);
            const stats = {
                totalRevenue: rev[0]?.total || 0,
                totalSoldItems: sold[0]?.total || 0,
                totalInCarts: carts[0]?.total || 0
            };
            sendResponse(res, 200, { success: true, data: { stats, lowStockProducts: lowStock, topSellingProducts: top } });
        } catch (e) { sendResponse(res, 500, { success: false }); }
    }

    // --- CREATE ORDER (MIDTRANS) DENGAN FIX ORDER ID ---
    else if (path === '/api/orders/create' && method === 'POST') {
        console.log('[0] POST /api/orders/create (Midtrans)...');
        try {
            const body = await getRequestBody(req);
            const { userId, items, shippingAddress, totalAmount, orderId } = body; 
            
            let orderToProcess;

            if (orderId) { 
                orderToProcess = await Order.findById(orderId);
                if (!orderToProcess) return sendResponse(res, 404, { success: false, message: 'Order lama tidak ditemukan.' });
            } else {
                if (!userId || !items || !shippingAddress || !totalAmount) return sendResponse(res, 400, { success: false, message: 'Data tidak lengkap' });
                const user = await User.findById(userId);
                if (!user) return sendResponse(res, 404, { success: false, message: 'User tidak ditemukan' });
                orderToProcess = await Order.create({
                    user: userId,
                    items: items,
                    shippingAddress: shippingAddress,
                    paymentMethod: 'Midtrans', 
                    totalAmount: totalAmount,
                    status: 'Menunggu Pembayaran'
                });
            }
            
            const user = await User.findById(orderToProcess.user); 
            
            const productItems = orderToProcess.items.map(item => ({
                id: item.productId.toString(),
                name: (item.nama || item.name || 'Produk').substring(0, 50),
                price: parseInt(item.harga),
                quantity: parseInt(item.quantity)
            }));
            
            productItems.push({ id: 'SHIPPING', name: 'Ongkos Kirim', price: 15000, quantity: 1 });

            const midtransOrderId = `${orderToProcess._id}-${Date.now()}`;

            let parameter = {
                "transaction_details": {
                    "order_id": midtransOrderId,
                    "gross_amount": orderToProcess.totalAmount
                },
                "customer_details": {
                    "first_name": user.username,
                    "email": user.email,
                    "phone": user.telpon || '081234567890', 
                    "shipping_address": { "address": typeof orderToProcess.shippingAddress === 'string' ? orderToProcess.shippingAddress : "Alamat User" }
                },
                "item_details": productItems, 
                "callbacks": {
                    "finish": `http://localhost:3000/pembelian?status=success`,
                    "error": `http://localhost:3000/pembelian?status=error`,
                    "pending": `http://localhost:3000/pembelian?status=pending`
                },
                "enabled_payments": ["qris", "bca_va", "bni_va", "bri_va", "other_va", "alfamart", "indomaret", "gopay"]
            };

            const transaction = await snap.createTransaction(parameter);
            console.log(`[Midtrans] Token dibuat. DB ID: ${orderToProcess._id}, Midtrans ID: ${midtransOrderId}`);

            sendResponse(res, 201, { 
                success: true, 
                message: 'Token berhasil dibuat', 
                data: { orderId: orderToProcess._id, token: transaction.token }
            });

        } catch (error) {
            console.error('[Create Order Error]', error.message);
            sendResponse(res, 500, { success: false, message: 'Midtrans Error: ' + error.message });
        }
    }

    // ==========================================================
    // FIX 2: WEBHOOK MIDTRANS (DENGAN FIX PEMBERSIHAN ID)
    // ==========================================================
    else if (path === '/api/midtrans/notifikasi' && method === 'POST') {
        console.log('[Webhook] Menerima notifikasi...');
        try {
            const notificationBody = await getRequestBody(req);
            const midtransOrderId = notificationBody.order_id; // ID Panjang (Raw)
            
            // 1. Bersihkan ID untuk ke Database (Hapus suffix timestamp)
            let dbOrderId = midtransOrderId;
            if (midtransOrderId && midtransOrderId.includes('-')) {
                dbOrderId = midtransOrderId.split('-')[0]; 
            }

            if (!dbOrderId) return sendResponse(res, 400, { success: false, message: 'Missing Order ID' });

            console.log(`[Webhook] Raw: ${midtransOrderId} -> Clean DB ID: ${dbOrderId}`);

            // 2. Cek status ke Midtrans pakai ID PANJANG (Raw)
            const transactionStatusResponse = await coreApi.transaction.status(midtransOrderId);
            const { transaction_status, fraud_status, payment_type } = transactionStatusResponse;
            
            // 3. Cek DB pakai ID PENDEK (Clean)
            const order = await Order.findById(dbOrderId);
            if (!order) {
                console.warn(`[Webhook] Order ${dbOrderId} tidak ditemukan di DB.`);
                return sendResponse(res, 404, { success: false });
            }

            // Tentukan Status
            let newStatus = order.status;
            if (transaction_status === 'capture') {
                if (fraud_status === 'accept') newStatus = 'Diproses';
            } else if (transaction_status === 'settlement') {
                newStatus = 'Diproses';
            } else if (transaction_status === 'pending') {
                newStatus = 'Menunggu Pembayaran';
            } else if (['deny', 'cancel', 'expire'].includes(transaction_status)) {
                newStatus = 'Dibatalkan';
            }

            // Update DB
            if (order.status !== newStatus) {
                order.status = newStatus;
                order.paymentMethod = payment_type; 
                await order.save();
                console.log(`[Webhook] Status updated: ${newStatus}`);
                
                if (newStatus === 'Diproses') {
                    const itemProductIds = order.items.map(item => item.productId);
                    await Cart.findOneAndUpdate(
                        { user: order.user },
                        { $pull: { items: { productId: { $in: itemProductIds } } } },
                        { new: true }
                    );
                }
            }
            sendResponse(res, 200, { success: true });
        } catch (error) {
            console.error('[Webhook Error]', error.message);
            // Tetap kirim 200 agar Midtrans tidak retry terus-menerus
            sendResponse(res, 200, { success: false, message: 'Handled Error' }); 
        }
    }

    // MESSAGES (CHAT)
    else if (path === '/api/messages/send' && method === 'POST') {
        try {
            const { senderId, senderName, receiverId, text, isFromAdmin } = await getRequestBody(req);
            const newMessage = await Message.create({ senderId, senderName, receiverId, text, isFromAdmin });
            sendResponse(res, 201, { success: true, data: newMessage });
        } catch (e) { sendResponse(res, 500, { success: false }); }
    }
    else if (path === '/api/messages/history' && method === 'GET') {
        try {
            const userId = parsedUrl.searchParams.get('userId');
            if (!userId) return sendResponse(res, 400, { success: false });
            const messages = await Message.find({
                $or: [{ senderId: userId, receiverId: 'admin' }, { senderId: 'admin', receiverId: userId }]
            }).sort({ createdAt: 1 });
            sendResponse(res, 200, { success: true, data: messages });
        } catch (e) { sendResponse(res, 500, { success: false }); }
    }
    else if (path === '/api/messages/conversations' && method === 'GET') {
        try {
            const senders = await Message.distinct('senderId', { isFromAdmin: false });
            let conversations = [];
            for (let uid of senders) {
                const lastMsg = await Message.findOne({ senderId: uid }).sort({ createdAt: -1 });
                if (lastMsg) {
                    conversations.push({ userId: uid, userName: lastMsg.senderName, lastMessage: lastMsg.text, lastTime: lastMsg.createdAt });
                }
            }
            sendResponse(res, 200, { success: true, data: conversations });
        } catch (e) { sendResponse(res, 500, { success: false }); }
    }
    
    // 404
    else {
        sendResponse(res, 404, { success: false, message: 'Endpoint Not Found' });
    }
});

// START SERVER
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
});