varying vec3 vNormal;
varying vec3 vViewPosition;
uniform highp sampler2D UVgg;

void main() {
    vec3 p = position;
    vec2 uv = texture2D(UVgg, p.xy).rg;
    vec4 modelViewPosition = modelViewMatrix * vec4(p.x, p.y, p.z, 1.0);
    // vViewPosition = -modelViewPosition.xyz;
    gl_Position = projectionMatrix * modelViewPosition;
    vNormal = normalMatrix * normal;
}