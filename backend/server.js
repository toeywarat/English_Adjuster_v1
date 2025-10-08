require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const authMiddleware = require("./middleware/authMiddleware");
const { OpenAI } = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // or hard-code your key
});

const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
// const port = 5500;
const port = process.env.PORT || 5500; // use Render's port OR local 5500

// ✅ เชื่อม MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ Middleware
// app.use(cors());   Modify this original statement to allow frontend's domain (Github Page) to call it
app.use(cors({
  origin: ["https://toeywarat.github.io/English_Adjuster_v1", "http://localhost:5500"], // allow both local + production
  credentials: true
}));
app.use(express.json());
app.use(express.static("public"));

// ✅ สมัครสมาชิก
app.post("/api/signup", async (req, res) => {
  console.log("📩 Signup request body:", req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "กรุณากรอก email และ password" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email นี้มีผู้ใช้แล้ว" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    // ✅ สร้าง token หลังสมัครเสร็จ
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // ✅ ส่ง token กลับไปให้ frontend
    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ", token });
  } catch (error) {
    console.error("❌ Signup Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ", error: error.message });
  }
});


// ✅ เข้าสู่ระบบ
app.post("/api/signin", async (req, res) => {
  console.log("📩 Signin request body:", req.body);
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "ไม่พบผู้ใช้นี้" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "เข้าสู่ระบบสำเร็จ", token });
  } catch (error) {
    console.error("❌ Signin Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ", error: error.message });
  }
});

// ✅ API แสดงข้อมูลผู้ใช้ที่ล็อกอินอยู่
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ", error: err.message });
  }
});


//API สำหรับบันทึกคะแนน
app.post("/api/pretest-score", authMiddleware, async (req, res) => {
  const { grammar, vocab, reading, writing } = req.body;

  if (
    typeof grammar !== "number" ||
    typeof vocab !== "number" ||
    typeof reading !== "number" ||
    typeof writing !== "number"
  ) {
    return res.status(400).json({ message: "Invalid score format" });
  }

  const total = grammar + vocab + reading + writing;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          "pretestScores.grammar": grammar,
          "pretestScores.vocab": vocab,
          "pretestScores.reading": reading,
          "pretestScores.writing": writing,
          "pretestScores.total": total
        }
      },
      { new: true }
    );

    res.json({ message: "บันทึกคะแนนสำเร็จ", pretestScores: updatedUser.pretestScores });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});

app.get("/api/analyze-pretest", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.pretestScores) {
      return res.status(404).json({ message: "No pretest score found." });
    }

    const { grammar, vocab, reading, writing } = user.pretestScores;

    // วิเคราะห์จุดอ่อน < 60% ของแต่ละหมวด
    const weaknesses = [];

    if (grammar < 11) {
      weaknesses.push({ topic: "Grammar", link: "/lessons/l-conditionals.html" });
    }
    if (vocab < 9) {
      weaknesses.push({ topic: "Vocabulary", link: "/lessons/lesson-m4.html" });
    }
    if (reading < 9) {
      weaknesses.push({ topic: "Reading", link: "/lessons/lesson-m5.html" });
    }
    if (writing < 8) {
      weaknesses.push({ topic: "Writing", link: "/lessons/l-passivevoice.html" });
    }

    return res.json({ weaknesses });
  } catch (err) {
    console.error("Analyze error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/generate-quiz", async (req, res) => {
  try {
    const prompt = req.body.prompt || "Generate 5 easy English grammar multiple choice questions.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `
${prompt}

Format:
[
  {
    "question": "Question?",
    "options": ["A", "B", "C", "D"],
    "answer": "B"
  },
  ...
]`
        }
      ]
    });

    const quizText = completion.choices[0].message.content;
    res.json({ quiz: quizText });

  } catch (error) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
});

// ✅ Start server
app.listen(port, () => {
  console.log(`✅ Server running on port:${port}`);
});
