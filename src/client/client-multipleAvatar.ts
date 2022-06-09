import { CharacterControls } from "./characterControls";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { GUI } from "dat.gui";

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// CAMERA
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.y = 5;
camera.position.z = 5;
camera.position.x = 0;

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

// CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 15;
orbitControls.enablePan = false;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
orbitControls.update();

const gui = new GUI();
const modelFolder = gui.addFolder("Select Model");
modelFolder.open();

// LIGHTS
light();

// FLOOR
generateFloor();

// MODEL WITH ANIMATIONS
const characterControls: CharacterControls[] = [];
let currModel: CharacterControls;

new FBXLoader().load("models/woman-atpos.fbx", function (object) {
  object.scale.set(0.02, 0.02, 0.02);
  scene.add(object);

  const fbxAnimations: THREE.AnimationClip[] = (object as THREE.Object3D)
    .animations;
  const mixer = new THREE.AnimationMixer(object);
  const animationsMap: Map<string, THREE.AnimationAction> = new Map();
  console.log(fbxAnimations);
  fbxAnimations
    .filter((a) => a.name != "TPose")
    .forEach((a: THREE.AnimationClip) => {
      animationsMap.set(a.name, mixer.clipAction(a));
    });

  characterControls.push(
    new CharacterControls(
      object,
      mixer,
      animationsMap,
      orbitControls,
      camera,
      "Idle"
    )
  );
  currModel = characterControls[0];
  modelFolder.add(models, "Model_01");
});

new FBXLoader().load("models/man-atpos.fbx", function (object) {
  object.scale.set(0.02, 0.02, 0.02);
  scene.add(object);

  const fbxAnimations: THREE.AnimationClip[] = (object as THREE.Object3D)
    .animations;
  const mixer = new THREE.AnimationMixer(object);
  const animationsMap: Map<string, THREE.AnimationAction> = new Map();
  console.log(fbxAnimations);
  fbxAnimations
    .filter((a) => a.name != "TPose")
    .forEach((a: THREE.AnimationClip) => {
      animationsMap.set(a.name, mixer.clipAction(a));
    });

  characterControls.push(
    new CharacterControls(
      object,
      mixer,
      animationsMap,
      orbitControls,
      camera,
      "Idle"
    )
  );
  modelFolder.add(models, "Model_02");
});

new FBXLoader().load("models/boy-atpos.fbx", function (object) {
  object.scale.set(0.02, 0.02, 0.02);
  scene.add(object);

  const fbxAnimations: THREE.AnimationClip[] = (object as THREE.Object3D)
    .animations;
  const mixer = new THREE.AnimationMixer(object);
  const animationsMap: Map<string, THREE.AnimationAction> = new Map();
  console.log(fbxAnimations);
  fbxAnimations
    .filter((a) => a.name != "TPose")
    .forEach((a: THREE.AnimationClip) => {
      animationsMap.set(a.name, mixer.clipAction(a));
    });

  characterControls.push(
    new CharacterControls(
      object,
      mixer,
      animationsMap,
      orbitControls,
      camera,
      "Idle"
    )
  );
  modelFolder.add(models, "Model_03");
});

const models = {
  Model_01: function () {
    currModel = characterControls[0];
  },
  Model_02: function () {
    currModel = characterControls[1];
  },
  Model_03: function () {
    currModel = characterControls[2];
  },
};

// CONTROL KEYS
const keysPressed = {};

document.addEventListener(
  "keydown",
  (event) => {
    (keysPressed as any)[event.key.toLowerCase()] = true;
  },
  false
);
document.addEventListener(
  "keyup",
  (event) => {
    (keysPressed as any)[event.key.toLowerCase()] = false;
  },
  false
);

const clock = new THREE.Clock();
// ANIMATE
function animate() {
  let mixerUpdateDelta = clock.getDelta();
  if (currModel) {
    currModel.update(mixerUpdateDelta, keysPressed);
  }
  orbitControls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
document.body.appendChild(renderer.domElement);
animate();

// RESIZE HANDLER
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize);

function generateFloor() {
  // TEXTURES
  const textureLoader = new THREE.TextureLoader();
  const sandBaseColor = textureLoader.load(
    "./textures/sand/Sand 002_COLOR.jpg"
  );
  const sandNormalMap = textureLoader.load("./textures/sand/Sand 002_NRM.jpg");
  const sandHeightMap = textureLoader.load("./textures/sand/Sand 002_DISP.jpg");
  const sandAmbientOcclusion = textureLoader.load(
    "./textures/sand/Sand 002_OCC.jpg"
  );

  const WIDTH = 80;
  const LENGTH = 80;

  const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 512, 512);
  const material = new THREE.MeshStandardMaterial({
    map: sandBaseColor,
    normalMap: sandNormalMap,
    displacementMap: sandHeightMap,
    displacementScale: 0.1,
    aoMap: sandAmbientOcclusion,
  });
  wrapAndRepeatTexture(material.map as THREE.Texture);
  wrapAndRepeatTexture(material.normalMap as THREE.Texture);
  wrapAndRepeatTexture(material.displacementMap as THREE.Texture);
  wrapAndRepeatTexture(material.aoMap as THREE.Texture);

  const floor = new THREE.Mesh(geometry, material);
  floor.receiveShadow = true;
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
}

function wrapAndRepeatTexture(map: THREE.Texture) {
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.x = map.repeat.y = 10;
}

function light() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(-60, 100, -10);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 50;
  dirLight.shadow.camera.bottom = -50;
  dirLight.shadow.camera.left = -50;
  dirLight.shadow.camera.right = 50;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  scene.add(dirLight);
}
