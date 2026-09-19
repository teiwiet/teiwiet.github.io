(function () {
  const boot = document.getElementById("bootScreen");
  if (!boot) return;

  const SHOW_MS = 3200; // thời gian hiện boot screen

  setTimeout(() => {
    boot.classList.add("boot-hide");
    // gỡ khỏi DOM sau khi mờ xong
    setTimeout(() => boot.remove(), 800);
  }, SHOW_MS);
})();
