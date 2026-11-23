import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { useAmmContent } from "../../content/editable/useAmmContent";
import MEDIA from "../../content/amm-media.json";
import { Artwork } from "../../attention-os/explainer/Artwork";
import { useOrganism } from "../../organism/OrganismContext";
import "./amm-media.css";

/**
 * A silent public hero loop that plays on its own (the author, 2026-11-22: "Remove the pause button
 * from the hero. Auto play it."). It never plays for a reader who asked for stillness: reduced
 * motion, Still in Appearance (offered on every page), the organism switched off, or Save-Data keep
 * the still artwork, which is always there to inspect. It rests offscreen and in a hidden tab, and a
 * browser that refuses autoplay simply keeps the still.
 */
export function AmmFeature() {
  const AMM = useAmmContent();
  const { config, reducedMotion } = useOrganism();
  const still = reducedMotion || config.stillness || !config.enabled;
  const container = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const inView = useInView(container, { amount: 0.35 });
  const [visible, setVisible] = useState(!document.hidden);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  const enabled = !still && !saveData && !failed;
  const art = MEDIA.illustration;

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  // A clip mounted again (after stillness is lifted) is checked again before it shows.
  useEffect(() => {
    if (!enabled) setReady(false);
  }, [enabled]);

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
    clip.addEventListener("loadeddata", inspectAlpha);
    clip.addEventListener("error", fail);
    // Cached/local media can finish loading before React commits its handlers.
    if (clip.error) fail();
    else if (clip.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) inspectAlpha();
    return () => {
      clip.removeEventListener("loadeddata", inspectAlpha);
      clip.removeEventListener("error", fail);
    };
  }, [enabled]);

  useEffect(() => {
    const clip = video.current;
    if (!clip) return;
    if (enabled && !blocked && ready && inView && visible) {
      let cancelled = false;
      void clip.play().catch(() => { if (!cancelled) setBlocked(true); });
      return () => { cancelled = true; clip.pause(); };
    }
    clip.pause();
  }, [enabled, blocked, ready, inView, visible]);

  return <div ref={container} className="amm-feature amm-feature--motion" data-motion-ready={(enabled && ready && !blocked) || undefined}>
    <Artwork priority image={{ ...art, full: AMM.artwork.src, title: AMM.artwork.title, alt: AMM.artwork.alt }} />
    {enabled && <video ref={video} className="amm-hero-motion" src={MEDIA.heroMotion.src}
      width={MEDIA.heroMotion.width} height={MEDIA.heroMotion.height} muted loop playsInline preload="auto"
      aria-hidden="true" tabIndex={-1} disablePictureInPicture />}
  </div>;
}
