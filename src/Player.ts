import * as THREE from "three";
import InputManager from "./InputManager";
import { AnimatedModelInstance } from "./model";
import { InputKey } from "./InputManager";

const getAngleFromVector = (vector: THREE.Vector3) => {
  const angle = Math.acos(vector.dot(new THREE.Vector3(0, 0, 1)));
  if (vector.x < 0) {
    return -angle;
  }
  return angle;
};

export default class Player {
  public position: THREE.Vector3 = new THREE.Vector3();

  constructor(
    private inputManager: InputManager,
    public modelInstance: AnimatedModelInstance,
    public speed: number = 5,
  ) {
    this.modelInstance.root.matrixAutoUpdate = false;
  }

  update(delta: number) {
    let world = new THREE.Matrix4().identity();

    const moveVector = new THREE.Vector3();

    if (this.inputManager.keys[InputKey.Left]?.down) {
      moveVector.x -= 1;
    }
    if (this.inputManager.keys[InputKey.Right]?.down) {
      moveVector.x += 1;
    }
    if (this.inputManager.keys[InputKey.Up]?.down) {
      moveVector.z -= 1;
    }
    if (this.inputManager.keys[InputKey.Down]?.down) {
      moveVector.z += 1;
    }

    if (moveVector.length() > 0) {
      moveVector.normalize();

      const angle = getAngleFromVector(moveVector);

      console.log("angle", angle / Math.PI, moveVector);

      const rotation = new THREE.Matrix4().makeRotationY(angle);

      world.multiply(rotation);
      this.position.add(moveVector.multiplyScalar(this.speed * delta));

      this.modelInstance.play("walk");
    } else {
      this.modelInstance.play("idle");
    }
    const translation = new THREE.Matrix4().makeTranslation(this.position);
    world = translation.multiply(world);

    this.modelInstance.root.matrix = world;
    this.modelInstance.update(delta);
  }
}
