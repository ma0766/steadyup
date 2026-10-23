// Copies the MediaPipe wasm runtime and fetches the pose model into web/public (both gitignored).
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const wasmSrc = path.resolve(root, "../node_modules/@mediapipe/tasks-vision/wasm");
const wasmDst = path.join(root, "public/mediapipe/wasm");
fs.mkdirSync(wasmDst, { recursive: true });
for (const f of fs.readdirSync(wasmSrc)) fs.copyFileSync(path.join(wasmSrc, f), path.join(wasmDst, f));

const modelDst = path.join(root, "public/models/pose_landmarker_lite.task");
if (!fs.existsSync(modelDst)) {
  fs.mkdirSync(path.dirname(modelDst), { recursive: true });
  const url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
  const r = await fetch(url);
  if (!r.ok) throw new Error(`model download failed: ${r.status}`);
  fs.writeFileSync(modelDst, Buffer.from(await r.arrayBuffer()));
  console.log("downloaded pose model", fs.statSync(modelDst).size, "bytes");
}
