/**
 * Recorded narration for the screening room's spoken film. Short films are silent
 * and never create this engine.
 *
 * Plays the recorded scene MP3s at their original rate, synchronized to the film
 * clock. Missing audio is reported without substituting a voice.
 */

export interface TrailerAudioOptions {
  voiceOffsetSeconds?: number;
}

export class TrailerAudioEngine {
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

  public start(): void {
    this.isPlaying = true;
  }

  public pause(): void {
    this.isPlaying = false;
    this.pauseVoiceover();
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
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
  }
}

