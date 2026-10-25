"""Local speech synthesis with a transcribed reference and private intermediates."""

import argparse
import json
import pathlib
import re

import numpy as np
import soundfile as sf
import torch
import torchaudio


def load_audio(filepath, *args, **kwargs):
    data, rate = sf.read(str(filepath), dtype="float32", always_2d=True)
    return torch.from_numpy(data.T), rate


torchaudio.load = load_audio


def spoken_text(text):
    text = re.sub(r"\bDOT\b", "Dot", text)
    text = text.replace("RF-zero", "R F zero").replace("RF₀", "R F zero")
    text = text.replace("D-O-Theory dot org", "D O Theory dot org")
    return text.replace("—", ", ").replace("↻", "")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--reference", required=True)
    parser.add_argument("--reference-text", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--speed", type=float, default=0.9)
    args = parser.parse_args()
    reference_text = pathlib.Path(args.reference_text).read_text().strip()
    if not reference_text:
        raise ValueError("A transcript matching the complete reference clip is required.")
    scenes = json.loads(pathlib.Path(args.manifest).read_text())
    output = pathlib.Path(args.output)
    output.mkdir(parents=True, exist_ok=True)

    from f5_tts.api import F5TTS

    tts = F5TTS(device="cuda" if torch.cuda.is_available() else "cpu")
    for scene in scenes:
        print(f"Synthesizing scene {scene['number']} at natural pitch...", flush=True)
        # F5 groups complete sentences. Preserve its pauses and every consonant;
        # do not regenerate tiny breaths or force speech into old scene lengths.
        waveform, rate, _ = tts.infer(
            ref_file=args.reference,
            ref_text=reference_text,
            gen_text=spoken_text(scene["text"]),
            speed=args.speed,
            nfe_step=64,
            cross_fade_duration=0.04,
            remove_silence=False,
            seed=9041 + scene["number"],
        )
        waveform = np.asarray(waveform, dtype=np.float32)
        if waveform.size < rate or not np.isfinite(waveform).all():
            raise ValueError(f"Invalid audio returned for scene {scene['number']}")
        sf.write(output / f"raw-scene-{scene['number']}.wav", waveform, rate, subtype="FLOAT")
        print(json.dumps({"scene": scene["number"], "durationSeconds": round(len(waveform) / rate, 3)}), flush=True)


if __name__ == "__main__":
    main()
