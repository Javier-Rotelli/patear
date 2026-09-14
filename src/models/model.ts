import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

export default class Model {
  gltf: GLTF;
  animations: { [name: string]: THREE.AnimationClip } = {};

  constructor(gltf: GLTF) {
    this.gltf = gltf;
    this.prepModelsAndAnimations();
  }

  prepModelsAndAnimations() {
    this.gltf.animations.forEach((clip) => {
      this.animations[clip.name] = clip;
      // console.log("  ", clip.name);
    });
  }
}

export class AnimatedModelInstance {
  mixer: THREE.AnimationMixer;
  currentAction?: THREE.AnimationAction;
  private animations: { [name: string]: THREE.AnimationClip } = {};
  public root: THREE.Object3D;
  constructor(
    private scene: THREE.Scene,
    model: Model,
    clipName?: string,
  ) {
    const clonedScene = SkeletonUtils.clone(model.gltf.scene);
    this.root = new THREE.Object3D();
    this.root.add(clonedScene);
    this.scene.add(this.root);
    this.mixer = new THREE.AnimationMixer(clonedScene);
    this.animations = model.animations;

    const startClip = this.resolveClipName(clipName);
    if (startClip) {
      this.play(startClip);
    }
  }

  play(name: string) {
    const clip = this.animations[name];
    if (!clip) {
      console.warn(`Animation "${name}" not found on model.`);
      return;
    }

    const action = this.mixer.clipAction(clip);
    if (action === this.currentAction) {
      return;
    }

    this.currentAction?.stop();
    action.reset().play();
    this.currentAction = action;
  }

  private resolveClipName(clipName?: string): string | undefined {
    const names = Object.keys(this.animations);
    if (clipName && this.animations[clipName]) {
      return clipName;
    }
    return (
      ["idle", "walk"].find((name) => this.animations[name]) ??
      names.find((name) => name !== "static") ??
      names[0]
    );
  }

  update(delta: number) {
    this.mixer.update(delta * 0.001); // Convert delta from milliseconds to seconds
    this.root.updateMatrixWorld(true);
  }

  remove() {
    this.scene.remove(this.root);
  }
}

export type PlayerAnimationNames =
  | "static"
  | "idle"
  | "walk"
  | "sprint"
  | "jump"
  | "fall"
  | "crouch"
  | "sit"
  | "drive"
  | "die"
  | "pick-up"
  | "emote-yes"
  | "emote-no"
  | "holding-right"
  | "holding-left"
  | "holding-both"
  | "holding-right-shoot"
  | "holding-left-shoot"
  | "holding-both-shoot"
  | "attack-melee-right"
  | "attack-melee-left"
  | "attack-kick-right"
  | "attack-kick-left"
  | "interact-right"
  | "interact-left"
  | "wheelchair-sit"
  | "wheelchair-look-left"
  | "wheelchair-look-right"
  | "wheelchair-move-forward"
  | "wheelchair-move-back"
  | "wheelchair-move-left"
  | "wheelchair-move-right";
