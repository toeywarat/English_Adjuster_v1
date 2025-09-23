const mongoose = require("mongoose");


const ItemSchema = new mongoose.Schema(
{
questionId: String, // optional internal id
questionText: String,
choices: [String], // optional to store for review
correctAnswer: String,
userAnswer: String,
isCorrect: Boolean,
difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
explanation: String // optional
},
{ _id: false }
);


const QuizAttemptSchema = new mongoose.Schema(
{
userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
topic: { type: String, default: "random" }, // e.g. "Idioms", "Inversion", etc.
quizType: { type: String, enum: ["topic", "random"], default: "topic" },
score: { type: Number, required: true },
total: { type: Number, required: true },
durationSec: { type: Number, default: 0 },
startedAt: { type: Date },
completedAt: { type: Date, default: Date.now },
items: [ItemSchema],
},
{ timestamps: true }
);


QuizAttemptSchema.virtual("percent").get(function () {
return this.total > 0 ? Math.round((this.score / this.total) * 100) : 0;
});


module.exports = mongoose.model("QuizAttempt", QuizAttemptSchema);