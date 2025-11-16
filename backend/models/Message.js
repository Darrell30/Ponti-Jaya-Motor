// BACKEND/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true }, // ID User atau 'admin'
  senderName: { type: String, required: true },
  receiverId: { type: String, required: true }, // ID User atau 'admin'
  text: { type: String, required: true },
  isFromAdmin: { type: Boolean, default: false }, // Penanda pesan dari admin
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);