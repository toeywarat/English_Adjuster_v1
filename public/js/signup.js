document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const messageEl = document.getElementById("message");

  // ✅ Render backend URL
  // const BACKEND_URL = "https://english-adjuster-v1.onrender.com"; 

  const BACKEND_URL =
    window.location.hostname === "localhost"
	  ? "http://localhost:5500"                     // local development
	  : "https://english-adjuster-v1.onrender.com"; // Render backend

  // Clear message before starting
  messageEl.textContent = "";
  messageEl.className = "";

  try {
    // 🔹 Call Render backend /api/signup
    const res = await fetch(`${BACKEND_URL}/api/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // 🔹 Save token & redirect
      localStorage.setItem("token", data.token);

      messageEl.textContent = "✅ สมัครสมาชิกสำเร็จ! กำลังไปทำ Pretest...";
      messageEl.className = "text-green-600 text-center mt-4";

      // Optional: delay before redirect
      setTimeout(() => {
        window.location.href = "pretest/pretest.html";
      }, 1500);
    } else {
      // 🔹 Show backend error message
      messageEl.textContent = "❌ " + (data.message || "เกิดข้อผิดพลาดในการสมัคร");
      messageEl.className = "text-red-600 text-center mt-4";
    }
  } catch (err) {
    console.error("Signup error:", err);
    messageEl.textContent = "🚫 ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";
    messageEl.className = "text-red-600 text-center mt-4";
  }
});
