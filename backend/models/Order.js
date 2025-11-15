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
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    items: [orderItemSchema],
    shippingAddress: { type: String, required: true },
    
    paymentMethod: { 
        type: String, 
        default: 'Belum Dipilih' // akan isi otomatis dari Midtrans
    },
    
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Menunggu Pembayaran', 'Diproses', 'Dikirim', 'Tiba', 'Selesai', 'Dibatalkan'],
        default: 'Menunggu Pembayaran'
    }
}, {
    collection: 'Orders',
    timestamps: true 
});

module.exports = mongoose.model('Order', orderSchema);