/* ****************************************************************************
 * Loverly globals. */

const print = console.log;
var container;
var camera, controls, mainScene, renderer;
var terrainMat, terrain;
var Sggg0, Sggg, rxnCompute;
const rxnD = 64, rxnDOn2 = rxnD / 2;
const worldD = 256, worldDon2 = worldD / 2;
const GLOB_RATE = 1.0;
const clock = new THREE.Clock();
var frame = 0;
var t0;
const rxn_frames = 1;
const phase_freq = 1 / num_phases;

/* ****************************************************************************
 * Lib */


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
}

function initialConditions(tex) {
    let ic = tex.image.data;
    noise.seed(Math.random());
    let idx = 0;
    for (let i = 0; i < rxnD; i++) {
        for (let j = 0; j < rxnD; j++) {
            let n = 0, freq = 0, max = 0;
            for (let o = 0; o < 21; o++) {
                freq = Math.pow(2, o);
                max += (1 / freq);
                n += noise.simplex2(
                    i * freq * rxnD / 8,
                    j * freq * rxnD / 8) / freq;
            }
            n /= max;
            ic[idx + 0] = 1.;
            if (n > 0.525) {
                ic[idx + 1] = (1.5 + n) / 4.;
            } else {
                ic[idx + 1] = 0;
            }
            ic[idx + 2] = 0;
            ic[idx + 3] = 1;
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
    Sggg.material.uniforms.beta = { type: 'f', value: 0.5 };
    Sggg.material.uniforms.dt = { type: 'f', value: 0.0 };
    Sggg.material.uniforms.f = { type: 'f', value: 0.1 };
    Sggg.material.defines.GLOB_RATE = GLOB_RATE.toFixed(1);
    let err = rxnCompute.init();
    if (err !== null) {
        console.error(err);
    }
}


function init() {
    container = document.getElementById('container');
    container.innerHTML = "";

    camera = new THREE.PerspectiveCamera(60,
        window.innerWidth / window.innerHeight, 1, 10000);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    initRxn();

    mainScene = new THREE.Scene();
    mainScene.background = new THREE.Color(0x333333);

    var terrainGeom = new THREE.PlaneBufferGeometry(worldD, worldD, rxnD - 1, rxnD - 1);
    terrainMat = new THREE.ShaderMaterial({
        uniforms: {
            Sggg: { type: 't', value: Sggg0 },
        },
        vertexShader: document.getElementById('tvs').textContent,
        fragmentShader: document.getElementById('tfs').textContent,
        lights: false,
        side: THREE.DoubleSide,
    });
    terrainMat.defines.WIDTH  = rxnD.toFixed(1);
    terrainMat.defines.BOUNDS = worldD.toFixed(1);
    terrainMat.defines.HEIGHT = HEIGHT.toFixed(1);
    terrainMat.defines.USE_COLOR = "";
    terrain = new THREE.Mesh(terrainGeom, terrainMat);
    terrain.castShadow = terrain.receiveShadow = true;
    mainScene.add(terrain);    

    var amLight = new THREE.AmbientLight(0x404040);
    mainScene.add(amLight);

    camera.position.set(0.0, 0.0, 10.0);

    window.addEventListener('resize', onWindowResize, false);
}


function react(dt) {
    Sggg.material.uniforms.dt = { type: 'f', value: dt     };
    rxnCompute.compute();
    terrainMat.uniforms.Sggg.value = rxnCompute.getCurrentRenderTarget(Sggg).texture;
}

function animate() {
    dt = clock.getDelta();
    requestAnimationFrame(animate);
    frame++;
    if (!(frame % rxn_frames)) {
        react(dt);
    }
    render(dt);
}


function render() {
    controls.update(dt);
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
