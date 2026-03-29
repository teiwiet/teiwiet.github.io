const musicIcon = document.getElementById("musicIcon");
const musicWindow = document.getElementById("musicWindow");
const closeMusic = document.getElementById("closeMusic");
const videoPlayer = document.getElementById("videoPlayer");
const nowPlayingText = document.getElementById("nowPlayingText");
console.log("MUSIC.JS VERSION = PORTFOLIO FIX 2025-OK");
// Danh sách bài nhạc (playlist)
const playlist = [
    "/music/Avicii-Without You.mp4",
    "/music/Coldplay-Yellow.mp4",
    "/music/Avicii-Wake Me Up.mp4",
    "/music/Coldplay-Everglow.mp4",
    "/music/Avicii-Dear Boy.mp4",
    "/music/Coldplay-Every Teardrop Is a Waterfall.mp4",
];
let currentIndex = 0;
function loadVideo(index) {
    const rawSrc = playlist[index];
    const src = encodeURI(rawSrc); // ⬅️ CỰC KỲ QUAN TRỌNG

    videoPlayer.pause();
    videoPlayer.src = src;
    videoPlayer.load();
    videoPlayer.currentTime = 0;
    videoPlayer.volume = 0.5;

    const fileName = rawSrc.split("/").pop().replace(/\.[^/.]+$/, "");
    nowPlayingText.textContent = "Now Playing – " + fileName;
}

// Mở player + phát nhạc
musicIcon.onclick = () => {
    musicWindow.style.display = "block";
    musicWindow.style.top = "120px";
    musicWindow.style.left = "120px";
    currentIndex = 0; // luôn bắt đầu từ bài 1
    loadVideo(currentIndex);

    // phát ngay sau khi click (được phép vì đây là event user)
    videoPlayer.play().catch(err => {
        console.log("Không phát được:", err);
    });
};

// Đóng player
closeMusic.onclick = () => {
    musicWindow.style.display = "none";
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
};

// Khi hết video -> chuyển bài tiếp theo
videoPlayer.addEventListener("ended", () => {
    currentIndex++;
    if (currentIndex >= playlist.length) {
        currentIndex = 0; // quay lại đầu playlist
    }
    loadVideo(currentIndex);
    videoPlayer.play().catch(err => {
        console.log("Không phát được bài tiếp:", err);
    });
});
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const volumeSlider = document.getElementById("volumeSlider");

// Play / Pause
playBtn.onclick = () => videoPlayer.play();
pauseBtn.onclick = () => videoPlayer.pause();

// Volume
volumeSlider.oninput = (e) => {
    videoPlayer.volume = e.target.value;
};

// Next / Prev
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
videoPlayer.addEventListener("error", () => {
    console.error("VIDEO ERROR:", videoPlayer.error);
});

videoPlayer.addEventListener("loadeddata", () => {
    console.log("Loaded OK:", videoPlayer.src);
});