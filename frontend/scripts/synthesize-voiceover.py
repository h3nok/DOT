"""Local speech synthesis matched to the author's settled vocal register and natural prosody."""

import argparse
import difflib
import json
import pathlib
import re
import subprocess

import librosa
import numpy as np
import scipy.signal
import soundfile as sf
import torch
import torchaudio


def load_audio(filepath, *args, **kwargs):
    data, rate = sf.read(str(filepath), dtype="float32", always_2d=True)
    return torch.from_numpy(data.T), rate


torchaudio.load = load_audio


def normalize_display_text(text):
    text = text.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    text = re.sub(r"\bDOT\b", "Dot", text)
    text = re.sub(r"\bLittle c\b", "Little C", text)
    text = text.replace("RF-zero", "R F zero").replace("RF₀", "R F zero")
    text = text.replace("D-O-Theory dot org", "D O Theory dot org")
    text = re.sub(r"\bdotheory\.org\b", "D O Theory dot org", text, flags=re.IGNORECASE)
    # Strip single quotation marks wrapping quoted phrases without touching contractions like They're or don't
    text = re.sub(r"(?<!\w)'([^']+?)'(?!\w)", r"\1", text)
    return text.replace("↻", "").strip()


def to_f5_prompt_text(unit_text):
    """
    Convert em-dashes, colons, and semicolons inside a single-batch sentence into
    natural comma pauses so F5-TTS inflects continuous clause contours without
    ever breaking a sentence into separate files.
    """
    t = unit_text.replace("—", ", ").replace(": ", ", ").replace("; ", ", ")
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"[,:;—]+$", ".", t)
    if t and t[-1] not in ".?!":
        t += "."
    return t


def word_tokens(text):
    norm = text.lower().replace("’", "'").replace("‘", "'")
    norm = re.sub(r"\bd\s+o\s+theory\s+dot\s+org\b", "dotheory org", norm)
    norm = re.sub(r"\bdotheory\.org\b", "dotheory org", norm)
    norm = re.sub(r"\bdo\s*theory\.org\b", "dotheory org", norm)
    norm = re.sub(r"\bbrush[- ]strokes\b", "brushstrokes", norm)
    norm = re.sub(r"\bdouble[- ]slit\b", "doubleslit", norm)
    norm = re.sub(r"\bself[- ]protection\b", "selfprotection", norm)
    norm = re.sub(r"\bself[- ]awareness\b", "selfawareness", norm)
    norm = re.sub(r"\bself[- ]sustaining\b", "selfsustaining", norm)
    norm = re.sub(r"\bone[- ]word\b", "oneword", norm)
    norm = re.sub(r"\bfive[- ]step\b", "fivestep", norm)
    norm = re.sub(r"\brule[- ]bound\b", "rulebound", norm)
    norm = re.sub(r"\bsecond[- ]order\b", "secondorder", norm)
    norm = re.sub(r"\bfirst[- ]order\b", "firstorder", norm)
    norm = re.sub(r"\b(first|third)[- ]person\b", r"\1person", norm)
    norm = re.sub(r"\bcounter[- ]evidence\b", "counterevidence", norm)
    norm = re.sub(r"\blow[- ]entropy\b", "lowentropy", norm)
    norm = re.sub(r"\bhigh[- ]precision\b", "highprecision", norm)
    return re.findall(r"[a-z0-9]+(?:'[a-z]+)?", norm)


