const aboutIcon = document.getElementById("aboutIcon");
const cvWindow = document.getElementById("cvWindow");
const closeCV = document.getElementById("closeCV");

aboutIcon.onclick = () => {
  cvWindow.style.display = "block";

  if (!cvWindow.style.left) {
    cvWindow.style.left = "200px";
    cvWindow.style.top = "120px";
  }
};

closeCV.onclick = () => {
  cvWindow.style.display = "none";
};