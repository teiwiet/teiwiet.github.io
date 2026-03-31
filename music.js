// ===== ELEMENTS =====
const musicDesktopIcon = document.getElementById("musicDesktopIcon");
const musicWindow = document.getElementById("musicWindow");
const closeMusic = document.getElementById("closeMusic");

const taskbarItems = document.getElementById("taskbarItems");

const videoPlayer = document.getElementById("videoPlayer");
const nowPlayingText = document.getElementById("nowPlayingText");

const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const volumeSlider = document.getElementById("volumeSlider");

console.log("MUSIC.JS VERSION = FULL REWRITE 2026");

// ===== PLAYLIST =====
const playlist = [
    "music/Avicii-Without You.mp4",
    "music/Coldplay-Yellow.mp4",
    "music/Avicii-Wake Me Up.mp4",
    "music/Coldplay-Everglow.mp4",
    "music/Avicii-Dear Boy.mp4",
    "music/Coldplay-Every Teardrop Is a Waterfall.mp4",
];

let currentIndex = 0;
let taskbarMusicBtn = null;

// ===== LOAD VIDEO =====
function loadVideo(index) {
    const rawSrc = playlist[index];
    const src = encodeURI(rawSrc);

    videoPlayer.pause();
    videoPlayer.src = src;
    videoPlayer.load();
    videoPlayer.currentTime = 0;
    videoPlayer.volume = volumeSlider.value || 0.5;

    const fileName = rawSrc.split("/").pop().replace(/\.[^/.]+$/, "");
    nowPlayingText.textContent = "Now Playing–" + fileName;

    console.log("Loaded:", src);
}

// ===== OPEN WINDOW =====
function openMusicWindow() {
    musicWindow.style.display = "block";
    musicWindow.style.top = "120px";
    musicWindow.style.left = "120px";

    currentIndex = 0;
    loadVideo(currentIndex);

    // autoplay hợp lệ vì nằm trong click event
    videoPlayer.play().catch(err => console.log("Play blocked:", err));

    createTaskbarButton();
}

// ===== CREATE TASKBAR BUTTON =====
function createTaskbarButton() {
    if (taskbarMusicBtn) return;

    taskbarMusicBtn = document.createElement("button");
    taskbarMusicBtn.textContent = "🎵 Music";

    taskbarMusicBtn.onclick = () => {
        if (musicWindow.style.display === "none") {
            musicWindow.style.display = "block";
        } else {
            musicWindow.style.display = "none";
        }
    };

    taskbarItems.appendChild(taskbarMusicBtn);
}

// ===== REMOVE TASKBAR BUTTON =====
function removeTaskbarButton() {
    if (taskbarMusicBtn) {
        taskbarMusicBtn.remove();
        taskbarMusicBtn = null;
    }
}

// ===== CLOSE WINDOW =====
closeMusic.onclick = () => {
    musicWindow.style.display = "none";
    videoPlayer.pause();
    videoPlayer.currentTime = 0;

    removeTaskbarButton();
};

// ===== DESKTOP ICON =====
musicDesktopIcon.onclick = openMusicWindow;

// double click cho đúng vibe OS 😄
musicDesktopIcon.ondblclick = openMusicWindow;

// ===== PLAYER CONTROLS =====
playBtn.onclick = () => videoPlayer.play();
pauseBtn.onclick = () => videoPlayer.pause();

volumeSlider.oninput = (e) => {
    videoPlayer.volume = e.target.value;
};

// ===== NEXT / PREV =====
nextBtn.onclick = () => {
    currentIndex++;
    if (currentIndex >= playlist.length) currentIndex = 0;
    loadVideo(currentIndex);
    videoPlayer.play();
};

prevBtn.onclick = () => {
    currentIndex--;
    if (currentIndex < 0) currentIndex = playlist.length - 1;
    loadVideo(currentIndex);
    videoPlayer.play();
};

// ===== AUTO NEXT =====
videoPlayer.addEventListener("ended", () => {
    nextBtn.onclick();
});

// ===== DEBUG =====
videoPlayer.addEventListener("error", () => {
    console.error("VIDEO ERROR:", videoPlayer.error);
});

videoPlayer.addEventListener("loadeddata", () => {
    console.log("READY:", videoPlayer.src);
});

const minMusic = document.getElementById("minMusic");
const maxMusic = document.getElementById("maxMusic");

let isMaximized = false;

let prevState = {
    width: "",
    height: "",
    top: "",
    left: ""
};
maxMusic.onclick = () => {
    if (!isMaximized) {
        // lưu trạng thái cũ
        prevState = {
            width: musicWindow.style.width,
            height: musicWindow.style.height,
            top: musicWindow.style.top,
            left: musicWindow.style.left
        };

        // full screen
        musicWindow.style.top = "0px";
        musicWindow.style.left = "0px";
        musicWindow.style.width = "100vw";
        musicWindow.style.height = "calc(100vh - 40px)"; // trừ taskbar

        isMaximized = true;
    } else {
        // restore
        musicWindow.style.width = prevState.width;
        musicWindow.style.height = prevState.height;
        musicWindow.style.top = prevState.top;
        musicWindow.style.left = prevState.left;

        isMaximized = false;
    }
};
minMusic.onclick = () => {
    musicWindow.style.display = "none";
};