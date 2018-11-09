// #define DEBUG 1

uniform sampler2D SLWg;
uniform sampler2D sand;
varying vec2 vUv;

const vec3 sandLight = vec3(0.75, 0.92, 0.7);
const vec3 sandTall = vec3(0.89, 0.82, 0.75);
const vec3 sandDark = vec3(0.32, 0.397, 0.227);
const vec3 waterLight = vec3(0.836, 0.957, 0.95);


float waterMix(float x) {
    return 0.01 + 0.35 / (1.0 + 4.0 * abs(x - 1.0));
}


#ifdef DEBUG
void main() {
    vec3 slw = texture2D(SLWg, vUv).rgb;
    gl_FragColor = vec4(slw.r, slw.r, slw.r, 1.0);
}
#else
void main() {
    vec3 grain = texture2D(sand, vUv).rgb;
    vec3 slw = texture2D(SLWg, vUv).rgb;
    float h2 = slw.r * sqrt(slw.r);
    float sigmoid = -0.10 + 0.7 / (1. + exp(-25.0 * (0.5 * h2 + 0.65 * slw.g)));
    vec3 litSandCol = mix(grain, sandLight, sigmoid);


    sigmoid = 0.6 / (1. + exp(-15.0 * (slw.r - abs(slw.g))));
    vec3 tallSandCol = mix(litSandCol, sandTall, sigmoid);

    sigmoid = -0.05 + 0.7 / (1. + exp(23.0 * (slw.g - 0.1 * h2)));
    vec3 darkSandCol = mix(tallSandCol, sandDark, sigmoid);

    float waterMix = waterMix(slw.b);
    vec3 wateryCol = mix(darkSandCol, waterLight, waterMix);

    gl_FragColor = vec4(wateryCol, 1.0);
}
#endif