import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import type { Camera } from "three";
import * as THREE from "three";

export default class DebugGUI {
  private gui: GUI;
  private camera: Camera;
  private scene: THREE.Scene;

  constructor(camera: Camera, scene: THREE.Scene) {
    this.camera = camera;
    this.scene = scene;
    this.gui = new GUI();
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);
  }

  setup() {
    const cameraFolder = this.gui.addFolder("Camera");
    cameraFolder.add(this.camera.position, "x", -100, 100).name("Position X");
    cameraFolder.add(this.camera.position, "y", -100, 100).name("Position Y");
    cameraFolder.add(this.camera.position, "z", -100, 100).name("Position Z");
    //cameraFolder.add(this.camera.lookAt, "x", -100, 100).name("LookAt X");
    cameraFolder.open();
  }
}
