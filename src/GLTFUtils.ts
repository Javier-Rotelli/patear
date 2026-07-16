import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const loadGLTF = (
  gltfLoader: GLTFLoader,
  url: string,
  cb: (gltf: GLTF) => void,
) => {
  console.log("Loading: ", url);
  gltfLoader.load(
    url,
    (model) => {
      console.log("Loaded model:", url);
      cb(model);
    },
    undefined,
    (e) => {
      console.error("Error loading GLTF model:", e);
      throw e;
    },
  );
};
