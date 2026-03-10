function makeDraggable(windowEl, headerEl) {
  let startX = 0, startY = 0, isDragging = false;

  headerEl.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX - windowEl.offsetLeft;
    startY = e.clientY - windowEl.offsetTop;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  function onMouseMove(e) {
    if (!isDragging) return;
    windowEl.style.left = (e.clientX - startX) + "px";
    windowEl.style.top = (e.clientY - startY) + "px";
  }

  function onMouseUp() {
    isDragging = false;
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