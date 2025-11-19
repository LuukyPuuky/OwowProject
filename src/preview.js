import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import url from "node:url";
import path from "node:path";

// In-memory mood entries: { mood: 'happy'|'sad', ts: number ms }
const moodEntries = [];
const WINDOW_MS = 20 * 60 * 1000; // last 20 minutes
// Active scene state (UI-selectable). Default from env or 'mood'
const DEFAULT_SCENE = (process.env.SCENE ? String(process.env.SCENE) : 'mood').toLowerCase();
let activeScene = DEFAULT_SCENE;

// Persistent animation storage
const ANIM_STORAGE_PATH = path.join(process.cwd(), 'output', 'animations.json');

function addMoodLabel(label) {
	if (label !== "happy" && label !== "sad") return false;
	moodEntries.push({ mood: label, ts: Date.now() });
	return true;
}

function getMajorityMood(windowMs = WINDOW_MS) {
	const cutoff = Date.now() - windowMs;
	// prune old
	for (let i = 0; i < moodEntries.length; i++) {
		if (moodEntries[i].ts < cutoff) {
			moodEntries.splice(i, 1);
			i--;
		}
	}
	let happy = 0;
	let sad = 0;
	for (const e of moodEntries) {
		if (e.ts >= cutoff) {
			if (e.mood === "happy") happy++;
			else if (e.mood === "sad") sad++;
		}
	}
	if (happy === 0 && sad === 0) return { majority: "neutral", happy, sad };
	if (happy === sad) return { majority: "neutral", happy, sad };
	return { majority: happy > sad ? "happy" : "sad", happy, sad };
}

function loadAnimations() {
	try {
		if (fs.existsSync(ANIM_STORAGE_PATH)) {
			const data = fs.readFileSync(ANIM_STORAGE_PATH, 'utf8');
			const parsed = JSON.parse(data);
			console.log('[anim] Loaded animations from disk:', Object.keys(parsed.items || {}).join(', '));
			return parsed;
		}
	} catch (err) {
		console.error('[anim] Failed to load animations:', err.message);
	}
	return { active: 'default', items: { default: { w: 84, h: 28, frames: [], text: { enable: false, url: '', field: '', intervalMs: 30000 } } } };
}

function saveAnimations(store) {
	try {
		// Ensure output directory exists
		const dir = path.dirname(ANIM_STORAGE_PATH);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		// Don't save textCache (temporary runtime data)
		const toSave = {
			active: store.active,
			items: {}
		};
		for (const [name, item] of Object.entries(store.items)) {
			toSave.items[name] = {
				w: item.w,
				h: item.h,
				frames: item.frames,
				text: item.text
			};
		}
		fs.writeFileSync(ANIM_STORAGE_PATH, JSON.stringify(toSave, null, 2), 'utf8');
		console.log('[anim] Saved animations to disk:', Object.keys(toSave.items).join(', '));
	} catch (err) {
		console.error('[anim] Failed to save animations:', err.message);
	}
}

// Initialize animation store from disk
if (!globalThis.__anim_store) {
	globalThis.__anim_store = loadAnimations();
}

export { getMajorityMood };

