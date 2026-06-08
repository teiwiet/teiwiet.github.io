// docs.js — cửa sổ "My Documents" + danh sách dự án lấy từ CV

// ===== DỮ LIỆU DỰ ÁN =====
const FOLDER_ICON = "/pictures/directory_open_file_mydocs-1.png";
const DOC_ICON = "/pictures/help_book_computer-0.png";

const projects = [
  {
    id: "firmware-exploit",
    name: "Firmware Exploitation Research",
    summary: "End-to-end security research on multiple MIPS-based routers — from hardware-level firmware extraction through emulation and analysis to working exploits.",
    bullets: [
      "Acquired firmware at the hardware level: after probing the PCB for UART and getting only garbled output, dumped firmware directly from SPI flash with a CH341A programmer instead of relying on vendor binaries.",
      "Unpacked filesystems with binwalk and emulated services in QEMU (user- & system-mode) for dynamic analysis; recovered hardcoded credentials and private keys via static analysis.",
      "Built working exploits for two known vulnerabilities: a command injection achieving arbitrary command execution (validated under GDB), and a stack buffer overflow in TP-Link WR740N httpd, assessed on a no-ASLR MIPS target."
    ],
    tech: ["MIPS", "Ghidra", "Binwalk", "QEMU", "GDB", "CH341A", "UART", "SPI flash"],
    links: [
      { label: "Netgear writeup", url: "https://teiwiet.github.io/writeup/netgear.html" },
      { label: "TP-Link writeup", url: "https://teiwiet.github.io/writeup/tplink.html" }
    ]
  },
  {
    id: "binary-fuzzer",
    name: "Binary Fuzzer",
    summary: "Mutation-based firmware fuzzer written in Rust, targeting MIPS/ARM binaries via QEMU user-mode emulation.",
    bullets: [
      "Implemented a multi-strategy mutator (bit flip, byte flip, format string injection, path traversal, null bytes) with crash-driven corpus growth.",
      "Developed an ELF static analyzer that scores and prioritizes high-risk binaries by dangerous function presence (strcpy, system, execve) and input entry points (recv, scanf).",
      "Designed a modular harness supporting both native and QEMU execution modes with configurable timeout handling."
    ],
    tech: ["Rust", "QEMU", "MIPS", "ARM", "ELF"],
    links: []
  },
  {
    id: "kprowl",
    name: "kprowl — eBPF Sandbox",
    summary: "An eBPF-based dynamic analysis sandbox (C + libbpf) that traces an untrusted binary's runtime behavior — process execution, file access, and network connections — without modifying the target or using a heavyweight VM.",
    bullets: [
      "Implemented process-tree scoping via a BPF hash map seeded before execve (pipe-synchronized fork/exec) and sched_process_fork propagation, isolating the target and its descendants from system-wide noise.",
      "Attached BPF programs to kernel tracepoints (execve, openat, connect, fork/exit), streaming events to user space through a BPF ring buffer with CO-RE for cross-kernel portability.",
      "Added structured JSON output, loader/runtime noise filtering, and a process-tree / timeline report."
    ],
    tech: ["C", "libbpf", "eBPF", "CO-RE", "Linux Kernel"],
    links: []
  },
  {
    id: "fw-analyzer",
    name: "Firmware Security Analyzer",
    summary: "An automated CLI firmware security analysis pipeline for IoT firmware.",
    bullets: [
      "Implemented firmware extraction and architecture detection (MIPS/ARM) using binwalk and ELF inspection.",
      "Built static scanners to detect hardcoded credentials, private keys, and unsafe functions in extracted filesystems.",
      "Implemented heuristics to identify command injection patterns and dangerous system calls.",
      "Detected embedded web servers and CGI endpoints, surfacing potential web attack surfaces."
    ],
    tech: ["Binwalk", "ELF", "MIPS", "ARM", "CLI"],
    links: []
  },
  {
    id: "os-dev",
    name: "OS Development",
    status: "Ongoing",
    summary: "A hobby x86 operating system built from scratch in C and Assembly.",
    bullets: [
      "Implemented bootloader interaction and early kernel initialization.",
      "Built simple framebuffer-based graphics modules for basic rendering.",
      "Exploring low-level system components and kernel architecture."
    ],
    tech: ["C", "Assembly", "x86", "Bare-metal"],
    links: []
  }
];

// ===== ELEMENTS =====
const docsIcon = document.getElementById("docsIcon");
const docsWindow = document.getElementById("docsWindow");
const docsGrid = document.getElementById("docsGrid");
const docsStatus = document.getElementById("docsStatus");
const closeDocs = document.getElementById("closeDocs");
const minDocs = document.getElementById("minDocs");

const projectWindow = document.getElementById("projectWindow");
const projectTitle = document.getElementById("projectTitle");
const projectContent = document.getElementById("projectContent");
const closeProject = document.getElementById("closeProject");
const minProject = document.getElementById("minProject");

