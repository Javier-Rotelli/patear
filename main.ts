import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

function loadGLTF(url: string): Promise<GLTF> {
  console.log("Loading: ", url);

  return new Promise((resolve, reject) => {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      url,
      (model) => {
        model.scene.traverse((child) => {
          child.castShadow = true;
          child.receiveShadow = true;
        });
        resolve(model);
      },
      undefined,
      (e) => {
        reject(e);
      },
    );
  });
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

loadGLTF("models/players/character-male-f.glb")
  .then((model) => {
    scene.add(model.scene);
  })
  .catch((error) => {
    console.error("Error loading GLTF model:", error);
  });

const skyBlue = 0x87ceeb;
scene.background = new THREE.Color(skyBlue);
scene.fog = new THREE.FogExp2(skyBlue, 0.02);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

camera.position.z = 5;

function animate() {
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
