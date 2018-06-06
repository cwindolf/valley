/* ****************************************************************************
 * Loverly globals. */

const print = console.log;
var container;
var camera, controls, mainScene, renderer;
var terrainMat, terrain;
var UVgg0, UVgg, rxnCompute;
const rxnD = 64, rxnDOn2 = rxnD / 2;
const worldD = 256, worldDon2 = worldD / 2;
const HEIGHT = 20.0;
const GLOB_RATE = 1.0;
const clock = new THREE.Clock();
var frame = 0;
var t0;
const rxn_frames = 1;
const fs = [
    0.0141,
    0.014,
    0.022,
    0.019,
    0.026,
    0.022,
    0.026,
    0.038,
    0.042,
    0.058,
    0.062,
    0.0638,
    0.058,
    0.038,
];
const ks = [
    0.0525,
    0.05,
    0.051,
    0.0548,
    0.054,
    0.051,
    0.0565,
    0.061,
    0.059,
    0.062,
    0.061,
    0.061,
    0.062,
    0.061,
];
const num_phases = fs.length;
const phase_freq = 1 / num_phases;
const PERIOD = 150000 * rxn_frames;

/* ****************************************************************************
 * Lib */

function fk(t) {
    t = (t % PERIOD) / PERIOD;
    let t_ = phase_freq;
    for (let i = 0; i < num_phases; i++) {
        if (t_ > t)  {
            return [
                fs[i], 
                ks[i]
            ];
        }
        t_ += phase_freq;
    }
}
const fk0 = fk(0);


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
    UVgg0 = rxnCompute.createTexture();
    initialConditions(UVgg0);
    UVgg = rxnCompute.addVariable(
        'UVgg',
        document.getElementById('rfs').textContent,
        UVgg0);
    rxnCompute.setVariableDependencies(UVgg, [UVgg]);
    UVgg.material.uniforms.D_u = { type: 'f', value: 1.0 };
    UVgg.material.uniforms.D_v = { type: 'f', value: 0.5 };
    UVgg.material.uniforms.f   = { type: 'f', value: fk0[0] };
    UVgg.material.uniforms.k   = { type: 'f', value: fk0[1] };
    UVgg.material.uniforms.dt  = { type: 'f', value: 0 };
    UVgg.material.defines.GLOB_RATE = GLOB_RATE.toFixed(1);
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
    mainScene.fog = new THREE.FogExp2(0xff00000, 0.0025);

    var terrainGeom = new THREE.PlaneBufferGeometry(worldD, worldD, rxnD - 1, rxnD - 1);
    terrainMat = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([THREE.ShaderLib.phong.uniforms, {
            UVgg: { type: 't', value: UVgg0 },
            emissive : { type: 'c', value: new THREE.Color(0x9f9f9f) },
            specular : { type: 'c', value: new THREE.Color(0xdadada) },
            // color: new THREE.Color(0x1111dd),
            lights: true,
            // ambient: new THREE.Color(0x1111dd),
        }]),
        vertexShader: document.getElementById('tvs').textContent,
        fragmentShader: document.getElementById('tfs').textContent,
        lights: true,
        fog: true,
        side: THREE.DoubleSide,
    });
    terrainMat.defines.WIDTH  = rxnD.toFixed(1);
    terrainMat.defines.BOUNDS = worldD.toFixed(1);
    terrainMat.defines.HEIGHT = HEIGHT.toFixed(1);
    terrainMat.defines.USE_COLOR = "";
    terrain = new THREE.Mesh(terrainGeom, terrainMat);
    terrain.castShadow = terrain.receiveShadow = true;
    mainScene.add(terrain);    

    var ptLight = new THREE.DirectionalLight(0xffffff, 0.5);
    ptLight.castShadow = true;
    ptLight.target = terrain;
    ptLight.position = new THREE.Vector3(2.0, 0.0, 1.0);
    mainScene.add(ptLight);

    var amLight = new THREE.AmbientLight(0x404040);
    mainScene.add(amLight);

    controls = new THREE.FlyControls(camera);
    controls.movementSpeed = 10;
    controls.domElement = renderer.domElement;
    controls.rollSpeed = Math.PI / 24;
    controls.autoForward = false;
    controls.dragToLook = false;
    controls.object.position.set(0.0, 0.0, 10.0 * HEIGHT + 2.0);

    window.addEventListener('resize', onWindowResize, false);
}


function react(dt) {
    let fk_ = fk(frame);
    UVgg.material.uniforms.f  = { type: 'f', value: fk_[0] };
    UVgg.material.uniforms.k  = { type: 'f', value: fk_[1] };
    UVgg.material.uniforms.dt = { type: 'f', value: dt     };
    rxnCompute.compute();
    terrainMat.uniforms.UVgg.value = rxnCompute.getCurrentRenderTarget(UVgg).texture;
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
