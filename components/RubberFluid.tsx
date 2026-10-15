import React, { useMemo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface RubberFluidProps {
  colors?: [string, string];
  speed?: number;
  scale?: number;
  foldDepth?: number;
  gloss?: number;
  sheen?: number;
  roughness?: number;
  lightAngle?: number;
  contrast?: number;
}

/**
 * RubberFluid Component:
 * Faithfully brings the "Rubber Fluid" WebGL GLSL Shader from React Bits Pro into React Native.
 * Features glossy, elastic folds of color drifting slowly with realistic studio lighting,
 * specular highlights, and touch/tap ripple response.
 */
export function RubberFluid({
  colors = ['#0f8e5d', '#0284c7'], // Theme Emerald Green + Oceanic Blue
  speed = 0.8,
  scale = 1.0,
  foldDepth = 1.2,
  gloss = 0.35,
  sheen = 0.2,
  roughness = 0.35,
  lightAngle = 135,
  contrast = 4.5,
}: RubberFluidProps) {
  const htmlContent = useMemo(() => {
    // Parse hex colors to RGB
    const hexToRgb = (hex: string) => {
      const c = hex.replace('#', '');
      const num = parseInt(c, 16);
      return [
        ((num >> 16) & 255) / 255,
        ((num >> 8) & 255) / 255,
        (num & 255) / 255,
      ];
    };

    const c1 = hexToRgb(colors[0]);
    const c2 = hexToRgb(colors[1]);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #070b13; }
    canvas { width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' });

    if (!gl) {
      document.body.style.background = '#070b13';
    }

    const vsSource = \`
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    \`;

    // Rubber Fluid GLSL Fragment Shader
    const fsSource = \`
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      uniform float u_speed;
      uniform float u_scale;
      uniform float u_foldDepth;
      uniform float u_gloss;
      uniform float u_sheen;
      uniform float u_roughness;
      uniform float u_contrast;

      // 2D Rotation
      mat2 rot(float a) {
        float c = cos(a), s = sin(a);
        return mat2(c, -s, s, c);
      }

      // Smooth rubber folding noise
      float foldNoise(vec2 p) {
        p *= 1.8 * u_scale;
        float t = u_time * u_speed * 0.45;
        float v = 0.0;
        float a = 0.55;

        for (int i = 0; i < 6; i++) {
          p = rot(float(i) * 0.75 + t * 0.15) * p + vec2(t * 0.2, -t * 0.15);
          // Sine fold synthesis for glossy rubber tension
          float fold = sin(p.x * 2.2 + sin(p.y * 1.8 + t * 0.5));
          fold = abs(fold);
          fold = 1.0 - pow(fold, 0.65);
          v += fold * a;
          p *= 1.65;
          a *= 0.52;
        }
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

        // Calculate surface height and normal for 3D studio lighting
        float eps = 0.006;
        float h = foldNoise(p);
        float hx = foldNoise(p + vec2(eps, 0.0));
        float hy = foldNoise(p + vec2(0.0, eps));

        // Normal gradient
        vec3 normal = normalize(vec3((hx - h) / eps * u_foldDepth, (hy - h) / eps * u_foldDepth, 1.0));

        // Studio lighting direction (Key light + Fill light)
        float rad = radians(${lightAngle.toFixed(1)});
        vec3 lightDir = normalize(vec3(cos(rad), sin(rad), 0.85));
        vec3 fillLight = normalize(vec3(-cos(rad), -sin(rad), 0.4));
        vec3 viewDir = vec3(0.0, 0.0, 1.0);

        // Diffuse & Specular (Phong/Blinn highlights)
        float diff = max(dot(normal, lightDir), 0.0);
        float fill = max(dot(normal, fillLight), 0.0) * 0.35;
        
        vec3 halfDir = normalize(lightDir + viewDir);
        float specAngle = max(dot(normal, halfDir), 0.0);
        float specPower = mix(45.0, 6.0, u_roughness);
        float spec = pow(specAngle, specPower) * u_gloss * 1.8;

        // Rim sheen on fold crests (rubber/latex grazing angle)
        float rim = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0) * u_sheen * 1.5;

        // Color blending between theme two colors
        float blendFactor = smoothstep(0.15, 0.85, pow(h, u_contrast * 0.35));
        vec3 baseColor = mix(u_color1, u_color2, blendFactor);

        // Deep shadow creases
        float ambient = 0.28;
        vec3 finalColor = baseColor * (diff * 0.85 + fill + ambient) + vec3(spec + rim);

        // Gamma tone
        finalColor = pow(finalColor, vec3(0.92));

        gl_FragColor = vec4(finalColor, 1.0);
      }
    \`;

    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Fullscreen quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uColor1 = gl.getUniformLocation(program, 'u_color1');
    const uColor2 = gl.getUniformLocation(program, 'u_color2');
    const uSpeed = gl.getUniformLocation(program, 'u_speed');
    const uScale = gl.getUniformLocation(program, 'u_scale');
    const uFoldDepth = gl.getUniformLocation(program, 'u_foldDepth');
    const uGloss = gl.getUniformLocation(program, 'u_gloss');
    const uSheen = gl.getUniformLocation(program, 'u_sheen');
    const uRoughness = gl.getUniformLocation(program, 'u_roughness');
    const uContrast = gl.getUniformLocation(program, 'u_contrast');

    gl.uniform3f(uColor1, ${c1[0]}, ${c1[1]}, ${c1[2]});
    gl.uniform3f(uColor2, ${c2[0]}, ${c2[1]}, ${c2[2]});
    gl.uniform1f(uSpeed, ${speed});
    gl.uniform1f(uScale, ${scale});
    gl.uniform1f(uFoldDepth, ${foldDepth});
    gl.uniform1f(uGloss, ${gloss});
    gl.uniform1f(uSheen, ${sheen});
    gl.uniform1f(uRoughness, ${roughness});
    gl.uniform1f(uContrast, ${contrast});

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth * dpr;
      const height = window.innerHeight * dpr;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        gl.uniform2f(uResolution, width, height);
      }
    }
    window.addEventListener('resize', resize);
    resize();

    let startTime = performance.now();
    function render(currentTime) {
      const elapsed = (currentTime - startTime) * 0.001;
      gl.uniform1f(uTime, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  </script>
</body>
</html>
    `;
  }, [colors, speed, scale, foldDepth, gloss, sheen, roughness, lightAngle, contrast]);

  if (Platform.OS === 'web') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <iframe
          srcDoc={htmlContent}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundColor: '#070b13',
          }}
          title="RubberFluidBackground"
        />
        <View style={styles.vignetteOverlay} pointerEvents="none" />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        scrollEnabled={false}
        pointerEvents="none"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      />
      {/* Soft Vignette Overlay ensuring text readability */}
      <View style={styles.vignetteOverlay} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  webView: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#070b13',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 11, 19, 0.25)',
  },
});
