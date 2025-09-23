const form = document.getElementById("signin-form");
const errorMsg = document.getElementById("error-msg");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.email.value;
    const password = form.password.value;

    try {
    const res = await fetch("http://localhost:5500/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
        errorMsg.textContent = data.message || "Sign in failed";
        errorMsg.classList.remove("hidden");
        return;
    }

    localStorage.setItem("token", data.token);
    window.location.href = "profile.html"; // ✅ ไปหน้าหลังล็อกอิน
    } catch (err) {
    errorMsg.textContent = "เกิดข้อผิดพลาดในระบบ";
    errorMsg.classList.remove("hidden");
    console.error("Sign in error:", err);
    }
});