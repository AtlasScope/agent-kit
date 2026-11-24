// Small WebGL2 helpers for the orbit renderer: programs that compile without blocking the page, textures and
// render targets. Every pass draws one triangle that covers its target; the fragment shader does the work.
export type GL = WebGL2RenderingContext;

const VERT = `#version 300 es
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}`;

export type Pass = {
  name: string;
  program: WebGLProgram;
  vs: WebGLShader;
  fs: WebGLShader;
  locs: Map<string, WebGLUniformLocation | null>;
  linked: boolean;
};

// Starts compiling and linking. Nothing here waits on the GPU driver; ask passReady() whether it has finished.
export function createPass(gl: GL, name: string, frag: string): Pass {
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, frag);
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  return { name, program, vs, fs, locs: new Map(), linked: false };
}

// True once the program has linked. Throws with the compiler's own message if it failed. With the parallel-compile
// extension the check never blocks; without it the first call waits for the driver.
export function passReady(gl: GL, pass: Pass, parallel: KHR_parallel_shader_compile | null): boolean {
  if (pass.linked) return true;
  if (parallel && !gl.getProgramParameter(pass.program, parallel.COMPLETION_STATUS_KHR)) return false;
  if (!gl.getProgramParameter(pass.program, gl.LINK_STATUS)) {
    const log = gl.getShaderInfoLog(pass.fs) || gl.getShaderInfoLog(pass.vs) || gl.getProgramInfoLog(pass.program) || "link failed";
    throw new Error(`orbit: ${pass.name}: ${log}`);
  }
  pass.linked = true;
  return true;
}

export function deletePass(gl: GL, pass: Pass) {
  gl.deleteShader(pass.vs);
  gl.deleteShader(pass.fs);
  gl.deleteProgram(pass.program);
}

// Uniforms are set by name; the location is looked up once and kept.
export class Uniforms {
  private gl: GL;
  private pass: Pass;
  private unit = 0;
  constructor(gl: GL, pass: Pass) {
    this.gl = gl;
    this.pass = pass;
    gl.useProgram(pass.program);
  }
  private loc(name: string) {
    let l = this.pass.locs.get(name);
    if (l === undefined) {
      l = this.gl.getUniformLocation(this.pass.program, name);
      this.pass.locs.set(name, l);
    }
    return l;
  }
  f(name: string, x: number) { const l = this.loc(name); if (l) this.gl.uniform1f(l, x); return this; }
  v2(name: string, x: number, y: number) { const l = this.loc(name); if (l) this.gl.uniform2f(l, x, y); return this; }
  v3(name: string, v: ArrayLike<number>) { const l = this.loc(name); if (l) this.gl.uniform3f(l, v[0], v[1], v[2]); return this; }
  v4(name: string, x: number, y: number, z: number, w: number) { const l = this.loc(name); if (l) this.gl.uniform4f(l, x, y, z, w); return this; }
  m3(name: string, m: ArrayLike<number>) { const l = this.loc(name); if (l) this.gl.uniformMatrix3fv(l, false, m as Float32List); return this; }
  tex(name: string, texture: WebGLTexture | null) {
    const l = this.loc(name);
    if (l) {
      this.gl.activeTexture(this.gl.TEXTURE0 + this.unit);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.uniform1i(l, this.unit);
      this.unit++;
    }
    return this;
  }
}

export type TexSpec = {
  w: number;
  h: number;
  internal: number;
  format: number;
  type: number;
  linear?: boolean;
  mips?: boolean;
  repeat?: boolean;
  data?: ArrayBufferView | null;
};

export function createTexture(gl: GL, spec: TexSpec): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, spec.internal, spec.w, spec.h, 0, spec.format, spec.type, spec.data ?? null);
  const mag = spec.linear ? gl.LINEAR : gl.NEAREST;
  const min = spec.mips ? gl.LINEAR_MIPMAP_LINEAR : mag;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mag);
  const wrap = spec.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  return tex;
}

// A framebuffer that draws into the given textures, in order.
export function createTarget(gl: GL, textures: WebGLTexture[]): WebGLFramebuffer {
  const fb = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  textures.forEach((tex, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, tex, 0));
  gl.drawBuffers(textures.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return fb;
}

export function draw(gl: GL) {
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
