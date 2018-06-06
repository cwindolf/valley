uniform highp sampler2D UVgg;
#define PHONG
varying vec3 vViewPosition;
varying float fogDepth;
#ifndef FLAT_SHADED
    varying vec3 vNormal;
#endif
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
// varying vec3 vColor;
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
    vec2 cellSize = vec2(1.0 / WIDTH, 1.0 / WIDTH);
    #include <uv_vertex>
    #include <uv2_vertex>
    // #include <color_vertex>
    float u = texture2D(UVgg, uv).r;
    float v = texture2D(UVgg, uv).g;
    float eu = exp(1.5 * (0.5 + u));
    float ev = exp(5.0 * v);
    vColor.xyz = vec3(
        ev / (ev + 1.0),
        0.5 * eu * ev / (0.5 * eu * ev + 1.0),
        eu / (eu + 1.0));
    // # include <beginnormal_vertex>
    // Compute normal from UVgg
    vec3 objectNormal = vec3(
        ( texture2D(UVgg, uv + vec2(-cellSize.x, 0)).x
        - texture2D(UVgg, uv + vec2( cellSize.x, 0)).x) * WIDTH / BOUNDS,
        ( texture2D(UVgg, uv + vec2(0, -cellSize.y)).x
        - texture2D(UVgg, uv + vec2(0,  cellSize.y)).x) * WIDTH / BOUNDS,
        1.0);
    //<beginnormal_vertex>
    #include <morphnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <defaultnormal_vertex>
#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED
    vNormal = normalize(transformedNormal);
#endif
    //# include <begin_vertex>
    float heightValue = texture2D(UVgg, uv).y;
    vec3 transformed = vec3(position.x, position.y, HEIGHT * heightValue);
    //<begin_vertex>
    #include <morphtarget_vertex>
    #include <skinning_vertex>
    #include <displacementmap_vertex>
    #include <project_vertex>
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
    vViewPosition = -mvPosition.xyz;
    #include <worldpos_vertex>
    #include <envmap_vertex>
    #include <shadowmap_vertex>
}
