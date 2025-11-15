// server.js

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');
const busboy = require('busboy');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Impor Model
const Sparepart = require('./models/sparepart'); 
const Service = require('./models/service'); 
const User = require('./models/User'); 
const Otp = require('./models/Otp'); 
const Cart = require('./models/Cart'); 
const StoreConfig = require('./models/StoreConfig');
const Order = require('./models/Order');

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

// Konfigurasi Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Nodemailer config error:', error.message);
        console.warn('Peringatan: Pastikan GMAIL_USER dan GMAIL_PASS (App Password) sudah benar di .env');
    } else {
        console.log('✅ Nodemailer (Email) configured successfully!');
    }
});

// Koneksi ke MongoDB
const connectDB = async () => {
    if (!MONGO_URI) {
        console.error('❌ MongoDB connection failed: MONGO_URI is undefined. Please check your .env file.');
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
        console.error("Gagal parse Public ID dari URL:", imageUrl, error);
        return null;
    }
}

// Fungsi utilitas (sendResponse & getRequestBody)
const sendResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(JSON.stringify(data));
};

const getRequestBody = (req) => {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {}); 
            } catch (error) {
                console.error("Error parsing JSON body:", error);
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
    
    if (method === 'OPTIONS') {
        sendResponse(res, 204, '');
        return;
    }

    // JALUR KHUSUS DELETE SPAREPART
    if (method === 'DELETE' && path.startsWith('/api/spareparts/')) {
        const id = path.split('/')[3];
        console.log(`[0] Menerima request DELETE (Jalur Khusus) untuk ID: ${id}`);
        
        try {
            const productToDelete = await Sparepart.findById(id);
            if (!productToDelete) {
                return sendResponse(res, 404, { success: false, message: 'Produk tidak ditemukan' });
            }
            const public_id = getPublicIdFromUrl(productToDelete.imageUrl);
            if (public_id) {
                try {
                    await cloudinary.uploader.destroy(public_id);
                    console.log(`[Cloudinary] Berhasil menghapus gambar: ${public_id}`);
                } catch (cldError) {
                    console.warn(`[Cloudinary] Gagal menghapus gambar: ${public_id}. Error:`, cldError.message);
                }
            } else {
                console.warn(`[Cloudinary] Tidak bisa mendapatkan Public ID dari URL: ${productToDelete.imageUrl}`);
            }
            await Sparepart.findByIdAndDelete(id);
            console.log(`[0] Produk berhasil dihapus dari DB: ${id}`);
            return sendResponse(res, 200, { success: true, message: 'Produk dan gambar berhasil dihapus' });
        } catch (error) {
            console.error('[0] ERROR DELETE:', error);
            return sendResponse(res, 500, { success: false, message: 'Gagal menghapus produk' });
        }
    }
    
    // Rute Status Toko
    else if (path === '/api/store/status' && method === 'GET') {
        console.log('[0] Menerima request GET /api/store/status...');
        try {
            let config = await StoreConfig.findOne();
            if (!config) {
                config = await StoreConfig.create({ isStoreOpen: true });
            }
            return sendResponse(res, 200, { success: true, isStoreOpen: config.isStoreOpen });
        } catch (error) {
            console.error('[0] ERROR GET Store Status:', error);
            return sendResponse(res, 500, { success: false, message: 'Gagal mengambil status toko' });
        }
    }
    else if (path === '/api/store/status' && method === 'PUT') {
        console.log('[0] Menerima request PUT /api/store/status...');
        try {
            const body = await getRequestBody(req);
            const config = await StoreConfig.findOneAndUpdate(
                {}, 
                { isStoreOpen: body.isStoreOpen }, 
                { new: true, upsert: true } 
            );
            console.log(`[Store Status] Toko sekarang: ${config.isStoreOpen ? 'BUKA' : 'TUTUP'}`);
            return sendResponse(res, 200, { success: true, isStoreOpen: config.isStoreOpen });
        } catch (error) {
            console.error('[0] ERROR PUT Store Status:', error);
            return sendResponse(res, 500, { success: false, message: 'Gagal update status toko' });
        }
    }

    //Routing Sparepart 
    else if (path.startsWith('/api/spareparts')) {
        
        if (path === '/api/spareparts' && method === 'GET') {
            console.log('[0] Menerima request GET /api/spareparts...'); 
            try {
                const spareparts = await Sparepart.find({});
                sendResponse(res, 200, { success: true, count: spareparts.length, data: spareparts });
            } catch (error) {
                console.error('[0] CRITICAL ERROR di /api/spareparts:', error);
                sendResponse(res, 500, { success: false, message: 'Server error retrieving spareparts' });
            }
        } 
        else if (path === '/api/spareparts' && method === 'POST') {
            try {
                const body = await getRequestBody(req);
                const newSparepart = await Sparepart.create(body);
                sendResponse(res, 201, { success: true, message: 'Sparepart created', data: newSparepart });
            } catch (error) {
                const message = error.name === 'ValidationError' ? error.message : 'Server error creating sparepart';
                sendResponse(res, 400, { success: false, message: message });
            }
        } 
        else if (method === 'PUT' && path.split('/').length === 4) {
            console.log('[0] Menerima request PUT /api/spareparts/:id...');
            try {
                const id = path.split('/')[3];
                if (!id) {
                    return sendResponse(res, 400, { success: false, message: 'ID produk tidak ditemukan di URL' });
                }
                const body = await getRequestBody(req);
                const updatedSparepart = await Sparepart.findByIdAndUpdate(id, body, {
                    new: true,
                    runValidators: true
                });
                if (!updatedSparepart) {
                    return sendResponse(res, 404, { success: false, message: 'Produk tidak ditemukan' });
                }
                console.log(`[0] Produk berhasil di-update: ${updatedSparepart._id}`);
                sendResponse(res, 200, { success: true, message: 'Produk berhasil diperbarui', data: updatedSparepart });
            } catch (error) {
                console.error('[0] CRITICAL ERROR di PUT /api/spareparts:', error);
                const message = error.name === 'ValidationError' ? error.message : 'Server error saat memperbarui produk';
                sendResponse(res, 400, { success: false, message: message });
            }
        }
        else if (method === 'GET' && path.split('/').length === 4) {
            const id = path.split('/')[3];
            try {
                const sparepart = await Sparepart.findById(id);
                if (!sparepart) {
                    return sendResponse(res, 404, { success: false, message: 'Sparepart not found' });
                }
                sendResponse(res, 200, { success: true, data: sparepart });
            } catch (error) {
                sendResponse(res, 500, { success: false, message: 'Server error retrieving sparepart' });
            }
        }
    } 
    
    // --- Routing Jasa (Services)
    else if (path.startsWith('/api/services')) {
        
        if (path === '/api/services' && method === 'GET') {
            try {
                const services = await Service.find({});
                sendResponse(res, 200, { success: true, count: services.length, data: services });
            } catch (error) {
                console.error('[0] ERROR di /api/services (GET):', error);
                sendResponse(res, 500, { success: false, message: 'Server error retrieving services' });
            }
        } 
        else if (path === '/api/services' && method === 'POST') {
            try {
                const body = await getRequestBody(req);
                const newService = await Service.create(body);
                sendResponse(res, 201, { success: true, message: 'Service created', data: newService });
            } catch (error) {
                const message = error.name === 'ValidationError' ? error.message : 'Server error creating service';
                sendResponse(res, 400, { success: false, message: message });
            }
        }
        else if (method === 'GET' && path.split('/').length === 4) {
            const id = path.split('/')[3];
            try {
                const service = await Service.findById(id);
                if (!service) {
                    return sendResponse(res, 404, { success: false, message: 'Service not found' });
                }
                sendResponse(res, 200, { success: true, data: service });
            } catch (error) {
                sendResponse(res, 500, { success: false, message: 'Server error retrieving service' });
            }
        }
    }

    // --- UPLOAD GAMBAR ---
    else if (path === '/api/upload' && method === 'POST') {
        if (!req.headers['content-type'] || !req.headers['content-type'].startsWith('multipart/form-data')) {
            return sendResponse(res, 400, { success: false, message: 'Content-Type harus multipart/form-data' });
        }
        try {
            const bb = busboy({ headers: req.headers });
            bb.on('file', (name, fileStream, info) => {
                const { filename } = info;
                const uniqueFilename = filename.split('.').slice(0, -1).join('.');
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "ponti_jaya_motor",
                        public_id: uniqueFilename,
                        overwrite: true
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                            return sendResponse(res, 500, { success: false, message: 'Upload ke Cloudinary gagal' });
                        }
                        sendResponse(res, 201, {
                            success: true,
                            message: 'File berhasil di-upload',
                            url: result.secure_url,
                            public_id: result.public_id
                        });
                    }
                );
                fileStream.pipe(uploadStream);
            });
            bb.on('error', (err) => {
                console.error('Busboy error:', err);
                sendResponse(res, 500, { success: false, message: 'Gagal mem-parsing file' });
            });
            req.pipe(bb);
        } catch (error) {
            console.error('Error di /api/upload:', error);
            sendResponse(res, 500, { success: false, message: 'Internal server error' });
        }
    }

    // --- RUTE KIRIM OTP ---
    else if (path === '/api/send-otp' && method === 'POST') {
        console.log('[0] Menerima request POST /api/send-otp...');
        try {
            const { email } = await getRequestBody(req);
            if (!email) {
                return sendResponse(res, 400, { success: false, message: 'Email wajib diisi' });
            }
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return sendResponse(res, 400, { success: false, message: 'Email sudah terdaftar' });
            }
            await Otp.deleteMany({ email });
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            await transporter.sendMail({
                from: `"Ponti Jaya Motor" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: 'Kode Verifikasi Anda - Ponti Jaya Motor',
                text: `Kode verifikasi Anda adalah: ${otp}`,
                html: `<b>Kode verifikasi Anda adalah: ${otp}</b><br><p>Kode ini akan kedaluwarsa dalam 5 menit.</p>` 
            });
            await Otp.create({ email, otp });
            console.log(`[0] OTP ${otp} berhasil dikirim ke ${email}`);
            sendResponse(res, 200, { success: true, message: `OTP telah dikirim ke ${email}` });
        } catch (error) {
            console.error('[0] CRITICAL ERROR di /api/send-otp:', error);
            sendResponse(res, 500, { success: false, message: 'Gagal mengirim OTP' });
        }
    }

    // --- RUTE REGISTRASI PENGGUNA ---
    else if (path === '/api/daftar' && method === 'POST') {
        console.log('[0] Menerima request POST /api/daftar...'); 
        try {
            const body = await getRequestBody(req); 
            const { username, email, password, otp } = body;
            if (!username || !email || !password || !otp) {
                return sendResponse(res, 400, { success: false, message: 'Semua field (termasuk OTP) wajib diisi' });
            }
            const fiveMinutesAgo = new Date(Date.now() - 300 * 1000); 
            const validOtp = await Otp.findOne({
                email: email,
                otp: otp,
                createdAt: { $gte: fiveMinutesAgo } 
            });
            if (!validOtp) {
                return sendResponse(res, 400, { success: false, message: 'Kode OTP salah atau telah kedaluwarsa' });
            }
            const existingUser = await User.findOne({ $or: [{ email: email }, { username: username }] });
            if (existingUser) {
                const message = existingUser.email === email ? 'Email sudah terdaftar' : 'Username sudah digunakan';
                return sendResponse(res, 400, { success: false, message: message });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const newUser = await User.create({
                username,
                email,
                password: hashedPassword
            });
            await Cart.create({ user: newUser._id, items: [] });
            console.log(`[0] Keranjang kosong dibuat untuk user: ${newUser.username}`);
            console.log(`[0] User baru berhasil dibuat: ${newUser.username}`);
            await Otp.deleteMany({ email });
            sendResponse(res, 201, { 
                success: true, 
                message: 'User berhasil dibuat', 
                data: { userId: newUser._id, username: newUser.username } 
            });
        } catch (error) {
            console.error('[0] CRITICAL ERROR di /api/daftar:', error);
            const message = error.name === 'ValidationError' ? error.message : 'Server error saat membuat user';
            sendResponse(res, 400, { success: false, message: message });
        }
    }

    // --- RUTE LOGIN ---
    else if (path === '/api/login' && method === 'POST') {
        console.log('[0] Menerima request POST /api/login...');
        try {
            const body = await getRequestBody(req);
            const { identifier, password } = body; 
            if (!identifier || !password) {
                return sendResponse(res, 400, { success: false, message: 'Username/Email dan password wajib diisi' });
            }
            const user = await User.findOne({
                $or: [{ email: identifier }, { username: identifier }]
            });
            if (!user) {
                return sendResponse(res, 404, { success: false, message: 'Username atau Email tidak ditemukan' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return sendResponse(res, 400, { success: false, message: 'Password salah' });
            }
            console.log(`[0] Login berhasil untuk: ${user.username} (Role: ${user.role})`);
            sendResponse(res, 200, {
                success: true,
                message: 'Login berhasil',
                data: {
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('[0] CRITICAL ERROR di /api/login:', error);
            sendResponse(res, 500, { success: false, message: 'Server error saat login' });
        }
    }
    
    // --- [RUTE BARU 1] GET PROFIL USER ---
    else if (path === '/api/users/profile' && method === 'GET') {
        console.log('[0] Menerima request GET /api/users/profile...');
        try {
            const userId = parsedUrl.searchParams.get('userId');
            if (!userId) {
                return sendResponse(res, 400, { success: false, message: 'userId query parameter wajib diisi' });
            }

            const user = await User.findById(userId).select('-password'); // Ambil semua KECUALI password
            if (!user) {
                return sendResponse(res, 404, { success: false, message: 'User tidak ditemukan' });
            }
            
            sendResponse(res, 200, { success: true, data: user });

        } catch (error) {
            console.error('[0] CRITICAL ERROR di GET /api/users/profile:', error);
            sendResponse(res, 500, { success: false, message: 'Server error saat mengambil profil' });
        }
    }

    // --- [RUTE BARU 2] PUT PROFIL USER ---
    else if (path === '/api/users/profile' && method === 'PUT') {
        console.log('[0] Menerima request PUT /api/users/profile...');
        try {
            const body = await getRequestBody(req);
            const { userId, username, telpon, alamat } = body;

            if (!userId) {
                return sendResponse(res, 400, { success: false, message: 'userId wajib diisi' });
            }
            
            // Cek jika username baru sudah dipakai user lain
            const existingUser = await User.findOne({ username: username, _id: { $ne: userId } });
            if (existingUser) {
                return sendResponse(res, 400, { success: false, message: 'Username tersebut sudah digunakan oleh akun lain' });
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { username, telpon, alamat },
                { new: true, runValidators: true } // Kirim balik data baru & jalankan validator
            ).select('-password');

            if (!updatedUser) {
                return sendResponse(res, 404, { success: false, message: 'User tidak ditemukan' });
            }
            
            console.log(`[0] Profil user ${userId} berhasil di-update`);
            sendResponse(res, 200, { success: true, message: 'Profil berhasil disimpan', data: updatedUser });

        } catch (error) {
            console.error('[0] CRITICAL ERROR di PUT /api/users/profile:', error);
            sendResponse(res, 500, { success: false, message: 'Gagal update profil' });
        }
    }
    
    // --- RUTE GET ALL USERS ---
    else if (path === '/api/users' && method === 'GET') {
        console.log('[0] Menerima request GET /api/users...');
        try {
            const users = await User.find({}).select('-password');
            console.log(`[0] Berhasil! Ditemukan ${users.length} pengguna.`);
            sendResponse(res, 200, { success: true, count: users.length, data: users });
        } catch (error) {
            console.error('[0] CRITICAL ERROR di /api/users:', error);
            sendResponse(res, 500, { success: false, message: 'Server error saat mengambil data pengguna' });
        }
    }

    // --- RUTE KERANJANG (GET) ---
    else if (path === '/api/cart' && method === 'GET') {
        console.log('[0] Menerima request GET /api/cart...');
        try {
            const userId = parsedUrl.searchParams.get('userId');
            if (!userId) {
                return sendResponse(res, 400, { success: false, message: 'userId query parameter wajib diisi' });
            }
            const cart = await Cart.findOne({ user: userId }); 
            if (!cart) {
                console.log(`[0] Tidak ada keranjang ditemukan untuk user ${userId}.`);
                return sendResponse(res, 200, { success: true, data: { _id: null, user: userId, items: [] } });
            }
            console.log(`[0] Keranjang ditemukan untuk user ${userId}, mengirim ${cart.items.length} item.`);
            sendResponse(res, 200, { success: true, data: cart });
        } catch (error) {
            console.error('[0] CRITICAL ERROR di GET /api/cart:', error);
            sendResponse(res, 500, { success: false, message: 'Server error saat mengambil keranjang' });
        }
    }

    // --- RUTE KERANJANG (TAMBAH ITEM) ---
    else if (path === '/api/cart/add' && method === 'POST') {
        console.log('[0] Menerima request POST /api/cart/add...');
        try {
            const body = await getRequestBody(req);
            const { userId, productId, name, price, image, itemType, quantity = 1 } = body;
            if (!userId) {
                return sendResponse(res, 400, { success: false, message: 'User ID tidak valid. Harap login kembali.' });
            }
            if (!productId || !name || !price || !image || !itemType) {
                return sendResponse(res, 400, { success: false, message: 'Data item tidak lengkap' });
            }
            let cart = await Cart.findOne({ user: userId });
            if (!cart) {
                 console.log(`[0] Keranjang tidak ada untuk ${userId}, membuatkan...`);
                 cart = await Cart.create({ user: userId, items: [] });
            }
            const existingItem = cart.items.find(item => item.productId === productId);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({ 
                    productId, 
                    nama: name, 
                    harga: price, 
                    image, 
                    itemType, 
                    quantity 
                });
            }
            await cart.save(); 
            console.log(`[0] Item ${name} ditambahkan ke keranjang user ${userId}`);
            sendResponse(res, 200, { success: true, message: 'Item ditambahkan ke keranjang', data: cart });
        } catch (error) {
            console.error('[0] CRITICAL ERROR di POST /api/cart/add:', error);
            sendResponse(res, 500, { success: false, message: 'Server error saat menambah item' });
        }
    }

    // --- RUTE KERANJANG (UPDATE QTY) ---
    else if (path === '/api/cart/update' && method === 'PUT') {
        console.log('[0] Menerima request PUT /api/cart/update...');
        try {
            const body = await getRequestBody(req);
            const { userId, cartItemId, quantity } = body; 
            if (!userId || !cartItemId || quantity === undefined) {
                return sendResponse(res, 400, { success: false, message: 'Data tidak lengkap' });
            }
            if (quantity < 1) {
                return sendResponse(res, 400, { success: false, message: 'Quantity tidak boleh kurang dari 1' });
            }
            const cart = await Cart.findOne({ user: userId });
            if (!cart) {
                return sendResponse(res, 404, { success: false, message: 'Keranjang tidak ditemukan' });
            }
            const itemToUpdate = cart.items.id(cartItemId);
            if (!itemToUpdate) {
                return sendResponse(res, 404, { success: false, message: 'Item tidak ditemukan di keranjang' });
            }
            itemToUpdate.quantity = quantity;
            await cart.save();
            console.log(`[0] Quantity item ${cartItemId} diupdate menjadi ${quantity}`);
            sendResponse(res, 200, { success: true, message: 'Quantity diperbarui', data: cart });
        } catch (error) {
            console.error('[0] CRITICAL ERROR di PUT /api/cart/update:', error);
            sendResponse(res, 500, { success: false, message: 'Server error saat update quantity' });
        }
    }
    
    // --- RUTE KERANJANG (HAPUS ITEM) ---
    else if (path === '/api/cart/remove' && method === 'POST') {
        console.log('[0] Menerima request POST /api/cart/remove...');
        try {
            const body = await getRequestBody(req);
            const { userId, cartItemId } = body;
            if (!userId || !cartItemId) {
                return sendResponse(res, 400, { success: false, message: 'Data tidak lengkap' });
            }
            const updatedCart = await Cart.findOneAndUpdate(
                { user: userId },
                { $pull: { items: { _id: cartItemId } } },
                { new: true } 
            );
            if (!updatedCart) {
                return sendResponse(res, 404, { success: false, message: 'Keranjang tidak ditemukan' });
            }
            console.log(`[0] Item ${cartItemId} dihapus dari keranjang`);
            sendResponse(res, 200, { success: true, message: 'Item dihapus', data: updatedCart });
        } catch (error) {
            console.error('[0] CRITICAL ERROR di POST /api/cart/remove:', error);
            sendResponse(res, 500, { success: false, message: 'Server error saat menghapus item' });
        }
    }
    
    // --- RUTE PESANAN BARU (UNTUK ADMIN) ---
    else if (path === '/api/orders/all' && method === 'GET') {
        console.log('[0] Menerima request GET /api/orders/all (ADMIN)...');
        try {
            const orders = await Order.find({})
                .populate('user', 'username email') 
                .sort({ createdAt: -1 }); 

            sendResponse(res, 200, { success: true, data: orders });
        } catch (error) {
            console.error('[0] CRITICAL ERROR di GET /api/orders/all:', error);
            sendResponse(res, 500, { success: false, message: 'Server error saat mengambil semua pesanan' });
        }
    }

    // --- RUTE UPDATE STATUS PESANAN (UNTUK ADMIN) ---
    else if (path === '/api/orders/status' && method === 'PUT') {
        console.log('[0] Menerima request PUT /api/orders/status (ADMIN)...');
        try {
            const body = await getRequestBody(req);
            const { orderId, newStatus } = body;

            if (!orderId || !newStatus) {
                return sendResponse(res, 400, { success: false, message: 'Data tidak lengkap (orderId atau newStatus)' });
            }
            
            const updatedOrder = await Order.findByIdAndUpdate(
                orderId,
                { status: newStatus }, 
                { new: true } 
            ).populate('user', 'username email'); 

            if (!updatedOrder) {
                return sendResponse(res, 404, { success: false, message: 'Pesanan tidak ditemukan' });
            }
            
            console.log(`[0] Status pesanan ${orderId} diubah menjadi ${newStatus}`);
            sendResponse(res, 200, { success: true, message: 'Status berhasil diubah', data: updatedOrder });
        } catch (error) {
            console.error('[0] CRITICAL ERROR di PUT /api/orders/status:', error);
            sendResponse(res, 500, { success: false, message: 'Gagal update status' });
        }
    }
    
    // --- RUTE MEMBUAT PESANAN (UNTUK USER) ---
    else if (path === '/api/orders/create' && method === 'POST') {
        console.log('[0] Menerima request POST /api/orders/create...');
        try {
            const body = await getRequestBody(req);
            const { userId, items, shippingAddress, paymentMethod, totalAmount, status } = body;
            if (!userId || !items || !shippingAddress || !paymentMethod || !totalAmount) {
                return sendResponse(res, 400, { success: false, message: 'Data pesanan tidak lengkap' });
            }
            const newOrder = await Order.create({
                user: userId,
                items: items,
                shippingAddress: shippingAddress,
                paymentMethod: paymentMethod,
                totalAmount: totalAmount,
                status: status
            });
            console.log(`[0] Pesanan baru ${newOrder._id} berhasil dibuat untuk user ${userId}`);
            
            const itemProductIds = items.map(item => item.productId);
            await Cart.findOneAndUpdate(
                { user: userId },
                { $pull: { items: { productId: { $in: itemProductIds } } } },
                { new: true }
            );
            console.log(`[0] Item yang di-checkout sudah dihapus dari keranjang user ${userId}`);
            sendResponse(res, 201, { success: true, message: 'Pesanan berhasil dibuat', data: newOrder });
        } catch (error) {
            console.error('[0] CRITICAL ERROR di POST /api/orders/create:', error);
            sendResponse(res, 500, { success: false, message: 'Server error saat membuat pesanan' });
        }
    }

    // --- RUTE MENGAMBIL PESANAN (UNTUK USER) ---
    else if (path === '/api/orders' && method === 'GET') {
        console.log('[0] Menerima request GET /api/orders...');
        try {
            const userId = parsedUrl.searchParams.get('userId');
            if (!userId) {
                return sendResponse(res, 400, { success: false, message: 'userId query parameter wajib diisi' });
            }
            const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
            if (!orders) {
                return sendResponse(res, 200, { success: true, data: [] });
            }
            console.log(`[0] Ditemukan ${orders.length} pesanan untuk user ${userId}`);
            sendResponse(res, 200, { success: true, data: orders });
        } catch (error) {
            console.error('[0] CRITICAL ERROR di GET /api/orders:', error);
            sendResponse(res, 500, { success: false, message: 'Server error saat mengambil pesanan' });
        }
    }
    
    // --- RUTE STATISTIK DASHBOARD ADMIN ---
    else if (path === '/api/admin/dashboard-stats' && method === 'GET') {
        console.log('[0] Menerima request GET /api/admin/dashboard-stats...');
        try {
            const [
                totalRevenueData,
                totalSoldItemsData,
                totalInCartsData,
                lowStockProducts,
                topSellingProducts
            ] = await Promise.all([
                Order.aggregate([
                    { $match: { status: 'Selesai' } },
                    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
                ]),
                Order.aggregate([
                    { $match: { status: 'Selesai' } },
                    { $unwind: '$items' },
                    { $group: { _id: null, total: { $sum: "$items.quantity" } } }
                ]),
                Cart.aggregate([
                    { $unwind: '$items' },
                    { $group: { _id: null, total: { $sum: "$items.quantity" } } }
                ]),
                Sparepart.find({ stok: { $lt: 10 } }).sort({ stok: 1 }),
                Order.aggregate([
                    { $match: { status: 'Selesai' } },
                    { $unwind: '$items' },
                    { $group: { 
                        _id: '$items.productId',
                        totalSold: { $sum: '$items.quantity' } 
                    }},
                    { $sort: { totalSold: -1 } },
                    { $limit: 6 },
                    { $addFields: { "productIdObj": { "$toObjectId": "$_id" } } },
                    { $lookup: {
                        from: 'Sparepart', 
                        localField: 'productIdObj',
                        foreignField: '_id',
                        as: 'productInfo'
                    }},
                    { $unwind: '$productInfo' },
                    { $project: {
                        _id: 0,
                        nama: '$productInfo.nama',
                        imageUrl: '$productInfo.imageUrl',
                        totalSold: '$totalSold'
                    }}
                ])
            ]);
            const stats = {
                totalRevenue: totalRevenueData[0]?.total || 0,
                totalSoldItems: totalSoldItemsData[0]?.total || 0,
                totalInCarts: totalInCartsData[0]?.total || 0
            };
            sendResponse(res, 200, {
                success: true,
                data: {
                    stats,
                    lowStockProducts,
                    topSellingProducts
                }
            });
        } catch (error) {
            console.error('[0] CRITICAL ERROR di GET /api/admin/dashboard-stats:', error);
            sendResponse(res, 500, { success: false, message: 'Gagal mengambil statistik dashboard' });
        }
    }
    
    // --- Rute 404 ---
    else {
        sendResponse(res, 404, { success: false, message: 'Endpoint Not Found' });
    }
});

// Menjalankan Server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server running for Ponti Jaya Motor on http://localhost:${PORT}`);
    });
});