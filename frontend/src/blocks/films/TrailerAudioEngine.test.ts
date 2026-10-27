import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TrailerAudioEngine } from "./TrailerAudioEngine";

class RecordedScene extends EventTarget {
  static instances: RecordedScene[] = [];
  currentTime = 0;
  duration = 90;
  readyState = 1;
  volume = 1;
  muted = false;
  playbackRate = 1;
  paused = true;
  play = vi.fn(() => {
    this.paused = false;
    return Promise.resolve();
  });
  pause = vi.fn(() => { this.paused = true; });

  constructor(readonly src: string) {
    super();
    RecordedScene.instances.push(this);
  }
}

function createEngine() {
  const onError = vi.fn();
  const engine = new TrailerAudioEngine(onError);
  engine.setVoiceoverEnabled(true);
  engine.start();
  return { engine, onError };
}

beforeEach(() => {
  RecordedScene.instances = [];
  vi.stubGlobal("Audio", RecordedScene);
});

afterEach(() => { vi.unstubAllGlobals(); });

describe("recorded trailer narration", () => {
  it("plays and synchronizes narration without creating a sound graph in narration-only mode", async () => {
    const audioContext = vi.fn(function () { throw new Error("Procedural audio must stay off"); });
    vi.stubGlobal("AudioContext", audioContext);
    const engine = new TrailerAudioEngine(() => {}, {
      narrationOnly: true,
      voiceOffsetSeconds: 0.18,
    });
    engine.setVoiceoverEnabled(true);
    engine.start();
    engine.playKeystrokeTick(1);
    // The Love scene also used to create an additional resolution chime.
    engine.updateScene(10, 420, 560, "Recorded narration", 420);
    engine.updateScene(10, 420.1, 560, "Recorded narration", 420);
    expect(RecordedScene.instances).toHaveLength(1);
    expect(RecordedScene.instances[0].paused).toBe(true);
    expect(RecordedScene.instances[0].play).not.toHaveBeenCalled();
    engine.updateScene(10, 425.18, 560, "Recorded narration", 420);
    const voice = RecordedScene.instances[0];
    await Promise.resolve();
    expect(voice.paused).toBe(false);
    expect(voice.src).toBe("/audio/scene-11.mp3");
    expect(voice.currentTime).toBeCloseTo(5);
    engine.setMuted(true);
    expect(voice.muted).toBe(true);
    engine.pause();
    expect(voice.paused).toBe(true);
    engine.start();
    engine.updateScene(10, 432.18, 560, "Recorded narration", 420);
    expect(voice.currentTime).toBeCloseTo(12);
    expect(voice.playbackRate).toBe(1);
    expect(voice.paused).toBe(false);
    engine.requestVoiceoverSeek();
    engine.updateScene(10, 420.05, 560, "Recorded narration", 420);
    engine.updateScene(10, 420.1, 560, "Recorded narration", 420);
    expect(voice.paused).toBe(true);
    expect(voice.currentTime).toBeCloseTo(12);
    engine.updateScene(10, 420.28, 560, "Recorded narration", 420);
    expect(voice.currentTime).toBeCloseTo(0.1);
    expect(RecordedScene.instances).toHaveLength(1);
    expect(audioContext).not.toHaveBeenCalled();
    engine.destroy();
  });

  it("does not repeat narration after a delayed clock update, while honoring an explicit backward seek", async () => {
    const { engine } = createEngine();
    engine.updateScene(0, 10, 500, "Recorded narration", 5);
    const voice = RecordedScene.instances[0];
    await Promise.resolve();
    voice.currentTime = 7;
    engine.updateScene(0, 10.5, 500, "Recorded narration", 5);
    expect(voice.currentTime).toBe(7);

    engine.requestVoiceoverSeek();
    engine.updateScene(0, 7, 500, "Recorded narration", 5);
    expect(voice.currentTime).toBe(2);
    expect(voice.playbackRate).toBe(1);
    engine.destroy();
  });

  it("loads narration during the section title without playing it when metadata arrives early", async () => {
    const engine = new TrailerAudioEngine(() => {}, {
      narrationOnly: true,
      voiceOffsetSeconds: 2.4,
    });
    engine.setVoiceoverEnabled(true);
    engine.start();
    engine.updateScene(7, 301.05, 560, "Recorded narration", 301);
    const voice = RecordedScene.instances[0];
    expect(voice.src).toBe("/audio/scene-8.mp3");
    expect(voice.play).not.toHaveBeenCalled();
    expect(engine.waitingForVoiceover).toBe(false);

    engine.updateScene(7, 302.3, 560, "Recorded narration", 301);
    voice.dispatchEvent(new Event("loadedmetadata"));
    expect(voice.play).not.toHaveBeenCalled();
    expect(voice.paused).toBe(true);
    expect(voice.currentTime).toBe(0);

    engine.updateScene(7, 303.45, 560, "Recorded narration", 301);
    expect(engine.waitingForVoiceover).toBe(true);
    voice.readyState = 3;
    expect(engine.waitingForVoiceover).toBe(false);
    await Promise.resolve();
    expect(RecordedScene.instances).toHaveLength(1);
    expect(voice.paused).toBe(false);
    expect(voice.currentTime).toBe(0);
    expect(voice.playbackRate).toBe(1);
    engine.destroy();
  });

  it("seeks within a scene and resumes at the film position without restarting or retiming the recording", async () => {
    const { engine } = createEngine();
    engine.updateScene(0, 12, 500, "Recorded narration", 5);
    const audio = RecordedScene.instances[0];
    expect(audio.currentTime).toBe(7);
    await Promise.resolve();

    engine.pause();
    expect(audio.paused).toBe(true);
    expect(audio.currentTime).toBe(7);
    engine.start();
    engine.updateScene(0, 12, 500, "Recorded narration", 5);
    expect(audio.play).toHaveBeenCalledTimes(2);
    await Promise.resolve();

    engine.updateScene(0, 30, 500, "Recorded narration", 5);
    expect(audio.currentTime).toBe(25);
    expect(audio.playbackRate).toBe(1);
    expect(RecordedScene.instances).toHaveLength(1);
    engine.destroy();
  });

  it("mutes and restores the same running recording, and enables narration at the current position", async () => {
    const { engine } = createEngine();
    engine.updateScene(0, 7, 500, "Recorded narration", 5);
    const audio = RecordedScene.instances[0];
    await Promise.resolve();
    engine.setMuted(true);
    expect(audio.muted).toBe(true);
    expect(audio.paused).toBe(false);
    engine.updateScene(0, 17, 500, "Recorded narration", 5);
    engine.setMuted(false);
    expect(audio.muted).toBe(false);
    expect(audio.currentTime).toBe(12);

    engine.setVoiceoverEnabled(false);
    expect(audio.paused).toBe(true);
    engine.updateScene(0, 23, 500, "Recorded narration", 5);
    engine.setVoiceoverEnabled(true);
    engine.updateScene(0, 23, 500, "Recorded narration", 5);
    expect(audio.currentTime).toBe(18);
    expect(audio.paused).toBe(false);
    expect(RecordedScene.instances).toHaveLength(1);
    engine.destroy();
  });

  it("stops the previous recording on scene changes and when seeking back into the opening splash", () => {
    const { engine } = createEngine();
    engine.updateScene(0, 8, 500, "First scene", 5);
    const first = RecordedScene.instances[0];
    engine.updateScene(1, 45, 500, "Second scene", 40);
    expect(first.paused).toBe(true);
    const second = RecordedScene.instances[1];
    expect(second.src).toBe("/audio/scene-2.mp3");
    expect(second.currentTime).toBe(5);
    engine.clearScene();
    expect(second.paused).toBe(true);
    engine.destroy();
  });

  it("reports a failed recording once instead of substituting an unrelated browser voice or retrying every frame", async () => {
    const { engine, onError } = createEngine();
    engine.updateScene(0, 5, 500, "Recorded narration", 5);
    const audio = RecordedScene.instances[0];
    audio.dispatchEvent(new Event("error"));
    expect(onError).toHaveBeenLastCalledWith(true);
    engine.updateScene(0, 6, 500, "Recorded narration", 5);
    engine.updateScene(0, 7, 500, "Recorded narration", 5);
    await Promise.resolve();
    expect(RecordedScene.instances).toHaveLength(1);
    expect(onError.mock.calls.filter(([failed]) => failed)).toHaveLength(1);

    engine.setVoiceoverEnabled(false);
    engine.setVoiceoverEnabled(true);
    engine.updateScene(0, 8, 500, "Recorded narration", 5);
    expect(RecordedScene.instances).toHaveLength(2);
    expect(RecordedScene.instances[1].currentTime).toBe(3);
    engine.destroy();
  });

  it("ignores an old scene's delayed playback rejection after the next scene has started", async () => {
    const { engine, onError } = createEngine();
    engine.updateScene(0, 5, 500, "First scene", 5);
    const first = RecordedScene.instances[0];
    await Promise.resolve();
    let rejectOldPlay: (reason: Error) => void = () => {};
    first.play.mockImplementationOnce(() => new Promise<void>((_resolve, reject) => { rejectOldPlay = reject; }));
    engine.pause();
    engine.start();
    engine.updateScene(0, 6, 500, "First scene", 5);
    engine.updateScene(1, 40, 500, "Second scene", 40);
    rejectOldPlay(new Error("Old request failed"));
    await Promise.resolve();
    await Promise.resolve();
    expect(onError.mock.calls.some(([failed]) => failed)).toBe(false);
    expect(RecordedScene.instances[1].paused).toBe(false);
    engine.destroy();
  });

  it("does not report a cancelled play request as failure after pause and immediate resume", async () => {
    const { engine, onError } = createEngine();
    engine.updateScene(0, 5, 500, "Recorded narration", 5);
    const audio = RecordedScene.instances[0];
    await Promise.resolve();
    let rejectCancelledPlay: (reason: Error) => void = () => {};
    audio.play.mockImplementationOnce(() => new Promise<void>((_resolve, reject) => {
      rejectCancelledPlay = reject;
    }));
    engine.pause();
    engine.start();
    engine.updateScene(0, 7, 500, "Recorded narration", 5);
    engine.pause();
    engine.start();
    engine.updateScene(0, 7, 500, "Recorded narration", 5);
    rejectCancelledPlay(new Error("Playback was interrupted by pause"));
    await Promise.resolve();
    await Promise.resolve();
    expect(onError.mock.calls.some(([failed]) => failed)).toBe(false);
    expect(audio.paused).toBe(false);
    expect(audio.currentTime).toBe(2);
    engine.destroy();
  });
});
