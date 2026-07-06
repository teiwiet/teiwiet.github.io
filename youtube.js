// youtube.js — thêm nhạc YouTube vào Media Player bằng cách hardcode link vào mảng.
// KHÔNG sửa music.js. Nhạc .mp4 cũ giữ nguyên; các link dưới đây hiện thêm vào playlist.
(function () {

  // ================== THÊM LINK Ở ĐÂY ==================
  // Muốn thêm bài: dán thêm link vào mảng này là xong.
  //   - Đơn giản: chỉ cần URL, tên bài tự lấy từ YouTube.
  //   - Muốn tự đặt tên: dùng { url: "...", title: "...", artist: "..." }
  // Nhận mọi kiểu link: watch?v= , youtu.be/ , /shorts/ , /embed/
  const YOUTUBE_TRACKS = [
    "https://www.youtube.com/watch?v=mhqovVvKwVE",
    "https://www.youtube.com/watch?v=dd7nhkYdXHI",
    "https://www.youtube.com/watch?v=58IkVCh3hWU",
    "https://www.youtube.com/watch?v=eLYS88I2dK0",
    "https://www.youtube.com/watch?v=hYUvI5Njbbk",
    "https://www.youtube.com/watch?v=xtyXoZ8LTHs",
  ];
  // ====================================================

  const videoPlayer   = document.getElementById("videoPlayer");
  const playlistEl    = document.getElementById("playlist");
  const nowPlaying    = document.getElementById("nowPlayingText");
  const volumeSlider  = document.getElementById("volumeSlider");
  const playBtn       = document.getElementById("playBtn");
  const pauseBtn      = document.getElementById("pauseBtn");
  const nextBtn       = document.getElementById("nextBtn");
  const prevBtn       = document.getElementById("prevBtn");
  const closeMusicBtn = document.getElementById("closeMusic");
  const videoWrapper  = document.querySelector("#musicWindow .video-wrapper");
  if (!videoPlayer || !playlistEl || !videoWrapper) return;

  let ytTracks = [];   // [{id, title, artist, _li}]
  let ytPlayer = null, ytReady = false, ytMode = false, curYt = 0, pendingId = null;

  /* ---------- CSS ---------- */
  if (!document.getElementById("ytStyles")) {
    const css = `
#ytHost{ display:none; width:100%; max-width:100%; max-height:100%;
  aspect-ratio:16/9; background:#000; }
#ytHost iframe, #ytHost #ytTarget{ width:100%; height:100%; border:0; display:block; }
`;
    const s = document.createElement("style");
    s.id = "ytStyles"; s.textContent = css; document.head.appendChild(s);
  }

  /* ---------- khung nhúng YouTube ---------- */
  const ytHost = document.createElement("div");   ytHost.id = "ytHost";
  const ytTarget = document.createElement("div"); ytTarget.id = "ytTarget";
  ytHost.appendChild(ytTarget);
  videoWrapper.appendChild(ytHost);

  /* ---------- tách video ID từ mọi kiểu link ---------- */
  function parseId(s) {
    s = (s || "").trim();
    if (/^[\w-]{11}$/.test(s)) return s;
    let m;
    if ((m = s.match(/[?&]v=([\w-]{11})/)))      return m[1];
    if ((m = s.match(/youtu\.be\/([\w-]{11})/))) return m[1];
    if ((m = s.match(/\/embed\/([\w-]{11})/)))   return m[1];
    if ((m = s.match(/\/shorts\/([\w-]{11})/)))  return m[1];
    if ((m = s.match(/([\w-]{11})/)))            return m[1];
    return null;
  }

  /* ---------- render 1 track vào playlist (giống item .mp4) ---------- */
  function addTrack(id, title, artist) {
    const t = { id: id, title: title || "", artist: artist || "" };
    ytTracks.push(t);
    const idx = ytTracks.length - 1;

    const li = document.createElement("li");
    li.className = "playlist-item yt-item";
    li.dataset.yt = id;
    li.innerHTML =
      '<img class="pl-thumb" src="https://img.youtube.com/vi/' + id + '/mqdefault.jpg" alt="">' +
      '<div class="pl-meta">' +
        '<span class="pl-name">' + (t.title || "YouTube video") + '</span>' +
        '<span class="pl-artist">' + (t.artist || "YouTube") + '</span>' +
      '</div>';
    li.onclick = () => playYT(idx);
    playlistEl.appendChild(li);
    t._li = li;

    // chưa có tên -> tự lấy tên (+ kênh) từ YouTube để hiện sẵn như nhạc cũ
    if (!t.title) fetchTitle(t);
  }

  function fetchTitle(t) {
    fetch("https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=" + t.id)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.title) setTitle(t, d.title, t.artist || d.author_name); })
      .catch(() => {});   // bị chặn CORS thì thôi, lát phát vẫn tự lấy được tên
  }

  function setTitle(t, title, artist) {
    t.title = title;
    if (artist) t.artist = artist;
    if (t._li) {
      t._li.querySelector(".pl-name").textContent = title;
      if (artist) t._li.querySelector(".pl-artist").textContent = artist;
    }
    if (ytMode && ytTracks[curYt] === t) nowPlaying.textContent = "Now Playing – " + title;
  }

  function setActive(id) {
    playlistEl.querySelectorAll(".playlist-item")
      .forEach(li => li.classList.toggle("active", li.dataset.yt === id));
  }

  /* ---------- phát / thoát YouTube ---------- */
  function playYT(i) {
    if (!ytTracks.length) return;
    curYt = (i + ytTracks.length) % ytTracks.length;
    const t = ytTracks[curYt];
    ytMode = true;
    try { videoPlayer.pause(); } catch (e) {}
    videoPlayer.style.display = "none";
    ytHost.style.display = "block";
    nowPlaying.textContent = "Now Playing – " + (t.title || ("YouTube " + t.id));
    setActive(t.id);
    if (ytReady && ytPlayer) {
      ytPlayer.loadVideoById(t.id);
      ytPlayer.setVolume(Math.round((+volumeSlider.value || 0.5) * 100));
    } else { pendingId = t.id; }
  }
  function exitYT() {
    ytMode = false;
    if (ytPlayer && ytPlayer.pauseVideo) { try { ytPlayer.pauseVideo(); } catch (e) {} }
    ytHost.style.display = "none";
    videoPlayer.style.display = "";
  }
  function ytNext() { if (ytTracks.length) playYT(curYt + 1); }
  function ytPrev() { if (ytTracks.length) playYT(curYt - 1); }

  /* ---------- YouTube IFrame API ---------- */
  if (!document.getElementById("ytApi")) {
    const s = document.createElement("script");
    s.id = "ytApi"; s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  }
  window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new YT.Player("ytTarget", {
      playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
      events: {
        onReady: function () {
          ytReady = true;
          ytPlayer.setVolume(Math.round((+volumeSlider.value || 0.5) * 100));
          if (pendingId) { ytPlayer.loadVideoById(pendingId); pendingId = null; }
        },
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.ENDED) { ytNext(); return; }
          if (e.data === YT.PlayerState.PLAYING) {
            const d = ytPlayer.getVideoData && ytPlayer.getVideoData();
            const t = ytTracks[curYt];
            if (d && d.title && t && t.title !== d.title) setTitle(t, d.title, t.artist);
          }
        }
      }
    });
  };

  /* ---------- BỌC nút sẵn có (giữ nguyên hành vi nhạc .mp4) ---------- */
  if (typeof window.loadVideo === "function") {   // phát nhạc thường -> tự thoát YouTube
    const _loadVideo = window.loadVideo;
    window.loadVideo = function (i) { if (ytMode) exitYT(); return _loadVideo(i); };
  }
  const _play = playBtn && playBtn.onclick, _pause = pauseBtn && pauseBtn.onclick;
  const _next = nextBtn && nextBtn.onclick, _prev = prevBtn && prevBtn.onclick;
  const _close = closeMusicBtn && closeMusicBtn.onclick;

  if (playBtn)  playBtn.onclick  = () => ytMode ? ytPlayer && ytPlayer.playVideo()  : (_play && _play());
  if (pauseBtn) pauseBtn.onclick = () => ytMode ? ytPlayer && ytPlayer.pauseVideo() : (_pause && _pause());
  if (nextBtn)  nextBtn.onclick  = () => ytMode ? ytNext() : (_next && _next());
  if (prevBtn)  prevBtn.onclick  = () => ytMode ? ytPrev() : (_prev && _prev());

  if (volumeSlider) volumeSlider.addEventListener("input", e => {
    if (ytPlayer && ytPlayer.setVolume) ytPlayer.setVolume(Math.round((+e.target.value) * 100));
  });
  if (closeMusicBtn) closeMusicBtn.onclick = function () {
    if (ytPlayer && ytPlayer.pauseVideo) { try { ytPlayer.pauseVideo(); } catch (e) {} }
    if (_close) _close();
  };

  /* ---------- KHỞI TẠO: đọc mảng, render hết ---------- */
  YOUTUBE_TRACKS.forEach(e => {
    const url = typeof e === "string" ? e : (e && e.url) || "";
    const id = parseId(url);
    if (!id) { console.warn("Link YouTube không hợp lệ, bỏ qua:", e); return; }
    addTrack(id, (e && e.title) || "", (e && e.artist) || "");
  });
})();
