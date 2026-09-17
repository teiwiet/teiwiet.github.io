const aboutIcon = document.getElementById("aboutIcon");
const cvWindow = document.getElementById("cvWindow");
const closeCV = document.getElementById("closeCV");
const minCV = document.getElementById("minCV");
const maxCV = document.getElementById("maxCV");

aboutIcon.onclick = () => {
  cvWindow.style.display = "flex";

  if (!cvWindow.style.left) {
    cvWindow.style.left = "200px";
    cvWindow.style.top = "120px";
  }

  bringToFront(cvWindow); // docs.js
  addTaskbarBtn(cvWindow, "Viet Tran - CV"); // docs.js
};

closeCV.onclick = () => {
  cvWindow.style.display = "none";
  removeTaskbarBtn(cvWindow); // docs.js
};

minCV.onclick = () => {
  cvWindow.style.display = "none";
};

makeMaximizable(cvWindow, maxCV); // resize.js
