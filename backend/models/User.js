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
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'User'
});

module.exports = mongoose.model('User', UserSchema);