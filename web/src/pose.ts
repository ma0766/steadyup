// Pose detection on the phone. Video frames never leave this file's caller: only landmarks come out.
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

export type Landmark = { x: number; y: number; z: number; visibility: number };

export async function createPoseDetector(base = "."): Promise<(video: HTMLVideoElement, tMs: number) => Landmark[] | null> {
  const fileset = await FilesetResolver.forVisionTasks(`${base}/mediapipe/wasm`);
  const make = (delegate: "GPU" | "CPU") =>
    PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: `${base}/models/pose_landmarker_lite.task`, delegate },
      runningMode: "VIDEO",
      numPoses: 1,
    });
  const forceCpu = new URLSearchParams(location.search).get("delegate") === "cpu";
  let landmarker: PoseLandmarker;
  try { landmarker = forceCpu ? await make("CPU") : await make("GPU"); } catch { landmarker = await make("CPU"); }
  return (video, tMs) => {
    const res = landmarker.detectForVideo(video, tMs);
    const lm = res.landmarks[0];
    return lm ? lm.map((l) => ({ x: l.x, y: l.y, z: l.z, visibility: l.visibility ?? 0 })) : null;
  };
}

/** Compact wire format: [x,y,visibility]*33 flattened, 3 decimals. Well under 4 KB. */
export function packLandmarks(lm: Landmark[]): number[] {
  const out: number[] = [];
  for (const l of lm) out.push(+l.x.toFixed(3), +l.y.toFixed(3), +l.visibility.toFixed(2));
  return out;
}
