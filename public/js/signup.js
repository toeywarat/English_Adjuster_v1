document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const messageEl = document.getElementById("message");

  try {
    const res = await fetch("http://localhost:5500/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      messageEl.textContent = "✅ สมัครสมาชิกสำเร็จ! กำลังไปทำ Pretest...";
      messageEl.className = "text-green-600 text-center mt-4";

      setTimeout(() => {
        console.log("🔁 Redirecting to pretest.html...");
        window.location.href = "pretest/pretest.html";
      }, 1500);
    } else {
      messageEl.textContent = "❌ " + (data.message || "เกิดข้อผิดพลาดในการสมัคร");
      messageEl.className = "text-red-600 text-center mt-4";
    }
  } catch (err) {
    console.error(err);
    messageEl.textContent = "🚫 ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";
    messageEl.className = "text-red-600 text-center mt-4";
  }
});
