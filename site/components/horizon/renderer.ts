// Draws the horizon scene into a canvas: builds the two air tables, loads whichever maps it is given, and runs the
// one shader in glsl.ts. It has no opinion about where the camera or the sun are; the caller passes a Frame.
import { MS_SIZE, T_SIZE, multipleScatteringTable, transmittanceTable } from "./atmosphere";
import type { Shot, Vec3 } from "./ephemeris";
import { FRAG, VERT } from "./glsl";

// `detail` is a sharper cloud map for one part of the globe: its west and north edges and its size, in degrees.
// `tops` is a map of how high the cloud tops stand over the same box (white is 12.75 km).
export interface Maps { cloud?: string; colour?: string; night?: string; detail?: { url: string; tops?: string; west: number; north: number; width: number; height: number } }
export interface Look {
  focal: number;        // 1 / tan(half the vertical field of view)
  exposure: number;
  contrast: number; saturation: number; p3: number; glare: number;
  cloudDepth: number; cloudRelief: number; cloudHeight: number; cloudDrift: number;
  cloudTops: number;    // 1 uses the measured cloud-top heights where a region has them, 0 keeps every cloud on one level
  cityLights: number; airglow: number; moonlight: number; stars: number;
  steps: number;
  warmth: number; tint: number;       // white balance: 0 leaves sunlight as yellow as the air makes it, 1 calls a sunlit cloud white
}
export const LOOK: Look = {
  focal: 2.4, exposure: 1, contrast: 1.6, saturation: 1.1, p3: 0.35, glare: 0.14,
  cloudDepth: 120, cloudRelief: 1, cloudHeight: 7, cloudDrift: 0, cloudTops: 1,
  cityLights: 0.003, airglow: 0.0000004, moonlight: 0.000032, stars: 0.0012, steps: 40, warmth: 1, tint: 0.03,
};
export interface Frame { shot: Shot; sun: Vec3; moon: Vec3; look: Look; time: number }
export interface Horizon {
  render(frame: Frame): boolean;
  ready(): boolean;
  broken(): boolean;    // a map the picture cannot do without failed to load, or the browser took the graphics context away
  coarser(): boolean;   // draw fewer pixels from now on (a machine that cannot keep up); false once at the floor
  wideGamut: boolean;
  stats(): { width: number; height: number; maxTexture: number; maps: string[]; renderer: string };
  dispose(): void;
}

