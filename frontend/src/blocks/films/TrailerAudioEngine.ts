/**
 * Recorded narration and optional procedural sound for the screening room.
 * The spoken trailer uses narration-only mode; short films retain their score.
 *
 * Features:
 * 1. Ambient Drone: 3 detuned oscillators (sine, triangle, sine) + harmonic resolution voices
 *    routed through a warm low-pass BiquadFilterNode (cutoff: 280Hz–450Hz) and stereo
 *    delay/reverb impulse response, shifting frequencies and tension across Scenes 1–8.
 * 2. Typewriter Ticks: Short 12ms band-pass filtered white-noise burst triggered as characters
 *    reveal during the first 2.5 seconds of each scene.
 * 3. Voiceover Manager: Plays the recorded scene MP3s at their original rate,
 *    synchronized to the film clock. Missing audio is reported without substituting a voice.
 */

export interface SceneAudioProfile {
  sceneIndex: number;
  rootHz: number;
  fifthHz: number;
  subHz: number;
  thirdHz: number;
  thirdGain: number;
  tensionHz: number;
  tensionGain: number;
  noiseGain: number;
  filterCutoffHz: number;
  pulseRateHz: number;
  pulseDepth: number;
  masterDroneGain: number;
}

export interface TrailerAudioOptions {
  narrationOnly?: boolean;
  voiceOffsetSeconds?: number;
}

