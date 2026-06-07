import { useEffect, type RefObject } from "react";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shaders";

const DAMP_LAMBDA = 8;
const MAX_DPR = 2;

export function useOrbCanvas(canvasRef: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      // straight (non-premultiplied) alpha: the browser multiplies rgb by alpha
      // when compositing over the page, which is consistent across GPUs. The
      // premultiplied "alpha 0, additive rgb" trick renders only in SwiftShader
      // and goes fully transparent on real GPU compositors.
      premultipliedAlpha: false,
      antialias: true,
    });
    if (!gl) return; // no WebGL2 → the CSS ambient fallback stays visible

    const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    if (!program) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // a single triangle large enough to cover clip space
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const aPosition = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uPixelRatio = gl.getUniformLocation(program, "u_pixelRatio");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uResolution, width, height);
      gl.uniform1f(uPixelRatio, dpr);
    };

    // pointer kept in canvas-local CSS px, bottom-up (matching gl_FragCoord)
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    // Resting blur position when the orb isn't hovered: horizontally centred,
    // ~2/3 down the orb. y is bottom-up (matching gl_FragCoord / u_mouse).
    const restTarget = () => {
      const rect = canvas.getBoundingClientRect();
      return { x: rect.width / 2, y: rect.height * 0.38 };
    };
    const setRest = () => {
      const rest = restTarget();
      target.x = current.x = rest.x;
      target.y = current.y = rest.y;
    };
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const yFromTop = event.clientY - rect.top;
      const inside =
        x >= 0 && x <= rect.width && yFromTop >= 0 && yFromTop <= rect.height;
      if (inside) {
        target.x = x;
        target.y = rect.height - yFromTop; // flip to bottom-up
      } else {
        // not hovering the orb → ease back to the resting position
        const rest = restTarget();
        target.x = rest.x;
        target.y = rest.y;
      }
    };

    const renderFrame = () => {
      gl.uniform2f(uMouse, current.x, current.y);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;
    let last = 0;
    let onscreen = true;
    const tick = (now: number) => {
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      // pointer-driven only (no autonomous motion); under reduced motion we
      // snap to the cursor instead of easing toward it.
      const k = reduceMotion ? 1 : 1 - Math.exp(-DAMP_LAMBDA * dt);
      current.x += (target.x - current.x) * k;
      current.y += (target.y - current.y) * k;
      renderFrame();
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf || !onscreen || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    setRest();
    renderFrame(); // paint immediately so the ring shows before the loop starts

    const resizeObserver = new ResizeObserver(() => {
      resize();
      renderFrame();
    });
    resizeObserver.observe(canvas);

    // pause when the orb scrolls out of view or the tab is hidden
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        onscreen = entry.isIntersecting;
        if (onscreen) start();
        else stop();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      // NB: deliberately not calling WEBGL_lose_context here — under React
      // StrictMode (dev) the effect remounts on the same canvas, and a lost
      // context can't be re-acquired, which would blank the orb. The context
      // is released on GC, which is fine for one small page-lifetime canvas.
    };
  }, [canvasRef]);
}

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  console.error("OrbCanvas shader compile failed:", gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram | null {
  const vertex = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  console.error("OrbCanvas program link failed:", gl.getProgramInfoLog(program));
  return null;
}