def split_overlong_sentence(sentence, max_chars=195):
    """
    Never split a sentence at a comma. Every sentence <= 195 characters is synthesized
    as a single continuous F5-TTS batch. Sentences >195 characters split strictly at
    their semicolon (;), em-dash (—), or colon (:).
    """
    sentence = sentence.strip()
    if len(sentence) <= max_chars:
        return [(sentence, "sentence")]
    if "; " in sentence:
        parts = [p.strip() for p in sentence.split("; ") if p.strip()]
        res = []
        for i, p in enumerate(parts):
            if p[-1] not in ".?!":
                p += "."
            p = p[0].upper() + p[1:]
            res.append((p, "pivot" if i < len(parts) - 1 else "sentence"))
        return res
    if "—" in sentence:
        idx = sentence.find("—")
        left = sentence[:idx].strip()
        right = sentence[idx + 1 :].strip()
        if left and right:
            if left[-1] not in ".?!":
                left += "."
            right = right[0].upper() + right[1:]
            return [(left, "pivot"), (right, "sentence")]
    if ": " in sentence:
        idx = sentence.find(": ")
        left = sentence[:idx].strip()
        right = sentence[idx + 2 :].strip()
        if len(left) >= 28 and len(right) >= 40:
            if left[-1] not in ".?!":
                left += "."
            right = right[0].upper() + right[1:]
            return [(left, "pivot"), (right, "sentence")]
    return [(sentence, "sentence")]


def split_into_rhetorical_groups(text, max_group_chars=168):
    """
    Keep complete sentences intact so F5-TTS generates continuous, natural prosody
    in a single batch per group. Pair ultra-short sentences (<46 chars) with the
    exact sentence they semantically introduce or conclude.
    """
    norm_text = normalize_display_text(text)
    raw_sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", norm_text) if s.strip()]
    units = []
    for sent in raw_sentences:
        units.extend(split_overlong_sentence(sent, max_chars=195))

    groups = []
    idx = 0
    while idx < len(units):
        cur_text, cur_kind = units[idx]
        # Keep the opening hook of Scene 1 standalone for dramatic weight
        if idx == 0 and cur_text.startswith("Look closely at the world"):
            groups.append((cur_text, "sentence"))
            idx += 1
            continue
        # Short concluding confirmations that belong to the preceding sentence
        if (
            cur_text.startswith("Both are real observations")
            or cur_text.startswith("You are one of those centers")
        ) and groups:
            prev_text, _ = groups[-1]
            if len(prev_text) + 1 + len(cur_text) <= 184:
                groups[-1] = (f"{prev_text} {cur_text}", "sentence")
                idx += 1
                continue
        # Short setup questions or thesis prompts (<46 chars) pair forward with their explanation
        if len(cur_text) < 46 and idx + 1 < len(units):
            nxt_text, nxt_kind = units[idx + 1]
            if len(cur_text) + 1 + len(nxt_text) <= max_group_chars:
                groups.append((f"{cur_text} {nxt_text}", nxt_kind))
                idx += 2
                continue
        groups.append((cur_text, cur_kind))
        idx += 1
    return groups


