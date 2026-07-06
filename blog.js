(function injectBlogStyles() {
  if (document.getElementById("blogStyles")) return;
  const css = `
#blogWindow { display:flex; flex-direction:column; min-width:560px; min-height:360px; }
#blogWindow > .window-body { flex:1; display:flex; flex-direction:column; min-height:0; margin:0; }
.blog-layout { display:flex; gap:4px; padding:3px; flex:1; min-height:0; }
.blog-list-col { width:220px; flex-shrink:0; display:flex; flex-direction:column; }
.blog-list-wrapper { flex:1; min-height:160px; overflow-y:auto; background:#fff; margin:0; }
.blog-list { list-style:none; margin:0; padding:0; font-size:12px; }
.blog-item { display:flex; flex-direction:column; gap:2px; padding:6px 8px; cursor:pointer; user-select:none; border-bottom:1px solid #ececec; }
.blog-item:hover { background:#d6e3f7; }
.blog-item.active { background:#000080; color:#fff; }
.blog-item .blog-title { font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.blog-item .blog-date { font-size:11px; color:gray; }
.blog-item.active .blog-date { color:#c0c0c0; }
.blog-content-col { flex:1; min-width:0; background:#fff; margin:0; overflow:hidden; display:flex; }

/* khu vực đọc: dùng font vector cho mượt (KHÔNG để MS Sans Serif kẻo vỡ pixel) */
.blog-content {
  flex:1; overflow-y:auto; padding:16px 22px;
  font-family: Tahoma, Verdana, Arial, sans-serif;
  font-size:14px; line-height:1.6; color:#1a1a1a;
}
.markdown-body h1, .markdown-body h2, .markdown-body h3 {
  font-family: Tahoma, Verdana, Arial, sans-serif;
  margin:0.9em 0 0.45em; line-height:1.25;
  border-bottom:1px solid #d0d0d0; padding-bottom:4px;
}
.markdown-body h1 { font-size:26px; }
.markdown-body h2 { font-size:20px; }
.markdown-body h3 { font-size:16px; border-bottom:none; }
.markdown-body p  { margin:0.65em 0; }
.markdown-body a  { color:#0645ad; }
.markdown-body ul, .markdown-body ol { padding-left:26px; margin:0.5em 0; }
.markdown-body li { margin:4px 0; }
.markdown-body code {
  font-family:"Courier New", monospace; background:#f3f3f3;
  border:1px solid #ddd; border-radius:3px; padding:1px 4px; font-size:13px;
}
.markdown-body pre {
  background:#1e1e1e; color:#e6e6e6; padding:12px 14px;
  border-radius:4px; overflow-x:auto; line-height:1.45;
}
.markdown-body pre code { background:none; border:none; color:inherit; padding:0; }
.markdown-body blockquote {
  margin:0.7em 0; padding:6px 14px;
  border-left:4px solid #000080; background:#f6f6f6; color:#444;
}
.markdown-body img { max-width:100%; }
.markdown-body table { border-collapse:collapse; margin:0.7em 0; }
.markdown-body th, .markdown-body td { border:1px solid #999; padding:5px 9px; }
.markdown-body hr { border:none; border-top:1px solid #ccc; margin:1.2em 0; }
`;
  const style = document.createElement("style");
  style.id = "blogStyles";
  style.textContent = css;
  document.head.appendChild(style);
})();

// ===== CONFIG: NGUỒN BÀI VIẾT =====
// Tự liệt kê mọi file .md trong thư mục blog/ trên GitHub.
// => Chỉ cần push thêm blog/abc.md là nó tự hiện, KHÔNG cần sửa code.
// Sửa lại 2 dòng này nếu repo / thư mục của bạn khác:
const BLOG_REPO = "teiwiet/teiwiet.github.io"; // "user/repo"
const BLOG_DIR  = "blog";                      // thư mục chứa file .md

let blogs = [];              // sẽ được nạp tự động từ GitHub
let blogIndexLoaded = false; // chỉ nạp 1 lần

