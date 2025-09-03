import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const animFile = path.join(process.cwd(), "mood.txt");

http.createServer((req, res) => {
    if (req.url === "/view") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Flipdot Animations</title>
  <style>
    body {
      background: #181c20;
      color: #fff;
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    h1 {
      margin-top: 32px;
      font-size: 2.2em;
      font-weight: 700;
      letter-spacing: 2px;
      text-align: center;
    }
    .controls {
      display: flex;
      gap: 32px;
      margin: 32px 0 24px 0;
      flex-wrap: wrap;
      justify-content: center;
    }
    .anim-btn {
      background: #23272b;
      border: none;
      border-radius: 16px;
      padding: 18px 24px 12px 24px;
      color: #fff;
      font-size: 1.1em;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 2px 8px #0003;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: background 0.2s, transform 0.2s;
      min-width: 110px;
      position: relative;
    }
    .anim-btn:hover {
      background: #2e3338;
      transform: translateY(-2px) scale(1.04);
    }
    .preview {
      margin-bottom: 10px;
      width: 60px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #111;
      border-radius: 8px;
      box-shadow: 0 1px 4px #0002;
      overflow: hidden;
    }
    .upload-btn {
      background: linear-gradient(90deg,#ffb347,#ffcc33);
      color: #222;
      font-weight: 600;
      border: none;
      border-radius: 16px;
      padding: 16px 32px;
      font-size: 1.1em;
      margin: 0 0 24px 0;
      cursor: pointer;
      box-shadow: 0 2px 8px #0002;
      transition: background 0.2s, transform 0.2s;
    }
    .upload-btn:hover {
      background: linear-gradient(90deg,#ffcc33,#ffb347);
      transform: scale(1.03);
    }
    .frame-preview {
      margin-top: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 16px #0006;
      background: #222;
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .frame-preview img {
      border-radius: 8px;
      background: #111;
      box-shadow: 0 1px 8px #0003;
      width: 420px;
      height: 140px;
      object-fit: contain;
      image-rendering: pixelated;
      margin-bottom: 8px;
    }
    .frame-preview label {
      color: #aaa;
      font-size: 1em;
      margin-bottom: 4px;
    }
    @media (max-width: 600px) {
      .frame-preview img { width: 95vw; height: auto; }
      .controls { flex-direction: column; gap: 18px; }
    }
  </style>
</head>
<body>
  <h1>Flipdot Animation Board</h1>
  <div class="controls">
    <button class="anim-btn" onclick="setAnim('bounce')">
      <div class="preview">
        <svg width="60" height="28">
          <circle cx="15" cy="14" r="8" fill="#FFD700"/>
        </svg>
      </div>
      Bounce
    </button>
    <button class="anim-btn" onclick="setAnim('wave')">
      <div class="preview">
        <svg width="60" height="28">
          <polyline points="0,14 10,10 20,18 30,10 40,18 50,10 60,14" fill="none" stroke="#FFD700" stroke-width="3"/>
        </svg>
      </div>
      Wave
    </button>
    <button class="anim-btn" onclick="setAnim('blink')">
      <div class="preview">
        <svg width="60" height="28">
          <rect x="15" y="7" width="30" height="14" fill="#FFD700" rx="4"/>
        </svg>
      </div>
      Blink
    </button>
    <button class="anim-btn" onclick="setAnim('rain')">
      <div class="preview">
        <svg width="60" height="28">
          <rect x="0" y="0" width="60" height="28" fill="#222"/>
          <rect x="10" y="5" width="3" height="10" fill="#FFD700"/>
          <rect x="25" y="12" width="3" height="10" fill="#FFD700"/>
          <rect x="40" y="8" width="3" height="10" fill="#FFD700"/>
          <rect x="55" y="3" width="3" height="10" fill="#FFD700"/>
        </svg>
      </div>
      Rain
    </button>
  </div>
  <button class="upload-btn" onclick="alert('Upload prototype!')">
    <span>+ Upload Animation</span>
  </button>
  <div class="frame-preview">
    <label>Live Board Preview</label>
    <img id="frame" src="/frame.png" alt="Flipdot Preview">
  </div>
  <script>
    function updateFrame(time) {
      document.getElementById('frame').src = '/frame.png?t=' + time;
      requestAnimationFrame(updateFrame);
    }
    requestAnimationFrame(updateFrame);

    function setAnim(anim) {
      fetch('/set-anim', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ anim })
      });
    }
  </script>
</body>
</html>
        `);
    } else if (req.url.startsWith("/frame.png")) {
        res.writeHead(200, { "Content-Type": "image/png" });
        const imgPath = path.join(process.cwd(), "output", "frame.png");
        if (fs.existsSync(imgPath)) {
            fs.createReadStream(imgPath).pipe(res);
        } else {
            res.end();
        }
    } else if (req.url === "/set-anim" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try {
                const { anim } = JSON.parse(body);
                fs.writeFileSync(animFile, anim, "utf8");
            } catch {}
            res.writeHead(200);
            res.end();
        });
    } else {
        res.writeHead(404);
        res.end();
    }
}).listen(3000);