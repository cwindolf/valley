/* ****************************************************************************
 * Loverly globals. */

var container;
var camera, controls, mainScene, renderer;
var terrainMat, terrain;
var UVgga, UVggb, rxnScene, rxnPlane, rxnMat, rxnObj, rxnCamera, rxnRenderer;
const rxnD = 64, rxnDOn2 = rxnD / 2;
const worldD = 1024, worldDon2 = worldD / 2;
const clock = new THREE.Clock();
var frame = 0;
const rxn_frames = 24;
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
const PERIOD = 150000;

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


function initRxnScene() {
    rxnScene = new THREE.Scene();
    rxnCamera = new THREE.OrthographicCamera(worldD / - 2, worldD / 2,
        worldD / 2, worldD / - 2, 1, 1000);
    UVgga = new THREE.WebGLRenderTarget(rxnD, rxnD, {
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.RepeatWrapping,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearMipMapLinearFilter,
        depthBuffer: false,
        stencilBuffer: false,
    });
    UVggb = new THREE.WebGLRenderTarget(rxnD, rxnD, {
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.RepeatWrapping,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearMipMapLinearFilter,
        depthBuffer: false,
        stencilBuffer: false,
    });
    rxnRenderer = new THREE.WebGLRenderer();
    rxnRenderer.setSize(rxnD, rxnD);
    rxnMat = new THREE.ShaderMaterial({
        uniforms: {
            UVgg: UVgga.texture,
            resolution: { type: 'v2', value: new THREE.Vector2(worldD, worldD)},
            D_u: { type: 'f', value: 1.0 },
            D_v: { type: 'f', value: 0.5 },
            f: { type: 'f', value: fk0[0] },
            k: { type: 'f', value: fk0[1] },
        },
        fragmentShader: document.getElementById('rfs').textContent,
    });
    rxnPlane = new THREE.PlaneBufferGeometry(worldD, worldD);
    rxnObj = new THREE.Mesh(rxnPlane, rxnMat);
    rxnScene.add(rxnObj);
}


function initMainScene() {
    container = document.getElementById('container');
    container.innerHTML = "";

    camera = new THREE.PerspectiveCamera(60,
        window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(new THREE.Vector3(0.0, 0.0, 1.0));

    controls = new THREE.FirstPersonControls(camera);
    controls.movementSpeed = 10;
    controls.lookSpeed = 0.05;

    mainScene = new THREE.Scene();
    mainScene.background = new THREE.Color(0xdddddd);
    mainScene.fog = new THREE.FogExp2(0xff00000, 0.0025);

    var terrainGeom = new THREE.PlaneBufferGeometry(worldD, worldD, rxnD - 1, rxnD - 1);
    var phongShader = THREE.ShaderLib.phong;
    terrainMat = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([phongShader.uniforms, {
            // UVgg: UVgga.texture,
            emissive : { type: 'c', value: new THREE.Color(0x1111dd) },
            specular : { type: 'c', value: new THREE.Color(0x1111dd) },
            color: new THREE.Color(0x1111dd),
            lights: true,
            ambient: new THREE.Color(0x1111dd),
        }]),
        // vertexShader: document.getElementById('tvs').textContent,
        vertexShader: phongShader.vertexShader,
        fragmentShader: phongShader.fragmentShader,
        lights: true,
        side: THREE.DoubleSide,
    });
    terrain = new THREE.Mesh(terrainGeom, terrainMat);
    mainScene.add(terrain);    

    var light = new THREE.PointLight(0xffffff, 1);
    light.position.set(0, 0, 5);
    mainScene.add(light);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
}


function react() {
    rxnRenderer.render(rxnScene, rxnCamera, UVggb);
    // Ping pong.
    let tmp = UVgga;
    UVgga = UVggb;
    UVggb = tmp;
    rxnMat.uniforms.UVgg.value = UVgga.texture;
    terrainMat.uniforms.UVgg.value = UVgga.texture;
}


function animate() {
    requestAnimationFrame(animate);
    render();
    frame++;
    if (!(frame % rxn_frames)) {
        // react();
        frame = 0;
    }
}


function render() {
    controls.update(clock.getDelta());
    renderer.render(mainScene, camera);
}


/* ****************************************************************************
 * Main. */

if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
    document.getElementById('container').innerHTML = "";
} else {
    initRxnScene();
    initMainScene();
    animate();
}