// ===== ELEMENTS =====
const writeupIcon = document.getElementById("writeupIcon");
const blogWindow  = document.getElementById("blogWindow");
const blogList    = document.getElementById("blogList");
const blogContent = document.getElementById("blogContent");
const closeBlog   = document.getElementById("closeBlog");
const minBlog     = document.getElementById("minBlog");
const maxBlog     = document.getElementById("maxBlog");

let blogLoadedId = null;

// ===== MARKDOWN -> HTML (an toàn nếu marked chưa load / khác version) =====
function mdToHtml(md) {
  md = md.replace(/^\uFEFF?\s*---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n/, "");

  if (window.marked) {
    if (typeof marked.parse === "function") return marked.parse(md);
    if (typeof marked === "function") return marked(md);
  }
  return "<pre>" + md.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</pre>";
}

// ===== ĐỌC FRONTMATTER (title, date, order) ở đầu file .md =====
function parseFrontmatter(md) {
  const m = md.match(/^\uFEFF?\s*---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/);
  const meta = {};
  if (m) {
    m[1].split(/\r?\n/).forEach(line => {
      const idx = line.indexOf(":");
      if (idx > 0) {
        const key = line.slice(0, idx).trim().toLowerCase();
        const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (val) meta[key] = val;
      }
    });
  }
  return meta;
}

