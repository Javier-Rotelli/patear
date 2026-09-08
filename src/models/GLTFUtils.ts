import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import createDebug from "debug";
const log = createDebug("GLTFUtils");

export const loadGLTF = (
  gltfLoader: GLTFLoader,
  url: string,
  cb: (gltf: GLTF) => void,
) => {
  log("Loading: ", url);
  gltfLoader.load(
    url,
    (model) => {
      log("Loaded model:", url);
      cb(model);
    },
    undefined,
    (e) => {
      log("Error loading GLTF model:", e);
      throw e;
    },
  );
};
