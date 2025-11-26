"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { PixelWeatherData } from "@/components/PixelWeatherCard";

const PixelWeatherCard = dynamic(() => import("@/components/PixelWeatherCard").then(mod => mod.PixelWeatherCard), { ssr: false });

const initialWeather: PixelWeatherData[] = [
  { city: "Amsterdam", temp: 17, condition: "sun" },
  { city: "London", temp: 12, condition: "cloud" },
  { city: "Seattle", temp: 8, condition: "rain" },
  { city: "Oslo", temp: -2, condition: "snow" },
];

export default function PixelWeatherPreview() {
  const [weather, setWeather] = useState<PixelWeatherData[]>(initialWeather);

  const handleChange = (idx: number, newData: PixelWeatherData) => {
    setWeather((prev) => prev.map((w, i) => (i === idx ? newData : w)));
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 32,
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#101018",
      }}
    >
      {weather.map((data, idx) => (
        <PixelWeatherCard key={data.city + idx} data={data} onChange={(d) => handleChange(idx, d)} />
      ))}
    </div>
  );
}
