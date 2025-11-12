const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    // Otomatis terhapus dari database setelah 5 menit
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // 300 detik = 5 menit
    }
}, {
    collection: 'Otp' // Nama collection di MongoDB
});

module.exports = mongoose.model('Otp', OtpSchema);