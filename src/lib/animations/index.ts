
import { timerAnimation, timerMetadata } from "././timer";
import { logoAnimation, logoMetadata } from "././logo";
import { waveAnimation, waveMetadata } from "././wave";
import { textScrollAnimation, textScrollMetadata } from "././text-scroll";
import { pongAnimation, pongMetadata } from "././pong";

export const animations = {

  timer: { renderer: timerAnimation, metadata: timerMetadata },
  logo: { renderer: logoAnimation, metadata: logoMetadata },
  wave: { renderer: waveAnimation, metadata: waveMetadata },
  "text-scroll": {
    renderer: textScrollAnimation,
    metadata: textScrollMetadata,
  },
  pong: { renderer: pongAnimation, metadata: pongMetadata },

};

export type AnimationId = keyof typeof animations;

export function getAnimation(id: AnimationId) {
  return animations[id];
}

export function getAllAnimations() {
  return Object.values(animations).map((anim) => anim.metadata);
}
