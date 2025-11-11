// server.js

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');
const busboy = require('busboy'); // Diperlukan untuk /api/upload
const bcrypt = require('bcryptjs'); // <-- BARU: Untuk hashing password

// Impor Model
const Sparepart = require('./models/sparepart'); 
const Service = require('./models/service'); 
const User = require('./models/User'); // <-- BARU: Impor model User

// Variabel Lingkungan
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI; 

console.log('--- Server Start Info ---');
console.log(`Port: ${PORT}`);
console.log('MongoDB URI Status:', MONGO_URI ? 'LOADED' : 'NOT FOUND. Check .env file and variable name.');
console.log('-------------------------');

// Konfigurasi Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});
console.log('✅ Cloudinary configured successfully!');

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
    
    // Handle CORS preflight
    if (method === 'OPTIONS') {
        sendResponse(res, 204, '');
        return;
    }

    // --- Routing Sparepart (DENGAN LOG DEBUG) ---
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
    
    // --- Routing Jasa (Services) - BLOK YANG DIPERBAIKI ---
    else if (url.startsWith('/api/services')) {
        
        // GET /api/services (Get All)
        if (url === '/api/services' && method === 'GET') {
            try {
                const services = await Service.find({});
                sendResponse(res, 200, { success: true, count: services.length, data: services });
            } catch (error) {
                // INI BAGIAN YANG DIPERBAIKI
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
                // INI BAGIAN YANG DIPERBAIKI
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
    // --- AKHIR BLOK YANG DIPERBAIKI ---

    // --- UPLOAD GAMBAR ---
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

    // --- BARU: RUTE REGISTRASI PENGGUNA ---
    else if (url === '/api/register' && method === 'POST') {
        
        console.log('[0] Menerima request POST /api/register...'); 
        
        try {
            // Menggunakan fungsi yang sudah ada untuk membaca body
            const body = await getRequestBody(req); 
            const { username, email, password } = body;

            // Validasi input
            if (!username || !email || !password) {
                return sendResponse(res, 400, { success: false, message: 'Username, email, dan password wajib diisi' });
            }

            // Cek apakah email sudah ada
            const existingUser = await User.findOne({ email: email });
            if (existingUser) {
                return sendResponse(res, 400, { success: false, message: 'Email sudah terdaftar' });
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
            
            // Kirim respons sukses (tanpa mengirim balik password)
            sendResponse(res, 201, { 
                success: true, 
                message: 'User berhasil dibuat', 
                data: { userId: newUser._id, username: newUser.username } 
            });

        } catch (error) {
            console.error('[0] CRITICAL ERROR di /api/register:', error);
            // Tangani error validasi Mongoose
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
        console.log(`Endpoints: /api/spareparts, /api/services, /api/upload, /api/register`); // <-- BARU
    });
});