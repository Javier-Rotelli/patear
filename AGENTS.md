# AGENTS.md

## Project

`pate.ar` — a browser-based 3D app built with [Three.js](https://threejs.org/) (v0.185) and bundled with [Vite](https://vite.dev/) (v8). TypeScript entry point is `main.ts`, loaded as an ES module from `index.html`.

## Commands

Use Vite directly via the local binary for dev/build:

- Dev server: `npx vite`
- Production build: `npx vite build`
- Preview build: `npx vite preview`
- Format: `npm run format` (writes) / `npm run format:check` (verifies)

Formatting is handled by [Prettier](https://prettier.io/). There is no test runner or linter configured.

## Layout

- `index.html` — HTML entry; loads `/main.ts` as a module. Vite serves this at the root.
- `main.ts` — application code: scene setup, camera, renderer, and GLTF model loading.
- `public/` — static assets served at the site root. `public/models/players/` holds `.glb`/`.gltf` character models. Reference them by root-relative path minus `public/` (e.g. `loadGLTF("models/players/character-male-f.glb")`).
- `node_modules/.vite/` — Vite dependency cache; do not edit.

## Conventions

- TypeScript, ES modules, `import * as THREE from "three"`. Three.js addons come from `three/addons/...` (e.g. `three/addons/loaders/GLTFLoader.js`).
- 2-space indentation, double-quoted strings, trailing commas, semicolons — match the existing style in `main.ts`.
- Static assets go in `public/` and are referenced by root-relative paths (no `public/` prefix, no leading `/` needed for loaders).
- There is no `tsconfig.json`; Vite handles TS transpilation. Type errors are not currently enforced by any tooling.