export const SCENE_AUDIO_PROFILES: SceneAudioProfile[] = [
  // Scene 1: 01 // THE GAP WE FEEL — Root ambient drone fades in (110Hz A2 warm pad)
  {
    sceneIndex: 0,
    rootHz: 110.0,
    fifthHz: 220.0,
    subHz: 55.0,
    thirdHz: 138.59,
    thirdGain: 0.0,
    tensionHz: 116.54,
    tensionGain: 0.0,
    noiseGain: 0.0,
    filterCutoffHz: 340,
    pulseRateHz: 0.25,
    pulseDepth: 12,
    masterDroneGain: 0.055,
  },
  // Scene 2: 02 // THE NEAREST FACT — Shifts to suspended fourth (146.83Hz D3), open inquiry
  {
    sceneIndex: 1,
    rootHz: 110.0,
    fifthHz: 146.83,
    subHz: 55.0,
    thirdHz: 220.0,
    thirdGain: 0.012,
    tensionHz: 116.54,
    tensionGain: 0.0,
    noiseGain: 0.0,
    filterCutoffHz: 380,
    pulseRateHz: 0.32,
    pulseDepth: 16,
    masterDroneGain: 0.06,
  },
  // Scene 3: 03 // THE SUBJECTIVE DATA PRINCIPLE — Careful examination, warm fifth (164.81Hz E3)
  {
    sceneIndex: 2,
    rootHz: 110.0,
    fifthHz: 164.81,
    subHz: 55.0,
    thirdHz: 220.0,
    thirdGain: 0.016,
    tensionHz: 116.54,
    tensionGain: 0.0,
    noiseGain: 0.0,
    filterCutoffHz: 400,
    pulseRateHz: 0.38,
    pulseDepth: 18,
    masterDroneGain: 0.064,
  },
  // Scene 4: 04 // A WORLD WE CAN QUESTION — Measured scientific cadence
  {
    sceneIndex: 3,
    rootHz: 110.0,
    fifthHz: 164.81,
    subHz: 55.0,
    thirdHz: 246.94, // B3 add9 warmth
    thirdGain: 0.015,
    tensionHz: 116.54,
    tensionGain: 0.0,
    noiseGain: 0.0,
    filterCutoffHz: 410,
    pulseRateHz: 0.65,
    pulseDepth: 32,
    masterDroneGain: 0.066,
  },
  // Scene 5: 05 // THE LANGUAGE OF A MODEL — Clear structural focus
  {
    sceneIndex: 4,
    rootHz: 110.0,
    fifthHz: 164.81,
    subHz: 55.0,
    thirdHz: 196.0,
    thirdGain: 0.014,
    tensionHz: 220.0,
    tensionGain: 0.008,
    noiseGain: 0.0,
    filterCutoffHz: 390,
    pulseRateHz: 0.45,
    pulseDepth: 22,
    masterDroneGain: 0.066,
  },
  // Scene 6: 06 // THE DIGITAL ORGANISM — Expansive Big C[T, E] foundation
  {
    sceneIndex: 5,
    rootHz: 110.0,
    fifthHz: 164.81,
    subHz: 55.0,
    thirdHz: 220.0,
    thirdGain: 0.024,
    tensionHz: 146.83,
    tensionGain: 0.014,
    noiseGain: 0.0,
    filterCutoffHz: 430,
    pulseRateHz: 0.4,
    pulseDepth: 24,
    masterDroneGain: 0.072,
  },
  // Scene 7: 07 // A LOCAL LIFE IN A SHARED WORLD — Grounded embodied pulse in RF0
  {
    sceneIndex: 6,
    rootHz: 110.0,
    fifthHz: 164.81,
    subHz: 55.0,
    thirdHz: 246.94,
    thirdGain: 0.018,
    tensionHz: 220.0,
    tensionGain: 0.012,
    noiseGain: 0.0,
    filterCutoffHz: 405,
    pulseRateHz: 0.78,
    pulseDepth: 38,
    masterDroneGain: 0.07,
  },
  // Scene 8: 08 // WHAT EXPERIENCE LEAVES BEHIND — Reflective Canvas & Painting warmth
  {
    sceneIndex: 7,
    rootHz: 110.0,
    fifthHz: 164.81,
    subHz: 55.0,
    thirdHz: 130.81, // C3 modal shading
    thirdGain: 0.016,
    tensionHz: 116.54,
    tensionGain: 0.0,
    noiseGain: 0.0,
    filterCutoffHz: 360,
    pulseRateHz: 0.55,
    pulseDepth: 22,
    masterDroneGain: 0.066,
  },
  // Scene 9: 09 // THE EXPERIENCE LOOP — Steady cyclical cadence
  {
    sceneIndex: 8,
    rootHz: 110.0,
    fifthHz: 164.81,
    subHz: 55.0,
    thirdHz: 146.83,
    thirdGain: 0.018,
    tensionHz: 220.0,
    tensionGain: 0.01,
    noiseGain: 0.0,
    filterCutoffHz: 380,
    pulseRateHz: 0.9,
    pulseDepth: 36,
    masterDroneGain: 0.068,
  },
  // Scene 10: 10 // WHEN FEAR TAKES THE LEAD — Subtle minor second/tritone tension + filtered noise swell
  {
    sceneIndex: 9,
    rootHz: 110.0,
    fifthHz: 155.56, // Eb3 tritone
    subHz: 55.0,
    thirdHz: 130.81,
    thirdGain: 0.018,
    tensionHz: 116.54, // Bb2 minor second
    tensionGain: 0.026,
    noiseGain: 0.015,
    filterCutoffHz: 310,
    pulseRateHz: 1.45,
    pulseDepth: 50,
    masterDroneGain: 0.074,
  },
  // Scene 11: 11 // LOVE, RESPONSIBILITY, AND REPAIR — Dissonance resolves into warm major chord swell
  {
    sceneIndex: 10,
    rootHz: 110.0,
    fifthHz: 164.81,
    subHz: 55.0,
    thirdHz: 138.59, // C#3 major third
    thirdGain: 0.032,
    tensionHz: 220.0, // A3 octave reinforcement
    tensionGain: 0.026,
    noiseGain: 0.0,
    filterCutoffHz: 450,
    pulseRateHz: 0.3,
    pulseDepth: 16,
    masterDroneGain: 0.082,
  },
  // Scene 12: 12 // THE INQUIRY WE SHARE — Warm resonant community resolution & tail fade
  {
    sceneIndex: 11,
    rootHz: 110.0,
    fifthHz: 164.81,
    subHz: 55.0,
    thirdHz: 138.59,
    thirdGain: 0.026,
    tensionHz: 220.0,
    tensionGain: 0.022,
    noiseGain: 0.0,
    filterCutoffHz: 385,
    pulseRateHz: 0.22,
    pulseDepth: 12,
    masterDroneGain: 0.062,
  },
];

