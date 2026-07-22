type KeyState = {
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

// Keeps the state of keys/buttons
//
// You can check
//
//   inputManager.keys.left.down
//
// to see if the left key is currently held down
// and you can check
//
//   inputManager.keys.left.justPressed
//
// To see if the left key was pressed this frame
//
// Keys are 'left', 'right', 'a', 'b', 'up', 'down'
export default class InputManager {
  keys: Partial<Record<InputKey, KeyState>> = {};

  constructor() {
    const keyMap = new Map<string, InputKey>();
    const setKey = (keyName: InputKey, pressed: boolean) => {
      const keyState = this.keys[keyName];
      if (!keyState) {
        return;
      }
      keyState.justPressed = pressed && !keyState.down;
      keyState.down = pressed;
    };

    const addKey = (keys: string[], name: InputKey) => {
      this.keys[name] = { down: false, justPressed: false };
      for (const keyCode of keys) {
        keyMap.set(keyCode, name);
      }
    };

    const setKeyFromKeyCode = (key: string, pressed: boolean) => {
      const keyName = keyMap.get(key);
      if (!keyName) {
        return;
      }
      setKey(keyName, pressed);
    };

    addKey(["a", "A", "ArrowLeft"], InputKey.Left);
    addKey(["d", "D", "ArrowRight"], InputKey.Right);
    addKey(["w", "W", "ArrowUp"], InputKey.Up);
    addKey(["s", "S", "ArrowDown"], InputKey.Down);
    addKey(["z", "Z"], InputKey.A);
    addKey(["x", "X"], InputKey.B);

    window.addEventListener("keydown", (e) => {
      setKeyFromKeyCode(e.key, true);
    });
    window.addEventListener("keyup", (e) => {
      setKeyFromKeyCode(e.key, false);
    });
  }

  update() {
    for (const keyState of Object.values(this.keys)) {
      if (keyState.justPressed) {
        keyState.justPressed = false;
      }
    }
  }
}
