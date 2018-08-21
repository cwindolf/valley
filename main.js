/* ****************************************************************************
 * Loverly globals. */

const print = console.log;
var container;
var camera, mainScene, renderer;
var terrainMat, terrain;
var Sggg0, Sggg, rxnCompute;
const rxnD = 512;
const worldD = 512;
const GLOB_RATE = 1.0;
const BASE_NOISE_FREQ = 10000.;
const clock = new THREE.Clock();
// var frame = 0;
var t0;
// const rxn_frames = 1;

/* ****************************************************************************
 * Lib */


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function initialConditions(tex) {
    let ic = tex.image.data;
    noise.seed(Math.random());
    let idx = 0;
    for (let i = 0; i < rxnD; i++) {
        for (let j = 0; j < rxnD; j++) {
            let n = 0, freq = 0, max = 0;
            for (let o = 0; o < 2; o++) {
                freq = Math.pow(2, o);
                max += (1 / freq);
                n += noise.simplex2(
                    i * freq * rxnD / BASE_NOISE_FREQ,
                    j * freq * rxnD / BASE_NOISE_FREQ) / freq;
            }
            n /= max;
            ic[idx + 0] = (n + 1.) / 2.;
            ic[idx + 1] = 0.0;
            ic[idx + 2] = 0.0;
            ic[idx + 3] = 1.0;
            idx += 4;
        }
    }
}

function initRxn() {
    rxnCompute = new GPUComputationRenderer(rxnD, rxnD, renderer);
    Sggg0 = rxnCompute.createTexture();
    initialConditions(Sggg0);
    Sggg = rxnCompute.addVariable(
        'Sggg',
        document.getElementById('rfs').textContent,
        Sggg0);
    rxnCompute.setVariableDependencies(Sggg, [Sggg]);
    Sggg.material.uniforms.alpha = { type: 'f', value: 1.0 };
    Sggg.material.uniforms.beta = { type: 'f', value: 0.7 };
    Sggg.material.uniforms.D_v = { type: 'f', value: 0.01 };
    Sggg.material.uniforms.dt = { type: 'f', value: 0.0 };
    Sggg.material.uniforms.f = { type: 'f', value: -0.5 };
    Sggg.material.defines.GLOB_RATE = GLOB_RATE.toFixed(1);
    let err = rxnCompute.init();
    if (err !== null) {
        console.error(err);
    }
}


function init() {
    container = document.getElementById('container');
    container.innerHTML = "";

    // camera = new THREE.OrthographicCamera(
    //     window.innerWidth / - 2, window.innerWidth / 2,
    //     window.innerHeight / 2, window.innerHeight / - 2,
    //     0.01, 1000. );
    camera = new THREE.PerspectiveCamera(45,
        window.innerWidth / window.innerHeight,
        0.01, 1000.);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    initRxn();

    mainScene = new THREE.Scene();
    mainScene.background = new THREE.Color(0xffff44);

    var terrainGeom = new THREE.PlaneBufferGeometry(worldD, worldD, rxnD - 1, rxnD - 1);
    terrainMat = new THREE.ShaderMaterial({
        uniforms: {
            Sggg: { type: 't', value: Sggg0 },
        },
        vertexShader: document.getElementById('tvs').textContent,
        fragmentShader: document.getElementById('tfs').textContent,
        side: THREE.DoubleSide,
    });
    terrainMat.defines.WIDTH  = rxnD.toFixed(1);
    terrainMat.defines.BOUNDS = worldD.toFixed(1);
    terrain = new THREE.Mesh(terrainGeom, terrainMat);
    mainScene.add(terrain);    

    camera.position.set(0.0, 0.0, 400.0);

    window.addEventListener('resize', onWindowResize, false);
}


function react(dt) {
    Sggg.material.uniforms.dt = { type: 'f', value: dt };
    rxnCompute.compute();
    terrainMat.uniforms.Sggg.value = rxnCompute.getCurrentRenderTarget(Sggg).texture;
}

function animate() {
    dt = clock.getDelta();
    requestAnimationFrame(animate);
    react(dt);
    render(dt);
}


function render() {
    renderer.render(mainScene, camera);
}


/* ****************************************************************************
 * Main. */

if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
    document.getElementById('container').innerHTML = "";
} else {
    window.addEventListener('keyup', function(e) { if(e.keyCode == 27) {debugger;} }, false);
    init();
    requestAnimationFrame(animate);
}