export class TrailerAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneBusGain: GainNode | null = null;
  private lowpassFilter: BiquadFilterNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  private oscRoot: OscillatorNode | null = null;
  private oscFifth: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private oscThird: OscillatorNode | null = null;
  private oscTension: OscillatorNode | null = null;

  private gainThird: GainNode | null = null;
  private gainTension: GainNode | null = null;
  private gainNoise: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private tickNoiseBuffer: AudioBuffer | null = null;

  private isPlaying = false;
  private isMuted = false;
  private voiceoverEnabled = false;
  private currentSceneIndex = -1;
  private activeAudioElement: HTMLAudioElement | null = null;
  private currentSceneOffset = 0;
  private failedVoiceoverSceneIndex = -1;
  private voiceoverPlayPending = false;
  private voiceoverPlayGeneration = 0;

  constructor(
    private readonly onVoiceoverError: (unavailable: boolean) => void = () => {},
    private readonly options: TrailerAudioOptions = {},
  ) {}

  private getAudioContextConstructor(): typeof AudioContext | null {
    if (typeof window === "undefined") return null;
    return (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
      null
    );
  }

  private createImpulseResponse(ctx: AudioContext, durationSec = 2.4, decay = 2.2): AudioBuffer {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * durationSec);
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const env = Math.pow(1 - i / length, decay);
        data[i] = (Math.random() * 2 - 1) * env * 0.35;
      }
    }
    return impulse;
  }

  private createWhiteNoiseBuffer(ctx: AudioContext, durationSec = 2.0): AudioBuffer {
    const rate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(rate * durationSec));
    const buf = ctx.createBuffer(1, length, rate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  private ensureGraph(): AudioContext | null {
    if (this.options.narrationOnly) return null;
    if (this.ctx) return this.ctx;
    const Ctx = this.getAudioContextConstructor();
    if (!Ctx) return null;

    try {
      const ctx = new Ctx();
      this.ctx = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, ctx.currentTime);
      masterGain.connect(ctx.destination);
      this.masterGain = masterGain;

      const droneBusGain = ctx.createGain();
      droneBusGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.droneBusGain = droneBusGain;

      // Warm low-pass BiquadFilterNode (cutoff: 280Hz–450Hz)
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(340, ctx.currentTime);
      filter.Q.setValueAtTime(1.15, ctx.currentTime);
      this.lowpassFilter = filter;

      // LFO for gentle rhythmic filter breathing
      const lfoOsc = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfoOsc.type = "sine";
      lfoOsc.frequency.setValueAtTime(0.3, ctx.currentTime);
      lfoGain.gain.setValueAtTime(14, ctx.currentTime);
      lfoOsc.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfoOsc.start();
      this.lfoOsc = lfoOsc;
      this.lfoGain = lfoGain;

      // Dry + Reverb Convolver + Stereo Delay routing for cinematic depth
      filter.connect(droneBusGain);

      try {
        const convolver = ctx.createConvolver();
        convolver.buffer = this.createImpulseResponse(ctx, 2.2, 2.4);
        const reverbSend = ctx.createGain();
        reverbSend.gain.setValueAtTime(0.42, ctx.currentTime);
        filter.connect(reverbSend);
        reverbSend.connect(convolver);
        convolver.connect(droneBusGain);
      } catch {
        // Fallback if ConvolverNode is unsupported in test mocks
      }

      droneBusGain.connect(masterGain);

      // 3 Primary Detuned Oscillators (sine, triangle, sine)
      const oscRoot = ctx.createOscillator();
      oscRoot.type = "sine";
      oscRoot.frequency.setValueAtTime(110.0, ctx.currentTime);
      oscRoot.detune.setValueAtTime(-4, ctx.currentTime);
      const gainRoot = ctx.createGain();
      gainRoot.gain.setValueAtTime(0.45, ctx.currentTime);
      oscRoot.connect(gainRoot);
      gainRoot.connect(filter);
      oscRoot.start();
      this.oscRoot = oscRoot;

      const oscFifth = ctx.createOscillator();
      oscFifth.type = "triangle";
      oscFifth.frequency.setValueAtTime(220.0, ctx.currentTime);
      oscFifth.detune.setValueAtTime(5, ctx.currentTime);
      const gainFifth = ctx.createGain();
      gainFifth.gain.setValueAtTime(0.28, ctx.currentTime);
      oscFifth.connect(gainFifth);
      gainFifth.connect(filter);
      oscFifth.start();
      this.oscFifth = oscFifth;

      const oscSub = ctx.createOscillator();
      oscSub.type = "sine";
      oscSub.frequency.setValueAtTime(55.0, ctx.currentTime);
      oscSub.detune.setValueAtTime(2, ctx.currentTime);
      const gainSub = ctx.createGain();
      gainSub.gain.setValueAtTime(0.36, ctx.currentTime);
      oscSub.connect(gainSub);
      gainSub.connect(filter);
      oscSub.start();
      this.oscSub = oscSub;

      // Harmonic third / colour voice
      const oscThird = ctx.createOscillator();
      oscThird.type = "sine";
      oscThird.frequency.setValueAtTime(138.59, ctx.currentTime);
      const gainThird = ctx.createGain();
      gainThird.gain.setValueAtTime(0.0001, ctx.currentTime);
      oscThird.connect(gainThird);
      gainThird.connect(filter);
      oscThird.start();
      this.oscThird = oscThird;
      this.gainThird = gainThird;

      // Tension / Octave reinforcement voice
      const oscTension = ctx.createOscillator();
      oscTension.type = "triangle";
      oscTension.frequency.setValueAtTime(116.54, ctx.currentTime);
      const gainTension = ctx.createGain();
      gainTension.gain.setValueAtTime(0.0001, ctx.currentTime);
      oscTension.connect(gainTension);
      gainTension.connect(filter);
      oscTension.start();
      this.oscTension = oscTension;
      this.gainTension = gainTension;

      // Low-level filtered white noise source for Scene 6 High Entropy
      const noiseBuf = this.createWhiteNoiseBuffer(ctx, 2.0);
      this.tickNoiseBuffer = this.createWhiteNoiseBuffer(ctx, 0.025);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuf;
      noiseSource.loop = true;
      const noiseBand = ctx.createBiquadFilter();
      noiseBand.type = "bandpass";
      noiseBand.frequency.setValueAtTime(240, ctx.currentTime);
      noiseBand.Q.setValueAtTime(1.8, ctx.currentTime);
      const gainNoise = ctx.createGain();
      gainNoise.gain.setValueAtTime(0.0001, ctx.currentTime);
      noiseSource.connect(noiseBand);
      noiseBand.connect(gainNoise);
      gainNoise.connect(filter);
      noiseSource.start();
      this.noiseSource = noiseSource;
      this.gainNoise = gainNoise;

      return ctx;
    } catch {
      return null;
    }
  }

  public start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    const ctx = this.ensureGraph();
    if (!ctx || !this.droneBusGain) return;
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const profile =
      SCENE_AUDIO_PROFILES[Math.max(0, this.currentSceneIndex)] ?? SCENE_AUDIO_PROFILES[0];
    this.droneBusGain.gain.cancelScheduledValues(now);
    this.droneBusGain.gain.setValueAtTime(
      Math.max(0.0001, this.droneBusGain.gain.value),
      now,
    );
    this.droneBusGain.gain.linearRampToValueAtTime(profile.masterDroneGain, now + 0.8);
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.ctx && this.droneBusGain) {
      const now = this.ctx.currentTime;
      this.droneBusGain.gain.cancelScheduledValues(now);
      this.droneBusGain.gain.setValueAtTime(
        Math.max(0.0001, this.droneBusGain.gain.value),
        now,
      );
      this.droneBusGain.gain.linearRampToValueAtTime(0.0001, now + 0.35);
    }
    this.pauseVoiceover();
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 1, now + 0.12);
    }
    // Keep the recorded voice on the film clock while muted, so unmuting is immediate.
    if (this.activeAudioElement) this.activeAudioElement.muted = muted;
  }

  public setVoiceoverEnabled(enabled: boolean): void {
    this.voiceoverEnabled = enabled;
    if (!enabled) {
      this.pauseVoiceover();
    } else {
      this.failedVoiceoverSceneIndex = -1;
      this.onVoiceoverError(false);
    }
  }

  public clearScene(): void {
    if (this.currentSceneIndex === -1) return;
    this.currentSceneIndex = -1;
    this.stopVoiceover();
    this.onVoiceoverError(false);
  }

  /**
   * Smoothly transitions the ambient drone frequencies, filter cutoff, and tension/resolution
   * layers for the active scene while keeping narration on its scene-local clock.
   */
  public updateScene(
    sceneIndex: number,
    elapsedTime: number,
    duration = 280,
    statementText?: string,
    sceneStart = 0,
  ): void {
    const safeIdx = Math.max(0, sceneIndex);
    const clampedIdx = Math.max(0, Math.min(SCENE_AUDIO_PROFILES.length - 1, safeIdx));
    const profile = SCENE_AUDIO_PROFILES[clampedIdx];
    const sceneChanged = safeIdx !== this.currentSceneIndex;
    if (sceneChanged) {
      this.stopVoiceover();
      this.failedVoiceoverSceneIndex = -1;
      this.onVoiceoverError(false);
    }
    this.currentSceneIndex = safeIdx;
    const sceneOffset = elapsedTime - sceneStart - (this.options.voiceOffsetSeconds ?? 0);
    this.currentSceneOffset = Math.max(0, sceneOffset);

    const ctx = this.ctx;
    if (ctx && this.isPlaying) {
      const now = ctx.currentTime;
      const rampSec = sceneChanged ? 1.35 : 0.25;

      // Tail fade-out in the final 3.5 seconds of Scene 12
      const tailFactor =
        elapsedTime > duration - 3.5
          ? Math.max(0.0001, (duration - elapsedTime) / 3.5)
          : 1.0;

      if (this.droneBusGain) {
        this.droneBusGain.gain.setTargetAtTime(
          profile.masterDroneGain * tailFactor,
          now,
          0.35,
        );
      }

      if (sceneChanged) {
        this.oscRoot?.frequency.setTargetAtTime(profile.rootHz, now, rampSec * 0.4);
        this.oscFifth?.frequency.setTargetAtTime(profile.fifthHz, now, rampSec * 0.4);
        this.oscSub?.frequency.setTargetAtTime(profile.subHz, now, rampSec * 0.4);
        this.oscThird?.frequency.setTargetAtTime(profile.thirdHz, now, rampSec * 0.35);
        this.oscTension?.frequency.setTargetAtTime(profile.tensionHz, now, rampSec * 0.35);

        this.gainThird?.gain.setTargetAtTime(profile.thirdGain, now, rampSec * 0.45);
        this.gainTension?.gain.setTargetAtTime(profile.tensionGain, now, rampSec * 0.45);
        this.gainNoise?.gain.setTargetAtTime(profile.noiseGain, now, rampSec * 0.45);

        this.lowpassFilter?.frequency.setTargetAtTime(
          profile.filterCutoffHz,
          now,
          rampSec * 0.4,
        );
        this.lfoOsc?.frequency.setTargetAtTime(profile.pulseRateHz, now, 0.3);
        this.lfoGain?.gain.setTargetAtTime(profile.pulseDepth, now, 0.3);

        // Cathartic golden shockwave chime when entering Scene 11 (Love, Responsibility, and Repair)
        if (safeIdx === 10 && !this.isMuted) {
          this.playResolutionShockwave(ctx);
        }
      }
    }

    if (sceneOffset < 0) {
      this.pauseVoiceover();
      return;
    }

    if (
      this.isPlaying &&
      this.voiceoverEnabled &&
      statementText &&
      this.failedVoiceoverSceneIndex !== safeIdx
    ) {
      this.synchronizeVoiceover(safeIdx + 1);
    }
  }

  private playResolutionShockwave(ctx: AudioContext): void {
    if (!this.masterGain) return;
    const now = ctx.currentTime;
    const chordHz = [220.0, 277.18, 329.63, 440.0]; // A3, C#4, E4, A4
    chordHz.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.016, now + idx * 0.04 + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 2.6);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 2.7);
    });
  }

  /**
   * Short 12ms filtered white-noise burst + subtle mechanical tick triggered as
   * characters appear during the first 2.5 seconds of each scene.
   */
  public playKeystrokeTick(index = 0): void {
    if (this.isMuted) return;
    const ctx = this.ensureGraph();
    if (!ctx || !this.masterGain) return;
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // 12ms filtered white-noise burst
    if (this.tickNoiseBuffer) {
      try {
        const src = ctx.createBufferSource();
        src.buffer = this.tickNoiseBuffer;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.setValueAtTime(1650 + ((index * 11) % 6) * 110, now);
        bp.Q.setValueAtTime(2.4, now);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.018, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
        src.connect(bp);
        bp.connect(gain);
        gain.connect(this.masterGain);
        src.start(now);
        src.stop(now + 0.013);
      } catch {
        // Ignore in restricted environments
      }
    }

    // Soft tonal body
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1480 + ((index * 7) % 5) * 90, now);
      gain.gain.setValueAtTime(0.009, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.013);
    } catch {
      // Ignore in restricted environments
    }
  }

  private synchronizeVoiceover(sceneNumber: number): void {
    if (typeof window === "undefined") return;
    let audio = this.activeAudioElement;
    if (!audio) {
      try {
        audio = new Audio(`/audio/scene-${sceneNumber}.mp3`);
        audio.volume = 0.9;
        audio.muted = this.isMuted;
        audio.playbackRate = 1;
        this.activeAudioElement = audio;
        const newAudio = audio;
        audio.addEventListener("loadedmetadata", () => {
          if (this.activeAudioElement === newAudio) this.synchronizeVoiceover(sceneNumber);
        }, { once: true });
        audio.addEventListener("error", () => this.voiceoverFailed(newAudio), { once: true });
      } catch {
        this.failedVoiceoverSceneIndex = this.currentSceneIndex;
        this.onVoiceoverError(true);
        return;
      }
    }

    // Seeking and resuming use the same scene-local clock. Never speed up a recording
    // to catch the pictures, and never restart the scene when resuming halfway through.
    const offset = this.currentSceneOffset;
    if (Number.isFinite(audio.duration) && offset >= audio.duration) {
      audio.pause();
      return;
    }
    if (audio.readyState >= 1 && Math.abs(audio.currentTime - offset) > 0.4) {
      audio.currentTime = offset;
    }
    if (!this.isPlaying || !this.voiceoverEnabled || !audio.paused || this.voiceoverPlayPending) {
      return;
    }
    const currentAudio = audio;
    const generation = ++this.voiceoverPlayGeneration;
    this.voiceoverPlayPending = true;
    try {
      void audio.play().then(() => {
        if (this.activeAudioElement !== currentAudio || this.voiceoverPlayGeneration !== generation) return;
        this.voiceoverPlayPending = false;
        if (!this.isPlaying || !this.voiceoverEnabled) currentAudio.pause();
      }).catch(() => {
        if (this.activeAudioElement !== currentAudio || this.voiceoverPlayGeneration !== generation) return;
        this.voiceoverPlayPending = false;
        if (this.isPlaying && this.voiceoverEnabled) this.voiceoverFailed(currentAudio);
      });
    } catch {
      this.voiceoverFailed(currentAudio);
    }
  }

  private voiceoverFailed(audio: HTMLAudioElement): void {
    // A rejected request from a previous scene must not affect the current voice.
    if (this.activeAudioElement !== audio) return;
    this.failedVoiceoverSceneIndex = this.currentSceneIndex;
    this.stopVoiceover();
    this.onVoiceoverError(true);
  }

  private pauseVoiceover(): void {
    this.voiceoverPlayGeneration += 1;
    this.voiceoverPlayPending = false;
    this.activeAudioElement?.pause();
  }

  public stopVoiceover(): void {
    this.pauseVoiceover();
    if (this.activeAudioElement) {
      try {
        this.activeAudioElement.pause();
        this.activeAudioElement.currentTime = 0;
      } catch {
        // Ignore
      }
      this.activeAudioElement = null;
    }
  }

  public destroy(): void {
    this.stopVoiceover();
    try {
      this.noiseSource?.stop();
    } catch {
      // Ignore
    }
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

