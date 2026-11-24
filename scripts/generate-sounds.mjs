/**
 * Generates the small synthesized sound effects used by TypeStrike.
 * Run with: node scripts/generate-sounds.mjs
 * No external audio files or dependencies are required.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAMPLE_RATE = 44100;

function makeWav(samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
  }
  return buffer;
}

function tone({ duration, startHz, endHz, gain = 0.25, type = "sine", attack = 0.008, release = 0.06 }) {
  const count = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(count);
  let phase = 0;
  for (let i = 0; i < count; i += 1) {
    const t = i / SAMPLE_RATE;
    const progress = i / Math.max(1, count - 1);
    const hz = startHz + (endHz - startHz) * progress;
    phase += (2 * Math.PI * hz) / SAMPLE_RATE;
    const base = type === "square" ? Math.sign(Math.sin(phase)) * 0.6 : Math.sin(phase);
    const envelope = Math.min(1, t / attack) * Math.min(1, (duration - t) / release);
    samples[i] = base * gain * Math.max(0, envelope);
  }
  return samples;
}

function sequence(parts, gapSeconds = 0.04) {
  const gap = new Float32Array(Math.floor(gapSeconds * SAMPLE_RATE));
  const chunks = [];
  for (const part of parts) {
    chunks.push(tone(part), gap);
  }
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

const effects = {
  "shoot.wav": tone({ duration: 0.11, startHz: 1180, endHz: 420, gain: 0.2, type: "square", release: 0.03 }),
  "impact.wav": sequence([
    { duration: 0.09, startHz: 320, endHz: 120, gain: 0.24, type: "square", release: 0.03 },
    { duration: 0.16, startHz: 190, endHz: 70, gain: 0.2, type: "triangle", release: 0.06 },
  ], 0.015),
  "target-destroy.wav": tone({ duration: 0.22, startHz: 880, endHz: 220, gain: 0.22, type: "square" }),
  "level-complete.wav": sequence([
    { duration: 0.16, startHz: 523, endHz: 523, gain: 0.2 },
    { duration: 0.16, startHz: 659, endHz: 659, gain: 0.2 },
    { duration: 0.24, startHz: 784, endHz: 988, gain: 0.22 },
  ]),
  "life-lost.wav": tone({ duration: 0.32, startHz: 180, endHz: 90, gain: 0.26, type: "square", release: 0.1 }),
  "game-over.wav": sequence([
    { duration: 0.26, startHz: 440, endHz: 330, gain: 0.2 },
    { duration: 0.34, startHz: 330, endHz: 196, gain: 0.22 },
  ], 0.02),
};

const interfaceSounds = {
  "button-hover.wav": tone({ duration: 0.06, startHz: 660, endHz: 720, gain: 0.09 }),
  "button-press.wav": tone({ duration: 0.09, startHz: 520, endHz: 760, gain: 0.14 }),
};

for (const [folder, files] of [
  ["public/sounds/effects", effects],
  ["public/sounds/interface", interfaceSounds],
]) {
  mkdirSync(join(ROOT, folder), { recursive: true });
  for (const [name, samples] of Object.entries(files)) {
    writeFileSync(join(ROOT, folder, name), makeWav(samples));
  }
}

console.log("Generated TypeStrike sound effects.");
