import type { IInputManager, KeyState } from "./IInputManager";
import { InputKey } from "./IInputManager";

// Provides input state driven by a remote source (e.g. another player over
// the network) rather than local keyboard events.
//
// This is a skeleton: it satisfies the IInputManager contract so it can be
// dropped in wherever an InputManager is expected, but it does not yet
// receive or apply any real remote input.
export default class NetworkInputManager implements IInputManager {
  keys: Partial<Record<InputKey, KeyState>> = {};

  constructor() {
    // Initialize every key so consumers can safely read state before any
    // remote input has arrived.
    for (const key of [
      InputKey.Left,
      InputKey.Right,
      InputKey.Up,
      InputKey.Down,
      InputKey.A,
      InputKey.B,
    ]) {
      this.keys[key] = { down: false, justPressed: false };
    }

    // TODO: subscribe to the network transport and forward incoming input
    // snapshots into `applyRemoteInput`.
  }

  // TODO: call this when a remote input snapshot is received to update the
  // local mirror of the remote player's key state.
  applyRemoteInput(state: Partial<Record<InputKey, boolean>>) {
    // TODO: for each key, set `down` and compute `justPressed` based on the
    // previous frame's `down` value (mirror InputManager's setKey logic).
    void state;
  }

  update() {
    // TODO: advance frame-based state (clear justPressed) once remote input
    // is being applied. Mirrors InputManager.update().
    for (const keyState of Object.values(this.keys)) {
      if (keyState.justPressed) {
        keyState.justPressed = false;
      }
    }
  }
}
