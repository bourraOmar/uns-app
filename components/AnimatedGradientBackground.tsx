import React from 'react';
import { RubberFluid } from './RubberFluid';

/**
 * AnimatedGradientBackground:
 * High-performance animated gradient shader background with emerald and ocean blue tones.
 */
export function AnimatedGradientBackground({ mode = 'shader' }: { mode?: 'shader' }) {
  return (
    <RubberFluid
      colors={['#0f8e5d', '#0284c7']}
      speed={0.7}
      scale={1.1}
      foldDepth={1.3}
      gloss={0.38}
      sheen={0.25}
      roughness={0.32}
      contrast={4.8}
    />
  );
}

export { RubberFluid };
