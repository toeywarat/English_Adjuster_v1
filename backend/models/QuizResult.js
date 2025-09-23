const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  topic: String,
  score: Number,
  total: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("QuizResult", quizResultSchema);
