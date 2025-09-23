const mongoose = require('mongoose');

const generatedQuizSchema = new mongoose.Schema({
  prompt: String,
  result: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GeneratedQuiz", generatedQuizSchema);
