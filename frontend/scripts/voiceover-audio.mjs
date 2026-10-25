import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rename, rm, stat } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_FFMPEG = process.env.DOT_FFMPEG ||
  (existsSync("/tmp/dot-channel-video-tools/ffmpeg")
    ? "/tmp/dot-channel-video-tools/ffmpeg"
    : "ffmpeg");

export async function runFFmpeg(args, { ffmpeg = DEFAULT_FFMPEG } = {}) {
  return await new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, ["-hide_banner", "-nostdin", ...args], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", () => reject(new Error("FFmpeg could not start. Install it or set DOT_FFMPEG.")));
    child.once("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`FFmpeg failed (${code}): ${stderr.slice(-1500)}`));
    });
  });
}

/** Decode the audio stream, rather than relying on rounded container durations. */
export async function probeAudio(inputPath, { ffmpeg = DEFAULT_FFMPEG } = {}) {
  const { stdout, stderr } = await runFFmpeg([
    "-i", inputPath, "-map", "0:a:0", "-vn", "-sn", "-dn",
    "-progress", "pipe:1", "-nostats", "-f", "null", "-",
  ], { ffmpeg });
  const times = [...stdout.matchAll(/out_time_us=(\d+)/g)];
  const durationSeconds = Number(times.at(-1)?.[1]) / 1_000_000;
  const stream = stderr.match(/Audio:\s*([^,\s]+)[^\n]*?,\s*(\d+) Hz,\s*(mono|stereo|\d+\.\d+)/);
  if (!stream || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("The recording has no decodable, non-empty audio stream.");
  }
  return {
    durationSeconds,
    codec: stream[1],
    sampleRate: Number(stream[2]),
    channels: stream[3] === "mono" ? 1 : stream[3] === "stereo" ? 2 : stream[3],
  };
}

function boundedNumber(value, minimum, maximum, label) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

