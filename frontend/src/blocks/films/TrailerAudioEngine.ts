/**
 * Recorded narration and a quiet procedural score for the screening room.
 * The spoken trailer uses narration-only mode; short films keep a sparse score.
 *
 * Features:
 * 1. Beat Tones: one soft tone at each beat of a short film, settling on an open chord at
 *    the closing title. There is no sustained drone, so nothing hums between beats.
 * 2. Typewriter Ticks: Short 12ms band-pass filtered white-noise burst triggered as characters
 *    reveal during the first 2.5 seconds of each scene.
 * 3. Voiceover Manager: Plays the recorded scene MP3s at their original rate,
 *    synchronized to the film clock. Missing audio is reported without substituting a voice.
 */

export interface TrailerAudioOptions {
  narrationOnly?: boolean;
  voiceOffsetSeconds?: number;
}

/**
 * The notes struck at each beat of a short film, in Hz: A major pentatonic in the middle
 * register, well above the 50–120 Hz range where a held tone reads as hum. Beats past the
 * end of the list repeat its closing chord.
 */
export const SHORT_FILM_CUES: number[][] = [
  [220.0, 329.63], // A3 + E4: an open fifth for the observer
  [246.94, 369.99], // B3 + F#4: emergence within T × E
  [277.18, 440.0], // C#4 + A4: the experience loop
  [329.63, 554.37], // E4 + C#5: a warm sixth for Love
  [220.0, 329.63, 440.0, 554.37], // A3 E4 A4 C#5: the closing title settles home
];

export class TrailerAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private scoreBus: GainNode | null = null;
  private scoreInput: AudioNode | null = null;
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
  private voiceoverSeekRequested = false;

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

      // The score fades with play and pause, so a ringing tone never outlasts the pictures.
      const scoreBus = ctx.createGain();
      scoreBus.gain.setValueAtTime(0.0001, ctx.currentTime);
      scoreBus.connect(masterGain);
      this.scoreBus = scoreBus;

      // Round off the top of each tone, then give it a little room.
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2400, ctx.currentTime);
      filter.Q.setValueAtTime(0.5, ctx.currentTime);
      filter.connect(scoreBus);
      this.scoreInput = filter;

      try {
        const convolver = ctx.createConvolver();
        convolver.buffer = this.createImpulseResponse(ctx, 2.6, 2.8);
        const reverbSend = ctx.createGain();
        reverbSend.gain.setValueAtTime(0.3, ctx.currentTime);
        filter.connect(reverbSend);
        reverbSend.connect(convolver);
        convolver.connect(scoreBus);
      } catch {
        // Fallback if ConvolverNode is unsupported in test mocks
      }

      this.tickNoiseBuffer = this.createWhiteNoiseBuffer(ctx, 0.025);

      return ctx;
    } catch {
      return null;
    }
  }

  public start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    const ctx = this.ensureGraph();
    if (!ctx || !this.scoreBus) return;
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    this.scoreBus.gain.cancelScheduledValues(now);
    this.scoreBus.gain.setValueAtTime(Math.max(0.0001, this.scoreBus.gain.value), now);
    this.scoreBus.gain.linearRampToValueAtTime(1, now + 0.15);
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.ctx && this.scoreBus) {
      const now = this.ctx.currentTime;
      this.scoreBus.gain.cancelScheduledValues(now);
      this.scoreBus.gain.setValueAtTime(Math.max(0.0001, this.scoreBus.gain.value), now);
      this.scoreBus.gain.linearRampToValueAtTime(0.0001, now + 0.35);
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

  public get waitingForVoiceover(): boolean {
    const audio = this.activeAudioElement;
    return Boolean(
      this.isPlaying &&
      this.voiceoverEnabled &&
      audio &&
      this.currentSceneOffset >= 0 &&
      (!Number.isFinite(audio.duration) || this.currentSceneOffset < audio.duration) &&
      (audio.readyState < 3 || audio.seeking),
    );
  }

  public requestVoiceoverSeek(): void {
    this.voiceoverSeekRequested = true;
  }

  /**
   * Keeps narration on its scene-local clock as the film moves between scenes.
   */
  public updateScene(
    sceneIndex: number,
    elapsedTime: number,
    statementText?: string,
    sceneStart = 0,
  ): void {
    const safeIdx = Math.max(0, sceneIndex);
    const sceneChanged = safeIdx !== this.currentSceneIndex;
    if (sceneChanged) {
      this.stopVoiceover();
      this.failedVoiceoverSceneIndex = -1;
      this.onVoiceoverError(false);
    }
    this.currentSceneIndex = safeIdx;
    this.currentSceneOffset = elapsedTime - sceneStart - (this.options.voiceOffsetSeconds ?? 0);

    if (
      this.isPlaying &&
      this.voiceoverEnabled &&
      statementText &&
      this.failedVoiceoverSceneIndex !== safeIdx
    ) {
      this.synchronizeVoiceover(safeIdx + 1);
    }
  }

  /**
   * Strikes the tones for one beat of a short film: a soft attack and a long natural
   * decay that carries quietly toward the next beat without holding a steady tone.
   */
  public playCue(index: number): void {
    if (this.isMuted || !this.isPlaying) return;
    const ctx = this.ensureGraph();
    if (!ctx || !this.scoreInput) return;
    const notes = SHORT_FILM_CUES[Math.min(Math.max(0, index), SHORT_FILM_CUES.length - 1)];
    const level = 0.05 / Math.sqrt(notes.length);
    const now = ctx.currentTime;
    notes.forEach((freq, voice) => {
      // A gentle arpeggio: each note enters just after the one below it.
      const at = now + voice * 0.09;
      // The fundamental carries the tone; a quieter octave adds glass and fades first.
      for (const [ratio, weight, decay] of [[1, 1, 5.5], [2, 0.18, 2.2]]) {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq * ratio, at);
          gain.gain.setValueAtTime(0.0001, at);
          gain.gain.linearRampToValueAtTime(level * weight, at + 0.06);
          gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
          osc.connect(gain);
          gain.connect(this.scoreInput!);
          osc.start(at);
          osc.stop(at + decay + 0.05);
        } catch {
          // Ignore in restricted environments
        }
      }
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
        audio.preload = "auto";
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
    // The section title gives the current recording time to load. Keep it paused
    // until narration begins so a slower download does not discard the opening words.
    if (offset < 0) {
      this.pauseVoiceover();
      return;
    }
    if (Number.isFinite(audio.duration) && offset >= audio.duration) {
      audio.pause();
      return;
    }
    // A delayed render can report an old clock after audio has already advanced.
    // Rewind only for an explicit seek, so a long frame never repeats spoken words.
    if (audio.readyState >= 1 && (this.voiceoverSeekRequested || offset - audio.currentTime > 0.4)) {
      audio.currentTime = offset;
      this.voiceoverSeekRequested = false;
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
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

