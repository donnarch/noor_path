
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const wasmSrc = path.resolve(
  "node_modules/@mediapipe/tasks-vision/wasm"
);

const wasmOut = path.resolve("public/mediapipe/wasm");

const modelUrl =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const modelOut = path.resolve(
  "public/models/pose_landmarker_lite.task"
);

// Copy files individually instead of using fs.cpSync.
// This avoids the Windows native crash encountered in your setup.
function copyDirectory(source, destination) {
  mkdirSync(destination, { recursive: true });

  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      copyFileSync(sourcePath, destinationPath);
    }
  }
}

async function main() {
  try {
    if (existsSync(wasmSrc)) {
      copyDirectory(wasmSrc, wasmOut);
      console.log("MediaPipe WASM copied successfully.");
    } else {
      throw new Error(`MediaPipe WASM folder not found: ${wasmSrc}`);
    }

    if (process.argv.includes("--model")) {
      console.log("Downloading MediaPipe Pose model...");

      const response = await fetch(modelUrl);

      if (!response.ok) {
        throw new Error(`Model download failed: HTTP ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      mkdirSync(path.dirname(modelOut), { recursive: true });
      writeFileSync(modelOut, buffer);

      console.log(
        `Pose model downloaded successfully (${buffer.length} bytes).`
      );
    }
  } catch (error) {
    console.error("MediaPipe setup failed:", error);
    process.exitCode = 1;
  }
}

main();
