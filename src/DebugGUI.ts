import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import type { Camera } from "three";
import * as THREE from "three";

export default class DebugGUI {
  private gui: GUI;

  debugPlanes: { [key: string]: THREE.PlaneHelper } = {};
  private debugPlanesFolder: GUI;

  constructor(
    private camera: Camera,
    private scene: THREE.Scene,
    limits: { x: number; z: number },
  ) {
    this.gui = new GUI();
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);

    const cameraFolder = this.gui.addFolder("Camera");
    cameraFolder.add(this.camera.position, "x", -100, 100).name("Position X");
    cameraFolder.add(this.camera.position, "y", -100, 100).name("Position Y");
    cameraFolder.add(this.camera.position, "z", -100, 100).name("Position Z");

    this.debugPlanesFolder = this.gui.addFolder(`Debug Planes`);

    this.setupLimitPlanes(limits);
  }

  setupLimitPlanes(limits: { x: number; z: number }) {
    for (const axis of ["x", "z"]) {
      for (const direction of [1, -1]) {
        const planeName = `Limit ${axis.toUpperCase()}${direction > 0 ? "+" : "-"}`;
        const normal = new THREE.Vector3(
          axis === "x" ? direction : 0,
          0,
          axis === "z" ? direction : 0,
        );
        const constant = -limits[axis];
        const plane = new THREE.Plane(normal, constant);
        this.addDebugPlane(planeName, plane, {
          onChangeCallback: (value: number) => {
            console.log(`${planeName} constant changed to:`, value);
          },
          min: -100,
          max: 100,
        });
      }
    }
  }

  addDebugPlane(
    name: string,
    plane: THREE.Plane,
    options: {
      onChangeCallback?: (value: number) => void;
      min?: number;
      max?: number;
      size?: number;
    } = {},
  ) {
    const { onChangeCallback, min = -100, max = 100, size = 100 } = options;
    this.debugPlanesFolder
      .add(plane, "constant", min, max)
      .name(name)
      .onChange((value: number) => {
        if (onChangeCallback) {
          onChangeCallback(value);
        }
      });
    this.debugPlanes[name] = new THREE.PlaneHelper(plane, size, 0xffffff);
    this.scene.add(this.debugPlanes[name]);
  }

  // update() {
  //   // Update the GUI if needed
  // }
}