export function createHorizon(canvas: HTMLCanvasElement, options: { maps?: Maps; maxPixelRatio?: number; onError?: (e: Error) => void } = {}): Horizon {
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" }) as WebGL2RenderingContext | null;
  if (!gl) throw new Error("WebGL 2 is not available");
  // Apple's screens show more colour than sRGB holds. Where the browser lets the canvas use Display P3, it does.
  let wideGamut = false;
  try {
    if (matchMedia("(color-gamut: p3)").matches && "drawingBufferColorSpace" in gl) {
      (gl as WebGL2RenderingContext & { drawingBufferColorSpace: string }).drawingBufferColorSpace = "display-p3";
      wideGamut = (gl as WebGL2RenderingContext & { drawingBufferColorSpace: string }).drawingBufferColorSpace === "display-p3";
    }
  } catch { wideGamut = false; }

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "shader failed to compile");
    return shader;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT)); gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "program failed to link");
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const at = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
  const U = (name: string) => gl.getUniformLocation(program, name);

  const table = (unit: number, [w, h]: readonly [number, number], data: Float32Array) => {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  };
  const transmittance = transmittanceTable();
  const textures: (WebGLTexture | null)[] = [table(0, T_SIZE, transmittance), table(1, MS_SIZE, multipleScatteringTable(transmittance))];
  gl.uniform1i(U("uT"), 0); gl.uniform1i(U("uMS"), 1);

  // Maps of the planet. Each is optional; until one arrives the shader draws that layer as absent (open sea, no
  // cloud, no lamps). An image wider than the GPU's limit is drawn down to it first.
  const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const anisotropy = gl.getExtension("EXT_texture_filter_anisotropic");
  const has = [0, 0, 0, 0, 0], loaded: string[] = [];
  let pending = 0, gone = false, broken = false, scale = 1;
  // A browser may take the graphics context away (memory pressure, a driver reset, too many tabs). The picture is
  // not rebuilt: the page is told, and shows its still.
  const lost = (event: Event) => { event.preventDefault(); broken = true; options.onError?.(new Error("graphics context lost")); };
  canvas.addEventListener("webglcontextlost", lost);
  // `cap` is the widest the map is kept on the GPU. Cloud and lamp maps are stored as one channel, a quarter of the
  // memory of the four the browser would otherwise keep.
  // `needed` marks a map without which the live picture would not match its still (the cloud, the surface): if one
  // fails, the scene reports itself broken instead of drawing a planet with a layer missing.
  const load = (slot: number, unit: number, name: string, url: string | undefined, srgb: boolean, cap: number, needed = false) => {
    gl.uniform1i(U(name), unit);
    if (!url) return;
    pending++;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = async () => {
      if (gone) return;
      try {
        let source: TexImageSource = image;
        const limit = Math.min(maxTexture, cap);
        if (image.naturalWidth > limit) {
          source = await createImageBitmap(image, { resizeWidth: limit, resizeHeight: Math.round((limit * image.naturalHeight) / image.naturalWidth), resizeQuality: "high" });
        }
        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        if (srgb) gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, source);
        else gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, source);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (anisotropy) gl.texParameterf(gl.TEXTURE_2D, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
        textures.push(texture);
        has[slot] = 1; loaded.push(`${name}:${image.naturalWidth}x${image.naturalHeight}`);
      } catch (error) { if (needed) broken = true; options.onError?.(error as Error); }
      pending--;
    };
    image.onerror = () => { pending--; if (needed) broken = true; options.onError?.(new Error(`could not load ${url}`)); };
    image.src = url;
  };
  // A phone keeps smaller maps: its screen shows less of them and its browser allows a page far less graphics memory.
  const small = matchMedia("(pointer: coarse)").matches || Math.min(innerWidth, innerHeight) < 700;
  const detail = options.maps?.detail;
  load(0, 2, "uCloud", options.maps?.cloud, false, detail || small ? 4096 : 8192, true);
  load(1, 3, "uColor", options.maps?.colour, true, small ? 2048 : 4096, true);
  load(2, 4, "uNight", options.maps?.night, false, small ? 2048 : 4096);
  load(3, 5, "uCloudHi", detail?.url, false, small ? 4096 : 8192, true);
  load(4, 6, "uTop", detail?.tops, false, small ? 2048 : 4096);

  const u = {
    res: U("uRes"), cam: U("uCam"), right: U("uRight"), up: U("uUp"), fwd: U("uFwd"), sun: U("uSun"), moon: U("uMoon"),
    tan: U("uTan"), exposure: U("uExposure"), time: U("uTime"), p3: U("uP3"), steps: U("uSteps"),
    has: U("uHas"), white: U("uWhite"), cloud: U("uCloudLook"), region: U("uRegion"), grade: U("uGrade"), night: U("uNightLook"),
  };
  const ratio = () => Math.min(devicePixelRatio || 1, options.maxPixelRatio ?? 2) * scale;

  return {
    wideGamut,
    ready: () => pending === 0 && !broken,
    broken: () => broken,
    // Each step draws about a third fewer pixels; the browser scales the canvas back up. Half the linear size is the
    // floor: below that the still is the better picture.
    coarser() { if (scale <= 0.5) return false; scale = Math.max(0.5, scale * 0.82); return true; },
    render({ shot, sun, moon, look, time }) {
      const w = Math.max(1, Math.round(canvas.clientWidth * ratio())), h = Math.max(1, Math.round(canvas.clientHeight * ratio()));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.res, w, h);
      gl.uniform3fv(u.cam, shot.position); gl.uniform3fv(u.right, shot.right); gl.uniform3fv(u.up, shot.up); gl.uniform3fv(u.fwd, shot.forward);
      gl.uniform3fv(u.sun, sun); gl.uniform3fv(u.moon, moon);
      gl.uniform1f(u.tan, 1 / look.focal); gl.uniform1f(u.exposure, look.exposure); gl.uniform1f(u.time, time);
      gl.uniform1f(u.p3, wideGamut ? 1 : 0); gl.uniform1f(u.steps, look.steps);
      gl.uniform3f(u.white, 1 + look.warmth * (1 / 0.93 - 1), (1 + look.warmth * (1 / 0.86 - 1)) * (1 + look.tint), 1 + look.warmth * (1 / 0.74 - 1));
      gl.uniform4f(u.has, has[0], has[1], has[2], has[3] && has[4] ? look.cloudTops : 0);
      gl.uniform4f(u.cloud, look.cloudDepth, look.cloudRelief, look.cloudHeight, look.cloudDrift / (2 * Math.PI * 6.371e6));
      if (detail && has[3]) gl.uniform4f(u.region, (detail.west + 180) / 360, (90 - detail.north) / 180, detail.width / 360, detail.height / 180);
      else gl.uniform4f(u.region, 0, 0, 0, 0);
      gl.uniform4f(u.grade, look.contrast, look.saturation, look.p3, look.glare);
      gl.uniform4f(u.night, look.cityLights, look.airglow, look.moonlight, look.stars);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return true;
    },
    stats: () => {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      return { width: canvas.width, height: canvas.height, maxTexture, maps: loaded, renderer: info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "" };
    },
    dispose() {
      gone = true;
      canvas.removeEventListener("webglcontextlost", lost);
      for (const texture of textures) gl.deleteTexture(texture);
      gl.deleteBuffer(buffer); gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
