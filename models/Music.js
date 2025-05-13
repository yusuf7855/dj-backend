const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  spotifyId: { type: String, required: true, unique: true },
  beatportUrl: { type: String, required: true },
  category: { type: String, required: true },
  likes: { type: Number, default: 0 },
  userLikes: [{ type: String }], 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Music', musicSchema);