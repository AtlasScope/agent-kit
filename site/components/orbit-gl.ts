// A live orbit for the homepage hero, drawn in one WebGL fragment shader over the supplied orbit photograph.
// The photo stays the planet; the shader adds what a still cannot: drifting cloud flow, a slow turn about the
// planet's centre, a sunrise breaking over the limb with an anamorphic streak, an atmosphere that brightens
// near the sun, a dashed orbit track with a craft moving along it, twinkling stars and film grain.
// The caller owns the clock and the camera (components/LaunchHero.tsx); this file only draws a frame.
//
// The limb is a circle fitted to the photo (orbit-1920: centre 1872.8, 5941.6; radius 5280.3, in 1920x1080 px).

// s: image px to CSS px; ox, oy: where the image's top-left lands, in CSS px. The rest are 0..1 light levels.
export type OrbitCamera = { s: number; ox: number; oy: number; rise: number; sun: number; expo: number; hud: number };

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

const FRAG = `precision highp float;
uniform sampler2D uTex;uniform vec2 uRes,uOff;uniform float uTime,uS,uRise,uSun,uExpo,uHud,uDpr;
const vec2 IMG=vec2(1920.,1080.);const vec2 C=vec2(1872.8,5941.6);const float R=5280.3;const float SX=1500.;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float limbY(float x){return C.y-sqrt(R*R-(x-C.x)*(x-C.x));}
void main(){
  vec2 q=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
  float k=uRes.y/900.;
  vec2 p=(q-uOff)/uS;
  float th=.0028*sin(uTime*.04)+uTime*.00009;
  vec2 pr=C+rot(th)*(p-C);
  float d=length(pr-C)-R;
  float inside=smoothstep(4.,-10.,d);
  vec2 uv=pr/IMG;
  vec2 w=uv*vec2(7.,16.);
  vec2 flow=vec2(fbm(w+vec2(uTime*.035,0.)),fbm(w+vec2(13.1,-uTime*.03)))-.5;
  uv+=flow*.0032*inside;
  vec3 col=vec3(0.);
  if(uv.x>0.&&uv.x<1.&&uv.y>0.&&uv.y<1.)col=texture2D(uTex,uv).rgb;
  col*=uExpo;
  float sky=smoothstep(2.,24.,d);
  vec2 sq=q/(3.*uDpr);vec2 cell=floor(sq);float st=h(cell);
  float star=step(.9965,st)*smoothstep(.5,.0,length(fract(sq)-.5))*(.55+.45*sin(uTime*(1.+st*3.)+st*40.));
  col+=vec3(.85,.9,1.)*star*sky*.9*max(uExpo,.5);
  float dd=d*uS;
  vec2 sunQ=vec2(SX,limbY(SX)+mix(46.,-6.,uSun))*uS+uOff;
  float near=exp(-pow((pr.x-SX)*uS/(uRes.x*.42),2.));
  float rim=exp(-abs(dd)/(2.2*k));
  float haze=exp(-max(dd,0.)/(26.*k))*smoothstep(-40.*k,0.,dd);
  float innerS=exp(min(dd,0.)/(55.*k))*(1.-step(0.,dd));
  vec3 atm=vec3(.28,.52,1.)*(haze*.6+innerS*.28)+vec3(.78,.9,1.)*rim;
  atm*=(.3+1.6*near*uSun)*uRise*(.92+.08*sin(uTime*.7+pr.x*.004));
  col+=atm;
  float above=smoothstep(-1.,4.,d);
  float sd=length(q-sunQ);
  float pulse=.93+.07*sin(uTime*.55);
  float core=exp(-sd/(5.*k))*above;
  float glow=1./(1.+pow(sd/(70.*k),2.));
  float streak=exp(-abs(q.y-sunQ.y)/(1.4*k))*exp(-abs(q.x-sunQ.x)/(uRes.x*.3));
  float halo=exp(-pow((sd-140.*k)/(7.*k),2.))*.05;
  col+=vec3(1.,.94,.84)*(core*2.4+glow*.42*mix(1.,above,.55)+halo)*uSun*pulse;
  col+=vec3(.55,.76,1.)*streak*.6*uSun*pulse;
  float ringR=R+170.;float rd=abs(length(pr-C)-ringR)*uS;
  float ang=atan(pr.x-C.x,C.y-pr.y);
  float dash=step(.55,fract(ang*900.-uTime*.05));
  float ring=smoothstep(1.1*uDpr,0.,rd)*.16*dash;
  float side=smoothstep(.42,.72,q.x/uRes.x);
  float ca=-.12+mod(uTime*.0045,.3);vec2 craft=C+ringR*vec2(sin(ca),-cos(ca));
  float cd=length(q-(craft*uS+uOff));
  float craftG=exp(-cd/(2.*k))+.25*exp(-cd/(12.*k))*(.6+.4*sin(uTime*3.));
  col+=(vec3(.8,.9,1.)*ring+vec3(1.,.85,.55)*craftG)*uHud*side;
  vec2 vq=q/uRes-.5;col*=1.-dot(vq,vq)*.55;
  col=col/(1.+col*.12);
  col+=(h(q+fract(uTime*7.)*100.)-.5)*.035;
  gl_FragColor=vec4(col,1.);
}`;

// Returns a draw function, or null without WebGL. onFirstFrame fires once the photo is on the GPU and drawn.
export function startOrbit(canvas: HTMLCanvasElement, src: string, onFirstFrame: () => void) {
  const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false, powerPreference: "high-performance" });
  if (!gl) return null;
  const sh = (type: number, code: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, code); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader"); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (name: string) => gl.getUniformLocation(prog, name);
  const U = { res: u("uRes"), off: u("uOff"), s: u("uS"), time: u("uTime"), rise: u("uRise"), sun: u("uSun"), expo: u("uExpo"), hud: u("uHud"), dpr: u("uDpr") };

  let ready = false, first = true;
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    ready = true;
  };
  img.src = src;
  const t0 = performance.now();

  return function draw(c: OrbitCamera, now: number) {
    if (!ready) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.round(canvas.clientWidth * dpr), hgt = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== hgt) { canvas.width = w; canvas.height = hgt; gl.viewport(0, 0, w, hgt); }
    gl.uniform2f(U.res, w, hgt);
    gl.uniform2f(U.off, c.ox * dpr, c.oy * dpr);
    gl.uniform1f(U.s, c.s * dpr);
    gl.uniform1f(U.time, (now - t0) / 1000);
    gl.uniform1f(U.rise, c.rise); gl.uniform1f(U.sun, c.sun); gl.uniform1f(U.expo, c.expo); gl.uniform1f(U.hud, c.hud);
    gl.uniform1f(U.dpr, dpr);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (first) { first = false; onFirstFrame(); }
  };
}
