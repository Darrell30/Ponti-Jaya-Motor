// server.js

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');
const busboy = require('busboy');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const url = require('url'); 

// Impor Model
const Sparepart = require('./models/sparepart'); 
const Service = require('./models/service'); 
const User = require('./models/User'); 
const Otp = require('./models/Otp'); 
const Cart = require('./models/Cart'); 

// ... (Konfigurasi, Koneksi DB, Fungsi Utilitas - tidak berubah) ...
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

    // ... (Routing Sparepart, Service, Upload, Auth... tidak berubah) ...
    //Routing Sparepart 
    if (path.startsWith('/api/spareparts')) {
        
        // GET /api/spareparts (Get All)
        if (path === '/api/spareparts' && method === 'GET') {
            
            console.log('[0] Menerima request GET /api/spareparts...'); 
            
            try {
                console.log('[0] Mencoba menjalankan Sparepart.find()...');
                const spareparts = await Sparepart.find({});
                console.log(`[0] Berhasil! Ditemukan ${spareparts.length} sparepart.`);
                sendResponse(res, 200, { success: true, count: spareparts.length, data: spareparts });
                console.log('[0] Respons 200 berhasil dikirim.');
            } catch (error) {
                console.error('[0] CRITICAL ERROR di /api/spareparts:', error);
                sendResponse(res, 500, { success: false, message: 'Server error retrieving spareparts' });
            }
        } 
        // POST /api/spareparts (Create)
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
        
        // PUT /api/spareparts/:id (Update)
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
        
        // GET /api/spareparts/:id (Get by ID)
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
        
        // GET /api/services (Get All)
        if (path === '/api/services' && method === 'GET') {
            try {
                const services = await Service.find({});
                sendResponse(res, 200, { success: true, count: services.length, data: services });
            } catch (error) {
                console.error('[0] ERROR di /api/services (GET):', error);
                sendResponse(res, 500, { success: false, message: 'Server error retrieving services' });
            }
        } 
        // POST /api/services (Create)
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
        // GET /api/services/:id (Get by ID)
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
                
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "ponti_jaya_motor", // Nama folder di Cloudinary
                        public_id: filename 
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
    else if (path === '/api/register' && method === 'POST') {
        
        console.log('[0] Menerima request POST /api/register...'); 
        
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
            
            // ========================================================
            // === PERUBAHAN DI SINI (SESUAI PERMINTAAN ANDA) ===
            // ========================================================
            // Otomatis buatkan keranjang kosong untuk user baru
            await Cart.create({ user: newUser._id, items: [] });
            console.log(`[0] Keranjang kosong dibuat untuk user: ${newUser.username}`);
            // ========================================================
            
            console.log(`[0] User baru berhasil dibuat: ${newUser.username}`);
            await Otp.deleteMany({ email });
            
            sendResponse(res, 201, { 
                success: true, 
                message: 'User berhasil dibuat', 
                data: { userId: newUser._id, username: newUser.username } 
            });

        } catch (error) {
            console.error('[0] CRITICAL ERROR di /api/register:', error);
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

            // PERUBAHAN: Gunakan findOne() dan pastikan keranjang ada
            // (Setelah Langkah 2, ini akan selalu ditemukan untuk user yang login)
            const cart = await Cart.findOne({ user: userId }); 

            if (!cart) {
                console.log(`[0] Tidak ada keranjang ditemukan untuk user ${userId}.`);
                // Jika (karena alasan aneh) keranjang tidak ada, kirim array kosong
                return sendResponse(res, 200, { success: true, data: { items: [] } });
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

            // PENGECEKAN KEAMANAN TAMBAHAN
            if (!userId) {
                console.error('[0] CRITICAL: /api/cart/add dipanggil tanpa userId.');
                return sendResponse(res, 400, { success: false, message: 'User ID tidak valid. Harap login kembali.' });
            }
            
            if (!productId || !name || !price || !image || !itemType) {
                return sendResponse(res, 400, { success: false, message: 'Data item tidak lengkap' });
            }

            // Logika "find-one-and-update" yang lebih aman
            let cart = await Cart.findOne({ user: userId });
            
            // Jika keranjang tidak ada (mis: user lama sebelum update ini), buatkan
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
            // Error E11000 (jika dokumen 'null' belum dihapus) akan tetap tertangkap di sini
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
    // !!! INI ADALAH BUG YANG SAYA SEBUTKAN SEBELUMNYA !!!
    // !!! RUTE INI BELUM ADA DI FILE ANDA !!!
    else if (path === '/api/cart/remove' && method === 'POST') {
        console.log('[0] Menerima request POST /api/cart/remove...');
        try {
            const body = await getRequestBody(req);
            const { userId, cartItemId } = body;

            if (!userId || !cartItemId) {
                return sendResponse(res, 400, { success: false, message: 'Data tidak lengkap' });
            }

            const cart = await Cart.findOne({ user: userId });
            if (!cart) {
                return sendResponse(res, 404, { success: false, message: 'Keranjang tidak ditemukan' });
            }
            
            // Hapus item dari array 'items'
            cart.items.pull({ _id: cartItemId });
            
            await cart.save();
            
            console.log(`[0] Item ${cartItemId} dihapus dari keranjang user ${userId}`);
            sendResponse(res, 200, { success: true, message: 'Item dihapus', data: cart });

        } catch (error) {
            console.error('[0] CRITICAL ERROR di POST /api/cart/remove:', error);
            sendResponse(res, 500, { success: false, message: 'Server error saat menghapus item' });
        }
    }
    
    // --- Rute Status Toko (biarkan saja) ---
    else if (path === '/api/store/status' && method === 'GET') {
        // ... (kode Anda yang ada)
        // (Saya singkat agar tidak terlalu panjang, JANGAN HAPUS KODE ASLI ANDA)
        try {
            let config = await StoreConfig.findOne();
            if (!config) {
                config = await StoreConfig.create({ isStoreOpen: true });
            }
            sendResponse(res, 200, { success: true, isStoreOpen: config.isStoreOpen });
        } catch (error) {
            console.error('[0] ERROR GET Store Status:', error);
            sendResponse(res, 500, { success: false, message: 'Gagal mengambil status toko' });
        }
    }
    else if (path === '/api/store/status' && method === 'PUT') {
        // ... (kode Anda yang ada)
        // (Saya singkat agar tidak terlalu panjang, JANGAN HAPUS KODE ASLI ANDA)
        try {
            const body = await getRequestBody(req);
            const { userId, cartItemId } = body;

            if (!userId || !cartItemId) {
                return sendResponse(res, 400, { success: false, message: 'Data tidak lengkap' });
            }

            // Ganti metode .id().remove() yang lama
            // dengan $pull yang atomik dan modern
            const updatedCart = await Cart.findOneAndUpdate(
                { user: userId },
                { $pull: { items: { _id: cartItemId } } },
                { new: true } // Kembalikan dokumen yang sudah diperbarui
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
    
    // --- Rute 404 ---
    else {
        sendResponse(res, 404, { success: false, message: 'Endpoint Not Found' });
    }
});

// Menjalankan Server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server running for Ponti Jaya Motor on http://localhost:${PORT}`);
        // Saya tambahkan rute remove di log ini
        console.log(`Endpoints: ... /api/cart, /api/cart/add, /api/cart/update, /api/cart/remove`);
    });
});