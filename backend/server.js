// server.js

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');

const Sparepart = require('./models/sparepart'); 
const Service = require('./models/service'); 

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully!');
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1); 
    }
};

const sendResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, { 
        'Content-Type': 'application/json',
        // CORS setting untuk pengembangan
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

const server = http.createServer(async (req, res) => {
    const { url, method } = req;
    
    if (method === 'OPTIONS') {
        sendResponse(res, 204, '');
        return;
    }

    if (url === '/api/spareparts') {
        if (method === 'GET') {
            try {
                const spareparts = await Sparepart.find({});
                sendResponse(res, 200, { success: true, data: spareparts });
            } catch (error) {
                sendResponse(res, 500, { success: false, message: 'Server error retrieving spareparts' });
            }
        } else if (method === 'POST') {
            try {
                const body = await getRequestBody(req);
                const newSparepart = await Sparepart.create(body);
                sendResponse(res, 201, { success: true, message: 'Sparepart created', data: newSparepart });
            } catch (error) {
                // Error validasi Mongoose
                const message = error.name === 'ValidationError' ? error.message : 'Server error creating sparepart';
                sendResponse(res, 400, { success: false, message: message });
            }
        }
    } 
    else if (url === '/api/services') {
        if (method === 'GET') {
            try {
                const services = await Service.find({});
                sendResponse(res, 200, { success: true, data: services });
            } catch (error) {
                sendResponse(res, 500, { success: false, message: 'Server error retrieving services' });
            }
        } else if (method === 'POST') {
            try {
                const body = await getRequestBody(req);
                const newService = await Service.create(body);
                sendResponse(res, 201, { success: true, message: 'Service created', data: newService });
            } catch (error) {
                // Error validasi Mongoose
                const message = error.name === 'ValidationError' ? error.message : 'Server error creating service';
                sendResponse(res, 400, { success: false, message: message });
            }
        }
    }
    else {
        sendResponse(res, 404, { success: false, message: 'Endpoint Not Found' });
    }
});

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server running for Ponti Jaya Motor on http://localhost:${PORT}`);
        console.log(`Endpoints:`);
        console.log(`  GET/POST /api/spareparts`);
        console.log(`  GET/POST /api/services`);
    });
});