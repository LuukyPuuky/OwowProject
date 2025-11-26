"use client";

// Add missing props type
export interface PixelWeatherCardProps {
  data: PixelWeatherData;
  onChange?: (data: PixelWeatherData) => void;
}
import React, { ReactElement, useState, useRef } from "react";

const pixelIcons: Record<string, ReactElement> = {
  sun: (
    <div style={{ fontSize: 32, lineHeight: 1, position: 'relative', width: 32, height: 32 }}>
      {/* Pixel sun animation */}
      <div style={{
        position: 'absolute',
        left: 8,
        top: 8,
        width: 16,
        height: 16,
        background: '#FFD600',
        borderRadius: 4,
        boxShadow: '0 0 8px #FFD600',
        animation: 'pixelSun 2s linear infinite',
      }} />
      <style>{`
        @keyframes pixelSun {
          0% { box-shadow: 0 0 8px #FFD600; }
          50% { box-shadow: 0 0 16px #FFD600; }
          100% { box-shadow: 0 0 8px #FFD600; }
        }
      `}</style>
    </div>
  ),
  cloud: (
    <div style={{ fontSize: 32, lineHeight: 1, position: 'relative', width: 32, height: 32 }}>
      {/* Pixel cloud animation */}
      <div style={{
        position: 'absolute',
        left: 6,
        top: 14,
        width: 20,
        height: 10,
        background: '#B0BEC5',
        borderRadius: 6,
        boxShadow: '0 0 8px #B0BEC5',
        opacity: 0.9,
        animation: 'pixelCloud 3s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes pixelCloud {
          0%, 100% { left: 6px; }
          50% { left: 10px; }
        }
      `}</style>
    </div>
  ),
  rain: (
    <div style={{ fontSize: 32, lineHeight: 1, position: 'relative', width: 32, height: 32 }}>
      {/* Pixel rain animation */}
      <div style={{
        position: 'absolute',
        left: 10,
        top: 8,
        width: 12,
        height: 8,
        background: '#B0BEC5',
        borderRadius: 4,
        opacity: 0.8,
      }} />
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          left: 12 + i * 4,
          top: 18,
          width: 2,
          height: 8,
          background: '#2196F3',
          borderRadius: 1,
          opacity: 0.7,
          animation: `pixelRainDrop 1s ${i * 0.3}s linear infinite`,
        }} />
      ))}
      <style>{`
        @keyframes pixelRainDrop {
          0% { top: 18px; opacity: 0.7; }
          80% { top: 26px; opacity: 0.7; }
          100% { top: 18px; opacity: 0.1; }
        }
      `}</style>
    </div>
  ),
  snow: (
    <div style={{ fontSize: 32, lineHeight: 1, position: 'relative', width: 32, height: 32 }}>
      {/* Pixel snow animation */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          left: 12 + i * 4,
          top: 16,
          width: 4,
          height: 4,
          background: '#fff',
          borderRadius: 2,
          opacity: 0.8,
          animation: `pixelSnowFlake 2s ${i * 0.5}s linear infinite`,
        }} />
      ))}
      <style>{`
        @keyframes pixelSnowFlake {
          0% { top: 16px; opacity: 0.8; }
          80% { top: 28px; opacity: 0.8; }
          100% { top: 16px; opacity: 0.1; }
        }
      `}</style>
    </div>
  ),
};

export interface PixelWeatherData {
  city: string;
  temp: number;
  condition: "sun" | "cloud" | "rain" | "snow";
}


export function PixelWeatherCard({ data, onChange }: PixelWeatherCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [editData, setEditData] = useState<PixelWeatherData>(data);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFlip = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    setFlipped((f) => !f);
  };
  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newData = {
      ...editData,
      [name]: name === "temp" ? Number(value) : value,
    };
    setEditData(newData);
    if (onChange) onChange(newData);
  };

  return (
    <>
      <audio ref={audioRef} preload="auto">
        <source src="https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg" type="audio/ogg" />
        <source src="https://www.soundjay.com/buttons/sounds/button-16.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      <div
        className="pixel-flip-card"
        style={{
          perspective: 1000,
          margin: 8,
          width: 200,
          height: 260,
          display: "inline-block",
        }}
      >
        <div
          className={`pixel-flip-inner${flipped ? " flipped" : ""}`}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transition: "transform 0.6s cubic-bezier(.4,2,.6,1)",
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "none",
          }}
        >
          {/* Front */}
          <div
            className="pixel-flip-front"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#181818",
              border: "4px solid #444",
              borderRadius: 0,
              boxShadow: "0 0 0 4px #111, 0 0 0 8px #222",
              fontFamily: "'Press Start 2P', monospace",
              imageRendering: "pixelated",
            }}
            onClick={handleFlip}
          >
            <div style={{ marginBottom: 12 }}>{pixelIcons[editData.condition]}</div>
            <div style={{
              fontSize: 40,
              color: "#fff",
              textShadow: "2px 2px 0 #000, 0 0 8px #00e0ff",
              fontFamily: "'Press Start 2P', monospace",
              letterSpacing: 2,
              marginBottom: 8,
            }}>
              {Math.round(editData.temp)}°
            </div>
            <div style={{
              fontSize: 16,
              color: "#fff",
              background: "#222",
              padding: "2px 8px",
              border: "2px solid #00e0ff",
              borderRadius: 0,
              fontFamily: "'Press Start 2P', monospace",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}>{editData.city}</div>
            <div style={{
              fontSize: 12,
              color: "#00e0ff",
              fontFamily: "'Press Start 2P', monospace",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}>
              {editData.condition.charAt(0).toUpperCase() + editData.condition.slice(1)}
            </div>
            <div style={{ fontSize: 10, color: "#444", marginTop: 8 }}>[Click to edit]</div>
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
            `}</style>
          </div>
          {/* Back (edit) */}
          <div
            className="pixel-flip-back"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden",
              background: "#111",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "4px solid #00e0ff",
              fontFamily: "'Press Start 2P', monospace",
              transform: "rotateY(180deg)",
            }}
            onClick={handleFlip}
          >
            <label style={{ fontSize: 10, color: "#00e0ff", marginBottom: 4 }}>City</label>
            <input
              name="city"
              value={editData.city}
              onChange={handleInput}
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 14,
                background: "#222",
                color: "#fff",
                border: "2px solid #00e0ff",
                borderRadius: 0,
                marginBottom: 8,
                padding: 4,
                textAlign: "center",
                width: 120,
              }}
              onClick={e => e.stopPropagation()}
            />
            <label style={{ fontSize: 10, color: "#00e0ff", marginBottom: 4 }}>Temp</label>
            <input
              name="temp"
              type="number"
              value={editData.temp}
              onChange={handleInput}
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 14,
                background: "#222",
                color: "#fff",
                border: "2px solid #00e0ff",
                borderRadius: 0,
                marginBottom: 8,
                padding: 4,
                textAlign: "center",
                width: 80,
              }}
              onClick={e => e.stopPropagation()}
            />
            <label style={{ fontSize: 10, color: "#00e0ff", marginBottom: 4 }}>Condition</label>
            <select
              name="condition"
              value={editData.condition}
              onChange={handleInput}
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 14,
                background: "#222",
                color: "#fff",
                border: "2px solid #00e0ff",
                borderRadius: 0,
                marginBottom: 8,
                padding: 4,
                width: 100,
              }}
              onClick={e => e.stopPropagation()}
            >
              <option value="sun">Sun</option>
              <option value="cloud">Cloud</option>
              <option value="rain">Rain</option>
              <option value="snow">Snow</option>
            </select>
            <div style={{ fontSize: 10, color: "#444", marginTop: 8 }}>[Click to flip back]</div>
          </div>
        </div>
        <style>{`
          .pixel-flip-card { user-select: none; }
          .pixel-flip-inner { transition: transform 0.6s cubic-bezier(.4,2,.6,1); }
          .pixel-flip-inner.flipped { transform: rotateY(180deg); }
        `}</style>
      </div>
    </>
  );
}
