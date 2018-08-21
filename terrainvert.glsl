uniform sampler2D Sggg;
varying float s;

void main() {
    vec3 p = position;
    s = texture2D(Sggg, uv.xy).r;
    vec4 modelViewPosition = modelViewMatrix * vec4(p.x, p.y, p.z, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;
}