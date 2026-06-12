import { useEffect, useState } from "react";
import {
  soundscape,
  type SoundscapeType,
} from "../../services/SoundscapeService";

export const useSoundscapeController = (initialVolume = 0.5) => {
  const [soundType, setSoundType] = useState<SoundscapeType>("off");
  const [volume, setVolumeState] = useState<number>(initialVolume);

  useEffect(() => {
    soundscape.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    return () => {
      soundscape.stop();
    };
  }, []);

  const setVolume = (nextVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, nextVolume));
    setVolumeState(clampedVolume);
    soundscape.setVolume(clampedVolume);
  };

  const setSoundscape = async (type: SoundscapeType) => {
    setSoundType(type);
    if (type === "off") {
      soundscape.stop();
      return;
    }

    await soundscape.start(type);
  };

  return {
    soundType,
    volume,
    setVolume,
    setSoundscape,
  };
};