// ===== BRING TO FRONT (cho nhiều cửa sổ) =====
let zCounter = 100;
function bringToFront(win) {
  win.style.zIndex = ++zCounter;
}
document.querySelectorAll(".window").forEach(win => {
  win.addEventListener("mousedown", () => bringToFront(win));
});

// ===== RENDER LƯỚI DỰ ÁN =====
function renderDocsGrid() {
  docsGrid.innerHTML = "";
  projects.forEach(p => {
    const item = document.createElement("div");
    item.className = "docs-item";
    item.dataset.id = p.id;
    item.innerHTML =
      '<img src="' + FOLDER_ICON + '" alt="">' +
      '<span>' + p.name + '</span>';

    // 1 click chọn (highlight), double click mở
    item.onclick = () => {
      docsGrid.querySelectorAll(".docs-item").forEach(el => el.classList.remove("selected"));
      item.classList.add("selected");
    };
    item.ondblclick = () => openProject(p.id);

    docsGrid.appendChild(item);
  });

  // 📄 file bí mật (easter egg)
  const secret = document.createElement("div");
  secret.className = "docs-item";
  secret.dataset.id = "secret";
  secret.innerHTML =
    '<img src="' + DOC_ICON + '" alt="">' +
    '<span>secret.txt</span>';
  secret.onclick = () => {
    docsGrid.querySelectorAll(".docs-item").forEach(el => el.classList.remove("selected"));
    secret.classList.add("selected");
  };
  secret.ondblclick = () => openTextFile("secret.txt", "i'm single");
  docsGrid.appendChild(secret);

  docsStatus.textContent = (projects.length + 1) + " object(s)";
}

// ===== MỞ FILE TEXT (Notepad) =====
function openTextFile(filename, content) {
  projectTitle.textContent = filename + " — Notepad";
  projectContent.innerHTML = '<div class="txt-file"></div>';
  projectContent.querySelector(".txt-file").textContent = content;
  projectContent.scrollTop = 0;

  projectWindow.style.display = "block";
  projectWindow.style.top = "140px";
  projectWindow.style.left = "340px";
  bringToFront(projectWindow);
}

// ===== MỞ CHI TIẾT DỰ ÁN =====
function openProject(id) {
  const p = projects.find(x => x.id === id);
  if (!p) return;

  projectTitle.textContent = p.name;

  let html = "";

  // header
  html += '<div class="project-header">';
  html += '<img class="project-icon" src="' + DOC_ICON + '" alt="">';
  html += '<div class="project-headtext">';
  html += '<div class="project-name">' + p.name + '</div>';
  if (p.status) html += '<span class="project-status">' + p.status + '</span>';
  html += '</div></div>';

  // overview
  html += '<fieldset><legend>Overview</legend><p>' + p.summary + '</p></fieldset>';

  // highlights
  html += '<fieldset><legend>Highlights</legend><ul class="project-bullets">';
  p.bullets.forEach(b => { html += '<li>' + b + '</li>'; });
  html += '</ul></fieldset>';

  // tech
  if (p.tech && p.tech.length) {
    html += '<fieldset><legend>Tech</legend><div class="project-tags">';
    p.tech.forEach(t => { html += '<span class="tag">' + t + '</span>'; });
    html += '</div></fieldset>';
  }

  // links
  if (p.links && p.links.length) {
    html += '<fieldset><legend>Links</legend><div class="project-links">';
    p.links.forEach(l => {
      html += '<a class="link-btn" href="' + l.url + '" target="_blank" rel="noopener">' + l.label + '</a>';
    });
    html += '</div></fieldset>';
  }

  projectContent.innerHTML = html;
  projectContent.scrollTop = 0;

  projectWindow.style.display = "block";
  projectWindow.style.top = "90px";
  projectWindow.style.left = "300px";
  bringToFront(projectWindow);
}

// ===== MỞ / ĐÓNG MY DOCUMENTS =====
function openDocsWindow() {
  docsWindow.style.display = "block";
  if (!docsWindow.style.left) {
    docsWindow.style.left = "160px";
    docsWindow.style.top = "80px";
  }
  bringToFront(docsWindow);
}

docsIcon.onclick = openDocsWindow;

closeDocs.onclick = () => { docsWindow.style.display = "none"; };
minDocs.onclick = () => { docsWindow.style.display = "none"; };

closeProject.onclick = () => { projectWindow.style.display = "none"; };
minProject.onclick = () => { projectWindow.style.display = "none"; };

// ===== KÉO DI CHUYỂN (dùng makeDraggable từ drag.js) =====
makeDraggable(docsWindow, document.getElementById("docsWindowHeader"));
makeDraggable(projectWindow, document.getElementById("projectWindowHeader"));

// ===== KHỞI TẠO =====
renderDocsGrid();
