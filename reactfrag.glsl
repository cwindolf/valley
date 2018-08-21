precision highp float;

// uniform highp sampler2D Sggg;
// uniform vec2 resolution;
uniform float alpha;
uniform float beta;
uniform float D_v;
uniform float dt;
uniform float f;

float rho(float x) {
    return (1. / (1. + exp(5. * (x + 1.0))));
}

float gamma(float x) {
    return (1. / (1. + exp(-6. * x)));
}

void main() {
    vec2 position = gl_FragCoord.xy / resolution.xy;
    vec2 pixel = 1.0 / resolution.xy;

    float c  = texture2D(Sggg, position                       ).r;
    float u  = texture2D(Sggg, position + pixel * vec2( 0,  1)).r;
    float ur = texture2D(Sggg, position + pixel * vec2( 1,  1)).r;
    float  r = texture2D(Sggg, position + pixel * vec2( 1,  0)).r;
    float rr = texture2D(Sggg, position + pixel * vec2( 2,  0)).r;
    float dr = texture2D(Sggg, position + pixel * vec2( 1, -1)).r;
    float d  = texture2D(Sggg, position + pixel * vec2( 0, -1)).r;
    float dl = texture2D(Sggg, position + pixel * vec2(-1, -1)).r;
    float  l = texture2D(Sggg, position + pixel * vec2(-1,  0)).r;
    float ll = texture2D(Sggg, position + pixel * vec2(-2,  0)).r;
    float ul = texture2D(Sggg, position + pixel * vec2(-1,  1)).r;

    float lap = 0.2 * (u + r + d + l) + 0.05 * (ul + ur + dl + dr) - c;
    float grad_fd = (r - c + 0.5 * (ur - u + dr - d)) / 2.5
                  + (c - l + 0.5 * (u - ul + d - dl)) / 2.5
                  + (rr - ll) / 5.;

    float ds = alpha * (grad_fd + gamma(grad_fd)) + f + beta * lap;

    float s_new = c + GLOB_RATE * dt * ds;
    gl_FragColor = vec4(s_new, 0.0, 0.0, 1.0);
}

// Kawamura 1951
// https://archive.org/details/nasa_techdoc_19720013709

// https://www.sciencedirect.com/science/article/pii/S0169555X03003398

// Nishimori and Ouichi work.
// https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.71.197
// scipress.org/journals/forma/pdf/30s1/30s10091.pdf

// two-phase, which we want to avoid:
// https://link.springer.com/article/10.1007%2Fs10652-012-9263-2