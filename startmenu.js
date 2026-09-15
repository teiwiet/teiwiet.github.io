// startmenu.js — nút Start thật: mở menu kiểu Windows 98, có shortcut tới các app + Restart/Shut Down.
(function () {
  /* ---------- CSS ---------- */
  if (!document.getElementById("startMenuStyles")) {
    const css = `
.start-menu {
  position: fixed; left: 2px; bottom: 36px; width: 200px;
  background: #c0c0c0; border: 2px outset #fff;
  box-shadow: 2px 2px 6px rgba(0,0,0,0.4);
  z-index: 100000; display: flex;
  font-family: "MS Sans Serif", Arial, sans-serif; font-size: 13px;
  padding: 3px; box-sizing: border-box;
}
.start-menu-sidebar {
  width: 22px; background: linear-gradient(180deg, #000080, #1084d0);
  color: #fff; writing-mode: vertical-rl; transform: rotate(180deg);
  display:flex; align-items:flex-end; justify-content:center;
  font-weight:bold; font-size:15px; letter-spacing:1px;
  padding: 6px 2px; flex-shrink:0;
}
.start-menu-items { flex:1; display:flex; flex-direction:column; padding-left:4px; min-width:0; }
.start-menu-item {
  display:flex; align-items:center; gap:8px;
  padding:4px 8px; cursor:pointer; white-space:nowrap; user-select:none;
}
.start-menu-item img { width:20px; height:20px; flex-shrink:0; object-fit:contain; }
.smi-icon {
  width:20px; height:20px; flex-shrink:0;
  background:#000; color:#39ff14; display:flex; align-items:center; justify-content:center;
  font-family:"Courier New", monospace; font-weight:bold; font-size:11px; border:1px solid #444;
}
.smi-icon.smi-blank { background:transparent; border:none; }
.start-menu-item:hover { background:#000080; color:#fff; }
.start-menu-sep { border-top:1px solid #808080; border-bottom:1px solid #fff; margin:3px 2px; }
.start-button.active { border: 2px inset #fff; }

#shutdownScreen {
  position: fixed; inset: 0; z-index: 999999;
  background: #1084d0; color: #fff;
  display:flex; align-items:center; justify-content:center; text-align:center;
  font-family: "MS Sans Serif", Arial, sans-serif; font-size: 20px;
  cursor: default;
}
`;
    const style = document.createElement("style");
    style.id = "startMenuStyles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ---------- ELEMENTS ---------- */
  const startButton = document.getElementById("startButton");
  const startMenu = document.getElementById("startMenu");
  if (!startButton || !startMenu) return;

  function click(id) {
    const el = document.getElementById(id);
    if (el) el.click();
  }

  function restart() {
    location.reload();
  }

  function shutDown() {
    const overlay = document.createElement("div");
    overlay.id = "shutdownScreen";
    overlay.innerHTML =
      '<div>' +
      '<div style="font-size:28px;margin-bottom:12px;">Teiwiet OS</div>' +
      "<div>It's now safe to turn off your computer.</div>" +
      '<div style="font-size:12px;margin-top:18px;opacity:.8;">(click anywhere to turn back on)</div>' +
      "</div>";
    overlay.addEventListener("click", () => overlay.remove());
    document.addEventListener(
      "keydown",
      function onKey() {
        overlay.remove();
        document.removeEventListener("keydown", onKey);
      },
      { once: true }
    );
    document.body.appendChild(overlay);
  }

  /* ---------- MENU ITEMS ---------- */
  const ITEMS = [
    { label: "About Me", icon: "/pictures/msagent-2.png", action: () => click("aboutIcon") },
    { label: "Music", icon: "/pictures/CDPlayer_Icon.png", action: () => click("musicDesktopIcon") },
    { label: "My Documents", icon: "/pictures/directory_open_file_mydocs-1.png", action: () => click("docsIcon") },
    { label: "WriteUp", icon: "/pictures/help_book_computer-0.png", action: () => click("writeupIcon") },
    { label: "Terminal", icon: "terminal", action: () => click("terminalIcon") },
    { sep: true },
    { label: "Restart", icon: null, action: restart },
    { label: "Shut Down...", icon: null, action: shutDown },
  ];

  function renderMenu() {
    startMenu.innerHTML = "";

    const sidebar = document.createElement("div");
    sidebar.className = "start-menu-sidebar";
    sidebar.textContent = "Teiwiet OS";
    startMenu.appendChild(sidebar);

    const itemsCol = document.createElement("div");
    itemsCol.className = "start-menu-items";

    ITEMS.forEach((it) => {
      if (it.sep) {
        const sep = document.createElement("div");
        sep.className = "start-menu-sep";
        itemsCol.appendChild(sep);
        return;
      }

      const row = document.createElement("div");
      row.className = "start-menu-item";

      if (it.icon === "terminal") {
        const box = document.createElement("div");
        box.className = "smi-icon";
        box.textContent = ">_";
        row.appendChild(box);
      } else if (it.icon) {
        const img = document.createElement("img");
        img.src = it.icon;
        img.alt = "";
        row.appendChild(img);
      } else {
        const spacer = document.createElement("div");
        spacer.className = "smi-icon smi-blank";
        row.appendChild(spacer);
      }

      const label = document.createElement("span");
      label.textContent = it.label;
      row.appendChild(label);

      row.onclick = () => {
        closeMenu();
        it.action();
      };
      itemsCol.appendChild(row);
    });

    startMenu.appendChild(itemsCol);
  }

  /* ---------- OPEN / CLOSE ---------- */
  function openMenu() {
    renderMenu();
    startMenu.style.display = "flex";
    startButton.classList.add("active");
    document.addEventListener("mousedown", onOutsideClick);
  }

  function closeMenu() {
    startMenu.style.display = "none";
    startButton.classList.remove("active");
    document.removeEventListener("mousedown", onOutsideClick);
  }

  function onOutsideClick(e) {
    if (!startMenu.contains(e.target) && e.target !== startButton) closeMenu();
  }

  startButton.onclick = (e) => {
    e.stopPropagation();
    if (startMenu.style.display === "flex") closeMenu();
    else openMenu();
  };
})();
