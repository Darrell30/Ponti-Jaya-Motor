const mongoose = require('mongoose');

const storeConfigSchema = new mongoose.Schema({
  isStoreOpen: { type: Boolean, default: true } // True = Buka, False = Tutup
});

module.exports = mongoose.model('StoreConfig', storeConfigSchema);