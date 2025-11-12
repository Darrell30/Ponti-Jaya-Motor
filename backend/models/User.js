// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username wajib diisi'],
        unique: true
    },
    email: {
        type: String,
        required: [true, 'Email wajib diisi'],
        unique: true,
        match: [/.+\@.+\..+/, 'Email tidak valid']
    },
    password: {
        type: String,
        required: [true, 'Password wajib diisi']
    },

    // ===================================
    // === TAMBAHAN BARU UNTUK ROLE ===
    // ===================================
    role: {
        type: String,
        enum: ['user', 'admin'], // Hanya izinkan nilai 'user' atau 'admin'
        default: 'user'          // OTOMATIS set 'user' untuk akun baru
    },
    // ===================================

    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'User'
});

module.exports = mongoose.model('User', UserSchema);