function createHandler() {
	return (req, res) => {
        // Basic CORS for cross-origin control page on :4000
        try{
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
        }catch{}
		const parsed = url.parse(req.url, true);
		if (parsed.pathname === "/view") {
			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(`
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Flipdots Preview</title>
        <style>
          /* Flipboard demo styles (scoped by #flipboard) */
          #flipboard{ --amount-of-columns:0; display:grid; grid-template-columns:repeat(var(--amount-of-columns),1fr); border:1px solid rgba(255,255,255,0.2); background:#000; padding:6px; }
          #flipboard>div{ width:10px; background-color:#000; border-radius:50%; aspect-ratio:1; transform:rotate(45deg) rotateY(180deg); backface-visibility:hidden; transition:transform 40ms ease-out, background-color 40ms ease-out; }
          #flipboard>div.on{ transform:rotate(45deg) rotateY(0deg); background-color:#fff; }
        </style>
      </head>
      <body style="margin:0;background:#fff;display:flex;flex-direction:column;gap:12px;align-items:center;justify-content:center;min-height:100vh;padding:12px;font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">
        <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;justify-content:center;width:100%;max-width:980px">
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
            <img id="frame" src="/frame.png" style="image-rendering:pixelated;max-width:100%;height:auto;border:1px solid #ddd">
            <div style="font-size:12px;color:#666">Live flipdot frame</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
            <section id="flipboard"></section>
            <div style="font-size:12px;color:#666">Flipboard-style demo</div>
          </div>
        </div>
        <div id="qrWrap" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
            <img id="qrImg" alt="QR to this page" style="width:180px;height:180px;border:1px solid #ddd;background:#fff" />
            <div id="qrUrl" style="font-size:12px;color:#555;max-width:360px;text-align:center;word-break:break-all"></div>
          </div>
          <div style="font-size:13px;color:#666;max-width:320px">
            Scan this QR with your phone to open this control page. Optionally, append <code>?scene=next</code> to open the "Who is next" scene automatically.
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center">
          <a href="http://localhost:4000" style="background:#111;color:#fff;padding:6px 10px;border-radius:6px;text-decoration:none;border:1px solid #222">Open Frontend</a>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center">
          <label for="sceneSel">Scene:</label>
			<select id="sceneSel">
            <option value="mood">mood</option>
            <option value="clock">clock</option>
            <option value="demo2">demo2</option>
            <option value="tally">tally</option>
            <option value="fact">fact</option>
            <option value="next">next</option>
            <option value="anim">anim</option>
          </select>
          <span id="sceneStatus" style="color:#333;display:inline-block;min-width:120px;height:20px;line-height:20px"></span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center">
          <a href="/anim" style="background:#0b5;color:#fff;padding:6px 10px;border-radius:6px;text-decoration:none;border:1px solid #0a4">Open Animation Maker</a>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center">
          <button id="voteHappy">Happy :-)</button>
          <button id="voteSad">Sad :-(</button>
          <button id="reset">Reset</button>
          <span id="status" style="color:#333;display:inline-block;min-width:140px;height:20px;line-height:20px"></span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center">
          <strong>Tally Game:</strong>
          <button id="tgA">+1 Team A</button>
          <button id="tgB">+1 Team B</button>
          <button id="tgReset">Reset</button>
          <span id="tgStatus" style="color:#333;display:inline-block;min-width:160px;height:20px;line-height:20px"></span>
        </div>
			<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center">
          <strong>Ski:</strong>
          <button id="skiJump">Jump</button>
          <button id="skiStart">Start Game</button>
          <span id="skiStatus" style="color:#333;display:inline-block;min-width:120px;height:20px;line-height:20px"></span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center">
          <strong>Who is next:</strong>
          <input id="nextInput" placeholder="Name" style="padding:4px 6px" />
          <button id="nextSet">Set</button>
          <button id="nextClear">Clear</button>
          <span id="nextStatus" style="color:#333;display:inline-block;min-width:140px;height:20px;line-height:20px"></span>
        </div>
        <div style="max-width:720px;text-align:center;color:#666;font-size:14px;line-height:1.35">
          Votes are counted over the last 20 minutes. If happy and sad are equal (or there are no votes), a neutral face is shown.
        </div>
        <div id="majority" style="color:#555;text-align:center;margin-top:4px">Current office mood (last 20 min): n/a</div>
        <script>
          function updateFrame(time) {
            document.getElementById('frame').src = '/frame.png?t=' + time;
            requestAnimationFrame(updateFrame);
          }
          requestAnimationFrame(updateFrame);
        // Flipboard demo (independent from real display)
        (function(){
          try{
            const flipboard_display_size = [84, 28]; // columns, rows
            const flipboard_dots_array = [];
            const flipboard_element = document.querySelector('#flipboard');
            if (!flipboard_element) return;
            flipboard_element.style.setProperty('--amount-of-columns', String(flipboard_display_size[0]));
            for (let c = 1; c <= flipboard_display_size[0]; c++) {
              for (let r = 1; r <= flipboard_display_size[1]; r++) {
                const dot = document.createElement('div');
                flipboard_element.appendChild(dot);
                flipboard_dots_array.push(false);
              }
            }
            const update_flipboard = () => {
              flipboard_dots_array.forEach((dot, idx) => {
                const el = flipboard_element.querySelector('div:nth-child(' + (idx + 1) + ')');
                if (!el) return;
                if (dot) el.classList.add('on'); else el.classList.remove('on');
              });
            };
            // Live mapping from backend frame bits → front flipboard
            let __prevBits = '';
            async function poll(){
              try{
                const r = await fetch('/frame.bits');
                const j = await r.json();
                if (j && j.bits && j.w && j.h){
                  if (j.bits === __prevBits) { setTimeout(poll, 120); return; }
                  // map center-cropped or scaled to 84x28; simple nearest sample
                  const W = 84, H = 28;
                  for (let y = 0; y < H; y++){
                    for (let x = 0; x < W; x++){
                      const sx = Math.floor(x * j.w / W);
                      const sy = Math.floor(y * j.h / H);
                      const sidx = sy * j.w + sx;
                      const bit = j.bits.charAt(sidx) === '1';
                      flipboard_dots_array[y * W + x] = bit;
                    }
                  }
                  __prevBits = j.bits;
                  update_flipboard();
                }
              }catch{}
              setTimeout(poll, 120);
            }
            poll();
          }catch{}
        })();
          // QR for fixed link
          (function(){
            try{
              const url = 'http://145.93.160.143:3000/view';
              const img = document.getElementById('qrImg');
              const txt = document.getElementById('qrUrl');
              if (img) img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(url);
              if (txt) txt.textContent = url;
            }catch{}
          })();
			async function refreshScene(){
            try{
              const r = await fetch('/scene');
              const j = await r.json();
              const sel = document.getElementById('sceneSel');
              if (j && j.scene && sel) sel.value = j.scene;
            }catch{}
          }
          async function setScene(scene){
            try{
              const r = await fetch('/scene', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ scene }) });
              document.getElementById('sceneStatus').textContent = r.ok ? ('Scene: ' + scene) : 'Failed';
              if (r.ok) setTimeout(()=>{ const el = document.getElementById('sceneStatus'); if (el.textContent.startsWith('Scene:')) el.textContent=''; }, 1200);
            }catch{
              document.getElementById('sceneStatus').textContent = 'Failed';
            }
          }
          document.getElementById('sceneSel').addEventListener('change', (e)=> setScene(e.target.value));
          refreshScene();
          // Allow linking with ?scene=next etc.
          (function(){
            try{
              const params = new URLSearchParams(location.search);
              const sc = params.get('scene');
              if (sc) setScene(String(sc).toLowerCase());
            }catch{}
          })();

          async function refreshMajority(){
            try{
              const r = await fetch('/mood/majority');
              const j = await r.json();
              document.getElementById('majority').textContent = 'Current office mood (last 20 min): ' + (j.majority ?? 'n/a') + '  —  counts: happy ' + j.happy + ' · sad ' + j.sad;
            }catch(e){
              document.getElementById('majority').textContent = 'Current office mood (last 20 min): n/a';
            }
          }
          setInterval(refreshMajority, 1500);
          refreshMajority();

          async function vote(label){
            const res = await fetch('/mood', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({mood: label})});
            const ok = res.ok;
            document.getElementById('status').textContent = ok ? 'Vote recorded' : 'Vote failed';
            if (ok) setTimeout(()=>{ const el = document.getElementById('status'); if (el.textContent === 'Vote recorded') el.textContent = ''; }, 1500);
            refreshMajority();
          }

          async function resetVotes(){
            const res = await fetch('/mood/reset', {method:'POST'});
            const ok = res.ok;
            document.getElementById('status').textContent = ok ? 'Votes reset' : 'Reset failed';
            if (ok) setTimeout(()=>{ const el = document.getElementById('status'); if (el.textContent === 'Votes reset') el.textContent = ''; }, 1500);
            refreshMajority();
          }

          document.getElementById('voteHappy').addEventListener('click', ()=>vote('happy'));
          document.getElementById('voteSad').addEventListener('click', ()=>vote('sad'));
          document.getElementById('reset').addEventListener('click', resetVotes);

          async function tgAdd(team){
            const res = await fetch('/tallygame/add', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ team })});
            document.getElementById('tgStatus').textContent = res.ok ? ('Added to Team ' + team) : 'Failed';
            if (res.ok) setTimeout(()=>{ const el = document.getElementById('tgStatus'); if (el.textContent.startsWith('Added')) el.textContent=''; }, 1200);
          }
          async function tgReset(){
            const res = await fetch('/tallygame/reset', {method:'POST'});
            document.getElementById('tgStatus').textContent = res.ok ? 'Game reset' : 'Failed';
            if (res.ok) setTimeout(()=>{ const el = document.getElementById('tgStatus'); if (el.textContent==='Game reset') el.textContent=''; }, 1200);
          }
          document.getElementById('tgA').addEventListener('click', ()=>tgAdd('A'));
          document.getElementById('tgB').addEventListener('click', ()=>tgAdd('B'));
          document.getElementById('tgReset').addEventListener('click', tgReset);

          async function skiJump(){
            try{
              const r = await fetch('/ski/jump', {method:'POST'});
              document.getElementById('skiStatus').textContent = r.ok ? 'Jump!' : 'Failed';
              if (r.ok) setTimeout(()=>{ const el = document.getElementById('skiStatus'); if (el.textContent==='Jump!') el.textContent=''; }, 600);
            }catch{ document.getElementById('skiStatus').textContent = 'Failed'; }
          }
          async function skiStart(){
            try{
              await fetch('/ski/start', {method:'POST'});
              document.getElementById('skiStatus').textContent = 'Game started';
              setTimeout(()=>{ const el = document.getElementById('skiStatus'); if (el.textContent==='Game started') el.textContent=''; }, 800);
            }catch{}
          }
          document.getElementById('skiJump').addEventListener('click', skiJump);
          document.getElementById('skiStart').addEventListener('click', skiStart);
          // Spacebar triggers jump
          window.addEventListener('keydown', (e)=>{
            if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); skiJump(); }
          });
          // Keep Start button enabled/disabled based on started flag
          async function syncSkiUI(){
            try{
              const r = await fetch('/ski');
              const j = await r.json();
              const btn = document.getElementById('skiStart');
              if (btn) btn.disabled = !!j.started;
            }catch{}
          }
          setInterval(syncSkiUI, 600);
          syncSkiUI();

          // Who is next UI
          async function nextGet(){
            try{ const r = await fetch('/next'); const j = await r.json(); return j && j.name ? String(j.name) : ''; }catch{ return ''; }
          }
          async function nextSet(name){
            try{
              const r = await fetch('/next', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name }) });
              const ok = r.ok; document.getElementById('nextStatus').textContent = ok ? ('Next: ' + name) : 'Failed';
              if (ok) setTimeout(()=>{ const el = document.getElementById('nextStatus'); if (el.textContent.startsWith('Next:')) el.textContent=''; }, 1200);
            }catch{ document.getElementById('nextStatus').textContent = 'Failed'; }
          }
          async function nextClear(){
            try{
              const r = await fetch('/next/clear', { method:'POST' });
              document.getElementById('nextStatus').textContent = r.ok ? 'Cleared' : 'Failed';
              if (r.ok) setTimeout(()=>{ const el = document.getElementById('nextStatus'); if (el.textContent==='Cleared') el.textContent=''; }, 1000);
            }catch{ document.getElementById('nextStatus').textContent = 'Failed'; }
          }
          document.getElementById('nextSet').addEventListener('click', async ()=>{
            const v = String(document.getElementById('nextInput').value || '').trim();
            if (v) nextSet(v);
          });
          document.getElementById('nextClear').addEventListener('click', nextClear);
          // Prefill current name
          nextGet().then(n=>{ const el = document.getElementById('nextInput'); if (el && n) el.value = n; });
        </script>
      </body></html>
    `);
		} else if (parsed.pathname === "/frame.png") {
            const buf = globalThis.__framePNG;
            if (buf && buf.length) {
                res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" });
                res.end(buf);
            } else {
                res.writeHead(200, { "Content-Type": "image/png" });
                res.end(fs.readFileSync("./output/frame.png"));
            }
        } else if (parsed.pathname === "/frame.bits") {
            const bm = globalThis.__frameBitmap;
            if (!bm || !bm.bits) { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ w:0, h:0, bits:'' })); return; }
            res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
            res.end(JSON.stringify({ w: Number(bm.w)||0, h: Number(bm.h)||0, bits: String(bm.bits||'') }));
		} else if (parsed.pathname === "/scene" && req.method === "GET") {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ scene: activeScene }));
		} else if (parsed.pathname === "/scene" && req.method === "POST") {
			let body = "";
			req.on("data", chunk => body += chunk);
			req.on("end", () => {
				try {
					const data = JSON.parse(body || "{}");
					const scene = String((data.scene || '')).toLowerCase();
                    if (scene === 'mood' || scene === 'clock' || scene === 'demo2' || scene === 'tally' || scene === 'fact' || scene === 'next' || scene === 'anim') {
						activeScene = scene;
						res.writeHead(200, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok: true, scene: activeScene }));
					} else {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok: false }));
					}
				} catch {
					res.writeHead(400, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok: false }));
				}
			});
        } else if (parsed.pathname === "/anim" && req.method === "GET") {
			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Animation Maker</title>
    <style>
      * { box-sizing: border-box; }
      body{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background:#2b2b2b; margin:0; padding:0; color:#e0e0e0; overflow:hidden; }
      
      /* Top menu bar */
      .menubar{ background:#1e1e1e; border-bottom:1px solid #000; padding:8px 16px; display:flex; gap:12px; align-items:center; height:40px; }
      .menubar h1{ margin:0; font-size:13px; font-weight:600; color:#fff; }
      .menubar-spacer{ flex:1; }
      .menubar-group{ display:flex; gap:6px; align-items:center; }
      
      /* Main workspace */
      .workspace{ display:flex; height:calc(100vh - 40px); }
      
      /* Left vertical toolbar */
      .left-toolbar{ 
        background:#1e1e1e; 
        width:52px; 
        border-right:1px solid #000; 
        display:flex; 
        flex-direction:column; 
        padding:8px 0;
        gap:2px;
      }
      .tool-group{ 
        display:flex; 
        flex-direction:column; 
        padding:4px 0; 
        border-bottom:1px solid #333; 
      }
      .tool-group:last-child{ border-bottom:none; }
      
      /* Side panels */
      .side-panel{ background:#262626; width:240px; border-right:1px solid #1a1a1a; overflow-y:auto; display:flex; flex-direction:column; }
      .side-panel.right{ border-right:none; border-left:1px solid #1a1a1a; }
      
      /* Center canvas area */
      .center-panel{ 
        flex:1; 
        display:flex; 
        flex-direction:column; 
        background:#2b2b2b; 
        overflow:hidden;
      }
      .canvas-area{ 
        flex:1; 
        display:flex; 
        align-items:center; 
        justify-content:center; 
        overflow:auto; 
        padding:20px; 
      }
      .timeline-area{ 
        background:#1e1e1e; 
        border-top:1px solid #000; 
        padding:12px 16px; 
        height:140px;
        overflow-x:auto;
        overflow-y:hidden;
      }
      
      /* Panel sections */
      .panel-section{ padding:16px 12px; border-bottom:1px solid #1a1a1a; }
      .panel-section h3{ margin:0 0 12px 0; font-size:11px; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:0.5px; }
      
      /* Icon buttons (square) */
      .icon-btn{
        background:transparent;
        border:none;
        color:#b0b0b0;
        width:36px;
        height:36px;
        margin:2px 8px;
        border-radius:4px;
        cursor:pointer;
        font-size:18px;
        display:flex;
        align-items:center;
        justify-content:center;
        transition:all 0.1s;
      }
      .icon-btn:hover{ background:#3a3a3a; color:#fff; }
      .icon-btn.active{ background:#0d7acc; color:#fff; }
      
      /* Small tool buttons */
      .tool-btn{ 
        background:#3a3a3a; 
        border:1px solid #4a4a4a; 
        color:#e0e0e0; 
        padding:6px 10px; 
        border-radius:3px; 
        cursor:pointer; 
        font-size:12px;
        transition:all 0.1s;
        white-space:nowrap;
      }
      .tool-btn:hover{ background:#4a4a4a; }
      .tool-btn.active{ background:#0d7acc; border-color:#0d7acc; color:#fff; }
      .tool-btn.danger{ background:#5a1a1a; border-color:#6a2020; }
      .tool-btn.danger:hover{ background:#6a2020; }
      .tool-btn.primary{ background:#0d7acc; border-color:#0d7acc; color:#fff; }
      .tool-btn.primary:hover{ background:#1583d4; }
      
      /* Grid */
      .grid-container{ background:#1a1a1a; padding:20px; border-radius:4px; box-shadow:0 2px 10px rgba(0,0,0,0.5); }
      .grid{ display:grid; grid-auto-rows:12px; gap:2px; background:#0a0a0a; padding:8px; border-radius:2px; }
      .cell{ width:12px; height:12px; background:#1a1a1a; border-radius:50%; cursor:crosshair; transition:background 0.05s; }
      .cell:hover{ background:#2a2a2a; }
      .cell.on{ background:#fff; }
      .cell.prev:not(.on){ background:#444; }
      .cell.next:not(.on){ background:#666; }
      
      /* Timeline */
      .timeline-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
      .timeline-header h3{ margin:0; font-size:11px; color:#888; text-transform:uppercase; }
      .timeline-controls{ display:flex; gap:4px; }
      .timeline{ display:flex; gap:6px; padding:8px 0; }
      .frameThumb{ 
        display:grid; 
        grid-template-columns:repeat(var(--w), 2px); 
        grid-auto-rows:2px; 
        gap:1px; 
        padding:4px; 
        background:#0a0a0a; 
        border:2px solid #2a2a2a; 
        border-radius:2px;
        cursor:pointer; 
        transition:all 0.1s;
        flex-shrink:0;
      }
      .frameThumb:hover{ border-color:#4a4a4a; }
      .frameThumb.active{ border-color:#0d7acc; }
      .frameThumb .p{ width:2px; height:2px; background:#1a1a1a; }
      .frameThumb .p.on{ background:#fff; }
      
      /* Inputs */
      input[type=text], input[type=number], select{ 
        background:#1a1a1a; 
        border:1px solid #3a3a3a; 
        color:#e0e0e0; 
        padding:6px 8px; 
        border-radius:3px; 
        font-size:12px;
        width:100%;
      }
      input[type=text]:focus, input[type=number]:focus, select:focus{ 
        outline:none; 
        border-color:#0d7acc; 
      }
      
      input[type=range]{ 
        -webkit-appearance:none; 
        width:100%; 
        height:3px; 
        background:#3a3a3a; 
        border-radius:2px; 
        outline:none;
      }
      input[type=range]::-webkit-slider-thumb{ 
        -webkit-appearance:none; 
        width:12px; 
        height:12px; 
        background:#0d7acc; 
        border-radius:50%; 
        cursor:pointer;
      }
      input[type=range]::-moz-range-thumb{ 
        width:12px; 
        height:12px; 
        background:#0d7acc; 
        border-radius:50%; 
        cursor:pointer; 
        border:none;
      }
      
      input[type=checkbox]{ accent-color:#0d7acc; }
      
      /* Property row */
      .prop-row{ display:flex; flex-direction:column; gap:4px; margin-bottom:10px; }
      .prop-row label{ font-size:11px; color:#888; }
      .prop-row-inline{ display:flex; align-items:center; gap:8px; margin-bottom:10px; }
      .prop-row-inline label{ font-size:11px; color:#888; flex:1; }
      .prop-value{ font-size:11px; color:#b0b0b0; margin-top:2px; }
      
      /* Animation list */
      .anim-item{ 
        background:#1a1a1a; 
        padding:8px 10px; 
        border-radius:3px; 
        margin-bottom:6px; 
        cursor:pointer; 
        border:1px solid transparent;
        transition:all 0.1s;
        font-size:12px;
      }
      .anim-item:hover{ background:#2a2a2a; border-color:#3a3a3a; }
      .anim-item.active{ background:#0d7acc; border-color:#0d7acc; color:#fff; }
      .anim-preview{ margin-top:6px; display:none; }
      .anim-item:hover .anim-preview{ display:block; }
      
      /* Badges */
      .badge{ 
        background:#3a3a3a; 
        padding:3px 6px; 
        border-radius:2px; 
        font-size:10px; 
        color:#888;
        display:inline-block;
      }
      
      /* Button groups */
      .btn-group{ display:flex; gap:4px; }
      .btn-group .tool-btn{ flex:1; padding:5px 8px; }
      
      /* Scrollbar styling */
      ::-webkit-scrollbar{ width:8px; height:8px; }
      ::-webkit-scrollbar-track{ background:#1a1a1a; }
      ::-webkit-scrollbar-thumb{ background:#3a3a3a; border-radius:4px; }
      ::-webkit-scrollbar-thumb:hover{ background:#4a4a4a; }
    </style>
  </head>
  <body>
    <!-- Menu Bar -->
    <div class="menubar">
      <h1>Animation Maker</h1>
      <div class="menubar-spacer"></div>
      <div class="menubar-group">
        <button class="tool-btn" id="play">▶ Play</button>
        <button class="tool-btn" id="stop">⏹ Stop</button>
        <button class="tool-btn primary" id="save">Save</button>
      </div>
    </div>
    
    <!-- Main Workspace -->
    <div class="workspace">
      <!-- Left Vertical Toolbar -->
      <div class="left-toolbar">
        <div class="tool-group">
          <button id="toolBrush" class="icon-btn active" title="Brush Tool (B)">✏️</button>
          <button id="toolLine" class="icon-btn" title="Line Tool (L)">📏</button>
          <button id="toolEllipse" class="icon-btn" title="Ellipse Tool (E)">⭕</button>
          <button id="toolArrow" class="icon-btn" title="Arrow Tool (A)">➡️</button>
        </div>
        <div class="tool-group">
          <button id="modePaint" class="icon-btn active" title="Paint">🎨</button>
          <button id="modeErase" class="icon-btn" title="Erase">🧹</button>
        </div>
      </div>
      
      <!-- Left Panel - Animation & Brush -->
      <div class="side-panel">
        <div class="panel-section">
          <h3>Animation</h3>
          <div class="prop-row">
            <select id="animSel"></select>
          </div>
          <div class="prop-row">
            <input id="animName" type="text" placeholder="Animation name" />
          </div>
          <div class="btn-group">
            <button class="tool-btn" id="animNew">New</button>
            <button class="tool-btn primary" id="animSetActive">Set Active</button>
          </div>
          <div class="btn-group" style="margin-top:4px;">
            <button class="tool-btn" id="animSaveAs">Save As</button>
            <button class="tool-btn danger" id="animDelete">Delete</button>
          </div>
        </div>
        
        <div class="panel-section">
          <h3>Brush</h3>
          <div class="prop-row">
            <label>Size</label>
            <input id="brushSize" type="range" min="1" max="8" value="1" />
          </div>
          <div class="prop-row">
            <label>Shape</label>
            <div class="btn-group">
              <button id="brushCircle" class="tool-btn active">●</button>
              <button id="brushSquare" class="tool-btn">■</button>
              <button id="brushTriangle" class="tool-btn">▲</button>
            </div>
          </div>
        </div>
        
        <div class="panel-section">
          <h3>Animations</h3>
          <div id="animList"></div>
        </div>
      </div>
      
      <!-- Center Panel - Canvas & Timeline -->
      <div class="center-panel">
        <div class="canvas-area">
          <div class="grid-container">
            <div id="grid" class="grid"></div>
          </div>
        </div>
        
        <div class="timeline-area">
          <div class="timeline-header">
            <h3>Timeline</h3>
            <div class="timeline-controls">
              <button class="tool-btn" id="addFrame">+ Add Frame</button>
              <button class="tool-btn" id="dupFrame">Duplicate</button>
              <button class="tool-btn danger" id="delFrame">Delete</button>
              <span class="badge" id="sizeBadge" style="margin-left:8px;">84×28</span>
            </div>
          </div>
          <div class="timeline" id="timeline"></div>
        </div>
      </div>
      
      <!-- Right Panel - Properties -->
      <div class="side-panel right">
        <div class="panel-section">
          <h3>Frame</h3>
          <div class="prop-row">
            <label>Duration (ms)</label>
            <input id="dur" type="range" min="10" max="2000" step="10" value="300" />
            <span id="durVal" class="prop-value">300 ms</span>
          </div>
        </div>
        
        <div class="panel-section">
          <h3>Onion Skin</h3>
          <div class="prop-row-inline">
            <label>Enable</label>
            <input id="onionEnable" type="checkbox" />
          </div>
          <div class="prop-row">
            <label>Previous Frames</label>
            <input id="onionPrev" type="number" min="0" max="2" value="1" />
          </div>
          <div class="prop-row">
            <label>Next Frames</label>
            <input id="onionNext" type="number" min="0" max="2" value="0" />
          </div>
        </div>
        
        <div class="panel-section">
          <h3>Text Overlay</h3>
          <div class="prop-row-inline">
            <label>Enable</label>
            <input id="textEnable" type="checkbox" />
          </div>
          <div class="prop-row">
            <label>API URL</label>
            <input id="textUrl" type="text" placeholder="https://..." />
          </div>
          <div class="prop-row">
            <label>JSON Field</label>
            <input id="textField" type="text" placeholder="message" />
          </div>
          <div class="prop-row">
            <label>Interval (ms)</label>
            <input id="textInt" type="number" min="1000" step="500" value="30000" />
          </div>
          <button class="tool-btn primary" id="textSave" style="width:100%; margin-top:4px;">Save Config</button>
        </div>
      </div>
    </div>
    
    <script>
      // Confirmation dialog only for deleting animations
      setTimeout(() => {
        const delAnimBtn = document.getElementById('animDelete');
        if (delAnimBtn) {
          const orig = delAnimBtn.onclick;
          delAnimBtn.onclick = function() {
            if (confirm('Delete this animation?')) {
              orig && orig();
            }
          };
        }
      }, 400);
      let W = 84, H = 28;
      async function getLiveSize(){ try{ const r = await fetch('/frame.bits'); const j = await r.json(); if (j && j.w && j.h){ W=j.w; H=j.h; } }catch{} }
      const grid = document.getElementById('grid');
      const tl = document.getElementById('timeline');
      const durEl = document.getElementById('dur');
      const sizeBadge = document.getElementById('sizeBadge');
      const brushSizeEl = document.getElementById('brushSize');
      const modePaintBtn = document.getElementById('modePaint');
      const modeEraseBtn = document.getElementById('modeErase');
      const brushCircleBtn = document.getElementById('brushCircle');
      const brushSquareBtn = document.getElementById('brushSquare');
      const brushTriangleBtn = document.getElementById('brushTriangle');
      const animListEl = document.getElementById('animList');
      const onionEnableEl = document.getElementById('onionEnable');
      const onionPrevEl = document.getElementById('onionPrev');
      const onionNextEl = document.getElementById('onionNext');
      const textUrlEl = document.getElementById('textUrl');
      const textFieldEl = document.getElementById('textField');
      const textIntEl = document.getElementById('textInt');
      const textEnableEl = document.getElementById('textEnable');
      const textSaveBtn = document.getElementById('textSave');
      const animSel = document.getElementById('animSel');
      const animNameInput = document.getElementById('animName');
      let frames = [];
      let idx = 0;
      let playing = false;
      let isMouseDown = false;
      let brushSize = 1; // radius in pixels
      let brushMode = 'paint'; // 'paint' | 'erase'
      let brushShape = 'circle'; // 'circle' | 'square' | 'triangle'
      let activeTool = 'brush'; // 'brush' | 'line' | 'ellipse' | 'arrow'
      let lastMouseIndex = -1; // for continuous brush strokes
      let shapeStartIndex = -1; // for shape tools (line, ellipse, arrow)
      let shapePreview = null; // temporary preview for shape tools
      let currentName = '';
      let textMeta = { enable:false, url:'', field:'', intervalMs:30000 };
      let onionEnabled = false;
      let onionPrev = 1;
      let onionNext = 0;
      function bitsOf(arr){ return arr.map(v=>v?'1':'0').join(''); }
      function arrOf(bits){ const arr = new Array(W*H).fill(false); for(let i=0;i<arr.length && i<bits.length;i++){ arr[i] = bits.charAt(i)==='1'; } return arr; }
      
      // Bresenham's line algorithm for continuous brush strokes
      function bresenhamLine(x0, y0, x1, y1) {
        const points = [];
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        let x = x0, y = y0;
        while (true) {
          points.push(y * W + x);
          if (x === x1 && y === y1) break;
          const e2 = 2 * err;
          if (e2 > -dy) { err -= dy; x += sx; }
          if (e2 < dx) { err += dx; y += sy; }
        }
        return points;
      }
      
      // Draw ellipse using midpoint algorithm
      function drawEllipse(cx, cy, rx, ry) {
        const points = [];
        // Handle degenerate cases
        if (rx === 0 && ry === 0) return [cy * W + cx];
        if (rx === 0) {
          for (let y = -ry; y <= ry; y++) {
            const py = cy + y;
            if (py >= 0 && py < H) points.push(py * W + cx);
          }
          return points;
        }
        if (ry === 0) {
          for (let x = -rx; x <= rx; x++) {
            const px = cx + x;
            if (px >= 0 && px < W) points.push(cy * W + px);
          }
          return points;
        }
        // Midpoint ellipse algorithm
        let x = 0, y = ry;
        let rx2 = rx * rx, ry2 = ry * ry;
        let px = 0, py = 2 * rx2 * y;
        const plot = (xp, yp) => {
          if (xp >= 0 && xp < W && yp >= 0 && yp < H) points.push(yp * W + xp);
        };
        // Region 1
        let p = Math.round(ry2 - (rx2 * ry) + (0.25 * rx2));
        while (px < py) {
          x++; px += 2 * ry2;
          if (p < 0) { p += ry2 + px; }
          else { y--; py -= 2 * rx2; p += ry2 + px - py; }
          plot(cx + x, cy + y); plot(cx - x, cy + y);
          plot(cx + x, cy - y); plot(cx - x, cy - y);
        }
        // Region 2
        p = Math.round(ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2);
        while (y >= 0) {
          y--; py -= 2 * rx2;
          if (p > 0) { p += rx2 - py; }
          else { x++; px += 2 * ry2; p += rx2 - py + px; }
          plot(cx + x, cy + y); plot(cx - x, cy + y);
          plot(cx + x, cy - y); plot(cx - x, cy - y);
        }
        return points;
      }
      
      function applyBrushAt(index){
        const arr = frames[idx]?.arr || new Array(W*H).fill(false);
        const cx = index % W;
        const cy = Math.floor(index / W);
        const r = Math.max(0, brushSize - 1);
        for (let dy = -r; dy <= r; dy++){
          for (let dx = -r; dx <= r; dx++){
            const nx = cx + dx; const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            let inside = false;
            if (brushShape === 'circle') {
              inside = (dx*dx + dy*dy) <= r*r;
            } else if (brushShape === 'square') {
              inside = Math.abs(dx) <= r && Math.abs(dy) <= r;
            } else if (brushShape === 'triangle') {
              // Isosceles triangle pointing up, apex at cy - r, base at cy + r
              const yPrime = dy + r; // 0..2r inside vertical span
              if (yPrime >= 0 && yPrime <= 2*r) {
                const halfWidth = Math.floor((yPrime / Math.max(1, 2*r)) * r);
                inside = Math.abs(dx) <= halfWidth;
              }
            }
            if (!inside) continue;
            const pi = ny * W + nx;
            arr[pi] = (brushMode === 'paint');
            const el = grid.children[pi];
            if (el) el.classList.toggle('on', arr[pi]);
          }
        }
      }
      
      // Apply brush along a line (for continuous strokes)
      function applyBrushLine(fromIndex, toIndex) {
        const x0 = fromIndex % W;
        const y0 = Math.floor(fromIndex / W);
        const x1 = toIndex % W;
        const y1 = Math.floor(toIndex / W);
        const line = bresenhamLine(x0, y0, x1, y1);
        for (const idx of line) applyBrushAt(idx);
      }
      
      // Draw shape (line, ellipse, arrow) from start to current index
      function drawShape(startIndex, endIndex, toolType, temporary = false) {
        const x0 = startIndex % W;
        const y0 = Math.floor(startIndex / W);
        const x1 = endIndex % W;
        const y1 = Math.floor(endIndex / W);
        let points = [];
        
        if (toolType === 'line') {
          points = bresenhamLine(x0, y0, x1, y1);
        } else if (toolType === 'ellipse') {
          const cx = Math.floor((x0 + x1) / 2);
          const cy = Math.floor((y0 + y1) / 2);
          const rx = Math.abs(x1 - x0) / 2;
          const ry = Math.abs(y1 - y0) / 2;
          points = drawEllipse(cx, cy, Math.round(rx), Math.round(ry));
        } else if (toolType === 'arrow') {
          // Arrow: line + arrowhead
          const line = bresenhamLine(x0, y0, x1, y1);
          points.push(...line);
          // Arrowhead (simple triangle at end)
          const dx = x1 - x0;
          const dy = y1 - y0;
          const len = Math.sqrt(dx*dx + dy*dy);
          if (len > 3) {
            const ndx = dx / len;
            const ndy = dy / len;
            const arrowSize = Math.min(5, len / 3);
            // Perpendicular vector
            const px = -ndy;
            const py = ndx;
            // Two points for arrowhead
            const ax1 = Math.round(x1 - ndx * arrowSize + px * arrowSize * 0.5);
            const ay1 = Math.round(y1 - ndy * arrowSize + py * arrowSize * 0.5);
            const ax2 = Math.round(x1 - ndx * arrowSize - px * arrowSize * 0.5);
            const ay2 = Math.round(y1 - ndy * arrowSize - py * arrowSize * 0.5);
            points.push(...bresenhamLine(x1, y1, ax1, ay1));
            points.push(...bresenhamLine(x1, y1, ax2, ay2));
          }
        }
        
        if (temporary) {
          // Preview only (don't modify actual array)
          return points;
        } else {
          // Commit to array
          const arr = frames[idx]?.arr || new Array(W*H).fill(false);
          for (const pi of points) {
            if (pi >= 0 && pi < arr.length) {
              arr[pi] = (brushMode === 'paint');
              const el = grid.children[pi];
              if (el) el.classList.toggle('on', arr[pi]);
            }
          }
        }
      }
      function renderGrid(){
        grid.style.gridTemplateColumns = 'repeat(' + W + ',12px)';
        grid.innerHTML = '';
        const arr = frames[idx]?.arr || new Array(W*H).fill(false);
        for(let i=0;i<W*H;i++){
          const d = document.createElement('div'); d.className = 'cell' + (arr[i]?' on':''); d.dataset.idx = String(i);
          d.onmousedown = (e)=>{ 
            e.preventDefault(); 
            isMouseDown = true; 
            if (activeTool === 'brush') {
              applyBrushAt(i); 
              lastMouseIndex = i;
            } else {
              // Shape tools: start shape drawing
              shapeStartIndex = i;
              shapePreview = null;
            }
          };
          d.onmouseover = (e)=>{ 
            if (!isMouseDown) return;
            if (activeTool === 'brush') {
              // Continuous brush with interpolation
              if (lastMouseIndex >= 0 && lastMouseIndex !== i) {
                applyBrushLine(lastMouseIndex, i);
              } else {
                applyBrushAt(i);
              }
              lastMouseIndex = i;
            } else {
              // Shape tools: preview shape
              if (shapeStartIndex >= 0) {
                // Clear previous preview
                if (shapePreview) {
                  for (const pi of shapePreview) {
                    if (pi >= 0 && pi < grid.children.length) {
                      const el = grid.children[pi];
                      const actual = arr[pi];
                      if (el) el.classList.toggle('on', actual);
                    }
                  }
                }
                // Draw new preview
                shapePreview = drawShape(shapeStartIndex, i, activeTool, true);
                for (const pi of shapePreview) {
                  if (pi >= 0 && pi < grid.children.length) {
                    const el = grid.children[pi];
                    if (el) el.classList.toggle('on', brushMode === 'paint');
                  }
                }
              }
            }
          };
          d.onmouseup = (e)=>{ 
            if (isMouseDown && activeTool !== 'brush' && shapeStartIndex >= 0) {
              // Commit shape to array
              drawShape(shapeStartIndex, i, activeTool, false);
              shapePreview = null;
              shapeStartIndex = -1;
            }
          };
          grid.appendChild(d);
        }
        sizeBadge.textContent = W + '×' + H;
        updateOnionSkins();
      }
      window.addEventListener('mouseup', ()=>{ 
        isMouseDown = false; 
        lastMouseIndex = -1;
        shapeStartIndex = -1;
        shapePreview = null;
      });
      function updateOnionSkins(){
        if (!grid) return;
        if (!onionEnabled){
          for (let i=0;i<grid.children.length;i++){ const el = grid.children[i]; el.classList.remove('prev'); el.classList.remove('next'); }
          return;
        }
        const cur = frames[idx]?.arr || new Array(W*H).fill(false);
        // compute aggregated prev/next ghost masks
        const prevMask = new Array(W*H).fill(false);
        const nextMask = new Array(W*H).fill(false);
        for (let k=1;k<=onionPrev;k++){
          const f = frames[idx - k]; if (!f) break; const a = f.arr;
          for (let i=0;i<a.length;i++){ if (a[i]) prevMask[i] = true; }
        }
        for (let k=1;k<=onionNext;k++){
          const f = frames[idx + k]; if (!f) break; const a = f.arr;
          for (let i=0;i<a.length;i++){ if (a[i]) nextMask[i] = true; }
        }
        for (let i=0;i<grid.children.length;i++){
          const el = grid.children[i];
          if (!el) continue;
          el.classList.remove('prev'); el.classList.remove('next');
          if (!cur[i]){
            if (prevMask[i]) el.classList.add('prev');
            if (nextMask[i]) el.classList.add('next');
          }
        }
      }
      function renderTimeline(){
        tl.innerHTML='';
        frames.forEach((f, i)=>{
          const t = document.createElement('div'); 
          t.className = 'frameThumb' + (i===idx ? ' active' : ''); 
          t.style.setProperty('--w', String(W)); 
          t.title = 'Frame ' + (i+1) + ' • ' + f.dur + 'ms';
          for(let y=0;y<H;y++){
            for(let x=0;x<W;x++){
              const p = document.createElement('div'); p.className='p' + (f.arr[y*W+x]?' on':''); t.appendChild(p);
            }
          }
          t.onclick = ()=>{ idx=i; durEl.value = String(frames[idx].dur); document.getElementById('durVal').textContent = frames[idx].dur + ' ms'; renderTimeline(); renderGrid(); };
          tl.appendChild(t);
        });
      }
      async function loadState(name){ try{ const r = await fetch('/anim/state' + (name?('?name='+encodeURIComponent(name)):'') ); const j = await r.json(); if (j && Array.isArray(j.frames)) { if (j.w && j.h){ W=j.w; H=j.h; } frames = j.frames.map(fr=>({ dur: Number(fr.durationMs)||300, arr: arrOf(String(fr.bits||'')) })); if (!frames.length) frames=[{ dur:300, arr:new Array(W*H).fill(false) }]; idx = Math.min(idx, frames.length-1); durEl.value=String(frames[idx].dur); currentName = String(j.name||'') || currentName; textMeta = { enable: !!(j.text && j.text.enable), url: String((j.text && j.text.url) || ''), field: String((j.text && j.text.field) || ''), intervalMs: Math.max(1000, Number(j.text && j.text.intervalMs) || 30000) }; textUrlEl.value = textMeta.url; textFieldEl.value = textMeta.field; textIntEl.value = String(textMeta.intervalMs); textEnableEl.checked = !!textMeta.enable; } }catch{ frames=[{ dur:300, arr:new Array(W*H).fill(false) }]; idx=0; }
        renderGrid(); renderTimeline(); }
      async function saveState(name){ const payload = { w: W, h: H, frames: frames.map(f=>({ bits: bitsOf(f.arr), durationMs: f.dur })), text: { enable: !!textEnableEl.checked, url: String(textUrlEl.value||'').trim(), field: String(textFieldEl.value||'').trim(), intervalMs: Math.max(1000, Number(textIntEl.value)||30000) } }; const q = name?('?name='+encodeURIComponent(name)) : ''; try{ await fetch('/anim/state'+q, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }); }catch{} }
      document.getElementById('addFrame').onclick = ()=>{ frames.splice(idx+1, 0, { dur: Number(durEl.value)||300, arr: new Array(W*H).fill(false) }); idx++; renderTimeline(); renderGrid(); };
      document.getElementById('dupFrame').onclick = ()=>{ const cur = frames[idx]; frames.splice(idx+1, 0, { dur: cur.dur, arr: cur.arr.slice() }); idx++; renderTimeline(); renderGrid(); };
      document.getElementById('delFrame').onclick = ()=>{ if (!frames.length) return; frames.splice(idx,1); if (!frames.length) frames.push({ dur:300, arr:new Array(W*H).fill(false) }); idx = Math.min(idx, frames.length-1); renderTimeline(); renderGrid(); };
      durEl.onchange = ()=>{ const v = Math.max(10, Number(durEl.value)||300); frames[idx].dur = v; renderTimeline(); };
      document.getElementById('save').onclick = ()=>{ const n = String(animSel.value||'').trim(); saveState(n||currentName); };
      textSaveBtn.onclick = ()=>{ const n = String(animSel.value||'').trim(); saveState(n||currentName); };
      let playTimer = 0;
      document.getElementById('play').onclick = ()=>{ if (playing) return; playing = true; function step(){ if (!playing) return; idx = (idx + 1) % frames.length; durEl.value = String(frames[idx].dur); renderTimeline(); renderGrid(); playTimer = setTimeout(step, frames[idx].dur); } playTimer = setTimeout(step, frames[idx].dur); };
      document.getElementById('stop').onclick = ()=>{ playing=false; try{ clearTimeout(playTimer); }catch{} };
      // Animation management
      function createPreviewGrid(container, Wsrc, Hsrc){
        const scale = 2; // 2px cells
        const Wt = Math.min(84, Wsrc);
        const Ht = Math.min(28, Hsrc);
        const root = document.createElement('div');
        root.style.display = 'grid';
        root.style.gridTemplateColumns = 'repeat(' + Wt + ', ' + scale + 'px)';
        root.style.gridAutoRows = scale + 'px';
        root.style.gap = '1px';
        root.style.background = '#111';
        root.style.padding = '4px';
        root.style.border = '1px solid #333';
        root.style.borderRadius = '4px';
        const pixels = [];
        for (let i=0;i<Wt*Ht;i++){ const d = document.createElement('div'); d.style.width = scale+'px'; d.style.height = scale+'px'; d.style.background = '#000'; pixels.push(d); root.appendChild(d); }
        container.appendChild(root);
        return { root, pixels, Wt, Ht };
      }
      function renderPreviewBits(preview, bits, Wsrc, Hsrc){
        const { pixels, Wt, Ht } = preview;
        for (let y=0;y<Ht;y++){
          for (let x=0;x<Wt;x++){
            const sx = Math.floor(x * Wsrc / Wt);
            const sy = Math.floor(y * Hsrc / Ht);
            const on = bits.charAt(sy * Wsrc + sx) === '1';
            const el = pixels[y*Wt + x];
            if (el) el.style.background = on ? '#fff' : '#000';
          }
        }
      }
      async function refreshAnimList(){
        try{
          const r = await fetch('/anim/list');
          const j = await r.json();
          if (!(j && Array.isArray(j.items))) return;
          // dropdown
          animSel.innerHTML='';
          j.items.forEach(n=>{ const o=document.createElement('option'); o.value=n; o.textContent=n; if (n===j.active) o.selected=true; animSel.appendChild(o); });
          currentName = j.active||currentName||''; animNameInput.value = currentName;
          // sidebar list with hover preview
          animListEl.innerHTML = '';
          j.items.forEach(name => {
            const item = document.createElement('div');
            item.className = 'anim-item' + (name===j.active ? ' active' : '');
            const label = document.createElement('div');
            label.textContent = name;
            label.style.fontSize = '13px';
            label.style.fontWeight = '500';
            const previewWrap = document.createElement('div');
            previewWrap.className = 'anim-preview';
            const meta = { playing: false, timer: 0, frames: [], w: 0, h: 0, preview: null };
            item.addEventListener('mouseenter', async ()=>{
              if (meta.preview) return; // already built
              try{
                const rr = await fetch('/anim/state?name=' + encodeURIComponent(name));
                const sj = await rr.json();
                const frames = Array.isArray(sj.frames) ? sj.frames.slice(0, 30) : [];
                meta.frames = frames.map(f=>({ bits: String(f.bits||''), dur: Math.max(10, Number(f.durationMs)||300) }));
                meta.w = Number(sj.w)||84; meta.h = Number(sj.h)||28;
                meta.preview = createPreviewGrid(previewWrap, meta.w, meta.h);
                if (meta.frames.length){
                  meta.playing = true;
                  let i = 0;
                  function step(){ if (!meta.playing) return; const fr = meta.frames[i]; renderPreviewBits(meta.preview, fr.bits, meta.w, meta.h); i = (i+1) % meta.frames.length; meta.timer = setTimeout(step, fr.dur); }
                  step();
                } else {
                  meta.preview = meta.preview || createPreviewGrid(previewWrap, 84, 28);
                }
              }catch{}
            });
            item.addEventListener('mouseleave', ()=>{
              meta.playing = false; try{ clearTimeout(meta.timer); }catch{}
              previewWrap.innerHTML = '';
              meta.preview = null;
            });
            item.addEventListener('click', async ()=>{ animSel.value = name; animNameInput.value = name; await loadState(name); await refreshAnimList(); });
            item.appendChild(label);
            item.appendChild(previewWrap);
            animListEl.appendChild(item);
          });
        }catch{}
      }
      animSel.addEventListener('change', async ()=>{ const n = String(animSel.value||''); await loadState(n); animNameInput.value = n; });
      document.getElementById('animNew').onclick = async ()=>{ const name = String(animNameInput.value||'').trim() || ('anim-'+Date.now()); frames=[{ dur:300, arr:new Array(W*H).fill(false) }]; idx=0; await saveState(name); await fetch('/anim/select', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name }) }); await refreshAnimList(); await loadState(name); };
      document.getElementById('animSaveAs').onclick = async ()=>{ const name = String(animNameInput.value||'').trim(); if (!name) return; await saveState(name); await refreshAnimList(); animSel.value = name; };
      document.getElementById('animDelete').onclick = async ()=>{ const name = String(animSel.value||''); if (!name) return; try{ await fetch('/anim/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name }) }); }catch{} await refreshAnimList(); const next = String(animSel.value||''); await loadState(next); };
      document.getElementById('animSetActive').onclick = async ()=>{ const name = String(animSel.value||''); if (!name) return; try{ await fetch('/anim/select', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name }) }); }catch{} await refreshAnimList(); };
      (async function init(){ await getLiveSize(); await refreshAnimList(); await loadState(); })();
      // Save on unload to persist quick edits
      window.addEventListener('beforeunload', ()=>{ try{ const n = String(animSel && animSel.value || ''); navigator.sendBeacon('/anim/state' + (n?('?name='+encodeURIComponent(n)):'') , new Blob([JSON.stringify({ w:W, h:H, frames: frames.map(f=>({ bits: bitsOf(f.arr), durationMs: f.dur })), text: { enable: !!textEnableEl.checked, url: String(textUrlEl.value||'').trim(), field: String(textFieldEl.value||'').trim(), intervalMs: Math.max(1000, Number(textIntEl.value)||30000) } })], { type:'application/json' })); }catch{} });
      
      // Duration slider display
      durEl.addEventListener('input', ()=>{ 
        const v = Math.max(10, Number(durEl.value)||300); 
        frames[idx].dur = v; 
        document.getElementById('durVal').textContent = v + ' ms';
        renderTimeline(); 
      });
      
      // Drawing Tools UI
      const toolBrushBtn = document.getElementById('toolBrush');
      const toolLineBtn = document.getElementById('toolLine');
      const toolEllipseBtn = document.getElementById('toolEllipse');
      const toolArrowBtn = document.getElementById('toolArrow');
      function setTool(tool){ 
        activeTool = tool; 
        toolBrushBtn.classList.toggle('active', tool==='brush'); 
        toolLineBtn.classList.toggle('active', tool==='line'); 
        toolEllipseBtn.classList.toggle('active', tool==='ellipse'); 
        toolArrowBtn.classList.toggle('active', tool==='arrow'); 
      }
      toolBrushBtn.addEventListener('click', ()=> setTool('brush'));
      toolLineBtn.addEventListener('click', ()=> setTool('line'));
      toolEllipseBtn.addEventListener('click', ()=> setTool('ellipse'));
      toolArrowBtn.addEventListener('click', ()=> setTool('arrow'));
      
      // Brush UI
      brushSizeEl.addEventListener('input', ()=>{ brushSize = Math.max(1, Number(brushSizeEl.value)||1); });
      modePaintBtn.addEventListener('click', ()=>{ brushMode = 'paint'; modePaintBtn.classList.add('active'); modeEraseBtn.classList.remove('active'); });
      modeEraseBtn.addEventListener('click', ()=>{ brushMode = 'erase'; modeEraseBtn.classList.add('active'); modePaintBtn.classList.remove('active'); });
      // Brush shape UI
      function setShape(shape){ brushShape = shape; brushCircleBtn.classList.toggle('active', shape==='circle'); brushSquareBtn.classList.toggle('active', shape==='square'); brushTriangleBtn.classList.toggle('active', shape==='triangle'); }
      brushCircleBtn.addEventListener('click', ()=> setShape('circle'));
      brushSquareBtn.addEventListener('click', ()=> setShape('square'));
      brushTriangleBtn.addEventListener('click', ()=> setShape('triangle'));
      // Onion skin UI
      onionEnableEl.addEventListener('change', ()=>{ onionEnabled = !!onionEnableEl.checked; updateOnionSkins(); });
      onionPrevEl.addEventListener('change', ()=>{ onionPrev = Math.max(0, Math.min(2, Number(onionPrevEl.value)||0)); updateOnionSkins(); });
      onionNextEl.addEventListener('change', ()=>{ onionNext = Math.max(0, Math.min(2, Number(onionNextEl.value)||0)); updateOnionSkins(); });
    </script>
  </body>
</html>`);
		} else if (parsed.pathname === "/anim/state") {
			if (!globalThis.__anim_store) globalThis.__anim_store = { active: 'default', items: {} };
			const store = globalThis.__anim_store;
			const q = parsed.query || {};
			const name = String(q.name || '').trim() || store.active || 'default';
			if (req.method === 'GET') {
				const bm = globalThis.__frameBitmap;
				const cur = store.items[name] || store.items[store.active] || { w: (bm && bm.w) || 84, h: (bm && bm.h) || 28, frames: [], text: { enable:false, url:'', field:'', intervalMs:30000 } };
				res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
				res.end(JSON.stringify({ name, w: Number(cur.w)||0, h: Number(cur.h)||0, frames: Array.isArray(cur.frames)?cur.frames:[], text: cur.text || { enable:false, url:'', field:'', intervalMs:30000 } }));
			} else if (req.method === 'POST') {
				let body = '';
				req.on('data', c => body += c);
				req.on('end', () => {
					try{
						const data = JSON.parse(body||'{}');
						const w = Math.max(1, Number(data.w)||0);
						const h = Math.max(1, Number(data.h)||0);
						const frames = Array.isArray(data.frames) ? data.frames.map(f=>({ bits: String(f.bits||''), durationMs: Math.max(10, Number(f.durationMs)||300) })) : [];
						const text = data && data.text ? { enable: !!data.text.enable, url: String(data.text.url||'').trim(), field: String(data.text.field||'').trim(), intervalMs: Math.max(1000, Number(data.text.intervalMs)||30000) } : { enable:false, url:'', field:'', intervalMs:30000 };
						store.items[name] = { w, h, frames, text };
						saveAnimations(store); // 💾 Save to disk
						res.writeHead(200, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok:true, name }));
					} catch {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok:false }));
					}
				});
			} else {
				res.writeHead(405); res.end('Method Not Allowed');
			}
		} else if (parsed.pathname === "/anim/list") {
			if (!globalThis.__anim_store) globalThis.__anim_store = { active: 'default', items: {} };
			const store = globalThis.__anim_store;
			if (!Object.keys(store.items).length) store.items['default'] = { w: 84, h: 28, frames: [] };
			res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
			res.end(JSON.stringify({ items: Object.keys(store.items), active: store.active }));
		} else if (parsed.pathname === "/anim/text" && req.method === 'GET') {
			// Per-animation text fetch (cache per name)
			if (!globalThis.__anim_store) globalThis.__anim_store = { active: 'default', items: {} };
			const store = globalThis.__anim_store;
			const q = parsed.query || {};
			const name = String(q.name||'').trim() || store.active || 'default';
			const item = store.items[name];
			if (!item || !item.text || !item.text.enable || !item.text.url) {
				res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
				res.end(JSON.stringify({ text: '' }));
				return;
			}
			if (!item.textCache) item.textCache = { lastText:'', nextAt:0, loading:false };
			const cache = item.textCache;
			function send(){ res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify({ text: String(cache.lastText||'') })); }
			const now = Date.now();
			if (now < (cache.nextAt||0) || cache.loading) { send(); return; }
			cache.loading = true; cache.nextAt = now + (Number(item.text.intervalMs)||30000);
			try{
				const h = item.text.url.startsWith('https:') ? https : http;
				new Promise(resolve => {
					const controller = new AbortController();
					const t = setTimeout(()=>{ try{ controller.abort(); }catch{} resolve(); }, 4000);
					const req2 = h.request(item.text.url, { method:'GET', signal: controller.signal }, res2 => {
						let data = '';
						res2.setEncoding('utf8');
						res2.on('data', c => { data += c; if (data.length > 8000) { try{ req2.destroy(); }catch{} } });
						res2.on('end', () => {
							clearTimeout(t);
							let text = '';
							try{
								const ct = String(res2.headers['content-type']||'').toLowerCase();
								if (ct.includes('application/json') || data.trim().startsWith('{') || data.trim().startsWith('[')){
									const j = JSON.parse(data);
									if (item.text.field){
										const parts = String(item.text.field).split('.');
										let v = j; for (const p of parts){ if (v && typeof v==='object') v = v[p]; else { v=''; break; } }
										text = String(v ?? '');
									} else {
										text = String(j && (j.text || j.message || j.title || ''));
									}
								} else {
									text = String(data||'');
								}
							}catch{ text = String(data||''); }
							cache.lastText = text.replace(/[\r\n\t]+/g, ' ').slice(0, 500);
							resolve();
						});
					});
					req2.on('error', () => resolve());
					req2.end();
				});
			}catch{}
			finally{ cache.loading = false; }
			send();
		} else if (parsed.pathname === "/anim/select" && req.method === 'POST') {
			if (!globalThis.__anim_store) globalThis.__anim_store = { active: 'default', items: {} };
			const store = globalThis.__anim_store;
			let body = '';
			req.on('data', c => body += c);
			req.on('end', () => {
				try{ 
					const { name } = JSON.parse(body||'{}'); 
					const n = String(name||'').trim(); 
					if (!n) throw new Error('bad'); 
					if (!store.items[n]) store.items[n] = { w:84, h:28, frames: [], text: { enable:false, url:'', field:'', intervalMs:30000 } }; 
					store.active = n; 
					saveAnimations(store); // 💾 Save to disk
					res.writeHead(200, { "Content-Type": "application/json" }); 
					res.end(JSON.stringify({ ok:true, active: n })); 
				}
				catch { res.writeHead(400, { "Content-Type": "application/json" }); res.end(JSON.stringify({ ok:false })); }
			});
		} else if (parsed.pathname === "/anim/delete" && req.method === 'POST') {
			if (!globalThis.__anim_store) globalThis.__anim_store = { active: 'default', items: {} };
			const store = globalThis.__anim_store;
			let body = '';
			req.on('data', c => body += c);
			req.on('end', () => {
				try{ 
					const { name } = JSON.parse(body||'{}'); 
					const n = String(name||'').trim(); 
					if (!n || !store.items[n]) throw new Error('bad'); 
					delete store.items[n]; 
					const keys = Object.keys(store.items); 
					if (!keys.length) store.items['default'] = { w:84, h:28, frames: [], text: { enable:false, url:'', field:'', intervalMs:30000 } }; 
					if (store.active === n) store.active = keys[0] || 'default'; 
					saveAnimations(store); // 💾 Save to disk
					res.writeHead(200, { "Content-Type": "application/json" }); 
					res.end(JSON.stringify({ ok:true, active: store.active })); 
				}
				catch { res.writeHead(400, { "Content-Type": "application/json" }); res.end(JSON.stringify({ ok:false })); }
			});
		} else if (parsed.pathname === "/ski") {
			// return simple input state for runner
			if (!globalThis.__ski_state) {
				globalThis.__ski_state = { lastJumpTs: 0, jumpWindowMs: 700, resetAt: 0, started: false };
			}
			const { lastJumpTs, jumpWindowMs, resetAt, started } = globalThis.__ski_state;
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ lastJumpTs, jumpWindowMs, resetAt, started }));
		} else if (parsed.pathname === "/ski/jump" && req.method === "POST") {
			if (!globalThis.__ski_state) {
				globalThis.__ski_state = { lastJumpTs: 0, jumpWindowMs: 700, resetAt: 0, started: false };
			}
			globalThis.__ski_state.lastJumpTs = Date.now();
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ ok:true }));
		} else if (parsed.pathname === "/ski/start" && req.method === "POST") {
			if (!globalThis.__ski_state) {
				globalThis.__ski_state = { lastJumpTs: 0, jumpWindowMs: 700, resetAt: 0, started: false };
			}
			globalThis.__ski_state.started = true;
			globalThis.__ski_state.resetAt = Date.now();
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ ok:true }));
		} else if (parsed.pathname === "/ski/stop" && req.method === "POST") {
			if (!globalThis.__ski_state) {
				globalThis.__ski_state = { lastJumpTs: 0, jumpWindowMs: 700, resetAt: 0, started: false };
			}
			globalThis.__ski_state.started = false;
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ ok:true }));
		} else if (parsed.pathname === "/mood" && req.method === "POST") {
			let body = "";
			req.on("data", chunk => body += chunk);
			req.on("end", () => {
				try {
					const data = JSON.parse(body || "{}");
					const ok = addMoodLabel(data.mood);
					res.writeHead(ok ? 200 : 400, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok }));
				} catch {
					res.writeHead(400, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok: false }));
				}
			});
		} else if (parsed.pathname === "/mood/majority") {
			const { majority, happy, sad } = getMajorityMood();
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ majority, happy, sad }));
		} else if (parsed.pathname === "/mood/reset" && req.method === "POST") {
			moodEntries.splice(0, moodEntries.length);
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ ok: true }));
		} else if (parsed.pathname === "/tallygame") {
			// in-memory two-team tally game state
			if (!globalThis.__tg_state) {
				globalThis.__tg_state = { a: 0, b: 0, lastTs: 0 };
			}
			if (req.method === 'GET') {
				const { a, b, lastTs } = globalThis.__tg_state;
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ a, b, lastTs }));
			} else {
				res.writeHead(405);
				res.end("Method Not Allowed");
			}
        } else if (parsed.pathname === "/tallygame/add" && req.method === "POST") {
			if (!globalThis.__tg_state) {
				globalThis.__tg_state = { a: 0, b: 0, lastTs: 0 };
			}
			let body = "";
			req.on("data", chunk => body += chunk);
			req.on("end", () => {
				try {
					const data = JSON.parse(body || "{}");
					const team = String(data.team || '').toUpperCase();
					if (team !== 'A' && team !== 'B') {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok:false }));
						return;
					}
					if (team === 'A') globalThis.__tg_state.a += 1; else globalThis.__tg_state.b += 1;
					globalThis.__tg_state.lastTs = Date.now();
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok:true, a: globalThis.__tg_state.a, b: globalThis.__tg_state.b }));
				} catch {
					res.writeHead(400, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok:false }));
				}
			});
        } else if (parsed.pathname === "/tallygame/reset" && req.method === "POST") {
			globalThis.__tg_state = { a: 0, b: 0, lastTs: Date.now() };
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ ok:true }));
        } else if (parsed.pathname === "/next" && req.method === "GET") {
            if (!globalThis.__next_state) globalThis.__next_state = { name: '' };
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ name: String(globalThis.__next_state.name || '') }));
        } else if (parsed.pathname === "/next" && req.method === "POST") {
            let body = "";
            req.on("data", chunk => body += chunk);
            req.on("end", () => {
                try {
                    const data = JSON.parse(body || "{}");
                    const nameRaw = (data && data.name) || '';
                    const name = String(nameRaw).slice(0, 64).trim();
                    if (!globalThis.__next_state) globalThis.__next_state = { name: '' };
                    globalThis.__next_state.name = name;
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ ok:true, name }));
                } catch {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ ok:false }));
                }
            });
        } else if (parsed.pathname === "/next/clear" && req.method === "POST") {
            globalThis.__next_state = { name: '' };
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok:true }));
		} else {
			res.writeHead(404);
			res.end("Not found");
		}
	};
}

function startPreviewServer(startPort = Number(process.env.PORT || 3000)) {
	function bind(port) {
		const server = http.createServer(createHandler());
		server.on('error', (err) => {
			if (err && err.code === 'EADDRINUSE') {
				console.error(`[preview] Port ${port} in use, trying ${port + 1}...`);
				setTimeout(() => bind(port + 1), 300);
			} else {
				console.error('[preview] Server error:', err);
			}
		});
		server.listen(port, () => {
			console.log(`[preview] Listening on http://localhost:${port}`);
		});
		globalThis.__previewServer = server;
	}
	bind(startPort);

	function shutdown() {
		try { globalThis.__previewServer && globalThis.__previewServer.close(); } catch {}
		process.exit(0);
	}
	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);
}

startPreviewServer();

// Separate lightweight frontend site (public): shows QR and live animation only
function createFrontendHandler() {
    return (req, res) => {
        const parsed = url.parse(req.url, true);
        if (parsed.pathname === '/live.png') {
            // proxy backend frame to avoid cross-origin issues for clients
            try{
                http.get({ hostname: '127.0.0.1', port: 3000, path: '/frame.png' }, (r) => {
                    res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
                    r.pipe(res);
                }).on('error', () => { res.writeHead(502); res.end(); });
            }catch{ res.writeHead(502); res.end(); }
            return;
        }
        if (parsed.pathname === '/live.bits') {
            // proxy backend frame bits to avoid cross-origin issues for clients
            try{
                http.get({ hostname: '127.0.0.1', port: 3000, path: '/frame.bits' }, (r) => {
                    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
                    r.pipe(res);
                }).on('error', () => { res.writeHead(502); res.end(); });
            }catch{ res.writeHead(502); res.end(); }
            return;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Flipdots Front</title>
    <style>
      #flipboard{ --amount-of-columns:0; display:grid; grid-template-columns:repeat(var(--amount-of-columns),1fr); border:1px solid rgba(255,255,255,0.2); background:#000; padding:6px; }
      #flipboard>div{ width:10px; background-color:#000; border-radius:50%; aspect-ratio:1; transform:rotate(45deg) rotateY(180deg); backface-visibility:hidden; transition:transform 40ms ease-out, background-color 40ms ease-out; }
      #flipboard>div.on{ transform:rotate(45deg) rotateY(0deg); background-color:#fff; }
    </style>
  </head>
  <body style="margin:0;background:#fff;display:flex;flex-direction:column;gap:16px;align-items:center;justify-content:center;min-height:100vh;padding:16px;font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">
    <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;justify-content:center;width:100%;max-width:980px">
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <img id="frame" alt="live" src="/live.png" style="image-rendering:pixelated;max-width:100%;height:auto;border:1px solid #ddd" />
        <div style="font-size:12px;color:#666">Live flipdot frame</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <section id="flipboard"></section>
        <div style="font-size:12px;color:#666">Flipboard-style demo</div>
      </div>
    </div>
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center">
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <img id="qrImg" alt="QR to controls" style="width:200px;height:200px;border:1px solid #ddd;background:#fff" />
        <div id="qrUrl" style="font-size:12px;color:#555;max-width:360px;text-align:center;word-break:break-all"></div>
      </div>
      <div style="font-size:13px;color:#666;max-width:340px">
        Scan the QR to open the control page on your phone.
      </div>
    </div>
    <div id="controls" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center"></div>
    <script>
      // auto-refresh frame (animation preview) - optimized
      let lastFrameTime = 0;
      (function updateFrame(time){
        if (time - lastFrameTime > 100) { // ~10fps instead of 60fps
          try{
            const img = document.getElementById('frame');
            const base = '/live.png';
            img.src = base + '?t=' + time;
            lastFrameTime = time;
          }catch{}
        }
        requestAnimationFrame(updateFrame);
      })();
      // Big Flipboard mapped from live bits
      (function(){
        try{
          const W = 84, H = 28;
          const dots = [];
          const root = document.getElementById('flipboard');
          if (!root) return;
          root.style.setProperty('--amount-of-columns', String(W));
          for (let c=0;c<W;c++) for (let r=0;r<H;r++){ const d=document.createElement('div'); root.appendChild(d); dots.push(d); }
          let prevBits = '';
          async function poll(){
            try{
              const r = await fetch('/live.bits');
              const j = await r.json();
              if (j && j.bits && j.w && j.h){
                if (j.bits !== prevBits){
                  for (let y=0;y<H;y++){
                    for (let x=0;x<W;x++){
                      const sx = Math.floor(x * j.w / W);
                      const sy = Math.floor(y * j.h / H);
                      const bit = j.bits.charAt(sy * j.w + sx) === '1';
                      const el = dots[y*W + x];
                      if (el){ if (bit) el.classList.add('on'); else el.classList.remove('on'); }
                    }
                  }
                  prevBits = j.bits;
                }
              }
            }catch{}
            setTimeout(poll, 200);
          }
          poll();
        }catch{}
      })();
      // static QR to backend control page
      (function(){
        try{
          const url = 'http://145.93.160.143:3000/view';
          const img = document.getElementById('qrImg');
          const txt = document.getElementById('qrUrl');
          if (img) img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(url);
          if (txt) txt.textContent = url;
        }catch{}
      })();

      // Dynamic controls based on active scene
      async function getScene(){ try{ const r = await fetch('http://145.93.160.143:3000/scene'); const j = await r.json(); return (j && j.scene) || 'mood'; }catch{ return 'mood'; } }
      async function setScene(scene){ try{ await fetch('http://145.93.160.143:3000/scene', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ scene }) }); }catch{} }
      async function getNext(){ try{ const r = await fetch('http://145.93.160.143:3000/next'); const j = await r.json(); return (j && j.name) || ''; }catch{ return ''; } }
      async function setNext(name){ try{ await fetch('http://145.93.160.143:3000/next', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name }) }); }catch{} }
      async function clearNext(){ try{ await fetch('http://145.93.160.143:3000/next/clear', { method:'POST' }); }catch{} }
      async function tgAdd(team){ try{ await fetch('http://145.93.160.143:3000/tallygame/add', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ team }) }); }catch{} }
      async function tgReset(){ try{ await fetch('http://145.93.160.143:3000/tallygame/reset', { method:'POST' }); }catch{} }
      async function skiJump(){ try{ await fetch('http://145.93.160.143:3000/ski/jump', { method:'POST' }); }catch{} }
      async function skiStart(){ try{ await fetch('http://145.93.160.143:3000/ski/start', { method:'POST' }); }catch{} }

      function el(tag, attrs, ...children){ const e = document.createElement(tag); if (attrs) Object.assign(e, attrs); for (const c of children) e.append(c); return e; }
      async function renderControls(){
        const scene = await getScene();
        const root = document.getElementById('controls');
        root.innerHTML = '';
        // Scene switcher
        root.append(el('div', { style: 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center' },
          el('span', { textContent: 'Scene:' }),
          (()=>{ const s = el('select'); ['mood','clock','demo2','tally','fact','next'].forEach(v=>{ const o = el('option', { value: v, textContent: v }); if (v===scene) o.selected=true; s.append(o); }); s.onchange = ()=> setScene(s.value).then(renderControls); return s; })()
        ));
        // Controls per scene
        if (scene === 'next'){
          const inp = el('input', { placeholder: 'Name', style: 'padding:4px 6px' });
          const cur = await getNext(); if (cur) inp.value = cur;
          root.append(el('div', { style: 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center' },
            el('strong', { textContent: 'Who is next:' }), inp,
            (()=>{ const b = el('button', { textContent: 'Set' }); b.onclick = ()=> setNext(String(inp.value||'').trim()); return b; })(),
            (()=>{ const b = el('button', { textContent: 'Clear' }); b.onclick = ()=> clearNext(); return b; })()
          ));
        } else if (scene === 'tally'){
          root.append(el('div', { style: 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center' },
            el('strong', { textContent: 'Tally:' }),
            (()=>{ const b = el('button', { textContent: '+1 Team A' }); b.onclick = ()=> tgAdd('A'); return b; })(),
            (()=>{ const b = el('button', { textContent: '+1 Team B' }); b.onclick = ()=> tgAdd('B'); return b; })(),
            (()=>{ const b = el('button', { textContent: 'Reset' }); b.onclick = ()=> tgReset(); return b; })()
          ));
        } else if (scene === 'demo2'){
          root.append(el('div', { style: 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center' },
            el('strong', { textContent: 'Ski:' }),
            (()=>{ const b = el('button', { textContent: 'Jump' }); b.onclick = ()=> skiJump(); return b; })(),
            (()=>{ const b = el('button', { textContent: 'Start' }); b.onclick = ()=> skiStart(); return b; })()
          ));
        } else if (scene === 'mood'){
          root.append(el('div', { style: 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center' },
            el('strong', { textContent: 'Mood:' }),
            (()=>{ const b = el('button', { textContent: 'Happy' }); b.onclick = ()=> fetch('http://145.93.160.143:3000/mood', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mood:'happy' }) }); return b; })(),
            (()=>{ const b = el('button', { textContent: 'Sad' }); b.onclick = ()=> fetch('http://145.93.160.143:3000/mood', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mood:'sad' }) }); return b; })(),
            (()=>{ const b = el('button', { textContent: 'Reset votes' }); b.onclick = ()=> fetch('http://145.93.160.143:3000/mood/reset', { method:'POST' }); return b; })()
          ));
        }
      }
      setInterval(renderControls, 2000);
      renderControls();
    </script>
  </body>
 </html>`);
    };
}

function startFrontendServer(port = 4000) {
    try{
        const server = http.createServer(createFrontendHandler());
        server.listen(port, () => {
            console.log(`[frontend] Listening on http://localhost:${port}`);
        });
    }catch(e){
        console.error('[frontend] Server error:', e);
    }
}

startFrontendServer();