async function atomicAudioOutput(outputPath, action) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  // Keep incomplete files out of the delivery filename, even after a failed run.
  const staging = await mkdtemp(path.join(path.dirname(outputPath), ".voiceover-stage-"));
  const temporary = path.join(staging, path.basename(outputPath));
  try {
    const result = await action(temporary);
    if ((await stat(temporary)).size === 0) throw new Error("The encoded audio file is empty.");
    await rename(temporary, outputPath);
    return result;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

export async function measureAudioLoudness(inputPath, { ffmpeg = DEFAULT_FFMPEG, filter = "" } = {}) {
  const { stderr } = await runFFmpeg([
    "-i", inputPath, "-map", "0:a:0", "-vn",
    "-af", [filter, "ebur128=peak=true"].filter(Boolean).join(","), "-f", "null", "-",
  ], { ffmpeg });
  const summary = stderr.slice(stderr.lastIndexOf("Summary:"));
  const integratedLufs = Number(summary.match(/I:\s*([-\d.]+) LUFS/)?.[1]);
  const truePeak = Number(summary.match(/Peak:\s*([-\d.]+) dBFS/)?.[1]);
  const loudnessRange = Number(summary.match(/LRA:\s*([-\d.]+) LU/)?.[1]);
  if (![integratedLufs, truePeak, loudnessRange].every(Number.isFinite)) {
    throw new Error("The recording is silent or cannot be measured for narration mastering.");
  }
  return { integratedLufs, truePeak, loudnessRange };
}

/**
 * A lossless narration master. Measure speech loudness, apply constant gain and a
 * short lookahead limiter to isolated peaks, then measure again. Preserve pauses,
 * pitch, and phrasing; no denoising, warmth EQ, or scene-duration cap.
 */
export async function masterVoiceover(inputPath, outputPath, {
  ffmpeg = DEFAULT_FFMPEG,
  leadInSeconds = 0.2,
  tailSeconds = 0.3,
  targetLufs = -17,
  truePeak = -1.5,
} = {}) {
  if (path.extname(outputPath).toLowerCase() !== ".wav") {
    throw new Error("Lossless narration masters must use a .wav destination.");
  }
  if (path.resolve(inputPath) === path.resolve(outputPath)) {
    throw new Error("Keep the original recording separate from its master.");
  }
  boundedNumber(leadInSeconds, 0, 5, "Lead-in seconds");
  boundedNumber(tailSeconds, 0, 5, "Tail seconds");
  boundedNumber(targetLufs, -30, -12, "Target loudness");
  boundedNumber(truePeak, -9, -1, "True-peak limit");
  const source = await probeAudio(inputPath, { ffmpeg });
  const preparation = "aformat=channel_layouts=mono,highpass=f=65";
  const input = await measureAudioLoudness(inputPath, { ffmpeg, filter: preparation });
  let gainDb = targetLufs - input.integratedLufs;
  // Sample limiting needs margin for intersample peaks. Measure the completed
  // waveform too, rather than assuming its sample ceiling is its true peak.
  let ceilingDb = truePeak - 0.8;

  return await atomicAudioOutput(outputPath, async (temporary) => {
    let measured;
    let appliedGainDb;
    for (let attempt = 0; attempt < 4; attempt++) {
      appliedGainDb = gainDb;
      const limit = Math.max(0.0625, 10 ** (ceilingDb / 20));
      const filters = [
        preparation, `volume=${gainDb.toFixed(3)}dB`,
        `alimiter=limit=${limit.toFixed(6)}:attack=5:release=60:level=0:latency=1`,
      ];
      if (leadInSeconds > 0) filters.push(`adelay=${Math.round(leadInSeconds * 1000)}:all=1`);
      if (tailSeconds > 0) filters.push(`apad=pad_dur=${tailSeconds}`);
      await runFFmpeg([
        "-y", "-i", inputPath, "-map", "0:a:0", "-vn", "-map_metadata", "-1",
        "-af", filters.join(","), "-ar", "48000", "-ac", "1",
        "-c:a", "pcm_s24le", temporary,
      ], { ffmpeg });
      measured = await measureAudioLoudness(temporary, { ffmpeg });
      const loudnessError = targetLufs - measured.integratedLufs;
      const peakError = measured.truePeak - truePeak;
      if (Math.abs(loudnessError) <= 0.2 && peakError <= 0.05) break;
      if (peakError > 0.05) ceilingDb -= peakError + 0.1;
      gainDb += loudnessError;
    }
    if (Math.abs(measured.integratedLufs - targetLufs) > 0.5 || measured.truePeak > truePeak + 0.1) {
      throw new Error("The recording could not reach the narration target with gentle peak limiting. Existing audio was preserved.");
    }
    const output = await probeAudio(temporary, { ffmpeg });
    const expectedDuration = source.durationSeconds + leadInSeconds + tailSeconds;
    if (Math.abs(output.durationSeconds - expectedDuration) > 0.05) {
      throw new Error("Master duration changed unexpectedly; the original narration was preserved.");
    }
    return {
      ...output,
      inputLufs: input.integratedLufs,
      targetLufs,
      achievedLufs: measured.integratedLufs,
      outputTruePeak: measured.truePeak,
      gainDb: Number(appliedGainDb.toFixed(3)),
    };
  });
}

/** Browser delivery only; use the lossless master for final video mixing. */
export async function encodeVoiceoverDelivery(masterPath, outputPath, { ffmpeg = DEFAULT_FFMPEG } = {}) {
  if (path.extname(outputPath).toLowerCase() !== ".mp3") {
    throw new Error("Browser narration delivery must use an .mp3 destination.");
  }
  return await atomicAudioOutput(outputPath, async (temporary) => {
    await runFFmpeg([
      "-y", "-i", masterPath, "-map", "0:a:0", "-vn", "-map_metadata", "-1",
      "-ar", "48000", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "192k", temporary,
    ], { ffmpeg });
    return await probeAudio(temporary, { ffmpeg });
  });
}
