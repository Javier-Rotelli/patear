import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";

export default class Model {
  url: string;
  gltf?: GLTF;

  constructor(url: string) {
    this.url = url;
  }

  init(scene: THREE.Scene) {
    if (!this.gltf) {
      console.error("GLTF model not loaded yet:", this.url);
      return;
    }

    const modelScene = this.gltf.scene;
    scene.add(modelScene);
  }

  update(deltaTime: number) {}
}
