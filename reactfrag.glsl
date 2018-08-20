precision highp float;

// uniform highp sampler2D Sggg;
// uniform vec2 resolution;
uniform float alpha;
uniform float beta;
uniform float dt;
uniform float f;

float rho(float x) {
    if (x > 0.0) {
        return x;
    } else {
        return 0.0
    }
}

float gamma(float x) {
    if (x > 0.0) {
        return x;
    } else {
        return 0.0
    }
}

void main() {
    vec2 position = gl_FragCoord.xy / resolution.xy;
    vec2 pixel = 1.0 / resolution.xy;

    float c  = texture2D(Sggg, position                       ).r;
    float u  = texture2D(Sggg, position + pixel * vec2( 0,  1)).r;
    float ur = texture2D(Sggg, position + pixel * vec2( 1,  1)).r;
    float  r = texture2D(Sggg, position + pixel * vec2( 1,  0)).r;
    float dr = texture2D(Sggg, position + pixel * vec2( 1, -1)).r;
    float d  = texture2D(Sggg, position + pixel * vec2( 0, -1)).r;
    float dl = texture2D(Sggg, position + pixel * vec2(-1, -1)).r;
    float  l = texture2D(Sggg, position + pixel * vec2(-1,  0)).r;
    float ul = texture2D(Sggg, position + pixel * vec2(-1,  1)).r;

    float lap = 0.2 * (u + r + d + l) + 0.05 * (ul + ur + dl + dr) - c;
    float grad_fd = r - c;

    float ds = alpha * gamma(grad_fd) - beta * rho(lap);

    float s_new = c + GLOB_RATE * dt * ds;
    gl_FragColor = vec4(s_new, 0.0, 0.0, 1.0);
}