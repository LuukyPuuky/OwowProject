import React from "react";
import { PixelWeatherCard, PixelWeatherData } from "@/components/PixelWeatherCard";

const mockWeather: PixelWeatherData[] = [
  { city: "Amsterdam", temp: 17, condition: "sun" },
  { city: "London", temp: 12, condition: "cloud" },
  { city: "Seattle", temp: 8, condition: "rain" },
  { city: "Oslo", temp: -2, condition: "snow" },
];

export default function PixelWeatherPreview() {
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
      {mockWeather.map((data) => (
        <PixelWeatherCard key={data.city} data={data} />
      ))}
    </div>
  );
}
