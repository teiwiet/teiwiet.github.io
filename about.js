const aboutIcon = document.getElementById("aboutIcon");
const cvWindow = document.getElementById("cvWindow");
const closeCV = document.getElementById("closeCV");

aboutIcon.onclick = () => {
  cvWindow.style.display = "block";
};

closeCV.onclick = () => {
  cvWindow.style.display = "none";
};
