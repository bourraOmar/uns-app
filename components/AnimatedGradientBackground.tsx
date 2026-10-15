import React from 'react';
import { VideoBackground } from './VideoBackground';
import { RubberFluid } from './RubberFluid';

/**
 * AnimatedGradientBackground:
 * Now supports high-performance looping video background seamlessly!
 * You can switch between VideoBackground or RubberFluid shader easily.
 */
export function AnimatedGradientBackground({ mode = 'video' }: { mode?: 'video' | 'shader' }) {
  if (mode === 'shader') {
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

  return <VideoBackground overlayOpacity={0.4} />;
}

export { RubberFluid, VideoBackground };
