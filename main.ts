import * as THREE from "three";
import { loadGLTF } from "./src/models/GLTFUtils";
import Model, { AnimatedModelInstance } from "./src/models/model";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import DebugGUI from "./src/DebugGUI";
import InputManager from "./src/InputManager";
import Player from "./src/Player";
import { createGrass } from "./src/grass";
import NetworkManager from "./src/network";
import getModelUrls from "./src/models/getModelUrls";

function loadContent(
  manager: THREE.LoadingManager,
  modelUrls: { [key: string]: string },
) {
  const gltfLoader = new GLTFLoader(manager);
  Object.keys(modelUrls).forEach((name) => {
    const url = modelUrls[name];
    loadGLTF(gltfLoader, url, (gltf) => {
      const model = new Model(gltf);
      models[name] = model;
    });
  });
}
const debug = true;
const loadingManager = new THREE.LoadingManager();

const modelUrls = getModelUrls();

const models: { [name: string]: Model } = {};
const textures: { [name: string]: THREE.Texture } = {};

loadContent(loadingManager, modelUrls);

textures["cancha"] = new THREE.TextureLoader(loadingManager).load(
  "models/cancha/cancha.png",
);

textures["cancha-rotada"] = new THREE.TextureLoader(loadingManager).load(
  "models/cancha/cancha-rotada.png",
);

loadingManager.onLoad = init;

const progressbarElem = document.querySelector<HTMLDivElement>("#progressbar");
loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  console.log(
    `Loading file: ${url}. Loaded ${itemsLoaded} of ${itemsTotal} files.`,
  );
  progressbarElem!.style.width = `${((itemsLoaded / itemsTotal) * 100) | 0}%`;
};

const networkManager = new NetworkManager("tigre");
const inputManager = new InputManager();

function init() {
  const loadingElem = document.querySelector<HTMLDivElement>("#loading");
  loadingElem!.style.display = "none";

  // Scene setup
  const scene = new THREE.Scene();
  const skyBlue = 0x87ceeb;
  scene.background = new THREE.Color(skyBlue);
  //scene.fog = new THREE.FogExp2(skyBlue, 0.02);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );

  camera.position.z = 5;
  camera.position.y = 3;
  const worldLimits = new THREE.Vector3(31, 0, 20);

  let debugGUI: DebugGUI | undefined;
  if (debug) {
    debugGUI = new DebugGUI(camera, scene, worldLimits);
  }
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const player = new Player(
    inputManager,
    new AnimatedModelInstance(scene, models["jugadorMf"], "idle"),
    5,
    worldLimits,
  );

  const cancha = models["cancha"];
  cancha.gltf.scene.rotateY(Math.PI);
  scene.add(cancha.gltf.scene);

  addLight(scene);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  createGrass(scene, textures);

  // loop
  function update(delta: number) {
    inputManager.update();
    player.update(delta);
  }

  let then = 0;

  function render(time: number) {
    const now = time * 0.001;
    const delta = Math.min(now - then, 1 / 20);
    then = now;
    update(delta);

    const playerPos = new THREE.Vector3().setFromMatrixPosition(
      player.modelInstance.root.matrix,
    );
    camera.lookAt(playerPos);
    camera.position.x = playerPos.x;
    camera.position.z = playerPos.z + 5;

    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(render);
}

function addLight(scene: THREE.Scene) {
  const color = 0xffffff;
  const intensity = 3;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
}
