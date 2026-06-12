// SDF "orb" - a filled planet (the original design's warm sphere gradient) with
// a faint rim. The SDF lens-blur technique from tympanus.net/Tutorials/SDFLensBlur
// is retained as the interaction: a soft circle tracks the pointer and feathers
// the planet's edge + blooms the rim wherever the cursor is near.

export const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_pixelRatio;
uniform vec2 u_center;   // orb centre in st-space (x left+, y up+)
uniform float u_radius;  // orb radius in st-space

vec2 coord(in vec2 p) {
  p = p / u_resolution.xy;
  if (u_resolution.x > u_resolution.y) {
    p.x *= u_resolution.x / u_resolution.y;
    p.x += (u_resolution.y - u_resolution.x) / u_resolution.y / 2.0;
  } else {
    p.y *= u_resolution.y / u_resolution.x;
    p.y += (u_resolution.x - u_resolution.y) / u_resolution.x / 2.0;
  }
  p -= 0.5;
  p *= vec2(-1.0, 1.0);
  return p;
}

#define st0 coord(gl_FragCoord.xy)
#define mx coord(u_mouse * u_pixelRatio)

float sdCircle(in vec2 st, in vec2 center) {
  return length(st - center) * 2.0;
}

float fill(float x, float size, float edge) {
  return 1.0 - smoothstep(size - edge, size + edge, x);
}

// Orb gradient stops, from the design: blue -> mauve -> soft yellow.
const vec3 G0 = vec3(0.23137, 0.29804, 0.88627); // #3B4CE2 @ 0%
const vec3 G1 = vec3(0.70588, 0.50588, 0.57647); // #B48193 @ 43%
const vec3 G2 = vec3(0.87059, 0.83137, 0.46275); // #DED476 @ 100%

vec3 gradient(float g) {
  vec3 c = mix(G0, G1, clamp(g / 0.43, 0.0, 1.0));
  return mix(c, G2, clamp((g - 0.43) / 0.57, 0.0, 1.0));
}

void main() {
  vec2 st = st0 + 0.5;
  vec2 posMouse = mx + 0.5;

  // var=1 lens: a soft disc around the cursor whose value sets how soft the
  // WHOLE planet is - so the gradient itself blurs/reveals, not just the edge.
  float lens = fill(sdCircle(st, posMouse), 0.19, 0.31);

  // Filled planet: edge crisp by default (just sub-pixel AA via fwidth), blooming
  // into a soft gradient cloud where the lens sits - exactly like demo var=1.
  float sd = sdCircle(st, u_center);
  float edge = max(lens * 1.4, fwidth(sd));
  float mask = fill(sd, u_radius * 2.0, edge);

  // Linear gradient on the -143° axis: blue (bottom-left) -> mauve -> yellow
  // (top-right). In st-space x increases leftward and y upward, so this dir
  // points up-right; projecting onto it gives the 0..1 ramp across the circle.
  vec2 dir = vec2(-0.7986, 0.6018);
  float g = clamp(0.5 + dot(st - u_center, dir) / (2.0 * u_radius), 0.0, 1.0);

  // Premultiplied alpha (premultipliedAlpha:true): rgb is multiplied by the
  // mask here rather than left to the page compositor. Straight alpha bloomed
  // in Safari, which composites the canvas as if it were already premultiplied
  // and so renders low-coverage pixels at full colour. The opaque interior
  // partially occludes the wordmark rendered behind this canvas.
  fragColor = vec4(gradient(g) * mask, mask);
}
`;
