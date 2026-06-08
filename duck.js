// duck.js — vịt chạy quanh màn hình, BẤM VÀO ĐƯỢC 🦆
(function () {
  const MAX_DUCKS = 40;
  const ducks = [];
  let mainDuck = null;
  let audioCtx = null;

  const messages = [
    "Quack! 🦆",
    "I'm single 😏",
    "Click me again 👀",
    "Quack quack quack",
    "Looking for a crush 🥺",
    "GG WP 🐔",
    "Don't rm -rf me 😨",
    "Ducks can reverse engineer too",
    "sudo quack",
    "Segfault? Skill issue 💀",
    "I overflow your stack 🦆",
    "0xDEADBEEF",
    "Just one more exploit...",
    "It compiles, ship it 🚀",
    "Have you tried turning it off and on?",
    "I run Linux btw",
    "Faker is the GOAT 🐐",
    "T1 wins again 🏆",
    "git push --force 😈",
    "There's no place like 127.0.0.1",
    "Quacker than your firewall 🔥",
    "Hire me pls 💼",
    "I speak fluent MIPS",
    "Buffer? I barely know her",
    "Press F to pay respects",
    "Still single, still quacking",
    "Ghidra is my best friend",
    "Catch me in the QEMU",
    "I'm not a bug, I'm a feature",
    "Honk if you love eBPF 🦆",
    "Powered by C and chaos",
    "Blue screen incoming 💙",
    "I dumped your firmware 🔧",
    "401 Unauthorized... to my heart",
    "Single and ready to fuzz",
    "Quack overflow",
    "Pet me, I'm friend-shaped",
    "Warning: ducks may multiply",
    "I touched the SPI flash 🔌",
    "rm -rf feelings/"
  ];

  function rand(min, max) { return Math.random() * (max - min) + min; }

  // di chuyển 1 con vịt tới chỗ ngẫu nhiên (tránh taskbar)
  function moveDuck(duck) {
    const w = window.innerWidth, h = window.innerHeight;
    const x = rand(0, Math.max(0, w - 64));
    const y = rand(0, Math.max(0, h - 128));
    duck.style.setProperty("--dir", x > duck.offsetLeft ? 1 : -1);
    duck.style.left = x + "px";
    duck.style.top = y + "px";
  }

  function moveAllDucks() { ducks.forEach(moveDuck); }

  // tiếng "quạc" tổng hợp bằng Web Audio (không cần file âm thanh)
  function quack(pitch) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(620 * pitch, t);
      osc.frequency.exponentialRampToValueAtTime(170 * pitch, t + 0.18);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    } catch (e) { /* trình duyệt chặn audio thì kệ */ }
  }

  function bounce(duck) {
    duck.classList.remove("duck-bounce");
    void duck.offsetWidth; // reset animation
    duck.classList.add("duck-bounce");
    setTimeout(() => duck.classList.remove("duck-bounce"), 450);
  }

  function showBubble(duck, text) {
    const b = document.createElement("div");
    b.className = "duck-bubble";
    b.textContent = text;
    b.style.top = (duck.offsetTop - 26) + "px";
    b.style.left = duck.offsetLeft + "px";
    document.body.appendChild(b);
    // căn giữa bong bóng trên đầu vịt
    const left = duck.offsetLeft + 32 - b.offsetWidth / 2;
    b.style.left = Math.max(4, left) + "px";
    setTimeout(() => b.remove(), 1600);
  }

  function spawnDuck(x, y) {
    if (ducks.length >= MAX_DUCKS) return;
    const d = document.createElement("div");
    d.className = "duck";
    d.style.left = x + "px";
    d.style.top = y + "px";
    document.body.appendChild(d);
    registerDuck(d);
    ducks.push(d);
  }

  function onDuckClick(duck, ev) {
    ev.stopPropagation();
    const pitch = ducks.length > 1 ? rand(1.0, 1.6) : 1.0;
    quack(pitch);
    bounce(duck);

    if (ducks.length < MAX_DUCKS) {
      showBubble(duck, messages[Math.floor(Math.random() * messages.length)]);
      // đẻ thêm 1-2 vịt con gần chỗ bấm
      const n = 1 + Math.round(Math.random());
      for (let i = 0; i < n; i++) {
        const bx = Math.min(window.innerWidth - 64, Math.max(0, duck.offsetLeft + rand(-60, 60)));
        const by = Math.min(window.innerHeight - 128, Math.max(0, duck.offsetTop + rand(-60, 60)));
        spawnDuck(bx, by);
      }
    } else {
      showBubble(duck, "🦆 DUCK INVASION 🦆");
    }
  }

  function registerDuck(duck) {
    duck.addEventListener("click", (ev) => onDuckClick(duck, ev));
    // chuột phải vào vịt nào cũng gom cả đàn về 1 con
    duck.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      resetDucks();
    });
  }

  // thỉnh thoảng cho 1 con vịt tự nói 1 câu (không kêu, đỡ phiền)
  function scheduleChatter() {
    const delay = rand(8000, 18000); // 8–18 giây
    setTimeout(() => {
      if (ducks.length > 0) {
        const d = ducks[Math.floor(Math.random() * ducks.length)];
        bounce(d);
        showBubble(d, messages[Math.floor(Math.random() * messages.length)]);
      }
      scheduleChatter();
    }, delay);
  }

  // gom hết vịt con, chỉ chừa lại 1 con
  function resetDucks() {
    if (ducks.length <= 1) return;
    ducks.forEach(d => { if (d !== mainDuck) d.remove(); });
    ducks.length = 0;
    if (mainDuck) ducks.push(mainDuck);
    document.querySelectorAll(".duck-bubble").forEach(b => b.remove());
    if (mainDuck) {
      bounce(mainDuck);
      quack(1);
      showBubble(mainDuck, "Quack~ just me now 🦆");
    }
  }

  // ===== KHỞI TẠO =====
  mainDuck = document.getElementById("duck");
  if (mainDuck) {
    mainDuck.classList.add("duck");
    ducks.push(mainDuck);
    registerDuck(mainDuck);
    moveDuck(mainDuck);
  }

  // cứ 5 giây tất cả vịt lại chạy chỗ khác
  setInterval(moveAllDucks, 5000);

  // thỉnh thoảng vịt tự nói chuyện
  scheduleChatter();
})();