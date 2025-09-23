const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  pretestScores: {
    grammar: { type: Number, default: 0 },
    vocab: { type: Number, default: 0 },
    reading: { type: Number, default: 0 },
    writing: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    analyzedWeaknesses: [{ type: String }]
  }
});

module.exports = mongoose.model("User", userSchema);