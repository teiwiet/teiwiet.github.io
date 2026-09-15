// terminal.js — "MS-DOS Prompt" giả: gõ lệnh, in kết quả, mở được app khác trong site.
(function () {
  /* ---------- CSS ---------- */
  if (!document.getElementById("terminalStyles")) {
    const css = `
.terminal-icon-img {
  width:40px; height:40px; background:#000; color:#39ff14;
  display:flex; align-items:center; justify-content:center;
  font-family:"Courier New", monospace; font-weight:bold; font-size:16px;
  border:1px solid #444;
}
#terminalWindow { display:flex; flex-direction:column; min-width:420px; min-height:260px; }
#terminalWindow > .window-body { flex:1; display:flex; flex-direction:column; min-height:0; }
.terminal-screen {
  flex:1; display:flex; flex-direction:column; min-height:0;
  background:#0c0c0c; color:#e0e0e0;
  font-family:"Courier New", monospace; font-size:13px; line-height:1.5;
  padding:8px; overflow-y:auto; cursor:text;
}
.terminal-output { white-space:pre-wrap; word-break:break-word; }
.terminal-output .t-prompt { color:#4caf50; }
.terminal-inputline { display:flex; align-items:center; gap:6px; }
.terminal-prompt { color:#4caf50; white-space:nowrap; }
#terminalInput {
  flex:1; background:transparent; border:none; outline:none;
  color:#e0e0e0; font-family:"Courier New", monospace; font-size:13px;
}
`;
    const style = document.createElement("style");
    style.id = "terminalStyles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ---------- ELEMENTS ---------- */
  const terminalIcon = document.getElementById("terminalIcon");
  const terminalWindow = document.getElementById("terminalWindow");
  const terminalScreen = document.getElementById("terminalScreen");
  const terminalOutput = document.getElementById("terminalOutput");
  const terminalInput = document.getElementById("terminalInput");
  const closeTerminal = document.getElementById("closeTerminal");
  const minTerminal = document.getElementById("minTerminal");
  if (!terminalIcon || !terminalWindow) return;

  const PROMPT = "guest@teiwiet:~$";
  const BANNER =
    'Teiwiet OS [Version 98.4.20]\n(c) Teiwiet Corp. Type "help" for a list of commands.';
  const SECRET = "i'm single";
  const NEOFETCH =
    "        __            guest@teiwiet\n" +
    "     __/  \\__         -------------\n" +
    "    /  \\__/  \\        OS: Teiwiet OS 98.4.20\n" +
    "    \\__/  \\__/        Host: your browser\n" +
    "    /  \\__/  \\        Shell: fakesh 1.0\n" +
    "    \\__/  \\__/        Uptime: since you opened this tab\n" +
    "                      Hobbies: firmware, exploits, ducks";

  /* ---------- OUTPUT HELPERS ---------- */
  function print(text, cls) {
    const line = document.createElement("div");
    if (cls) line.className = cls;
    line.textContent = text;
    terminalOutput.appendChild(line);
    terminalScreen.scrollTop = terminalScreen.scrollHeight;
  }

  function printEcho(cmdLine) {
    const line = document.createElement("div");
    const p = document.createElement("span");
    p.className = "t-prompt";
    p.textContent = PROMPT;
    line.appendChild(p);
    line.appendChild(document.createTextNode(" " + cmdLine));
    terminalOutput.appendChild(line);
    terminalScreen.scrollTop = terminalScreen.scrollHeight;
  }

  /* ---------- COMMANDS ---------- */
  const commands = {
    help() {
      print("Available commands:");
      print("  help          show this list");
      print("  whoami        who you are");
      print("  about         short intro");
      print("  ls            list projects");
      print("  cat <file>    read a file (try: cat secret.txt)");
      print("  open <app>    open an app: music | docs | cv | writeup");
      print("  neofetch      flex the system");
      print("  duck          summon another duck");
      print("  date          current date/time");
      print("  echo <text>   print text back");
      print("  sudo <...>    try it");
      print("  clear / cls   clear the screen");
      print("  exit          close the terminal");
    },
    whoami() {
      print("guest — the closest you'll get to root around here.");
    },
    about() {
      print("Tran Huy Viet — a.k.a teiwiet.");
      print("Digging into firmware, exploit dev, and occasionally bothering ducks.");
      print('Type "open cv" to see the full CV.');
    },
    ls() {
      if (typeof projects === "undefined") {
        print("ls: cannot read /projects");
        return;
      }
      projects.forEach((p) => print(p.id + (p.status ? "  [" + p.status + "]" : "")));
      print("secret.txt");
    },
    cat(args) {
      const name = args[0];
      if (!name) {
        print("cat: missing file operand. Try: cat secret.txt");
        return;
      }
      if (name === "secret.txt") {
        print(SECRET);
        return;
      }
      const id = name.replace(/\.txt$/i, "");
      const p = typeof projects !== "undefined" && projects.find((x) => x.id === id);
      if (p) {
        print(p.summary);
        return;
      }
      print("cat: " + name + ": No such file or directory");
    },
    open(args) {
      const target = (args[0] || "").toLowerCase();
      const map = {
        music: () => typeof openMusicWindow === "function" && openMusicWindow(),
        docs: () => typeof openDocsWindow === "function" && openDocsWindow(),
        projects: () => typeof openDocsWindow === "function" && openDocsWindow(),
        cv: () => document.getElementById("aboutIcon") && document.getElementById("aboutIcon").click(),
        writeup: () => typeof openBlogWindow === "function" && openBlogWindow(),
        blog: () => typeof openBlogWindow === "function" && openBlogWindow(),
      };
      if (map[target]) {
        map[target]();
        print("Opening " + target + "...");
      } else {
        print("open: don't know how to open '" + (args[0] || "") + "'. Try: music, docs, cv, writeup");
      }
    },
    neofetch() {
      print(NEOFETCH);
    },
    duck() {
      const d = document.getElementById("duck");
      if (d) d.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      print("quack.");
    },
    date() {
      print(new Date().toString());
    },
    echo(args) {
      print(args.join(" "));
    },
    sudo(args) {
      const rest = args.join(" ");
      if (/rm\s+-rf/.test(rest)) {
        print("Nice try. This isn't your router.");
        return;
      }
      print("guest is not in the sudoers file. This incident will be reported. (not really, relax)");
    },
    clear() {
      terminalOutput.innerHTML = "";
    },
    cls() {
      commands.clear();
    },
    exit() {
      closeTerminalWindow();
    },
  };

  function runCommand(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (commands[cmd]) {
      commands[cmd](args);
    } else {
      print(cmd + ": command not found. Type 'help' for a list of commands.");
    }
  }

  /* ---------- INPUT + HISTORY ---------- */
  let history = [];
  let histPos = -1;

  terminalInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const val = terminalInput.value;
      if (val.trim()) {
        history.push(val);
        histPos = history.length;
      }
      printEcho(val);
      terminalInput.value = "";
      runCommand(val);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (histPos > 0) {
        histPos--;
        terminalInput.value = history[histPos] || "";
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histPos < history.length - 1) {
        histPos++;
        terminalInput.value = history[histPos];
      } else {
        histPos = history.length;
        terminalInput.value = "";
      }
    }
  });

  terminalScreen.addEventListener("mousedown", () => terminalInput.focus());

  /* ---------- OPEN / CLOSE ---------- */
  function openTerminalWindow() {
    terminalWindow.style.display = "flex";
    if (!terminalWindow.style.left) {
      terminalWindow.style.left = "220px";
      terminalWindow.style.top = "100px";
    }
    bringToFront(terminalWindow); // docs.js
    addTaskbarBtn(terminalWindow, "🖥️ Terminal"); // docs.js
    if (!terminalOutput.childElementCount) print(BANNER);
    terminalInput.focus();
  }

  function closeTerminalWindow() {
    terminalWindow.style.display = "none";
    removeTaskbarBtn(terminalWindow); // docs.js
  }

  terminalIcon.onclick = openTerminalWindow;
  terminalIcon.ondblclick = openTerminalWindow;
  closeTerminal.onclick = closeTerminalWindow;
  minTerminal.onclick = () => {
    terminalWindow.style.display = "none";
  };

  makeDraggable(terminalWindow, document.getElementById("terminalWindowHeader")); // drag.js
  makeResizable(terminalWindow, { minW: 420, minH: 260 }); // resize.js
})();
