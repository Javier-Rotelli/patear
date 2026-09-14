import * as THREE from "three";
import type { IInputManager } from "./Input/IInputManager";
import { AnimatedModelInstance } from "./models/model";
import { InputKey } from "./Input/IInputManager";

const getAngleFromVector = (vector: THREE.Vector3) => {
  const angle = Math.acos(vector.dot(new THREE.Vector3(0, 0, 1)));
  if (vector.x < 0) {
    return -angle;
  }
  return angle;
};

export type PlayerMap = {
  local: Player;
  [id: string]: Player;
};
type Player = {
  id: string;
  modelInstance: AnimatedModelInstance;
  inputManager: IInputManager;
  playerState: PlayerState;
};
type PlayerState = {
  position: THREE.Vector3;
};

export default class PlayerManager {
  playersMap: PlayerMap;
  public speed: number = 0.005;

  constructor(
    public worldLimits: THREE.Vector3,
    inputManager: IInputManager,
    modelInstance: AnimatedModelInstance,
  ) {
    modelInstance.root.matrixAutoUpdate = false;
    this.playersMap = {
      local: {
        id: "local",
        inputManager,
        modelInstance,
        playerState: {
          position: new THREE.Vector3(),
        },
      },
    };
  }

  addPlayer(
    id: string,
    inputManager: IInputManager,
    modelInstance: AnimatedModelInstance,
  ) {
    modelInstance.root.matrixAutoUpdate = false;
    this.playersMap[id] = {
      id: id,
      inputManager,
      modelInstance,
      playerState: {
        position: new THREE.Vector3(),
      },
    };
  }

  removePlayer(id: string) {
    this.playersMap[id].modelInstance.remove();
    delete this.playersMap[id];
  }

  update(delta: number) {
    Object.values(this.playersMap).forEach((player) => {
      this.updatePlayer(player, delta);
    });
  }

  private updatePlayer(player: Player, delta: number) {
    let world = new THREE.Matrix4().identity();

    const moveVector = new THREE.Vector3();

    if (player.inputManager.keys[InputKey.Left]?.down) {
      moveVector.x -= 1;
    }
    if (player.inputManager.keys[InputKey.Right]?.down) {
      moveVector.x += 1;
    }
    if (player.inputManager.keys[InputKey.Up]?.down) {
      moveVector.z -= 1;
    }
    if (player.inputManager.keys[InputKey.Down]?.down) {
      moveVector.z += 1;
    }

    if (moveVector.length() > 0) {
      moveVector.normalize();

      const angle = getAngleFromVector(moveVector);

      const rotation = new THREE.Matrix4().makeRotationY(angle);

      world.multiply(rotation);

      player.playerState.position.add(
        moveVector.multiplyScalar(this.speed * delta),
      );

      player.playerState.position.clamp(
        this.worldLimits.clone().multiplyScalar(-1),
        this.worldLimits,
      );

      player.modelInstance.play("sprint");
    } else {
      player.modelInstance.play("idle");
    }
    const translation = new THREE.Matrix4().makeTranslation(
      player.playerState.position,
    );
    world = translation.multiply(world);

    player.modelInstance.root.matrix = world;
    player.modelInstance.update(delta);
  }
}
