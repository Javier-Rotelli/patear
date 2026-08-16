import * as THREE from "three";

export function createGrass(
  scene: THREE.Scene,
  textures: Record<string, THREE.Texture>,
) {
  const grassRoot = new THREE.Object3D();
  scene.add(grassRoot);
  grassRoot.position.set(0, 0, 0);
  grassRoot.rotateX(-Math.PI / 2);

  const geometry = new THREE.PlaneGeometry(70, 50);
  const material = new THREE.MeshBasicMaterial({
    color: "#007515",
    side: THREE.FrontSide,
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.translateZ(-0.01);
  grassRoot.add(plane);

  const canchaGeometry = new THREE.BufferGeometry();

  const vertices = new Float32Array([
    -1.0,
    -1.0,
    0.0, // v0
    1.0,
    -1.0,
    0.0, // v1
    1.0,
    1.0,
    0.0, // v2
    1.0,
    1.0,
    0.0, // v3
    -1.0,
    1.0,
    0.0, // v4
    -1.0,
    -1.0,
    0.0, // v5
  ]);
  // itemSize = 3 because there are 3 values (components) per vertex
  canchaGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(vertices, 3),
  );

  canchaGeometry.setAttribute(
    "uv",
    new THREE.BufferAttribute(
      new Float32Array([
        0.0,
        0.0, // uv0
        1.0,
        0.0, // uv1
        1.0,
        1.0, // uv2
        1.0,
        1.0, // uv3
        0.0,
        1.0, // uv4
        0.0,
        0.0, // uv5
      ]),
      2,
    ),
  );

  canchaGeometry.scale(31, 20, 1);
  const canchaMaterial = new THREE.MeshStandardMaterial({
    map: textures["cancha-rotada"],
    side: THREE.DoubleSide,
  });
  const canchaPlane = new THREE.Mesh(canchaGeometry, canchaMaterial);
  canchaPlane.receiveShadow = true;
  grassRoot.add(canchaPlane);
}