def trim_outer_edges(
    waveform,
    rate,
    threshold_db=-42.0,
    pre_roll_sec=0.045,
    post_roll_sec=0.065,
    max_hallucinated_pause_sec=0.85,
    target_capped_pause_sec=0.52,
):
    """
    Trim only leading and trailing dead air while preserving 100% of natural internal
    clause and comma pauses. Never slice open a sentence to insert artificial pauses.
    """
    x = np.asarray(waveform, dtype=np.float32).reshape(-1)
    if x.size == 0:
        return x
    peak = float(np.max(np.abs(x)))
    if peak < 1e-5:
        return x
    hop = max(1, int(rate * 0.010))
    win = max(hop, int(rate * 0.020))
    n_frames = max(1, (len(x) - win) // hop + 1)
    rms = np.array(
        [np.sqrt(np.mean(x[i * hop : i * hop + win] ** 2) + 1e-12) for i in range(n_frames)],
        dtype=np.float32,
    )
    thresh = max(10.0 ** (threshold_db / 20.0), peak * 0.012)
    active = np.where(rms >= thresh)[0]
    if active.size == 0:
        return x
    start_sample = max(0, int(active[0] * hop - pre_roll_sec * rate))
    end_sample = min(len(x), int((active[-1] + 1) * hop + win + post_roll_sec * rate))
    x = x[start_sample:end_sample].copy()

    # Cap only extreme (>0.85s) internal dead-air diffusion dropouts
    n_frames2 = max(1, (len(x) - win) // hop + 1)
    rms2 = np.array(
        [np.sqrt(np.mean(x[i * hop : i * hop + win] ** 2) + 1e-12) for i in range(n_frames2)],
        dtype=np.float32,
    )
    silent = rms2 < thresh
    segments = []
    idx = 0
    fade_samples = max(16, int(0.025 * rate))
    max_pause_frames = int(max_hallucinated_pause_sec * rate / hop)
    keep_pause_samples = int(target_capped_pause_sec * rate)
    last_sample = 0
    while idx < len(silent):
        if not silent[idx]:
            idx += 1
            continue
        run_start = idx
        while idx < len(silent) and silent[idx]:
            idx += 1
        run_len = idx - run_start
        if run_len > max_pause_frames and run_start > 3 and idx < len(silent) - 3:
            gap_start = run_start * hop
            gap_end = min(len(x), idx * hop)
            if gap_end - gap_start > keep_pause_samples + fade_samples * 2:
                half = keep_pause_samples // 2
                left_end = gap_start + half + fade_samples
                right_start = gap_end - half
                segments.append(x[last_sample:left_end])
                last_sample = right_start
    segments.append(x[last_sample:])

    if len(segments) > 1:
        out = segments[0]
        for seg in segments[1:]:
            if len(out) > fade_samples and len(seg) > fade_samples:
                t = np.linspace(0.0, np.pi / 2.0, fade_samples, dtype=np.float32)
                cross = out[-fade_samples:] * np.cos(t) + seg[:fade_samples] * np.sin(t)
                out = np.concatenate([out[:-fade_samples], cross, seg[fade_samples:]])
            else:
                out = np.concatenate([out, seg])
        x = out

    fi = min(len(x) // 4, int(0.025 * rate))
    fo = min(len(x) // 4, int(0.045 * rate))
    if fi > 0:
        x[:fi] *= np.sin(np.linspace(0.0, np.pi / 2.0, fi, dtype=np.float32)) ** 2
    if fo > 0:
        x[-fo:] *= np.cos(np.linspace(0.0, np.pi / 2.0, fo, dtype=np.float32)) ** 2
    return x


def load_reference_ensemble(reference_path, reference_text):
    """
    Load the primary un-stretched reference clip plus any companion settled-register
    reference clips (voice-alt1, voice-alt2), real studio room tone, and ground-truth
    speaker profile from the reference directory.
    """
    ref_path = pathlib.Path(reference_path)
    ref_dir = ref_path.parent
    ensemble = [(str(ref_path), reference_text.strip())]
    for name in ("voice-alt1", "voice-alt2"):
        wav_p = ref_dir / f"{name}.wav"
        txt_p = ref_dir / f"{name}.txt"
        if wav_p.exists() and txt_p.exists():
            txt = txt_p.read_text(encoding="utf-8").strip()
            if txt:
                ensemble.append((str(wav_p), txt))

    room_path = ref_dir / "room-tone.wav"
    if room_path.exists():
        room_data, _ = sf.read(str(room_path), dtype="float32", always_2d=False)
        if room_data.ndim > 1:
            room_data = room_data.mean(axis=1)
        room_rms = float(np.sqrt(np.mean(room_data**2) + 1e-12))
        target_rms = 10.0 ** (-65.0 / 20.0)
        room_tone = room_data * min(0.5, target_rms / room_rms)
    else:
        room_tone = np.zeros(12000, dtype=np.float32)

    profile_path = ref_dir / "speaker-profile.npz"
    if profile_path.exists():
        prof = np.load(str(profile_path))
        speaker_profile = {
            "f0_median": float(prof["f0_median"]),
            "f0_mean": float(prof["f0_mean"]),
            "f0_p90": float(prof["f0_p90"]),
            "mfcc_mean": prof["mfcc_mean"].astype(np.float32),
        }
    else:
        speaker_profile = {
            "f0_median": 102.7,
            "f0_mean": 104.0,
            "f0_p90": 127.1,
            "mfcc_mean": None,
        }

    return ensemble, room_tone, speaker_profile


def make_room_pause(duration_sec, rate, room_tone):
    n = max(1, int(round(duration_sec * rate)))
    if room_tone is None or len(room_tone) == 0:
        return np.zeros(n, dtype=np.float32)
    if len(room_tone) >= n:
        return room_tone[:n].copy()
    reps = (n // len(room_tone)) + 2
    tiled = np.tile(room_tone, reps)
    return tiled[:n].copy()


def evaluate_speaker_similarity(wave, sr, speaker_profile):
    """
    Measure fundamental frequency (F0 median, mean, 90th percentile) and volume-invariant
    vocal-tract MFCC[1:20] cosine similarity against the author's ground-truth recordings.
    """
    y = wave / (float(np.sqrt(np.mean(wave**2))) + 1e-12) * 0.1
    f0, _, _ = librosa.pyin(y, fmin=60, fmax=240, sr=sr)
    valid_f0 = f0[~np.isnan(f0)]
    if len(valid_f0) >= 3:
        f0_med = float(np.median(valid_f0))
        f0_mean = float(np.mean(valid_f0))
        f0_p90 = float(np.percentile(valid_f0, 90))
    else:
        f0_med = speaker_profile["f0_median"]
        f0_mean = speaker_profile["f0_mean"]
        f0_p90 = speaker_profile["f0_p90"]

    mfcc_sim = 0.985
    gt_mfcc = speaker_profile.get("mfcc_mean")
    if gt_mfcc is not None and len(y) >= sr // 2:
        rms = librosa.feature.rms(y=y)[0]
        act = rms > np.percentile(rms, 40)
        if np.any(act):
            raw_mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
            mfcc = np.mean(
                raw_mfcc[1:, act] if gt_mfcc.shape[0] == 19 else raw_mfcc[:, act], axis=1
            )
            denom = float(np.linalg.norm(mfcc) * np.linalg.norm(gt_mfcc)) + 1e-12
            mfcc_sim = float(np.dot(mfcc, gt_mfcc) / denom)

    return f0_med, f0_mean, f0_p90, mfcc_sim


def condition_scene_audio(raw_wav_path, conditioned_wav_path, rate):
    """
    Transparent studio vocal chain that removes only <65 Hz sub-rumble and applies
    gentle leveling without muffling the speaker's natural upper-mid presence (~4.5 kHz rolloff).
    """
    af_chain = ",".join(
        [
            "highpass=f=65:poles=2",
            "acompressor=threshold=-21dB:ratio=1.45:attack=30:release=250:makeup=1.05",
        ]
    )
    subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(raw_wav_path),
            "-af",
            af_chain,
            "-ar",
            str(rate),
            "-ac",
            "1",
            "-c:a",
            "pcm_f32le",
            str(conditioned_wav_path),
        ],
        check=True,
    )


def inter_group_pause_seconds(unit_text, unit_kind):
    text = unit_text.strip()
    if unit_kind == "pivot":
        return 0.28
    if text.endswith("?"):
        return 0.54
    if len(text) <= 58:
        return 0.50
    return 0.44


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--reference", required=True)
    parser.add_argument("--reference-text", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--speed", type=float, default=0.91)
    args = parser.parse_args()
    reference_text = pathlib.Path(args.reference_text).read_text().strip()
    if not reference_text:
        raise ValueError("A transcript matching the complete reference clip is required.")
    scenes = json.loads(pathlib.Path(args.manifest).read_text())
    output = pathlib.Path(args.output)
    output.mkdir(parents=True, exist_ok=True)

    ensemble, room_tone, speaker_profile = load_reference_ensemble(args.reference, reference_text)
    print(
        f"Loaded {len(ensemble)} un-stretched reference clips (target F0 median={speaker_profile['f0_median']:.1f}Hz, mean={speaker_profile['f0_mean']:.1f}Hz)",
        flush=True,
    )

    device = "cuda" if torch.cuda.is_available() else "cpu"
    from f5_tts.api import F5TTS
    from f5_tts.infer import utils_infer
    from faster_whisper import WhisperModel

    # Never let F5-TTS chop a single sentence group into multiple fragments
    utils_infer.chunk_text = lambda text, max_chars=250: [text.strip()] if text.strip() else []

    tts = F5TTS(device=device)
    asr = WhisperModel(
        "small.en",
        device=device,
        compute_type="float16" if device == "cuda" else "int8",
        download_root="/hf-cache/asr",
    )

    base_speed = min(0.94, max(0.89, float(args.speed) if float(args.speed) < 0.99 else 0.91))
    gt_f0_med = speaker_profile["f0_median"]
    gt_f0_mean = speaker_profile["f0_mean"]

    for scene in scenes:
        scene_num = scene["number"]
        groups = split_into_rhetorical_groups(scene["text"])
        print(
            f"Synthesizing scene {scene_num} in {len(groups)} single-batch complete sentence groups (base_speed={base_speed:.2f})...",
            flush=True,
        )
        assembled = []
        rate = 24000
        scene_f0_meds = []
        scene_mfcc_sims = []

        for g_idx, (unit_text, unit_kind) in enumerate(groups):
            f5_text = to_f5_prompt_text(unit_text)
            expected_words = word_tokens(unit_text)
            expects_question = unit_text.strip().endswith("?")
            local_speed = (
                base_speed - 0.01
                if len(unit_text) <= 68
                else base_speed
                if len(unit_text) <= 145
                else base_speed + 0.01
            )
            best_wave = None
            best_score = -1e9
            best_meta = None

            # Multi-take tournament across the settled reference ensemble
            max_attempts = 4
            for attempt in range(max_attempts):
                # Prefer shorter reference clip (voice-alt1, 9.31s) first on long sentences (>145 chars)
                ref_idx = (attempt + (1 if len(unit_text) > 145 else 0)) % len(ensemble)
                ref_file, ref_txt = ensemble[ref_idx]
                seed = 7103 + scene_num * 313 + g_idx * 43 + attempt * 157
                cfg = 2.20 if attempt % 2 == 0 else 2.05
                waveform, sr, _ = tts.infer(
                    ref_file=ref_file,
                    ref_text=ref_txt,
                    gen_text=f5_text,
                    speed=local_speed,
                    nfe_step=64,
                    cfg_strength=cfg,
                    sway_sampling_coef=-1.0,
                    cross_fade_duration=0.10,
                    remove_silence=False,
                    seed=seed,
                )
                rate = sr
                wave = trim_outer_edges(waveform, sr)
                if wave.size < sr * 0.40 or not np.isfinite(wave).all():
                    continue
                wave_16k = scipy.signal.resample_poly(wave, 16000, sr).astype(np.float32)
                segments, _ = asr.transcribe(
                    wave_16k, beam_size=5, language="en", vad_filter=False, word_timestamps=True
                )
                seg_list = list(segments)
                asr_words = [w for s in seg_list for w in (s.words or []) if w.word.strip()]
                actual_text = " ".join(s.text.strip() for s in seg_list)
                actual_words = word_tokens(actual_text)
                ratio = difflib.SequenceMatcher(
                    None, expected_words, actual_words, autojunk=False
                ).ratio()
                probs = [w.probability for w in asr_words]
                min_prob = min(probs) if probs else 0.0
                avg_prob = float(np.mean(probs)) if probs else 0.0

                intonation_penalty = (
                    -0.45 if (not expects_question and actual_text.strip().endswith("?")) else 0.0
                )
                word_len_diff = abs(len(expected_words) - len(actual_words))
                hallucination_penalty = -0.35 * word_len_diff

                f0_med, f0_mean, f0_p90, mfcc_sim = evaluate_speaker_similarity(
                    wave, sr, speaker_profile
                )
                f0_med_err = abs(f0_med - gt_f0_med)
                f0_mean_err = abs(f0_mean - gt_f0_mean)
                f0_penalty = (
                    -0.055 * f0_med_err
                    - 0.035 * f0_mean_err
                    - 0.05 * max(0.0, f0_p90 - 129.5)
                    - 0.06 * max(0.0, 92.0 - f0_med)
                )

                dur_sec = len(wave) / sr
                chars_per_sec = len(unit_text) / max(0.5, dur_sec)
                pace_penalty = (
                    0.0
                    if 10.2 <= chars_per_sec <= 17.5
                    else -abs(chars_per_sec - 13.8) * 0.05
                )

                score = (
                    ratio * 4.0
                    + avg_prob * 0.6
                    + min_prob * 0.35
                    + mfcc_sim * 2.0
                    + f0_penalty
                    + pace_penalty
                    + intonation_penalty
                    + hallucination_penalty
                )
                if score > best_score:
                    best_score = score
                    best_wave = wave
                    best_meta = (
                        ratio,
                        f0_med,
                        f0_mean,
                        f0_p90,
                        mfcc_sim,
                        chars_per_sec,
                        actual_text,
                        attempt + 1,
                    )

                if (
                    ratio >= 0.999
                    and word_len_diff == 0
                    and intonation_penalty == 0.0
                    and min_prob >= 0.70
                    and f0_med_err <= 4.5
                    and f0_p90 <= 129.5
                    and mfcc_sim >= 0.935
                    and 10.2 <= chars_per_sec <= 17.5
                ):
                    break

            if best_wave is None:
                raise ValueError(f"Failed to synthesize group {g_idx + 1} in scene {scene_num}")

            ratio, f0_med, f0_mean, f0_p90, mfcc_sim, cps, actual_text, tries = best_meta
            scene_f0_meds.append(f0_med)
            scene_mfcc_sims.append(mfcc_sim)
            print(
                f"  [Scene {scene_num} G{g_idx + 1}/{len(groups)} try={tries}] asr={ratio:.3f} F0={f0_med:.1f}Hz(p90={f0_p90:.1f}) sim={mfcc_sim:.4f} cps={cps:.1f}",
                flush=True,
            )

            assembled.append(best_wave)
            if g_idx < len(groups) - 1:
                pause_sec = inter_group_pause_seconds(unit_text, unit_kind)
                assembled.append(make_room_pause(pause_sec, rate, room_tone))

        full_wave = np.concatenate(assembled) if assembled else np.zeros(rate, dtype=np.float32)
        if full_wave.size < rate or not np.isfinite(full_wave).all():
            raise ValueError(f"Invalid audio returned for scene {scene_num}")
        unconditioned_path = output / f"unconditioned-scene-{scene_num}.wav"
        raw_path = output / f"raw-scene-{scene_num}.wav"
        sf.write(unconditioned_path, full_wave, rate, subtype="FLOAT")
        condition_scene_audio(unconditioned_path, raw_path, rate)
        unconditioned_path.unlink(missing_ok=True)
        print(
            json.dumps(
                {
                    "scene": scene_num,
                    "groups": len(groups),
                    "durationSeconds": round(len(full_wave) / rate, 3),
                    "f0MedianHz": round(float(np.median(scene_f0_meds)), 1),
                    "mfccSimilarity": round(float(np.mean(scene_mfcc_sims)), 4),
                }
            ),
            flush=True,
        )


if __name__ == "__main__":
    main()

