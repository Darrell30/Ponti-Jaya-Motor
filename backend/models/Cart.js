// backend/models/Cart.js

const mongoose = require('mongoose');

// Ini adalah skema untuk 1 item DI DALAM keranjang
const cartItemSchema = new mongoose.Schema({
    // Kita akan simpan ID dari sparepart atau service
    productId: { 
        type: String, 
        required: true 
    }, 
    // Kita simpan data mentahnya agar tidak perlu populate
    nama: { type: String, required: true },
    harga: { type: Number, required: true },
    image: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    // Ini penting untuk membedakan Jasa dan Sparepart
    itemType: { 
        type: String, 
        enum: ['Sparepart', 'Service'], 
        required: true 
    }
}, {
    // _id akan otomatis dibuat untuk setiap cartItem
    timestamps: true 
});

// Ini adalah skema untuk Keranjang utama
const cartSchema = new mongoose.Schema({
    // Setiap keranjang HARUS terhubung ke satu User
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true // Setiap user hanya punya 1 keranjang
    },
    // Keranjang berisi sebuah array dari item-item di atas
    items: [cartItemSchema]
}, {
    collection: 'Cart',
    timestamps: true 
});

module.exports = mongoose.model('Cart', cartSchema);