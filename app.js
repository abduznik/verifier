// Level runtime. Answers are compared by SHA-256 of the normalised input,
// so the plain answer never reaches the browser.
const ICONS = ["🎮", "🧩", "🔢", "💾", "🕹️", "📺", "🧠", "🚀", "🔍", "🎯"];
const KEY = "verifier.solved";
const $ = (id) => document.getElementById(id);

let levels = [];
let current = null;
let solved = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));

const norm = (s) => s.split(/\s+/).filter(Boolean).join(" ").trim().toLowerCase();

async function hash(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
}

function render() {
  $("grid").innerHTML = "";
  levels.forEach((lvl, i) => {
    const b = document.createElement("button");
    b.className = "channel" + (solved.has(lvl.id) ? " done" : "");
    b.type = "button";
    b.innerHTML = `
      <span class="num">${String(i + 1).padStart(2, "0")}</span>
      <span class="icon">${ICONS[i % ICONS.length]}</span>
      <span class="name">${esc(lvl.title)}</span>
      <span class="sub">${solved.has(lvl.id) ? "verified" : esc(lvl.desc)}</span>`;
    b.addEventListener("click", () => open(lvl, i));
    $("grid").appendChild(b);
  });
  const total = levels.length;
  $("statusline").textContent =
    solved.size === 0 ? `${total} level${total === 1 ? "" : "s"} waiting`
                      : `${solved.size} of ${total} verified`;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function open(lvl, i) {
  current = lvl;
  $("levelnum").textContent = `Level ${i + 1}`;
  $("ltitle").textContent = lvl.title;
  $("ldesc").textContent = lvl.desc;
  $("lprompt").textContent = lvl.prompt;
  $("lanswer").value = "";
  $("feedback").textContent = "";
  $("feedback").className = "feedback";
  show("level");
  $("lanswer").focus();
}

async function submit(e) {
  e.preventDefault();
  const value = $("lanswer").value;
  if (!norm(value)) return;
  const got = await hash(norm(value));
  if (got === current.answer_sha) {
    solved.add(current.id);
    localStorage.setItem(KEY, JSON.stringify([...solved]));
    $("feedback").textContent = "Verified. Nice work.";
    $("feedback").className = "feedback ok";
    render();
    if (solved.size === levels.length) {
      $("winstats").textContent = `All ${levels.length} levels cleared. You are, as far as we can tell, a human.`;
      show("win");
    } else {
      setTimeout(() => show("menu"), 700);
    }
  } else {
    $("feedback").textContent =
      value.trim().length === current.answer_len ? "Wrong answer. Try again." : "Not quite. Look again.";
    $("feedback").className = "feedback bad";
    const p = document.querySelector(".panel");
    p.classList.remove("shake");
    void p.offsetWidth;
    p.classList.add("shake");
    $("lanswer").select();
  }
}

function clock() {
  const d = new Date();
  $("clock").textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  $("date").textContent = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

async function boot() {
  clock();
  setInterval(clock, 15000);
  // cache-bust: a merged PR rebuilds levels.json, and the site should pick it up
  const res = await fetch(`levels.json?${Math.floor(Date.now() / 60000)}`);
  levels = await res.json();
  render();
  show("menu");
}

$("answerform").addEventListener("submit", submit);
$("back").addEventListener("click", () => { $("feedback").textContent = ""; show("menu"); });
$("again").addEventListener("click", () => { solved.clear(); localStorage.removeItem(KEY); render(); show("menu"); });
boot();
