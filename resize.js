// resize.js — cho phép kéo cạnh/góc để thay đổi kích thước cửa sổ
function makeResizable(windowEl, opts) {
  opts = opts || {};
  const minW = opts.minW || 320;
  const minH = opts.minH || 240;

  // 4 cạnh + 4 góc
  const dirs = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
  dirs.forEach(dir => {
    const handle = document.createElement("div");
    handle.className = "resize-handle resize-" + dir;
    handle.addEventListener("mousedown", (e) => startResize(e, dir));
    windowEl.appendChild(handle);
  });

  let startX = 0, startY = 0;
  let startW = 0, startH = 0, startL = 0, startT = 0;
  let curDir = "", resizing = false;

  function startResize(e, dir) {
    e.preventDefault();
    e.stopPropagation();

    resizing = true;
    curDir = dir;
    startX = e.clientX;
    startY = e.clientY;

    const rect = windowEl.getBoundingClientRect();
    startW = rect.width;
    startH = rect.height;
    startL = windowEl.offsetLeft;
    startT = windowEl.offsetTop;

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function onMove(e) {
    if (!resizing) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let w = startW, h = startH, l = startL, t = startT;

    if (curDir.includes("e")) w = startW + dx;
    if (curDir.includes("s")) h = startH + dy;
    if (curDir.includes("w")) { w = startW - dx; l = startL + dx; }
    if (curDir.includes("n")) { h = startH - dy; t = startT + dy; }

    // chặn nhỏ hơn min, giữ cạnh đối diện đứng yên khi kéo từ trái/trên
    if (w < minW) {
      if (curDir.includes("w")) l = startL + (startW - minW);
      w = minW;
    }
    if (h < minH) {
      if (curDir.includes("n")) t = startT + (startH - minH);
      h = minH;
    }

    windowEl.style.width = w + "px";
    windowEl.style.height = h + "px";
    windowEl.style.left = l + "px";
    windowEl.style.top = t + "px";
  }

  function onUp() {
    resizing = false;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  }
}

makeResizable(
  document.getElementById("musicWindow"),
  { minW: 520, minH: 360 }
);
