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
  <title>Flipdot Dashboard</title>
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
    header {
      width: 100%;
      background: #23272b;
      padding: 32px 0 18px 0;
      box-shadow: 0 2px 12px #0003;
      text-align: center;
      margin-bottom: 0;
    }
    header h1 {
      margin: 0;
      font-size: 2.5em;
      font-weight: 700;
      letter-spacing: 2px;
    }
    header p {
      margin: 8px 0 0 0;
      font-size: 1.2em;
      color: #ffd700;
      font-weight: 500;
      letter-spacing: 1px;
    }
    .dashboard {
      width: 100%;
      max-width: 1200px;
      margin: 32px auto 0 auto;
      display: flex;
      gap: 32px;
      flex-wrap: wrap;
      justify-content: center;
      align-items: flex-start;
    }
    .card {
      background: #23272b;
      border-radius: 18px;
      box-shadow: 0 2px 16px #0006;
      padding: 32px 28px 24px 28px;
      min-width: 320px;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
    }
    .card h2 {
      margin: 0 0 18px 0;
      font-size: 1.3em;
      font-weight: 600;
      color: #ffd700;
      letter-spacing: 1px;
    }
    .controls {
      display: flex;
      gap: 24px;
      margin: 0 0 24px 0;
      flex-wrap: wrap;
      justify-content: center;
    }
    .anim-btn {
      background: #181c20;
      border: none;
      border-radius: 14px;
      padding: 18px 24px 12px 24px;
      color: #fff;
      font-size: 1.1em;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 2px 8px #0003;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
      min-width: 110px;
      position: relative;
      outline: none;
    }
    .anim-btn.selected, .anim-btn:active {
      background: #ffd70022;
      box-shadow: 0 0 0 3px #ffd70088;
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
      width: 100%;
      max-width: 320px;
      align-self: center;
    }
    .upload-btn:hover {
      background: linear-gradient(90deg,#ffcc33,#ffb347);
      transform: scale(1.03);
    }
    .frame-preview {
      border-radius: 18px;
      box-shadow: 0 2px 16px #0006;
      background: #222;
      padding: 24px 18px 18px 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
      min-width: 320px;
    }
    .frame-preview label {
      color: #ffd700;
      font-size: 1.1em;
      margin-bottom: 8px;
      font-weight: 600;
      letter-spacing: 1px;
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
      border: 2px solid #ffd70033;
    }
    .clock {
      font-size: 2.2em;
      font-family: 'Segoe UI Mono', 'Consolas', monospace;
      color: #ffd700;
      margin: 18px 0 8px 0;
      letter-spacing: 2px;
      text-align: center;
    }
    .calendar {
      font-size: 1.2em;
      color: #fff;
      background: #181c20;
      border-radius: 10px;
      padding: 12px 20px;
      margin-top: 8px;
      box-shadow: 0 1px 8px #0002;
      text-align: center;
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    @media (max-width: 1200px) {
      .dashboard { flex-direction: column; gap: 0; align-items: stretch; }
      .card, .frame-preview { min-width: 0; width: 95vw; }
      .frame-preview img { width: 95vw; height: auto; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Flipdot Dashboard</h1>        
  </header>
  <div class="dashboard">
    <div class="card">
      <h2>Animation Controls</h2>
      <div class="controls">
        <button class="anim-btn selected" id="btn-bounce" onclick="setAnim('bounce')">
          <div class="preview">
            <svg width="60" height="28">
              <circle cx="15" cy="14" r="8" fill="#FFD700"/>
            </svg>
          </div>
          Bounce
        </button>
        <button class="anim-btn" id="btn-wave" onclick="setAnim('wave')">
          <div class="preview">
            <svg width="60" height="28">
              <polyline points="0,14 10,10 20,18 30,10 40,18 50,10 60,14" fill="none" stroke="#FFD700" stroke-width="3"/>
            </svg>
          </div>
          Wave
        </button>
        <button class="anim-btn" id="btn-blink" onclick="setAnim('blink')">
          <div class="preview">
            <svg width="60" height="28">
              <rect x="15" y="7" width="30" height="14" fill="#FFD700" rx="4"/>
            </svg>
          </div>
          Blink
        </button>
        <button class="anim-btn" id="btn-rain" onclick="setAnim('rain')">
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
        <button class="anim-btn" id="btn-clock" onclick="setAnim('clock')">
          <div class="preview">
            <svg width="60" height="28">
              <circle cx="30" cy="14" r="12" fill="#222" stroke="#FFD700" stroke-width="3"/>
              <line x1="30" y1="14" x2="30" y2="6" stroke="#FFD700" stroke-width="2"/>
              <line x1="30" y1="14" x2="40" y2="14" stroke="#FFD700" stroke-width="2"/>
            </svg>
          </div>
          Clock
        </button>
        <button class="anim-btn" id="btn-calendar" onclick="setAnim('calendar')">
          <div class="preview">
            <svg width="60" height="28">
              <rect x="10" y="6" width="40" height="16" fill="#222" stroke="#FFD700" stroke-width="2"/>
              <text x="30" y="18" text-anchor="middle" fill="#FFD700" font-size="10" font-family="monospace">DATE</text>
            </svg>
          </div>
          Calendar
        </button>
      </div>
      <button class="upload-btn" onclick="alert('Upload prototype!')">
        <span>+ Upload Animation</span>
      </button>
    </div>
    <div class="card">
      <h2>Clock</h2>
      <div class="clock" id="clock"></div>
      <div class="calendar" id="calendar"></div>
    </div>
    <div class="frame-preview">
      <label>Live Board Preview</label>
      <img id="frame" src="/frame.png" alt="Flipdot Preview">
    </div>
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
      // Highlight selected button
      document.querySelectorAll('.anim-btn').forEach(btn => btn.classList.remove('selected'));
      document.getElementById('btn-' + anim).classList.add('selected');
    }

    // Clock and Calendar
    function updateClockAndCalendar() {
      const now = new Date();
      // Clock
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      document.getElementById('clock').textContent = hh + ":" + mm + ":" + ss;
      // Calendar
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      document.getElementById('calendar').textContent = now.toLocaleDateString(undefined, options);
    }
    setInterval(updateClockAndCalendar, 1000);
    updateClockAndCalendar();
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