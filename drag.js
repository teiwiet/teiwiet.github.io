// drag.js — kéo cửa sổ bằng thanh tiêu đề
// Con trỏ hình bàn tay + không bị kẹt khi rê qua video/iframe YouTube.

function makeDraggable(windowEl, headerEl) {
  let startX = 0, startY = 0, isDragging = false, overlay = null;

  // con trỏ "bàn tay" khi rê vào thanh tiêu đề (nút min/max/close để mặc định)
  headerEl.style.cursor = "grab";
  const ctrls = headerEl.querySelector(".title-bar-controls");
  if (ctrls) ctrls.style.cursor = "default";

  headerEl.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;                           // chỉ chuột trái
    if (e.target.closest(".title-bar-controls")) return;  // bấm nút thì đừng kéo

    e.preventDefault();
    isDragging = true;
    startX = e.clientX - windowEl.offsetLeft;
    startY = e.clientY - windowEl.offsetTop;
    headerEl.style.cursor = "grabbing";

    // lớp phủ trong suốt hứng hết chuột -> video/iframe không "nuốt" sự kiện,
    // nên kéo qua khu vực video cũng không bị rớt/kẹt.
    overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:999999;cursor:grabbing;";
    document.body.appendChild(overlay);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  function onMouseMove(e) {
    if (!isDragging) return;
    windowEl.style.left = (e.clientX - startX) + "px";
    windowEl.style.top  = (e.clientY - startY) + "px";
  }

  function onMouseUp() {
    isDragging = false;
    headerEl.style.cursor = "grab";
    if (overlay) { overlay.remove(); overlay = null; }
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }
}

makeDraggable(
    document.getElementById("musicWindow"),
    document.getElementById("musicWindowHeader")
);

makeDraggable(
    document.getElementById("cvWindow"),
    document.getElementById("cvWindowHeader")
);