// ===== TÊN ĐẸP TỪ FILENAME (fallback khi .md không có title) =====
function prettifyName(filename) {
  return filename
    .replace(/\.md$/i, "")
    .replace(/^\s*\d+\s*[-_.]\s*/, "")   // bỏ số thứ tự ở đầu: "1_netgear" -> "netgear"
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ===== ĐỌC THỨ TỰ SẮP XẾP =====
// Ưu tiên 'order:' trong frontmatter, rồi tới số ở đầu tên file (1_netgear.md, 02-tenda.md, 3.foo.md)
// Không có gì -> null (bài đó sẽ xuống dưới các bài có số, xếp theo date/tên như cũ)
function parseOrder(filename, meta) {
  if (meta && meta.order != null && meta.order !== "") {
    const n = Number(meta.order);
    if (!isNaN(n)) return n;
  }
  const m = filename.match(/^\s*(\d+)\s*[-_.]/);
  if (m) return Number(m[1]);
  return null;
}

// ===== TỰ NẠP DANH SÁCH .md TỪ GITHUB =====
async function loadBlogIndex() {
  if (blogIndexLoaded) return;

  blogList.innerHTML = '<li style="padding:8px;color:gray">Đang tải danh sách…</li>';

  // dùng nhánh mặc định của repo (khỏi lo main/master)
  const api = "https://api.github.com/repos/" + BLOG_REPO + "/contents/" + BLOG_DIR;

  let files;
  try {
    const res = await fetch(api, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error("GitHub API " + res.status);
    const data = await res.json();
    files = data.filter(f => f.type === "file" && /\.md$/i.test(f.name));
  } catch (e) {
    blogList.innerHTML =
      '<li style="padding:8px;color:#a00">Không tải được danh sách bài viết<br>' +
      '<span style="color:gray;font-size:11px">' + e.message + '</span></li>';
    return;
  }

  // tải nội dung từng file (cùng origin) để lấy title/date/order + cache luôn
  blogs = await Promise.all(files.map(async f => {
    const path = BLOG_DIR + "/" + f.name;
    let md = "";
    try {
      const r = await fetch(path);
      if (r.ok) md = await r.text();
    } catch (_) {}
    const meta = parseFrontmatter(md);
    return {
      id: f.name.replace(/\.md$/i, ""),
      file: path,
      title: meta.title || prettifyName(f.name),
      date: meta.date || "",
      order: parseOrder(f.name, meta),
      content: md || null   // cache; null thì lúc bấm sẽ tải lại
    };
  }));

  // Quy tắc xếp:
  //  1) Bài có 'order' luôn nằm TRÊN bài không có; số nhỏ lên trước.
  //  2) Bài không đánh số: giữ như cũ — mới nhất lên đầu theo date,
  //     không đọc được date thì theo tên giảm dần.
  blogs.sort((a, b) => {
    const ao = a.order, bo = b.order;
    if (ao != null && bo != null) { if (ao !== bo) return ao - bo; }
    else if (ao != null) return -1;
    else if (bo != null) return 1;

    const da = Date.parse(a.date), db = Date.parse(b.date);
    if (!isNaN(da) && !isNaN(db)) return db - da;
    return b.id.localeCompare(a.id);
  });

  blogIndexLoaded = true;

  if (!blogs.length) {
    blogList.innerHTML = '<li style="padding:8px;color:gray">Chưa có file .md nào trong /' + BLOG_DIR + '</li>';
    blogContent.innerHTML = '<p style="color:gray">Thêm file .md vào thư mục ' + BLOG_DIR + '/ là nó tự hiện ở đây.</p>';
    return;
  }

  renderBlogList();
  openBlog(blogs[0].id); // mở sẵn bài đầu danh sách
}

// ===== RENDER DANH SÁCH BÀI VIẾT (cột trái) =====
function renderBlogList() {
  blogList.innerHTML = "";
  blogs.forEach(b => {
    const li = document.createElement("li");
    li.className = "blog-item";
    li.dataset.id = b.id;
    li.innerHTML =
      '<span class="blog-title">' + b.title + '</span>' +
      (b.date ? '<span class="blog-date">' + b.date + '</span>' : '');
    li.onclick = () => openBlog(b.id);
    blogList.appendChild(li);
  });
  if (blogLoadedId) setActiveBlog(blogLoadedId);
}

function setActiveBlog(id) {
  blogList.querySelectorAll(".blog-item").forEach(it => {
    it.classList.toggle("active", it.dataset.id === id);
  });
}

// ===== MỞ 1 BÀI VIẾT =====
async function openBlog(id) {
  const b = blogs.find(x => x.id === id);
  if (!b) return;

  setActiveBlog(id);
  blogLoadedId = id;

  let md;
  if (b.content != null) {
    md = b.content;
  } else {
    blogContent.innerHTML = '<p style="color:gray">Đang tải…</p>';
    try {
      const res = await fetch(b.file);
      if (!res.ok) throw new Error("HTTP " + res.status);
      md = await res.text();
      b.content = md; // cache lại
    } catch (e) {
      blogContent.innerHTML =
        '<h1>:( Không mở được bài viết</h1>' +
        '<p>Không đọc được file: <code>' + b.file + '</code></p>' +
        '<p style="color:gray">' + e.message + '</p>';
      return;
    }
  }

  blogContent.innerHTML = mdToHtml(md);
  blogContent.scrollTop = 0;
}

// ===== MỞ / ĐÓNG CỬA SỔ =====
function openBlogWindow() {
  blogWindow.style.display = "flex";
  if (!blogWindow.style.left) {
    blogWindow.style.left = "180px";
    blogWindow.style.top = "90px";
  }
  bringToFront(blogWindow);          // dùng chung từ docs.js
  addTaskbarBtn(blogWindow, "📖 WriteUp");

  loadBlogIndex();                   // tự quét .md trong blog/ (chỉ chạy lần đầu)
}

writeupIcon.onclick = openBlogWindow;
writeupIcon.ondblclick = openBlogWindow;

closeBlog.onclick = () => { blogWindow.style.display = "none"; removeTaskbarBtn(blogWindow); };
minBlog.onclick   = () => { blogWindow.style.display = "none"; };

// ===== MAXIMIZE (giống Media Player) =====
let blogMax = false;
let blogPrev = {};
maxBlog.onclick = () => {
  if (!blogMax) {
    blogPrev = {
      width: blogWindow.style.width, height: blogWindow.style.height,
      top: blogWindow.style.top,     left: blogWindow.style.left
    };
    blogWindow.style.top = "0px";
    blogWindow.style.left = "0px";
    blogWindow.style.width = "100vw";
    blogWindow.style.height = "calc(100vh - 40px)";
    blogMax = true;
  } else {
    blogWindow.style.width  = blogPrev.width;
    blogWindow.style.height = blogPrev.height;
    blogWindow.style.top    = blogPrev.top;
    blogWindow.style.left   = blogPrev.left;
    blogMax = false;
  }
};

// ===== KÉO DI CHUYỂN + RESIZE =====
makeDraggable(blogWindow, document.getElementById("blogWindowHeader")); // drag.js
makeResizable(blogWindow, { minW: 560, minH: 360 });                    // resize.js
