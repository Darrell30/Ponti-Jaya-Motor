// server.js (LENGKAP DAN SUDAH DIPERBARUI)

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
const User = require('./models/User'); // Model ini SEKARANG memiliki 'role'
const Otp = require('./models/Otp'); 

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
    const { url, method } = req;
    
    if (method === 'OPTIONS') {
        sendResponse(res, 204, '');
        return;
    }

    //Rute Sparepart 
    if (url.startsWith('/api/spareparts')) {
        
        if (url === '/api/spareparts' && method === 'GET') {
            try {
                const spareparts = await Sparepart.find({});
                sendResponse(res, 200, { success: true, count: spareparts.length, data: spareparts });
            } catch (error) {
                sendResponse(res, 500, { success: false, message: 'Server error retrieving spareparts' });
            }
        } 
        else if (url === '/api/spareparts' && method === 'POST') {
            try {
                const body = await getRequestBody(req);
                const newSparepart = await Sparepart.create(body);
                sendResponse(res, 201, { success: true, message: 'Sparepart created', data: newSparepart });
            } catch (error) {
                sendResponse(res, 400, { success: false, message: error.message });
            }
        } 
        else if (method === 'GET' && url.split('/').length === 4) {
            const id = url.split('/')[3];
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
    
    // Rute Jasa
    else if (url.startsWith('/api/services')) {
        
        if (url === '/api/services' && method === 'GET') {
            try {
                const services = await Service.find({});
                sendResponse(res, 200, { success: true, count: services.length, data: services });
            } catch (error) {
                sendResponse(res, 500, { success: false, message: 'Server error retrieving services' });
            }
        } 
        else if (url === '/api/services' && method === 'POST') {
            try {
                const body = await getRequestBody(req);
                const newService = await Service.create(body);
                sendResponse(res, 201, { success: true, message: 'Service created', data: newService });
            } catch (error) {
                sendResponse(res, 400, { success: false, message: error.message });
            }
        }
        else if (method === 'GET' && url.split('/').length === 4) {
            const id = url.split('/')[3];
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

    // Rute Upload Gambar
    else if (url === '/api/upload' && method === 'POST') {
        
        if (!req.headers['content-type'] || !req.headers['content-type'].startsWith('multipart/form-data')) {
            return sendResponse(res, 400, { success: false, message: 'Content-Type harus multipart/form-data' });
        }

        try {
            const bb = busboy({ headers: req.headers });
            bb.on('file', (name, fileStream, info) => {
                const { filename } = info;
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: "ponti_jaya_motor", public_id: filename },
                    (error, result) => {
                        if (error) {
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
                sendResponse(res, 500, { success: false, message: 'Gagal mem-parsing file' });
            });
            req.pipe(bb);
        } catch (error) {
            sendResponse(res, 500, { success: false, message: 'Internal server error' });
        }
    }

    // Rute Kirim OTP
    else if (url === '/api/send-otp' && method === 'POST') {
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
            sendResponse(res, 500, { success: false, message: 'Gagal mengirim OTP' });
        }
    }

    // Rute Registrasi
    else if (url === '/api/register' && method === 'POST') {
        
        console.log('[0] Menerima request POST /api/register...'); 
        
        try {
            const body = await getRequestBody(req); 
            const { username, email, password, otp } = body;

            if (!username || !email || !password || !otp) {
                return sendResponse(res, 400, { success: false, message: 'Semua field (termasuk OTP) wajib diisi' });
            }

            // Batas waktu OTP (5 menit = 300 * 1000)
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

            // User.create akan OTOMATIS mengatur 'role: "user"'
            // karena pembaruan di models/User.js
            const newUser = await User.create({
                username,
                email,
                password: hashedPassword
            });
            
            // REVISI: Log untuk menampilkan role
            console.log(`[0] User baru berhasil dibuat: ${newUser.username} (Role: ${newUser.role})`);

            await Otp.deleteMany({ email });
            
            // REVISI: Mengirim 'role' di respons
            sendResponse(res, 201, { 
                success: true, 
                message: 'User berhasil dibuat', 
                data: { userId: newUser._id, username: newUser.username, role: newUser.role } 
            });

        } catch (error) {
            sendResponse(res, 400, { success: false, message: error.message });
        }
    }

    // =======================================================
    // === RUTE LOGIN (DIPERBARUI UNTUK CEK USERNAME/EMAIL) ===
    // =======================================================
    else if (url === '/api/auth/login' && method === 'POST') {
        
        console.log('\n--- [DEBUG] /api/auth/login ---'); // Debugging
        
        try {
            const body = await getRequestBody(req);
            // 'username' dari form bisa berisi username ATAU email
            const { username, password } = body; 

            // --- DEBUG LOG 1 ---
            console.log(`[1] Menerima data: Input='${username}', Password='${"*".repeat(password.length)}'`);

            if (!username || !password) {
                console.log('[DEBUG] Gagal: Username atau password kosong.');
                return sendResponse(res, 400, { success: false, message: 'Username dan password wajib diisi' });
            }

            // 1. REVISI: Cari user yang 'username'-nya ATAU 'email'-nya cocok
            const user = await User.findOne({
                $or: [
                    { username: username },
                    { email: username }
                ]
            });
            
            // --- DEBUG LOG 2 ---
            if (!user) {
                console.log(`[2] HASIL DB: User TIDAK DITEMUKAN untuk query: '${username}'`);
                console.log('--- [DEBUG] Selesai (Gagal) ---');
                return sendResponse(res, 401, { success: false, message: 'Username atau password salah' });
            }
            console.log(`[2] HASIL DB: User DITEMUKAN. ID: ${user._id}, Username: ${user.username}`);
            console.log(`   -> Hash di DB: ${user.password}`);


            // 2. Bandingkan password
            const isMatch = await bcrypt.compare(password, user.password);

            // --- DEBUG LOG 3 ---
            console.log(`[3] HASIL BCRYPT: ${isMatch}`);

            if (!isMatch) {
                console.log(`   -> Login Gagal: Password tidak cocok.`);
                console.log('--- [DEBUG] Selesai (Gagal) ---');
                return sendResponse(res, 401, { success: false, message: 'Username atau password salah' });
            }

            // 3. Login Berhasil. Baca 'role' dari database.
            // REVISI: Membaca 'user.role' langsung dari database
            console.log(`[4] Login BERHASIL. Role: ${user.role}`);
            console.log('--- [DEBUG] Selesai (Sukses) ---');

            // 4. Kirim respons sukses ke frontend
            sendResponse(res, 200, {
                success: true,
                message: 'Login berhasil',
                user: {
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role // Kirim role asli dari database
                }
            });

        } catch (error) {
            console.error('[DEBUG] CRITICAL ERROR di /api/auth/login:', error);
            console.log('--- [DEBUG] Selesai (Error Kritis) ---');
            sendResponse(res, 500, { success: false, message: 'Server error saat login' });
        }
    }
    // =======================================================
    // === AKHIR RUTE LOGIN ===
    // =======================================================

    else {
        sendResponse(res, 404, { success: false, message: 'Endpoint Not Found' });
    }
});

// Menjalankan Server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server running for Ponti Jaya Motor on http://localhost:${PORT}`);
        // REVISI: Menambahkan /api/auth/login ke log
        console.log(`Endpoints: /api/spareparts, /api/services, /api/upload, /api/register, /api/send-otp, /api/auth/login`);
    });
});