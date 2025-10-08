// const API_BASE = ""; // e.g. "http://localhost:5500" if needed
const API_BASE =
  window.location.hostname === "localhost"
	? ""                                          // local development
	: "https://english-adjuster-v1.onrender.com"; // Render backend

const token = localStorage.getItem("token");
if (!token) {
  // redirect to signin if unauthenticated
  // location.href = "signin.html";
}

let state = { page: 1, limit: 10, topic: "all", quizType: "all" };

async function getJSON(url) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function fmtDate(d) {
  const dt = new Date(d);
  return dt.toLocaleString();
}
function fmtDur(s) {
  if (!s || s <= 0) return "-";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

async function loadSummary() {
  try {
    const data = await getJSON(`${API_BASE}/api/attempts/stats/summary`);
    document.getElementById("card-total").textContent = data.totalAttempts;
    document.getElementById("card-7d").textContent = data.attemptsLast7Days;
    document.getElementById("card-top-topic").textContent = data.byTopic[0]?.topic || "-";
  } catch (e) {
    console.error(e);
  }
}

async function loadAttempts() {
  const url = new URL(`${API_BASE}/api/attempts`, location.origin);
  url.searchParams.set("page", state.page);
  url.searchParams.set("limit", state.limit);
  if (state.topic !== "all") url.searchParams.set("topic", state.topic);
  if (state.quizType !== "all") url.searchParams.set("quizType", state.quizType);

  const data = await getJSON(url.toString().replace(location.origin, API_BASE || location.origin));
  const tbody = document.getElementById("attempt-rows");
  tbody.innerHTML = "";
  data.items.forEach((a) => {
    const tr = document.createElement("tr");
    tr.className = "border-b last:border-0";
    tr.innerHTML = `
      <td class="px-4 py-3">${fmtDate(a.completedAt)}</td>
      <td class="px-4 py-3">${a.topic}</td>
      <td class="px-4 py-3">${a.quizType}</td>
      <td class="px-4 py-3 font-semibold">${a.score}/${a.total} (${Math.round((a.score/a.total)*100)}%)</td>
      <td class="px-4 py-3">${fmtDur(a.durationSec)}</td>
      <td class="px-4 py-3"><button data-id="${a._id}" class="view px-3 py-1 rounded-xl border hover:bg-gray-50">View</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("page-info").textContent = `Page ${data.page}`;
  document.getElementById("prev").disabled = state.page <= 1;
  document.getElementById("next").disabled = data.total <= state.page * state.limit;
}

function bindUI() {
  document.getElementById("btn-apply").addEventListener("click", () => {
    state.topic = document.getElementById("filter-topic").value;
    state.quizType = document.getElementById("filter-type").value;
    state.page = 1;
    loadAttempts().catch(console.error);
  });
  document.getElementById("prev").addEventListener("click", () => {
    if (state.page > 1) {
      state.page -= 1; loadAttempts().catch(console.error);
    }
  });
  document.getElementById("next").addEventListener("click", () => {
    state.page += 1; loadAttempts().catch(console.error);
  });

  document.getElementById("attempt-rows").addEventListener("click", async (e) => {
    const btn = e.target.closest(".view");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const attempt = await getJSON(`${API_BASE}/api/attempts/${id}`);
    openModal(renderAttemptDetail(attempt));
  });

  document.getElementById("close-modal").addEventListener("click", closeModal);
  document.getElementById("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
  });
}

function renderAttemptDetail(attempt) {
  const itemsHtml = (attempt.items || [])
    .map((it, idx) => {
      const isCorrect = it.isCorrect ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50";
      return `
        <div class="p-3 rounded-xl border ${isCorrect}">
          <div class="font-semibold mb-1">Q${idx + 1}. ${it.questionText || "(question)"}</div>
          ${it.choices && it.choices.length ? `<ul class="ml-5 list-disc">${it.choices.map(c=>`<li>${c}</li>`).join("")}</ul>` : ""}
          <div class="mt-2 text-sm"><span class="font-semibold">Your answer:</span> ${it.userAnswer || "-"}</div>
          <div class="text-sm"><span class="font-semibold">Correct:</span> ${it.correctAnswer || "-"}</div>
          ${it.explanation ? `<div class="mt-1 text-sm text-gray-700">${it.explanation}</div>` : ""}
        </div>`;
    })
    .join("");

  return `
    <div class="space-y-2">
      <div class="flex flex-wrap gap-3 text-sm text-gray-600">
        <div><span class="font-semibold">Topic:</span> ${attempt.topic}</div>
        <div><span class="font-semibold">Type:</span> ${attempt.quizType}</div>
        <div><span class="font-semibold">Score:</span> ${attempt.score}/${attempt.total} (${Math.round((attempt.score/attempt.total)*100)}%)</div>
        <div><span class="font-semibold">Duration:</span> ${fmtDur(attempt.durationSec)}</div>
        <div><span class="font-semibold">Date:</span> ${fmtDate(attempt.completedAt)}</div>
      </div>
      <div class="grid gap-3">${itemsHtml || "<div class='text-sm text-gray-500'>No item details saved for this attempt.</div>"}</div>
    </div>
  `;
}

function openModal(html) {
  const m = document.getElementById("modal");
  document.getElementById("modal-body").innerHTML = html;
  m.classList.remove("hidden");
  m.classList.add("flex");
}
function closeModal() {
  const m = document.getElementById("modal");
  m.classList.add("hidden");
  m.classList.remove("flex");
}

// init
bindUI();
loadSummary().catch(console.error);
loadAttempts().catch(console.error);