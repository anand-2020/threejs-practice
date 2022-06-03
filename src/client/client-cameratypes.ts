import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const canvas1 = document.createElement("canvas");
canvas1.id = "c1";
canvas1.classList.add("c");
document.body.appendChild(canvas1);

const canvas2 = document.createElement("canvas");
canvas1.id = "c2";
canvas1.classList.add("c");
document.body.appendChild(canvas2);

const canvas3 = document.createElement("canvas");
canvas1.id = "c3";
canvas1.classList.add("c");
document.body.appendChild(canvas3);

const canvas4 = document.createElement("canvas");
canvas1.id = "c4";
canvas1.classList.add("c");
document.body.appendChild(canvas4);

const scene = new THREE.Scene();
// scene.background = new THREE.Color("blue");

const camera1 = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
const camera2 = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
const camera3 = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
const camera4 = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);

camera1.position.z = 2; // perspective
camera2.position.y = 1; // orthographic top
camera2.lookAt(new THREE.Vector3(0, 0, 0)); // here (0,0,0) is position of cube object
camera3.position.z = 1; // orthographic right
camera4.position.x = 1; // orthographic front
camera4.lookAt(new THREE.Vector3(0, 0, 0));

// const canvas1 = document.getElementById("c1") as HTMLCanvasElement;
// const canvas2 = document.getElementById("c2") as HTMLCanvasElement;
// const canvas3 = document.getElementById("c3") as HTMLCanvasElement;
// const canvas4 = document.getElementById("c4") as HTMLCanvasElement;

// WebGL is default renderer
const renderer1 = new THREE.WebGLRenderer({ canvas: canvas1 });
renderer1.setSize(300, 300);
const renderer2 = new THREE.WebGLRenderer({ canvas: canvas2 });
renderer2.setSize(300, 300);
const renderer3 = new THREE.WebGLRenderer({ canvas: canvas3 });
renderer3.setSize(300, 300);
const renderer4 = new THREE.WebGLRenderer({ canvas: canvas4 });
renderer4.setSize(300, 300);

//dynamically adding child to html objects
//document.body.appendChild(renderer.domElement)

// for auto controlling using mouse
const controls = new OrbitControls(camera1, renderer1.domElement);
controls.addEventListener("change", render); //this line is unnecessary if you are re-rendering within the animation loop

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: true,
});

const cube = new THREE.Mesh(geometry, material);
//console.log(cube.position); // default is (0,0,0)
// cube.position.x = 0.5;
scene.add(cube);

// one object can be added to only one scene.

function animate() {
  requestAnimationFrame(animate);

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  render();
}

function render() {
  renderer1.render(scene, camera1);
  renderer2.render(scene, camera2);
  renderer3.render(scene, camera3);
  renderer4.render(scene, camera4);
}

animate();
// render();
