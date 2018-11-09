/* ****************************************************************************
 * Loverly globals. */

const print = console.log;
var container;
var camera, mainScene, renderer;
var terrainMat, terrain;
var SLWg0, SLWg, rxnCompute;
const rxnD = 128;
const worldD = 128;
const GLOB_RATE = 0.005;
const BASE_NOISE_FREQ = 8000.;
const clock = new THREE.Clock();
let mousedown = false;

/* ****************************************************************************
 * Sand color data */

const sands = [
        [199, 153, 121],
        [188, 103, 78],
        [142, 101, 50],
        [142, 101, 50],
        [142, 101, 50],
        [142, 101, 50],
        [142, 101, 50],
        [142, 101, 50],
        [142, 101, 50],
        [110, 73, 46],
        [110, 73, 46],
        [110, 73, 46],
        [110, 73, 46],
        [110, 73, 46],
        [110, 73, 46],
        [110, 73, 46],
        [110, 73, 46],
        [110, 73, 46],
        [143, 89, 71],
        [143, 89, 71],
        [143, 89, 71],
        [143, 89, 71],
        [143, 89, 71],
        [143, 89, 71],
        [143, 89, 71],
        [143, 89, 71],
        [143, 89, 71],
        [143, 89, 71],
        [126, 115, 67],
        [72, 38, 31],
        [72, 38, 31],
        [72, 38, 31],
        [105, 66, 21],
        [105, 85, 84],
    ];

/* ****************************************************************************
 * Lib */


function onWindowResize() {
    var screen = 2 * Math.tan(camera.fov * Math.PI / 360) * Math.max(container.clientWidth, container.clientHeight) / container.clientHeight;
    camera.position.z = worldD / screen;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function initialConditions(tex) {
    let ic = tex.image.data;
    let idx = 0;
    for (let j = 0; j < rxnD; j++) {
        for (let i = 0; i < rxnD; i++) {
            ic[idx + 0] = 0.4 + 0.1 * (Math.random() + Math.random());
            ic[idx + 1] = 0.0;
            ic[idx + 2] = 0.0;
            ic[idx + 3] = 1.0;
            idx += 4;
        }
    }
}

function initRxn() {
    rxnCompute = new GPUComputationRenderer(rxnD, rxnD, renderer);
    SLWg0 = rxnCompute.createTexture();
    initialConditions(SLWg0);
    SLWg = rxnCompute.addVariable(
        'SLWg',
        document.getElementById('rfs').textContent,
        SLWg0);
    rxnCompute.setVariableDependencies(SLWg, [SLWg]);
    SLWg.material.uniforms.alpha = { type: 'f', value: 1.0 };
    SLWg.material.uniforms.beta = { type: 'f', value: 0.1 };
    SLWg.material.uniforms.f = { type: 'f', value: -0.5 };
    SLWg.material.uniforms.time = { type: 'f', value: 0.0 };
    SLWg.material.uniforms.ij = { type: 'v2', value: new THREE.Vector2(-1, -1) };
    SLWg.material.defines.GLOB_RATE = GLOB_RATE.toFixed(5);
    let err = rxnCompute.init();
    if (err !== null) {
        console.error(err);
    }
}


function sandTex() {
    let theSand = new Uint8Array(rxnD * rxnD * 3);
    for (let i = 0; i < rxnD * rxnD * 3; i += 3) {
        let j = Math.floor(Math.random() * sands.length);
        theSand[i + 0] = sands[j][0];
        theSand[i + 1] = sands[j][1];
        theSand[i + 2] = sands[j][2];
    }
    return new THREE.DataTexture(theSand, rxnD, rxnD, THREE.RGBFormat,
        THREE.UnsignedByteType, THREE.UVMapping, THREE.RepeatWrapping,
        THREE.RepeatWrapping, THREE.NearestFilter, THREE.NearestFilter);
}


function init() {
    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(45,
        container.clientWidth / container.clientHeight,
        0.01, 1000.);

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    initRxn();

    mainScene = new THREE.Scene();
    mainScene.background = new THREE.Color(0x0);

    var terrainGeom = new THREE.PlaneBufferGeometry(worldD, worldD, rxnD - 1, rxnD - 1);
    var tex = sandTex();
    tex.needsUpdate = true;
    terrainMat = new THREE.ShaderMaterial({
        uniforms: {
            SLWg: { type: 't', value: SLWg0, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping },
            sand: { type: 't', value: tex },
        },
        vertexShader: document.getElementById('tvs').textContent,
        fragmentShader: document.getElementById('tfs').textContent,
        flatShading: true,
        side: THREE.DoubleSide,
    });
    terrainMat.uniforms.SLWg.wrapS = terrainMat.uniforms.SLWg.wrapT = THREE.RepeatWrapping;
    terrainMat.uniforms.SLWg.offset = new THREE.Vector2();
    terrainMat.defines.WIDTH  = rxnD.toFixed(1);
    terrainMat.defines.BOUNDS = worldD.toFixed(1);
    terrainMat.uniforms.time = { type: 'f', value: 0.0 };
    terrainMat.uniforms.SLWg.minFilter = THREE.NearestFilter;
    terrainMat.uniforms.SLWg.magFilter = THREE.NearestFilter;
    terrainMat.uniforms.SLWg.needsUpdate = true;
    terrain = new THREE.Mesh(terrainGeom, terrainMat);
    mainScene.add(terrain);

    window.addEventListener('resize', onWindowResize, false);
}


function react() {
    SLWg.material.uniforms.time = { type: 'f', value: clock.getElapsedTime() };
    rxnCompute.compute();
    terrainMat.uniforms.SLWg.value = rxnCompute.getCurrentRenderTarget(SLWg).texture;
}

function animate() {
    react();
    render();
    requestAnimationFrame(animate);
}


function render() {
    renderer.render(mainScene, camera);
}


/* ****************************************************************************
 * Main. */

if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
    document.getElementById('container').innerHTML = "Your Computer is Buns i mean Im sorry...";
} else {
    window.addEventListener('keyup', function(e) { if(e.keyCode == 27) {debugger;} }, false);
    init();
    for (z = 0; z < 10000; z++) { react(Math.PI); }
    onWindowResize();
    requestAnimationFrame(animate);
}
