import { useEffect, type RefObject } from "react";
import { createProgram } from "./glProgram";
import { centerYFromTopFraction, cubicBezier, easeInOut } from "./orbMath";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shaders";

const DAMP_LAMBDA = 8;
const MAX_DPR = 2;
// Orb geometry in the shader's st-space (resolution-independent). y is bottom-up;
// 0.66 sits in the upper area, behind the "Peek" wordmark. Shared with the shader
// (as uniforms) and the resting-blur math so they always agree.
const ORB_CENTER_Y = 0.66;
const ORB_RADIUS = 0.18;
// How far (in orb radii) the cursor may stray before the blur eases back to its
// resting spot instead of following the pointer.
const ORB_REACH = 3.0;
// The design Y as a top-down fraction (matches ORB_CENTER_Y in landscape).
const DESIGN_TOP_FRACTION = 1 - ORB_CENTER_Y;
// The wordmark we anchor the orb to, and how far below its centre the orb centre
// sits (in orb radii) so the heading reads on the planet's upper hemisphere.
const ANCHOR_SELECTOR = "[data-orb-anchor]";
const ORB_BELOW_ANCHOR = 0.7;
// Extra push-down (CSS px) below the radius-based offset, so the wordmark stays
// readable above the planet.
const ORB_OFFSET_PX = 80;

