import * as THREE from "three";
import { loadGLTF } from "./src/models/GLTFUtils";
import Model, { AnimatedModelInstance } from "./src/models/model";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import DebugGUI from "./src/DebugGUI";
import InputManager from "./src/Input/InputManager";
import { createGrass } from "./src/grass";
import NetworkManager from "./src/network";
import getModelUrls from "./src/models/getModelUrls";

import createDebug from "debug";
import PlayerManager from "./src/PlayerManager";
import { maxFPS, timestep } from "./src/constants";
const log = createDebug("main");

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
  log(`Loading file: ${url}. Loaded ${itemsLoaded} of ${itemsTotal} files.`);
  progressbarElem!.style.width = `${((itemsLoaded / itemsTotal) * 100) | 0}%`;
};

const inputManager = new InputManager();
const worldLimits = new THREE.Vector3(31, 0, 20);

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

  const playerManager = new PlayerManager(
    worldLimits,
    inputManager,
    new AnimatedModelInstance(scene, models["jugadorMf"], "idle"),
  );

  const networkManager = new NetworkManager(
    "tigre",
    playerManager,
    scene,
    models,
  );

  let debugGUI: DebugGUI | undefined;
  if (debug) {
    debugGUI = new DebugGUI(camera, scene, worldLimits);
  }
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const cancha = models["cancha"];
  cancha.gltf.scene.rotateY(Math.PI);
  scene.add(cancha.gltf.scene);

  addLight(scene);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  createGrass(scene, textures);

  // loop
  function update(delta: number, now: number) {
    let numUpdates = 0;
    while (delta >= timestep) {
      //log(`updating with delta: ${delta}`);
      updateLocal(timestep, now);
      delta -= timestep;
      if (++numUpdates > 100) {
        updateLocal(delta, now);
        log("Too many updates in one frame, dropping the rest");
        delta = 0;
        break;
      }
    }

    const simulationDelta = timestep * numUpdates;
    networkManager.update(simulationDelta);
    playerManager.updatePlayersMatrices(simulationDelta);

    log(`numUpdates: ${numUpdates}, delta: ${delta}`);
    return simulationDelta;
  }
  function updateLocal(delta: number, now: number) {
    inputManager.update();
    const move = playerManager.updateLocalPlayer(delta, now);
    networkManager.sendMovement(move);
  }

  let then = 0,
    delta = 0;
  function render(now: number) {
    delta += now - then;
    // Throttle the frame rate.
    if (delta < 1000 / maxFPS) {
      return;
    }
    log(`delta: ${delta}`);
    const simulatedDelta = update(delta, now);
    delta -= simulatedDelta;

    const playerPos = new THREE.Vector3().setFromMatrixPosition(
      playerManager.localPlayer.modelInstance.root.matrix,
    );

    camera.lookAt(playerPos);
    camera.position.lerp(
      playerPos.clone().add(new THREE.Vector3(0, 3, 5)),
      0.2,
    );
    // camera.position.x = playerPos.x;
    // camera.position.z = playerPos.z + 5;

    renderer.render(scene, camera);

    then = now;
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
