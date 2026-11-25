#!/usr/bin/env node
// Times each of the orbit scene's shaders as a browser compiles and links it from cold: the cost a visitor pays
// before the first frame. On Windows the browser translates GLSL to HLSL and the driver compiles that, which is
// where a shader's size and its loops show.
//   cd site && node scripts/orbit-compile.mjs
import { launch, startLab } from "./orbit-browser.mjs";

const lab = await startLab(4330);
const browser = await launch();
try {
  const page = await browser.newPage();
  await page.goto(`${lab.base}/?bare=1`);
  const out = await page.evaluate(async () => {
    const bake = await import("/components/orbit/glsl/bake.ts");
    const scene = await import("/components/orbit/glsl/scene.ts");
    const { SHADE } = await import("/components/orbit/glsl/shade.ts");
    const { AURORA } = await import("/components/orbit/glsl/aurora.ts");
    const { POST } = await import("/components/orbit/glsl/post.ts");
    const gl = document.createElement("canvas").getContext("webgl2");
    const VS = "#version 300 es\nvoid main(){ vec2 p = vec2((gl_VertexID<<1)&2, gl_VertexID&2); gl_Position = vec4(p*2.-1., 0., 1.); }";
    // A comment that changes every run, so no cache in the browser or the driver can answer for the compiler.
    const salt = `\n// ${Math.random()}\n`;
    const sources = { surface: bake.bakeSurface(), clouds: bake.BAKE_CLOUDS, shade: SHADE, scene: scene.sceneShader(24, 8), aurora: AURORA, post: POST };
    const res = {};
    for (const [name, src] of Object.entries(sources)) {
      const t = performance.now();
      const p = gl.createProgram();
      for (const [type, s] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, src + salt]]) { const sh = gl.createShader(type); gl.shaderSource(sh, s); gl.compileShader(sh); gl.attachShader(p, sh); }
      gl.linkProgram(p);
      const ok = gl.getProgramParameter(p, gl.LINK_STATUS);
      res[name] = `${(performance.now() - t).toFixed(0)} ms${ok ? "" : " FAILED " + gl.getProgramInfoLog(p)}`;
    }
    return res;
  });
  console.log(out);
} finally {
  await browser.close();
  lab.stop();
}