export function useOrbCanvas(canvasRef: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      // Premultiplied alpha: the shader outputs rgb already multiplied by the
      // mask. Straight alpha (premultipliedAlpha:false) renders correctly in
      // Chrome but blooms in Safari, which composites the canvas as if it were
      // premultiplied and so shows low-coverage pixels at full colour. Doing the
      // multiply in-shader is the portable path — same maths, no reliance on the
      // browser's straight→premultiplied conversion.
      premultipliedAlpha: true,
      antialias: true,
    });
    if (!gl) {
      // no WebGL2 → the CSS ambient fallback stays visible
      return;
    }

    const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    if (!program) {
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // a single triangle large enough to cover clip space
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uPixelRatio = gl.getUniformLocation(program, "u_pixelRatio");
    const uCenter = gl.getUniformLocation(program, "u_center");
    gl.uniform1f(gl.getUniformLocation(program, "u_radius"), ORB_RADIUS);

    // Orb geometry in canvas-local CSS px, recomputed on resize. The radius keys
    // off the SHORTER dimension (matching the shader's coord()); the centre is
    // anchored a fixed distance below the wordmark so it stays glued to the
    // heading at every viewport size. The blur targets below derive from these
    // pixel values — driving them off orbCenterY/height instead lets the blur
    // drift up the orb as the screen narrows (orbCenterY is inflated in portrait
    // to undo coord()'s y-remap, and the radius isn't a fraction of height).
    // st-space, for the shader uniform
    let orbCenterY = ORB_CENTER_Y;
    // CSS px, top-down
    let orbCenterFromTop = 0;
    // CSS px
    let orbRadiusPx = 0;

    const updateOrbGeometry = (cssWidth: number, cssHeight: number) => {
      orbRadiusPx = ORB_RADIUS * Math.min(cssWidth, cssHeight);
      const anchor = document.querySelector(ANCHOR_SELECTOR);
      if (!anchor || cssHeight === 0) {
        orbCenterFromTop = DESIGN_TOP_FRACTION * cssHeight;
        return;
      }
      const canvasRect = canvas.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      orbCenterFromTop =
        anchorRect.top -
        canvasRect.top +
        anchorRect.height / 2 +
        ORB_BELOW_ANCHOR * orbRadiusPx +
        ORB_OFFSET_PX;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const cssWidth = canvas.clientWidth;
      const cssHeight = canvas.clientHeight;
      const width = Math.max(1, Math.round(cssWidth * dpr));
      const height = Math.max(1, Math.round(cssHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      updateOrbGeometry(cssWidth, cssHeight);
      const topFraction = cssHeight > 0 ? orbCenterFromTop / cssHeight : DESIGN_TOP_FRACTION;
      orbCenterY = centerYFromTopFraction(topFraction, width, height);
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uResolution, width, height);
      gl.uniform2f(uCenter, 0.5, orbCenterY);
      gl.uniform1f(uPixelRatio, dpr);
    };

    // pointer kept in canvas-local CSS px, bottom-up (matching gl_FragCoord)
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    // Resting blur position when the orb isn't hovered: horizontally centred,
    // ~2/3 down the orb (in bottom-up px, matching gl_FragCoord / u_mouse).
    const restTarget = () => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: rect.width / 2,
        y: rect.height - orbCenterFromTop - orbRadiusPx / 1.5,
      };
    };
    const setRest = () => {
      const rest = restTarget();
      target.x = current.x = rest.x;
      target.y = current.y = rest.y;
    };

    // Intro: the blur enters at the orb's top-right and arcs (a cubic Bézier)
    // down to its resting spot just below the ball, once on load.
    const INTRO_MS = 1500;
    let introStart = 0;
    let introDone = false;
    const introPos = (te: number) => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2;
      // bottom-up
      const cy = rect.height - orbCenterFromTop;
      const r = orbRadiusPx;
      // P0 top-right → sweep down the right side (arch) → P3 rest (centre,
      // just below the ball). y is bottom-up, so +y is up.
      return {
        x: cubicBezier(te, cx + r * 0.9, cx + r * 1.3, cx + r * 0.3, cx),
        y: cubicBezier(te, cy + r * 0.9, cy + r * 0.4, cy - r * 0.6, cy - r / 1.5),
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const yFromTop = event.clientY - rect.top;
      // distance from the orb centre (in px); the orb radius keys off the
      // shorter canvas dimension, matching the shader's coord() aspect handling.
      const orbX = rect.width / 2;
      const orbYFromTop = orbCenterFromTop;
      const orbR = orbRadiusPx;
      const near = Math.hypot(x - orbX, yFromTop - orbYFromTop) <= orbR * ORB_REACH;
      if (near) {
        // genuine interaction takes over from the intro
        introDone = true;
        target.x = x;
        // flip to bottom-up
        target.y = rect.height - yFromTop;
      } else {
        // cursor too far from the orb → ease back to the resting position
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

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let last = 0;
    let onscreen = true;
    const tick = (now: number) => {
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      if (introDone) {
        // pointer-driven only (no autonomous motion); reduced motion snaps.
        const k = reduceMotion ? 1 : 1 - Math.exp(-DAMP_LAMBDA * dt);
        current.x += (target.x - current.x) * k;
        current.y += (target.y - current.y) * k;
      } else {
        // play the intro arc, easing along the Bézier toward the rest spot
        if (!introStart) {
          introStart = now;
        }
        const t = Math.min((now - introStart) / INTRO_MS, 1);
        const pos = introPos(easeInOut(t));
        current.x = pos.x;
        current.y = pos.y;
        if (t >= 1) {
          introDone = true;
        }
      }
      renderFrame();
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf || !onscreen || document.hidden) {
        return;
      }
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
      }
      raf = 0;
    };

    resize();
    setRest();
    if (reduceMotion) {
      // honour reduced motion: skip the intro animation
      introDone = true;
    } else {
      const begin = introPos(0);
      current.x = begin.x;
      current.y = begin.y;
    }
    // paint the starting frame before the loop runs
    renderFrame();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      renderFrame();
    });
    resizeObserver.observe(canvas);
    // also watch the wordmark: when it reflows (web font load, line wrap) the orb
    // must re-anchor even though the canvas size hasn't changed.
    const anchor = document.querySelector(ANCHOR_SELECTOR);
    if (anchor) {
      resizeObserver.observe(anchor);
    }

    // pause when the orb scrolls out of view or the tab is hidden
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        onscreen = entry.isIntersecting;
        if (onscreen) {
          start();
        } else {
          stop();
        }
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
