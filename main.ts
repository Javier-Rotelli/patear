import * as THREE from "three";
import { loadGLTF } from "./src/GLTFUtils";
import Model, { AnimatedModelInstance } from "./src/model";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import DebugGUI from "./src/DebugGUI";
import InputManager from "./src/InputManager";
import Player from "./src/Player";

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

const modelUrls = {
  jugadorF: "models/players/character-male-b.glb",
  cancha: "models/cancha/cancha.glb",
};
const models: { [name: string]: Model } = {};

loadContent(loadingManager, modelUrls);

loadingManager.onLoad = init;

const progressbarElem = document.querySelector<HTMLDivElement>("#progressbar");
loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  console.log(
    `Loading file: ${url}. Loaded ${itemsLoaded} of ${itemsTotal} files.`,
  );
  progressbarElem!.style.width = `${((itemsLoaded / itemsTotal) * 100) | 0}%`;
};

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
    80,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );

  camera.position.z = 5;
  camera.position.y = 3;

  if (debug) {
    const debugGUI = new DebugGUI(camera, scene);
    debugGUI.setup();
  }
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const player = new Player(
    inputManager,
    new AnimatedModelInstance(scene, models["jugadorF"], "walk"),
    5,
  );
  const cancha = models["cancha"];
  cancha.gltf.scene.rotateY(Math.PI);
  cancha.gltf.scene.position.set(0, -1, 0);
  cancha.gltf.scene.scale.set(0.5, 0.5, 0.5);

  scene.add(cancha.gltf.scene);

  const color = 0xffffff;
  const intensity = 3;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const geometry = new THREE.PlaneGeometry(70, 50);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -1, 0);
  const material = new THREE.MeshPhongMaterial({
    color: "#35c112",
    side: THREE.FrontSide,
  });
  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);

  // loop
  function update(delta: number) {
    player.update(delta);
    inputManager.update();
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
