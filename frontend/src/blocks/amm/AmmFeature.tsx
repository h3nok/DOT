import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useInView } from "framer-motion";
import { useAmmContent } from "../../content/editable/useAmmContent";
import MEDIA from "../../content/amm-media.json";
import { Artwork } from "../../attention-os/explainer/Artwork";
import { useOrganism } from "../../organism/OrganismContext";
import { AmmButton } from "./AmmControls";
import "./amm-media.css";

/** A silent, pausable public hero loop. The still artwork is always available. */
export function AmmFeature() {
  const AMM = useAmmContent();
  const { config, reducedMotion } = useOrganism();
  const still = reducedMotion || config.stillness || !config.enabled;
  const container = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const inView = useInView(container, { amount: 0.35 });
  const [visible, setVisible] = useState(!document.hidden);
  const [requested, setRequested] = useState(!still);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  const enabled = !still && !saveData && !failed;
  const art = MEDIA.illustration;

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (still) setRequested(false);
  }, [still]);

  useEffect(() => {
    const clip = video.current;
    if (!enabled || !clip) return;
    const fail = () => setFailed(true);
    const inspectAlpha = () => {
      // A decoder may support VP9 but discard its alpha plane. Inspect one
      // clear corner before revealing the clip, preserving the still fallback.
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 2;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("No alpha inspection context");
        context.drawImage(clip, clip.videoWidth - 2, 0, 2, 2, 0, 0, 2, 2);
        if (context.getImageData(0, 0, 1, 1).data[3] > 8) throw new Error("No video transparency");
        setReady(true);
      } catch { fail(); }
    };
    const play = () => setPlaying(true);
    const pause = () => setPlaying(false);
    clip.addEventListener("loadeddata", inspectAlpha);
    clip.addEventListener("error", fail);
    clip.addEventListener("play", play);
    clip.addEventListener("pause", pause);
    // Cached/local media can finish loading before React commits its handlers.
    if (clip.error) fail();
    else if (clip.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) inspectAlpha();
    return () => {
      clip.removeEventListener("loadeddata", inspectAlpha);
      clip.removeEventListener("error", fail);
      clip.removeEventListener("play", play);
      clip.removeEventListener("pause", pause);
    };
  }, [enabled]);

  useEffect(() => {
    const clip = video.current;
    if (!clip) return;
    if (enabled && requested && ready && inView && visible) {
      let cancelled = false;
      void clip.play().catch(() => { if (!cancelled) setRequested(false); });
      return () => { cancelled = true; clip.pause(); };
    }
    clip.pause();
  }, [enabled, requested, ready, inView, visible]);

  const PlaybackIcon = playing ? Pause : Play;

  return <div ref={container} className="amm-feature amm-feature--motion" data-motion-ready={enabled && ready || undefined}>
    <div onClickCapture={() => setRequested(false)}>
      <Artwork priority image={{ ...art, full: AMM.artwork.src, title: AMM.artwork.title, alt: AMM.artwork.alt }} />
    </div>
    {enabled && <video ref={video} className="amm-hero-motion" src={MEDIA.heroMotion.src}
      width={MEDIA.heroMotion.width} height={MEDIA.heroMotion.height} muted loop playsInline preload="auto"
      aria-hidden="true" tabIndex={-1} disablePictureInPicture />}
    {enabled && <AmmButton className="amm-media-toggle" icon={<PlaybackIcon />} disabled={!ready}
      label={playing ? "Pause" : "Play"} title="The Host · silent animation" onClick={() => setRequested(value => !value)} />}
  </div>;
}
