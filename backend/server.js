// server.js

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');
const busboy = require('busboy');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const Sparepart = require('./models/sparepart'); 
const Service = require('./models/service'); 
const User = require('./models/User'); 
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

// Fungsi utilitas untuk mengirim respons JSON
const sendResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(JSON.stringify(data));
};

// Fungsi utilitas untuk membaca body JSON
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

    // Routing Sparepart 
    if (url.startsWith('/api/spareparts')) {
        
        // GET /api/spareparts (Get All)
        if (url === '/api/spareparts' && method === 'GET') {
            
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
        else if (url === '/api/spareparts' && method === 'POST') {
            try {
                const body = await getRequestBody(req);
                const newSparepart = await Sparepart.create(body);
                sendResponse(res, 201, { success: true, message: 'Sparepart created', data: newSparepart });
            } catch (error) {
                const message = error.name === 'ValidationError' ? error.message : 'Server error creating sparepart';
                sendResponse(res, 400, { success: false, message: message });
            }
        } 
        // GET /api/spareparts/:id (Get by ID)
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
    
    // Routing Jasa (Services)
    else if (url.startsWith('/api/services')) {
        
        // GET /api/services (Get All)
        if (url === '/api/services' && method === 'GET') {
            try {
                const services = await Service.find({});
                sendResponse(res, 200, { success: true, count: services.length, data: services });
            } catch (error) {
                console.error('[0] ERROR di /api/services (GET):', error);
                sendResponse(res, 500, { success: false, message: 'Server error retrieving services' });
            }
        } 
        // POST /api/services (Create)
        else if (url === '/api/services' && method === 'POST') {
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

    //UPLOAD GAMBAR
    else if (url === '/api/upload' && method === 'POST') {
        
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

    //RUTE KIRIM OTP 
    else if (url === '/api/send-otp' && method === 'POST') {
        console.log('[0] Menerima request POST /api/send-otp...');
        try {
            const { email } = await getRequestBody(req);
            if (!email) {
                return sendResponse(res, 400, { success: false, message: 'Email wajib diisi' });
            }

            // Cek apakah user dengan email ini sudah ada
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return sendResponse(res, 400, { success: false, message: 'Email sudah terdaftar' });
            }

            // Hapus OTP lama (jika ada) untuk email ini
            await Otp.deleteMany({ email });

            // Buat 6 digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            // Kirim email
            await transporter.sendMail({
                from: `"Ponti Jaya Motor" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: 'Kode Verifikasi Anda - Ponti Jaya Motor',
                text: `Kode verifikasi Anda adalah: ${otp}`,
                html: `<b>Kode verifikasi Anda adalah: ${otp}</b><br><p>Kode ini akan kedaluwarsa dalam 5 menit.</p>`
            });

            // Simpan OTP ke database
            await Otp.create({ email, otp });

            console.log(`[0] OTP ${otp} berhasil dikirim ke ${email}`);
            sendResponse(res, 200, { success: true, message: `OTP telah dikirim ke ${email}` });

        } catch (error) {
            console.error('[0] CRITICAL ERROR di /api/send-otp:', error);
            sendResponse(res, 500, { success: false, message: 'Gagal mengirim OTP' });
        }
    }

    //RUTE REGISTRASI PENGGUNA 
    else if (url === '/api/register' && method === 'POST') {
        
        console.log('[0] Menerima request POST /api/register...'); 
        
        try {
            const body = await getRequestBody(req); 
            const { username, email, password, otp } = body; //SEKARANG MEMBUTUHKAN OTP

            // Validasi input
            if (!username || !email || !password || !otp) {
                return sendResponse(res, 400, { success: false, message: 'Semua field (termasuk OTP) wajib diisi' });
            }

            // VERIFIKASI OTP
            const validOtp = await Otp.findOne({ email: email, otp: otp });
            if (!validOtp) {
                // OTP tidak ditemukan atau salah
                return sendResponse(res, 400, { success: false, message: 'Kode OTP salah atau telah kedaluwarsa' });
            }
            //AKHIR VERIFIKASI OTP

            // Cek apakah email atau username sudah ada (redundant, tapi bagus untuk keamanan)
            const existingUser = await User.findOne({ $or: [{ email: email }, { username: username }] });
            if (existingUser) {
                const message = existingUser.email === email ? 'Email sudah terdaftar' : 'Username sudah digunakan';
                return sendResponse(res, 400, { success: false, message: message });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Buat user baru
            const newUser = await User.create({
                username,
                email,
                password: hashedPassword
            });
            
            console.log(`[0] User baru berhasil dibuat: ${newUser.username}`);

            // Hapus OTP setelah berhasil digunakan
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

    else {
        sendResponse(res, 404, { success: false, message: 'Endpoint Not Found' });
    }
});

// Menjalankan Server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server running for Ponti Jaya Motor on http://localhost:${PORT}`);
        console.log(`Endpoints: /api/spareparts, /api/services, /api/upload, /api/register, /api/send-otp`);
    });
});