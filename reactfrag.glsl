precision highp float;

// uniform highp sampler2D SLWg;
// uniform vec2 resolution;
uniform float alpha;
uniform float beta;
uniform float D_v;
uniform float f;
uniform float time;
uniform vec2 ij;

float rho(float x) {
    return (1. / (1. + exp(5. * (x + 1.0))));
}

float gamma(float x) {
    return (1. / (1. + exp(-6. * x)));
}

lowp vec4 permute(in lowp vec4 x){return mod(x*x*34.+x,289.);}
lowp float snoise(in mediump vec3 v){
  const lowp vec2 C = vec2(0.16666666666,0.33333333333);
  const lowp vec4 D = vec4(0,.5,1,2);
  lowp vec3 i  = floor(C.y*(v.x+v.y+v.z) + v);
  lowp vec3 x0 = C.x*(i.x+i.y+i.z) + (v - i);
  lowp vec3 g = step(x0.yzx, x0);
  lowp vec3 l = (1. - g).zxy;
  lowp vec3 i1 = min( g, l );
  lowp vec3 i2 = max( g, l );
  lowp vec3 x1 = x0 - i1 + C.x;
  lowp vec3 x2 = x0 - i2 + C.y;
  lowp vec3 x3 = x0 - D.yyy;
  i = mod(i,289.);
  lowp vec4 p = permute( permute( permute(
      i.z + vec4(0., i1.z, i2.z, 1.))
    + i.y + vec4(0., i1.y, i2.y, 1.))
    + i.x + vec4(0., i1.x, i2.x, 1.));
  lowp vec3 ns = .142857142857 * D.wyz - D.xzx;
  lowp vec4 j = -49. * floor(p * ns.z * ns.z) + p;
  lowp vec4 x_ = floor(j * ns.z);
  lowp vec4 x = x_ * ns.x + ns.yyyy;
  lowp vec4 y = floor(j - 7. * x_ ) * ns.x + ns.yyyy;
  lowp vec4 h = 1. - abs(x) - abs(y);
  lowp vec4 b0 = vec4( x.xy, y.xy );
  lowp vec4 b1 = vec4( x.zw, y.zw );
  lowp vec4 sh = -step(h, vec4(0));
  lowp vec4 a0 = b0.xzyw + (floor(b0)*2.+ 1.).xzyw*sh.xxyy;
  lowp vec4 a1 = b1.xzyw + (floor(b1)*2.+ 1.).xzyw*sh.zzww;
  lowp vec3 p0 = vec3(a0.xy,h.x);
  lowp vec3 p1 = vec3(a0.zw,h.y);
  lowp vec3 p2 = vec3(a1.xy,h.z);
  lowp vec3 p3 = vec3(a1.zw,h.w);
  lowp vec4 norm = inversesqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  lowp vec4 m = max(.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.);
  return .5 + 12. * dot( m * m * m, vec4( dot(p0,x0), dot(p1,x1),dot(p2,x2), dot(p3,x3) ) );
}

void main() {
    vec2 position = gl_FragCoord.xy / resolution.xy;
    vec2 pixel = 1.0 / resolution.xy;

    float c  = texture2D(SLWg, position                       ).r;
    float u  = texture2D(SLWg, position + pixel * vec2( 0,  1)).r;
    float ur = texture2D(SLWg, position + pixel * vec2( 1,  1)).r;
    float  r = texture2D(SLWg, position + pixel * vec2( 1,  0)).r;
    float rr = texture2D(SLWg, position + pixel * vec2( 2,  0)).r;
    float dr = texture2D(SLWg, position + pixel * vec2( 1, -1)).r;
    float d  = texture2D(SLWg, position + pixel * vec2( 0, -1)).r;
    float dl = texture2D(SLWg, position + pixel * vec2(-1, -1)).r;
    float  l = texture2D(SLWg, position + pixel * vec2(-1,  0)).r;
    float ll = texture2D(SLWg, position + pixel * vec2(-2,  0)).r;
    float ul = texture2D(SLWg, position + pixel * vec2(-1,  1)).r;

    float lap = 0.2 * (u + r + d + l) + 0.05 * (ul + ur + dl + dr) - c;
    float grad_fd = (r - c + 0.5 * (ur - u + dr - d)) / 2.5
                  + (c - l + 0.5 * (u - ul + d - dl)) / 2.5
                  + (rr - ll) / 5.;
    float grad_ld = (dr - ul + r - u + d - l) / 4.;

    float inter = 0.0;
    if (ij.x > 0.0) {
        float inter = 10000. * exp(-length(position - ij));
    }
    float ds = alpha * (grad_fd * 0.5 + 1.0 * gamma(grad_fd)) + f + beta * lap;

    float warp = sin(0.4 * time);
    float s_new = c + inter + GLOB_RATE * (0.75 + 1.0 * max(warp, 0.0)) * ds;

    float wt = 0.005 * time;
    vec2 here = 2.0 * position - vec2(0.03 * time + 0.14 * warp, 0.0);
    float water = snoise(vec3(0.75 * here, wt)) + snoise(vec3(1.5 * here, wt));
    gl_FragColor = vec4(s_new, grad_ld, water, 1.0);
}

// Kawamura 1951
// https://archive.org/details/nasa_techdoc_19720013709

// https://www.sciencedirect.com/science/article/pii/S0169555X03003398

// Nishimori and Ouichi work.
// https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.71.197
// scipress.org/journals/forma/pdf/30s1/30s10091.pdf

// two-phase, which we want to avoid:
// https://link.springer.com/article/10.1007%2Fs10652-012-9263-2