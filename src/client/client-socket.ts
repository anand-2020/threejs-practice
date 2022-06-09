import { CharacterControls } from "./characterControls";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { GUI } from "dat.gui";
const { io } = require("socket.io-client");
const socket = io("http://localhost:3000");
console.log(socket);

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
const allModels: Map<string, CharacterControls> = new Map();
let currModel: CharacterControls;

new FBXLoader().load("models/woman-atpos.fbx", function (object) {
  object.scale.set(0.02, 0.02, 0.02);
  scene.add(object);

  const fbxAnimations: THREE.AnimationClip[] = (object as THREE.Object3D)
    .animations;
  const mixer = new THREE.AnimationMixer(object);
  const animationsMap: Map<string, THREE.AnimationAction> = new Map();
  // console.log(fbxAnimations);
  fbxAnimations
    .filter((a) => a.name != "TPose")
    .forEach((a: THREE.AnimationClip) => {
      animationsMap.set(a.name, mixer.clipAction(a));
    });

  currModel = new CharacterControls(
    object,
    mixer,
    animationsMap,
    orbitControls,
    camera,
    "Idle",
    true
  );
  socket.emit(
    "newAvatar",
    "woman-atpos.fbx",
    currModel.model.position,
    currModel.model.quaternion
  );
  // socket.emit("currLoc", currModel.model.position, currModel.model.quaternion);
});

const addNewAvatar = (
  sockId: string,
  modelName: string,
  position: THREE.Vector3,
  rotation: THREE.Quaternion
) => {
  new FBXLoader().load(`models/${modelName}`, function (object) {
    object.scale.set(0.02, 0.02, 0.02);
    scene.add(object);

    const fbxAnimations: THREE.AnimationClip[] = (object as THREE.Object3D)
      .animations;
    const mixer = new THREE.AnimationMixer(object);
    const animationsMap: Map<string, THREE.AnimationAction> = new Map();
    // console.log(fbxAnimations);
    fbxAnimations
      .filter((a) => a.name != "TPose")
      .forEach((a: THREE.AnimationClip) => {
        animationsMap.set(a.name, mixer.clipAction(a));
      });

    allModels.set(
      sockId,
      new CharacterControls(
        object,
        mixer,
        animationsMap,
        orbitControls,
        camera,
        "Idle",
        false
      )
    );

    object.position.set(position.x, position.y, position.z);
    object.applyQuaternion(rotation);
  });
};

socket.on(
  "newAvatar",
  (
    sockId: string,
    modelName: string,
    position: THREE.Vector3,
    rotation: THREE.Quaternion
  ) => {
    addNewAvatar(sockId, modelName, position, rotation);
  }
);

socket.on(
  "updateAvatar",
  (sockId: string, mixerUpdateDelta: number, keysPressed: any) => {
    allModels.get(sockId)?.update(mixerUpdateDelta, keysPressed);
  }
);

socket.on("currState", (models: any) => {
  console.log(models);
  models.forEach((model: any) => {
    addNewAvatar(model.sockId, model.modelName, model.position, model.rotation);
  });
});

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
    socket.emit(
      "currLoc",
      currModel.model.position,
      currModel.model.quaternion
    );
  },
  false
);

const clock = new THREE.Clock();
// ANIMATE
function animate() {
  let mixerUpdateDelta = clock.getDelta();
  if (currModel) {
    currModel.update(mixerUpdateDelta, keysPressed);
    socket.emit("updateAvatar", mixerUpdateDelta, keysPressed);
  }
  orbitControls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
  //console.log(currModel);
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
