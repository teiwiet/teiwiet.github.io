// duck.js
const duck = document.getElementById("duck");
let screenW = window.innerWidth;
let screenH = window.innerHeight;

function moveDuck() {
  let x = Math.random() * (screenW - 64);
  let y = Math.random() * (screenH - 128); // tránh taskbar
  if (x > duck.offsetLeft) {
    duck.style.transform = "scaleX(1)";
  } else {
    duck.style.transform = "scaleX(-1)";
  }
  duck.style.left = x + "px";
  duck.style.top = y + "px";
}

// cho vịt chạy 5 giây/lần
setInterval(moveDuck, 5000);
moveDuck();

// cập nhật khi resize cửa sổ
window.addEventListener("resize", () => {
  screenW = window.innerWidth;
  screenH = window.innerHeight;
});
