import * as THREE from "three";
import { loadGLTF } from "./src/GLTFUtils";
import Model from "./src/model";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

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

function init() {
  const loadingElem = document.querySelector<HTMLDivElement>("#loading");
  loadingElem!.style.display = "none";
}
