// models/service.js

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
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
    imageUrl: {
        type: String,
        required: true
    }
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;