'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './view.module.css';
import Link from 'next/link';

const RENDERER_BASE = process.env.NEXT_PUBLIC_RENDERER_BASE || 'http://localhost:3000';

export default function ViewPage() {
  const [scene, setScene] = useState('mood');
  const [majority, setMajority] = useState({ majority: 'n/a', happy: 0, sad: 0 });
  const [status, setStatus] = useState('');
  const [sceneStatus, setSceneStatus] = useState('');
  const [tgStatus, setTgStatus] = useState('');
  const [skiStatus, setSkiStatus] = useState('');
  const [nextStatus, setNextStatus] = useState('');
  const [nextInput, setNextInput] = useState('');
  const frameRef = useRef<HTMLImageElement>(null);
  const flipboardRef = useRef<HTMLDivElement>(null);
  const flipboardDots = useRef<boolean[]>([]);

  // Initialize flipboard
  useEffect(() => {
    const W = 84, H = 28;
    if (!flipboardRef.current) return;
    flipboardRef.current.style.setProperty('--amount-of-columns', String(W));
    flipboardDots.current = new Array(W * H).fill(false);
    
    for (let i = 0; i < W * H; i++) {
      const dot = document.createElement('div');
      flipboardRef.current.appendChild(dot);
    }

    let prevBits = '';
    async function pollBits() {
      try {
        const r = await fetch(`${RENDERER_BASE}/frame.bits`);
        const j = await r.json();
        if (j && j.bits && j.w && j.h) {
          if (j.bits !== prevBits) {
            for (let y = 0; y < H; y++) {
              for (let x = 0; x < W; x++) {
                const sx = Math.floor(x * j.w / W);
                const sy = Math.floor(y * j.h / H);
                const sidx = sy * j.w + sx;
                flipboardDots.current[y * W + x] = j.bits.charAt(sidx) === '1';
              }
            }
            prevBits = j.bits;
            updateFlipboard();
          }
        }
      } catch {}
      setTimeout(pollBits, 120);
    }

    function updateFlipboard() {
      if (!flipboardRef.current) return;
      flipboardDots.current.forEach((dot, idx) => {
        const el = flipboardRef.current!.querySelector(`div:nth-child(${idx + 1})`);
        if (!el) return;
        if (dot) el.classList.add(styles.on);
        else el.classList.remove(styles.on);
      });
    }

    pollBits();
  }, []);

  // Live frame updates
  useEffect(() => {
    let frameId: number;
    function updateFrame(time: number) {
      if (frameRef.current) {
        frameRef.current.src = `${RENDERER_BASE}/frame.png?t=${time}`;
      }
      frameId = requestAnimationFrame(updateFrame);
    }
    frameId = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Refresh scene on mount
  useEffect(() => {
    async function refreshScene() {
      try {
        const r = await fetch(`${RENDERER_BASE}/scene`);
        const j = await r.json();
        if (j && j.scene) setScene(j.scene);
      } catch {}
    }
    refreshScene();

    // Check for ?scene= param
    const params = new URLSearchParams(window.location.search);
    const sc = params.get('scene');
    if (sc) handleSetScene(sc.toLowerCase());
  }, []);

  // Poll majority mood
  useEffect(() => {
    async function refreshMajority() {
      try {
        const r = await fetch(`${RENDERER_BASE}/mood/majority`);
        const j = await r.json();
        setMajority({ majority: j.majority ?? 'n/a', happy: j.happy ?? 0, sad: j.sad ?? 0 });
      } catch {
        setMajority({ majority: 'n/a', happy: 0, sad: 0 });
      }
    }
    refreshMajority();
    const interval = setInterval(refreshMajority, 1500);
    return () => clearInterval(interval);
  }, []);

  // Spacebar for ski jump
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleSkiJump();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function handleSetScene(newScene: string) {
    try {
      const r = await fetch(`${RENDERER_BASE}/scene`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: newScene })
      });
      setSceneStatus(r.ok ? `Scene: ${newScene}` : 'Failed');
      if (r.ok) {
        setScene(newScene);
        setTimeout(() => setSceneStatus(''), 1200);
      }
    } catch {
      setSceneStatus('Failed');
    }
  }

  async function handleVote(label: string) {
    try {
      const res = await fetch(`${RENDERER_BASE}/mood`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: label })
      });
      setStatus(res.ok ? 'Vote recorded' : 'Vote failed');
      if (res.ok) setTimeout(() => setStatus(''), 1500);
    } catch {
      setStatus('Vote failed');
    }
  }

  async function handleResetVotes() {
    try {
      const res = await fetch(`${RENDERER_BASE}/mood/reset`, { method: 'POST' });
      setStatus(res.ok ? 'Votes reset' : 'Reset failed');
      if (res.ok) setTimeout(() => setStatus(''), 1500);
    } catch {
      setStatus('Reset failed');
    }
  }

  async function handleTgAdd(team: string) {
    try {
      const res = await fetch(`${RENDERER_BASE}/tallygame/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team })
      });
      setTgStatus(res.ok ? `Added to Team ${team}` : 'Failed');
      if (res.ok) setTimeout(() => setTgStatus(''), 1200);
    } catch {
      setTgStatus('Failed');
    }
  }

  async function handleTgReset() {
    try {
      const res = await fetch(`${RENDERER_BASE}/tallygame/reset`, { method: 'POST' });
      setTgStatus(res.ok ? 'Game reset' : 'Failed');
      if (res.ok) setTimeout(() => setTgStatus(''), 1200);
    } catch {
      setTgStatus('Failed');
    }
  }

  async function handleSkiJump() {
    try {
      const r = await fetch(`${RENDERER_BASE}/ski/jump`, { method: 'POST' });
      setSkiStatus(r.ok ? 'Jump!' : 'Failed');
      if (r.ok) setTimeout(() => setSkiStatus(''), 600);
    } catch {
      setSkiStatus('Failed');
    }
  }

  async function handleSkiStart() {
    try {
      await fetch(`${RENDERER_BASE}/ski/start`, { method: 'POST' });
      setSkiStatus('Game started');
      setTimeout(() => setSkiStatus(''), 800);
    } catch {}
  }

  async function handleNextSet() {
    try {
      const res = await fetch(`${RENDERER_BASE}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nextInput })
      });
      setNextStatus(res.ok ? 'Set!' : 'Failed');
      if (res.ok) {
        setTimeout(() => setNextStatus(''), 1200);
        setNextInput('');
      }
    } catch {
      setNextStatus('Failed');
    }
  }

  async function handleNextClear() {
    try {
      const res = await fetch(`${RENDERER_BASE}/next/clear`, { method: 'POST' });
      setNextStatus(res.ok ? 'Cleared' : 'Failed');
      if (res.ok) setTimeout(() => setNextStatus(''), 1200);
    } catch {
      setNextStatus('Failed');
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.displays}>
        <div className={styles.displayItem}>
          <img ref={frameRef} className={styles.frame} alt="Live frame" />
          <div className={styles.label}>Live flipdot frame</div>
        </div>
        <div className={styles.displayItem}>
          <section ref={flipboardRef} className={styles.flipboard}></section>
          <div className={styles.label}>Flipboard-style demo</div>
        </div>
      </div>

      <div className={styles.qrWrap}>
        <div className={styles.qrItem}>
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('http://145.93.160.143:3000/view')}`}
            alt="QR code"
            className={styles.qrImg}
          />
          <div className={styles.qrUrl}>http://145.93.160.143:3000/view</div>
        </div>
        <div className={styles.qrHint}>
          Scan this QR with your phone to open this control page. Optionally, append <code>?scene=next</code> to open the "Who is next" scene automatically.
        </div>
      </div>

      <div className={styles.controls}>
        <a href="http://localhost:4000" className={styles.btn}>
          Open Frontend
        </a>
      </div>

      <div className={styles.controls}>
        <label htmlFor="sceneSel">Scene:</label>
        <select 
          id="sceneSel" 
          value={scene} 
          onChange={(e) => handleSetScene(e.target.value)}
          className={styles.select}
        >
          <option value="mood">mood</option>
          <option value="clock">clock</option>
          <option value="demo2">demo2</option>
          <option value="tally">tally</option>
          <option value="fact">fact</option>
          <option value="next">next</option>
          <option value="anim">anim</option>
        </select>
        <span className={styles.status}>{sceneStatus}</span>
      </div>

      <div className={styles.controls}>
        <Link href="/anim" className={styles.btnGreen}>
          Open Animation Maker
        </Link>
      </div>

      <div className={styles.controls}>
        <button onClick={() => handleVote('happy')} className={styles.btn}>Happy :-)</button>
        <button onClick={() => handleVote('sad')} className={styles.btn}>Sad :-(</button>
        <button onClick={handleResetVotes} className={styles.btn}>Reset</button>
        <span className={styles.status}>{status}</span>
      </div>

      <div className={styles.controls}>
        <strong>Tally Game:</strong>
        <button onClick={() => handleTgAdd('A')} className={styles.btn}>+1 Team A</button>
        <button onClick={() => handleTgAdd('B')} className={styles.btn}>+1 Team B</button>
        <button onClick={handleTgReset} className={styles.btn}>Reset</button>
        <span className={styles.status}>{tgStatus}</span>
      </div>

      <div className={styles.controls}>
        <strong>Ski:</strong>
        <button onClick={handleSkiJump} className={styles.btn}>Jump</button>
        <button onClick={handleSkiStart} className={styles.btn}>Start Game</button>
        <span className={styles.status}>{skiStatus}</span>
      </div>

      <div className={styles.controls}>
        <strong>Who is next:</strong>
        <input 
          type="text" 
          placeholder="Name" 
          value={nextInput}
          onChange={(e) => setNextInput(e.target.value)}
          className={styles.input}
        />
        <button onClick={handleNextSet} className={styles.btn}>Set</button>
        <button onClick={handleNextClear} className={styles.btn}>Clear</button>
        <span className={styles.status}>{nextStatus}</span>
      </div>

      <div className={styles.hint}>
        Votes are counted over the last 20 minutes. If happy and sad are equal (or there are no votes), a neutral face is shown.
      </div>

      <div className={styles.majority}>
        Current office mood (last 20 min): {majority.majority} — counts: happy {majority.happy} · sad {majority.sad}
      </div>
    </div>
  );
}
