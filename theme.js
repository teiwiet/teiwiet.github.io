// theme.js — Dark mode cho Teiwiet OS
// Tự inject CSS + nút toggle ở khay đồng hồ, nhớ lựa chọn bằng localStorage.
(function () {
  if (window.__teiwietThemeInit) return;     // tránh init 2 lần
  window.__teiwietThemeInit = true;

  const STORAGE_KEY = "teiwiet-theme";

  /* ---------- 1. INJECT CSS ---------- */
  if (!document.getElementById("themeStyles")) {
    const css = `
/* ====== DESKTOP ====== */
body.dark { background: #10302f; }

/* ====== 98.css CHROME (override biến) ====== */
body.dark {
  --text-color: #e8e8e8;
  --surface: #3c3c3c;
  --button-face: #484848;
  --button-highlight: #6d6d6d;
  --button-shadow: #161616;
  --window-frame: #000000;
  --dialog-gray: #5a5a5a;
  --dialog-gray-light: #777777;
  --link-blue: #6cb6ff;
}
body.dark .window,
body.dark .window-body { color: var(--text-color); }

/* taskbar */
body.dark #taskbar {
  background: var(--surface);
  border-top-color: var(--button-highlight);
  border-left-color: var(--button-highlight);
  border-right-color: var(--button-shadow);
  border-bottom-color: var(--button-shadow);
}
body.dark .taskbar-items { background: var(--surface); }
body.dark .start-button,
body.dark .taskbar-items button,
body.dark .taskbar-clock { color: var(--text-color); background: var(--surface); }

/* ====== WRITEUP / BLOG (điểm nhấn) ====== */
body.dark .blog-list-wrapper { background: #232323; }
body.dark .blog-item { color: #dcdcdc; border-bottom-color: #353535; }
body.dark .blog-item:hover { background: #33415e; }
body.dark .blog-item.active { background: #102a66; color: #fff; }
body.dark .blog-item .blog-date { color: #9a9a9a; }
body.dark .blog-item.active .blog-date { color: #b9c8e6; }

body.dark .blog-content-col,
body.dark .blog-content { background: #1d1d1d; color: #d7d7d7; }
body.dark .markdown-body h1,
body.dark .markdown-body h2,
body.dark .markdown-body h3 { color: #f1f1f1; border-bottom-color: #3a3a3a; }
body.dark .markdown-body h3 { border-bottom: none; }
body.dark .markdown-body a { color: #6cb6ff; }
body.dark .markdown-body code { background: #2d2d2d; border-color: #454545; color: #eaeaea; }
body.dark .markdown-body blockquote { background: #242424; border-left-color: #3b6ea5; color: #b9b9b9; }
body.dark .markdown-body th,
body.dark .markdown-body td { border-color: #555; }
body.dark .markdown-body hr { border-top-color: #444; }
/* <pre> vốn đã tối nên giữ nguyên */

/* ====== MEDIA PLAYER ====== */
body.dark .playlist-wrapper { background: #232323; }
body.dark .playlist-item { color: #dcdcdc; border-bottom-color: #353535; }
body.dark .playlist-item:hover { background: #33415e; }
body.dark .playlist-item.active { background: #102a66; color: #fff; }
body.dark .playlist-item .pl-artist { color: #9a9a9a; }
body.dark .playlist-item.active .pl-artist { color: #b9c8e6; }
body.dark .video-controls { background: var(--surface); border-top-color: var(--button-highlight); }

/* ====== MY DOCUMENTS ====== */
body.dark .docs-menubar { background: var(--surface); border-bottom-color: var(--button-shadow); }
body.dark .docs-addressbar { background: var(--surface); }
body.dark .docs-addr-label { color: #c4c4c4; }
body.dark .docs-addr-field { background: #232323; color: #dcdcdc; }
body.dark .docs-grid { background: #1d1d1d; }
body.dark .docs-item span { color: #e4e4e4; }
body.dark .docs-item:hover { border-color: #666; }

/* ====== NOTEPAD ====== */
body.dark .txt-file { background: #1d1d1d; color: #e4e4e4; }

/* ====== KHAY TOGGLE ====== */
.theme-tray {
  display: flex; align-items: center;
  height: 22px; padding: 0 6px;
  background: #c0c0c0; border: 2px inset #fff;
  box-sizing: border-box;
}
body.dark .theme-tray {
  background: var(--surface);
  border-color: var(--button-shadow) var(--button-highlight) var(--button-highlight) var(--button-shadow);
}
.theme-toggle-btn {
  border: none; background: transparent; cursor: pointer;
  font-size: 15px; line-height: 1; padding: 0;
}
.theme-toggle-btn:active { transform: translateY(1px); }
`;
    const style = document.createElement("style");
    style.id = "themeStyles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ---------- 2. ĐỌC LỰA CHỌN ĐÃ LƯU ---------- */
  let mode = "light";
  try { mode = localStorage.getItem(STORAGE_KEY) || "light"; } catch (e) {}

  /* ---------- 3. NÚT TOGGLE Ở TASKBAR ---------- */
  const taskbar = document.getElementById("taskbar");
  const clock = document.getElementById("clock");

  const tray = document.createElement("div");
  tray.className = "theme-tray";

  const btn = document.createElement("button");
  btn.className = "theme-toggle-btn";
  btn.setAttribute("aria-label", "Toggle dark mode");
  tray.appendChild(btn);

  if (taskbar && clock) taskbar.insertBefore(tray, clock);
  else if (taskbar) taskbar.appendChild(tray);

  /* ---------- 4. ÁP DỤNG ---------- */
  function apply(m) {
    document.body.classList.toggle("dark", m === "dark");
    btn.textContent = m === "dark" ? "☀️" : "🌙";
    btn.title = m === "dark" ? "Chuyển sang Light mode" : "Chuyển sang Dark mode";
  }

  apply(mode);

  btn.onclick = () => {
    mode = document.body.classList.contains("dark") ? "light" : "dark";
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) {}
    apply(mode);
  };
})();
