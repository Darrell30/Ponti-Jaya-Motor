// models/sparepart.js

const mongoose = require('mongoose');

const sparepartSchema = new mongoose.Schema({
    nama: {
        type: String,
        required: true,
        trim: true
    },
    deskripsi: {
        type: String,
        required: true
    },
    harga: {
        type: Number,
        required: true
    },
    stok: {
        type: Number,
        required: true,
        default: 0
    },
    imageUrl: {
        type: String,
        required: true
    },
    // --- PENAMBAHAN BARU ---
    kategori: {
        type: String,
        enum: ['Sparepart', 'Ori', 'KW'], // Tambahkan enum kategori
        default: 'Sparepart' // Default jika tidak diset
    }
    // -----------------------
}, {
    // TAMBAHAN: Memberitahu Mongoose nama collection yang TEPAT
    collection: 'Sparepart' 
});

const Sparepart = mongoose.model('Sparepart', sparepartSchema);

module.exports = Sparepart;