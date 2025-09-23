const express = require("express");
const router = express.Router();
const QuizAttempt = require("../models/QuizAttempt");
const auth = require("../middleware/authMiddleware");

// Create attempt
router.post("/", auth, async (req, res) => {
  try {
    const { topic = "random", quizType = "topic", score, total, durationSec = 0, startedAt, items = [] } = req.body;
    if (typeof score !== "number" || typeof total !== "number") {
      return res.status(400).json({ message: "score and total are required numbers" });
    }

    const attempt = await QuizAttempt.create({
      userId: req.userId,
      topic,
      quizType,
      score,
      total,
      durationSec,
      startedAt: startedAt ? new Date(startedAt) : undefined,
      completedAt: new Date(),
      items,
    });
    res.status(201).json(attempt);
  } catch (err) {
    res.status(500).json({ message: "Failed to create attempt", error: err.message });
  }
});

// List attempts with filters + pagination
router.get("/", auth, async (req, res) => {
  try {
    const { topic, quizType, page = 1, limit = 10, sort = "-completedAt" } = req.query;
    const q = { userId: req.userId };
    if (topic && topic !== "all") q.topic = topic;
    if (quizType && quizType !== "all") q.quizType = quizType;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      QuizAttempt.find(q).sort(sort).skip(skip).limit(Number(limit)),
      QuizAttempt.countDocuments(q),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch attempts", error: err.message });
  }
});

// Read single attempt (for detailed review)
router.get("/:id", auth, async (req, res) => {
  try {
    const attempt = await QuizAttempt.findOne({ _id: req.params.id, userId: req.userId });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    res.json(attempt);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch attempt", error: err.message });
  }
});

// Stats summary for header cards
router.get("/stats/summary", auth, async (req, res) => {
  try {
    const userId = req.userId;

    const [countAll, last7d, byTopic] = await Promise.all([
      QuizAttempt.countDocuments({ userId }),
      QuizAttempt.aggregate([
        { $match: { userId } },
        { $match: { completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $count: "count" }
      ]),
      QuizAttempt.aggregate([
        { $match: { userId } },
        { $group: { _id: "$topic", attempts: { $sum: 1 }, avgPercent: { $avg: { $multiply: [{ $divide: ["$score", "$total"] }, 100] } } } },
        { $sort: { attempts: -1 } }
      ])
    ]);

    res.json({
      totalAttempts: countAll,
      attemptsLast7Days: last7d[0]?.count || 0,
      byTopic: byTopic.map(x => ({ topic: x._id, attempts: x.attempts, avgPercent: Math.round(x.avgPercent || 0) })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
});

module.exports = router;