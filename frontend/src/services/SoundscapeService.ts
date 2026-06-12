// SoundscapeService.ts
// Procedural audio synthesis engine using the Web Audio API
// Engineered specifically for cognitive retention, relaxed focus, and circadian comfort.

export type SoundscapeType = 'alpha' | 'gamma' | 'ocean' | 'off';

class SoundscapeService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Binaural Beats Nodes
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private leftPanner: StereoPannerNode | null = null;
  private rightPanner: StereoPannerNode | null = null;

  // Ocean / White Noise Nodes
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseLFO: OscillatorNode | null = null;
  private noiseLFOGain: GainNode | null = null;

  private currentType: SoundscapeType = 'off';
  private currentVolume: number = 0.5; // Scale from 0.0 to 1.0

  constructor() {
    // Lazy-load AudioContext on user action to satisfy browser security policies
  }

  private initContext() {
    if (this.ctx) return;

    // Support standard and legacy browsers
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API is not supported in this browser.');
      return;
    }

    try {
      this.ctx = new AudioContextClass();

      // Master Gain Node for smooth fader fading and overall safe ceiling
      this.masterGain = this.ctx.createGain();
      // Set a safe output volume ceiling (0.15 master limit) to protect user ears
      this.masterGain.gain.setValueAtTime(this.currentVolume * 0.15, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.error('Failed to initialize AudioContext:', e);
    }
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.masterGain) {
      // Smoothly transition volume to avoid sudden gain jumps
      this.masterGain.gain.linearRampToValueAtTime(
        this.currentVolume * 0.15,
        this.ctx.currentTime + 0.1
      );
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  public getCurrentType(): SoundscapeType {
    return this.currentType;
  }

  public async start(type: SoundscapeType) {
    this.initContext();

    if (!this.ctx || !this.masterGain) return;

    // If context is suspended (browser autoplay policy), resume it
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Stop current soundscape first
    this.stop();

    this.currentType = type;
    if (type === 'off') return;

    try {
      if (type === 'alpha' || type === 'gamma') {
        this.playBinauralBeats(type);
      } else if (type === 'ocean') {
        this.playOceanNoise();
      }
    } catch (e) {
      console.error(`Failed to play soundscape "${type}":`, e);
    }
  }

  private playBinauralBeats(type: 'alpha' | 'gamma') {
    if (!this.ctx || !this.masterGain) return;

    const baseFreq = 140; // Calming low-frequency carrier wave
    const offset = type === 'alpha' ? 10 : 40; // 10Hz Alpha (focus) vs 40Hz Gamma (problem-solving)

    // Left channel carrier wave (e.g. 140Hz)
    this.leftOsc = this.ctx.createOscillator();
    this.leftOsc.type = 'sine';
    this.leftOsc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

    // Right channel offset wave (e.g. 150Hz for 10Hz beats, or 180Hz for 40Hz beats)
    this.rightOsc = this.ctx.createOscillator();
    this.rightOsc.type = 'sine';
    this.rightOsc.frequency.setValueAtTime(baseFreq + offset, this.ctx.currentTime);

    // Left Stereo Panner Node
    this.leftPanner = this.ctx.createStereoPanner();
    this.leftPanner.pan.setValueAtTime(-1, this.ctx.currentTime); // Hard left

    // Right Stereo Panner Node
    this.rightPanner = this.ctx.createStereoPanner();
    this.rightPanner.pan.setValueAtTime(1, this.ctx.currentTime); // Hard right

    // Connections
    this.leftOsc.connect(this.leftPanner);
    this.leftPanner.connect(this.masterGain);

    this.rightOsc.connect(this.rightPanner);
    this.rightPanner.connect(this.masterGain);

    // Smoothly fade-in oscillators to prevent start-clicks
    const leftGain = this.ctx.createGain();
    const rightGain = this.ctx.createGain();
    leftGain.gain.setValueAtTime(0, this.ctx.currentTime);
    rightGain.gain.setValueAtTime(0, this.ctx.currentTime);

    // Ramp up in 0.5 seconds
    leftGain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.5);
    rightGain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.5);

    // Start oscillators
    this.leftOsc.start(0);
    this.rightOsc.start(0);
  }

  private playOceanNoise() {
    if (!this.ctx || !this.masterGain) return;

    // 1. Generate White Noise Buffer
    const bufferSize = this.ctx.sampleRate * 4; // 4 seconds of unique noise
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const outputChannel = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      outputChannel[i] = Math.random() * 2 - 1; // Pure randomized wave
    }

    // 2. Setup Noise Source Node (looped)
    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;

    // 3. Setup Lowpass Filter to mold white noise into deep ocean wind
    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = 'lowpass';
    this.noiseFilter.frequency.setValueAtTime(250, this.ctx.currentTime); // Base cutoff frequency
    this.noiseFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    // 4. Create breathing modulator (LFO) to simulate wave wash (tides)
    // 0.083 Hz corresponds to an ~12 second inhale-exhale tide cycle
    this.noiseLFO = this.ctx.createOscillator();
    this.noiseLFO.type = 'sine';
    this.noiseLFO.frequency.setValueAtTime(0.08, this.ctx.currentTime);

    // Gain node to set amplitude of filter sweeping (sweeps from ~100Hz to ~400Hz)
    this.noiseLFOGain = this.ctx.createGain();
    this.noiseLFOGain.gain.setValueAtTime(150, this.ctx.currentTime); // sweep amplitude +/- 150Hz

    // Connect LFO Modulator to Filter Frequency
    this.noiseLFO.connect(this.noiseLFOGain);
    this.noiseLFOGain.connect(this.noiseFilter.frequency);

    // Connect Source -> Filter -> Master Output
    this.noiseSource.connect(this.noiseFilter);
    this.noiseFilter.connect(this.masterGain);

    // Start playback & breathing modulation
    this.noiseLFO.start(0);
    this.noiseSource.start(0);
  }

  public stop() {
    if (!this.ctx) return;

    // 1. Stop Binaural Beat Oscillators
    if (this.leftOsc) {
      try { this.leftOsc.stop(); } catch (e) {}
      this.leftOsc.disconnect();
      this.leftOsc = null;
    }
    if (this.rightOsc) {
      try { this.rightOsc.stop(); } catch (e) {}
      this.rightOsc.disconnect();
      this.rightOsc = null;
    }
    if (this.leftPanner) {
      this.leftPanner.disconnect();
      this.leftPanner = null;
    }
    if (this.rightPanner) {
      this.rightPanner.disconnect();
      this.rightPanner = null;
    }

    // 2. Stop Ocean Wind Noise
    if (this.noiseSource) {
      try { this.noiseSource.stop(); } catch (e) {}
      this.noiseSource.disconnect();
      this.noiseSource = null;
    }
    if (this.noiseLFO) {
      try { this.noiseLFO.stop(); } catch (e) {}
      this.noiseLFO.disconnect();
      this.noiseLFO = null;
    }
    if (this.noiseLFOGain) {
      this.noiseLFOGain.disconnect();
      this.noiseLFOGain = null;
    }
    if (this.noiseFilter) {
      this.noiseFilter.disconnect();
      this.noiseFilter = null;
    }

    this.currentType = 'off';
  }
}

export const soundscape = new SoundscapeService();
export default soundscape;
