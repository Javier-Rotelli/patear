export type KeyState = {
  down: boolean;
  justPressed: boolean;
};

export const enum InputKey {
  Left = "left",
  Right = "right",
  Up = "up",
  Down = "down",
  A = "a",
  B = "b",
}

// Common contract for anything that provides input state.
//
// Consumers read the current key state via `keys`, e.g.
//
//   inputManager.keys.left?.down        // held down
//   inputManager.keys.left?.justPressed // pressed this frame
//
// and call `update()` once per frame to advance frame-based state
// (e.g. clearing `justPressed`).
export interface IInputManager {
  keys: Partial<Record<InputKey, KeyState>>;
  update(): void;
}
