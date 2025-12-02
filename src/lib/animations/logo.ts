import type { AnimationRenderer } from ".././display/types";

export const logoMetadata = {
  id: "logo",
  name: "Logo",
  description: "Displays the OWOW logo",
  status: "Available" as const,
};

export const logoAnimation: AnimationRenderer = (ctx, frame, config) => {
  const { width, height } = config;
  const text = "OWOW";

  if (!ctx) return;

  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(text, width / 2, height / 2);
};
