import React, { ReactElement } from "react";

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

export interface PixelWeatherCardProps {
  data: PixelWeatherData;
}

export const PixelWeatherCard: React.FC<PixelWeatherCardProps> = ({ data }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#181818",
        border: "4px solid #444",
        borderRadius: 0,
        boxShadow: "0 0 0 4px #111, 0 0 0 8px #222",
        padding: 20,
        minWidth: 180,
        minHeight: 220,
        fontFamily: "'Press Start 2P', monospace",
        imageRendering: "pixelated",
        margin: 8,
      }}
    >
      <div style={{ marginBottom: 12 }}>{pixelIcons[data.condition]}</div>
      <div style={{
        fontSize: 40,
        color: "#fff",
        textShadow: "2px 2px 0 #000, 0 0 8px #00e0ff",
        fontFamily: "'Press Start 2P', monospace",
        letterSpacing: 2,
        marginBottom: 8,
      }}>
        {Math.round(data.temp)}°
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
      }}>{data.city}</div>
      <div style={{
        fontSize: 12,
        color: "#00e0ff",
        fontFamily: "'Press Start 2P', monospace",
        letterSpacing: 2,
        textTransform: "uppercase",
      }}>
        {data.condition.charAt(0).toUpperCase() + data.condition.slice(1)}
      </div>
      {/* Pixel font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      `}</style>
    </div>
  );
};
