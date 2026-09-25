import * as THREE from "three";
import type { IInputManager } from "./Input/IInputManager";
import { AnimatedModelInstance } from "./models/model";
import { InputKey } from "./Input/IInputManager";
import InputManager from "./Input/InputManager";
import createDebug from "debug";
import { timestep } from "./constants";

const log = createDebug("PlayerManager");

const getAngleFromVector = (vector: THREE.Vector3) => {
  const angle = Math.acos(vector.dot(new THREE.Vector3(0, 0, 1)));
  if (vector.x < 0) {
    return -angle;
  }
  return angle;
};

export type PlayerMap = {
  [id: string]: NetworkPlayer;
};
type Player = {
  id: string;
  modelInstance: AnimatedModelInstance;
  playerState: PlayerState;
};

type NetworkPlayer = Player & {
  queuedMovements: Move[];
  ack: number;
};

type LocalPlayer = Player & {
  inputManager: InputManager;
  movements: Move[];
};
export type PlayerState = {
  position: THREE.Vector3;
  angle: number;
};

export type Move = {
  direction: THREE.Vector3;
  timestamp: number;
};

export default class PlayerManager {
  playersMap: PlayerMap = {};
  localPlayer: LocalPlayer;
  public speed: number = 0.005;

  constructor(
    public worldLimits: THREE.Vector3,
    inputManager: IInputManager,
    modelInstance: AnimatedModelInstance,
  ) {
    modelInstance.root.matrixAutoUpdate = false;
    this.localPlayer = {
      id: "local",
      inputManager,
      modelInstance,
      playerState: {
        position: new THREE.Vector3(),
        angle: 0,
      },
      movements: [],
    };
  }

  addNetworkPlayer(id: string, modelInstance: AnimatedModelInstance) {
    modelInstance.root.matrixAutoUpdate = false;
    this.playersMap[id] = {
      id: id,
      modelInstance,
      playerState: {
        position: new THREE.Vector3(),
        angle: 0,
      },
      queuedMovements: [],
      ack: 0,
    };
  }

  removePlayer(id: string) {
    this.playersMap[id].modelInstance.remove();
    delete this.playersMap[id];
  }

  updateLocalPlayer(delta: number, now: number): Move {
    const moveVector = new THREE.Vector3();

    if (this.localPlayer.inputManager.keys[InputKey.Left]?.down) {
      moveVector.x -= 1;
    }
    if (this.localPlayer.inputManager.keys[InputKey.Right]?.down) {
      moveVector.x += 1;
    }
    if (this.localPlayer.inputManager.keys[InputKey.Up]?.down) {
      moveVector.z -= 1;
    }
    if (this.localPlayer.inputManager.keys[InputKey.Down]?.down) {
      moveVector.z += 1;
    }
    moveVector.normalize();

    const move = {
      direction: moveVector,
      timestamp: now,
    };
    this.localPlayer.movements.push(move);

    while (this.localPlayer.movements.length > 30) {
      this.localPlayer.movements.shift();
    }

    this.updatePlayer(this.localPlayer, moveVector, delta);
    return move;
  }

  updateNetworkPlayers() {
    for (const player of Object.values(this.playersMap)) {
      while (player.queuedMovements.length > 0) {
        const move = player.queuedMovements.shift();
        if (move) {
          this.updatePlayer(player, move.direction, timestep);
          player.ack = move.timestamp;
        }
      }
    }
  }

  updatePlayerMatrix(player: Player, delta: number) {
    let world = new THREE.Matrix4().identity();
    const rotation = new THREE.Matrix4().makeRotationY(
      player.playerState.angle,
    );

    world.multiply(rotation);

    const translation = new THREE.Matrix4().makeTranslation(
      player.playerState.position,
    );
    world = translation.multiply(world);

    player.modelInstance.root.matrix = world;
    player.modelInstance.update(delta);
  }
  updatePlayersMatrices(delta: number) {
    this.updatePlayerMatrix(this.localPlayer, delta);
    for (const player of Object.values(this.playersMap)) {
      this.updatePlayerMatrix(player, delta);
    }
  }

  updatePlayer(player: Player, moveVector: THREE.Vector3, delta: number) {
    if (moveVector.length() > 0) {
      player.playerState.angle = getAngleFromVector(moveVector);

      player.playerState.position.add(
        moveVector.clone().multiplyScalar(this.speed * delta),
      );

      player.playerState.position.clamp(
        this.worldLimits.clone().multiplyScalar(-1),
        this.worldLimits,
      );

      player.modelInstance.play("sprint");
    } else {
      player.modelInstance.play("idle");
    }
  }

  queueNetworkPlayerMovement(id: string, move: Move) {
    const player = this.playersMap[id];
    if (!player) {
      log(`Player with id ${id} not found`);
      return;
    }
    player.queuedMovements.push(move);
  }

  reconcileLocalPlayerState({
    position,
    ack,
  }: {
    position: THREE.Vector3Tuple;
    ack: number;
  }) {
    this.localPlayer.playerState.position.fromArray(position);
    // borro todo lo que ya proceso el servidor
    this.localPlayer.movements = this.localPlayer.movements.filter(
      (savedMove) => savedMove.timestamp > ack,
    );

    this.localPlayer.movements.forEach((move) => {
      this.updatePlayer(this.localPlayer, move.direction, timestep);
    });
  }
}
