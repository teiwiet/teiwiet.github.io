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
const playlistEl = document.getElementById("playlist");

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
let loadedIndex = -1; // bài đang nằm trong video (để khỏi nạp lại, giữ buffer)
let taskbarMusicBtn = null;
const thumbTargets = [];

// ===== PARSE TÊN BÀI =====
// "music/Avicii-Without You.mp4" -> { artist: "Avicii", title: "Without You" }
function parseTrack(rawSrc) {
    const fileName = rawSrc.split("/").pop().replace(/\.[^/.]+$/, "");
    const dash = fileName.indexOf("-");
    if (dash > 0) {
        return {
            artist: fileName.slice(0, dash).trim(),
            title: fileName.slice(dash + 1).trim()
        };
    }
    return { artist: "", title: fileName };
}

function formatTrackName(rawSrc) {
    const { artist, title } = parseTrack(rawSrc);
    return artist ? artist + " – " + title : title;
}

// ===== TỰ BẮT THUMBNAIL TỪ VIDEO =====
// Tạo 1 video ẩn, tua tới 1 khung hình rồi vẽ ra canvas làm ảnh thumb
function generateThumbnail(rawSrc, imgEl) {
    const v = document.createElement("video");
    v.muted = true;
    v.preload = "metadata";
    v.src = encodeURI(rawSrc);
    // để off-screen cho trình duyệt chịu decode khung hình
    v.style.cssText = "position:fixed;left:-9999px;width:160px;height:90px;";
    document.body.appendChild(v);

    const cleanup = () => { v.remove(); };

    v.addEventListener("loadeddata", () => {
        // tua tới ~ giây thứ 3 (hoặc giữa bài nếu ngắn hơn)
        const t = Math.min(3, (v.duration || 6) / 2);
        try { v.currentTime = t; } catch (e) { cleanup(); }
    }, { once: true });

    v.addEventListener("seeked", () => {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = 80;
            canvas.height = 60;
            canvas.getContext("2d").drawImage(v, 0, 0, canvas.width, canvas.height);
            imgEl.src = canvas.toDataURL("image/jpeg", 0.7);
        } catch (e) {
            console.log("Thumb fail:", rawSrc, e);
        }
        cleanup();
    }, { once: true });

    v.addEventListener("error", cleanup, { once: true });
}

// ===== RENDER PLAYLIST =====
function renderPlaylist() {
    playlistEl.innerHTML = "";
    playlist.forEach((src, i) => {
        const { artist, title } = parseTrack(src);

        const li = document.createElement("li");
        li.className = "playlist-item";
        li.dataset.index = i;

        const thumb = document.createElement("img");
        thumb.className = "pl-thumb";
        thumb.alt = "";

        const meta = document.createElement("div");
        meta.className = "pl-meta";
        meta.innerHTML =
            '<span class="pl-name">' + title + '</span>' +
            (artist ? '<span class="pl-artist">' + artist + '</span>' : '');

        li.appendChild(thumb);
        li.appendChild(meta);

        // 1 click chọn + phát luôn cho đỡ phải double click
        li.onclick = () => playTrack(i);
        playlistEl.appendChild(li);

        // lưu lại để bắt thumbnail sau (khi mở cửa sổ lần đầu)
        thumbTargets.push({ src: src, el: thumb });
    });
    setActiveTrack(currentIndex);
}

// bắt thumbnail cho toàn bộ playlist, chỉ chạy 1 lần
let thumbsReady = false;
function ensureThumbnails() {
    if (thumbsReady) return;
    thumbsReady = true;
    thumbTargets.forEach(t => generateThumbnail(t.src, t.el));
}

// ===== HIGHLIGHT BÀI ĐANG PHÁT =====
function setActiveTrack(index) {
    playlistEl.querySelectorAll(".playlist-item").forEach(item => {
        item.classList.toggle("active", Number(item.dataset.index) === index);
    });
}

// ===== CHỌN & PHÁT 1 BÀI BẤT KỲ =====
function playTrack(index) {
    currentIndex = index;
    loadVideo(index);            // no-op nếu bài đã nạp sẵn
    videoPlayer.currentTime = 0; // bấm chọn thì luôn phát lại từ đầu
    videoPlayer.play().catch(err => console.log("Play blocked:", err));
}

// ===== LOAD VIDEO =====
function loadVideo(index) {
    // đã nạp đúng bài này rồi -> giữ nguyên buffer, không tải lại
    if (index === loadedIndex) {
        setActiveTrack(index);
        return;
    }

    const rawSrc = playlist[index];
    const src = encodeURI(rawSrc);

    videoPlayer.pause();
    videoPlayer.src = src;
    videoPlayer.load();
    videoPlayer.currentTime = 0;
    videoPlayer.volume = volumeSlider.value || 0.5;

    nowPlayingText.textContent = "Now Playing – " + formatTrackName(rawSrc);
    setActiveTrack(index);
    loadedIndex = index;

    console.log("Loaded:", src);
}

// ===== OPEN WINDOW =====
function openMusicWindow() {
    musicWindow.style.display = "flex";
    musicWindow.style.top = "120px";
    musicWindow.style.left = "120px";
    musicWindow.style.width = "1060px";    
    musicWindow.style.height = "520px"; 
    currentIndex = 0;
    loadVideo(currentIndex);

    // bắt thumbnail lần đầu mở cửa sổ
    ensureThumbnails();

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
            musicWindow.style.display = "flex";
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

// ===== KHỞI TẠO PLAYLIST KHI LOAD TRANG =====
renderPlaylist();

loadVideo(0);
currentIndex = 0;
