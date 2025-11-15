// models/Order.js
const mongoose = require('mongoose');

// Skema untuk item di dalam pesanan
const orderItemSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    nama: { type: String, required: true },
    harga: { type: Number, required: true },
    image: { type: String, required: true },
    quantity: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
    // Siapa yang pesan
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // Apa saja barangnya
    items: [orderItemSchema],
    
    // Detail Pengiriman & Pembayaran
    shippingAddress: { type: String, required: true },
    paymentMethod: { 
        type: String, 
        enum: ['COD', 'QRIS'], 
        required: true 
    },
    
    // Status & Total
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Menunggu Pembayaran', 'Diproses', 'Dikirim', 'Tiba', 'Selesai', 'Dibatalkan'],
        default: 'Menunggu Pembayaran'
    }
}, {
    collection: 'Orders',
    timestamps: true // Otomatis menambah createdAt dan updatedAt
});

module.exports = mongoose.model('Order', orderSchema);