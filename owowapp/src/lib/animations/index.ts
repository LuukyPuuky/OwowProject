import { starBounceAnimation, starBounceMetadata } from "././star-bounce";
import { timerAnimation, timerMetadata } from "././timer";
import { logoAnimation, logoMetadata } from "././logo";
import { waveAnimation, waveMetadata } from "././wave";
import { textScrollAnimation, textScrollMetadata } from "././text-scroll";
export { starBounce } from "./star-bounce";
export { textScroll } from "./text-scroll";
export { wave } from "./wave";
export { timer } from "./timer";
export { logo } from "./logo";

export const animations = {
  "star-bounce": {
    renderer: starBounceAnimation,
    metadata: starBounceMetadata,
  },
  timer: { renderer: timerAnimation, metadata: timerMetadata },
  logo: { renderer: logoAnimation, metadata: logoMetadata },
  wave: { renderer: waveAnimation, metadata: waveMetadata },
  "text-scroll": {
    renderer: textScrollAnimation,
    metadata: textScrollMetadata,
  },
};

export type AnimationId = keyof typeof animations;

export function getAnimation(id: AnimationId) {
  return animations[id];
}

export function getAllAnimations() {
  return Object.values(animations).map((anim) => anim.metadata);
}
