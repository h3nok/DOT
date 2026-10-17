import { useAmmContent } from "../../content/editable/useAmmContent";
import MEDIA from "../../content/amm-media.json";
import { Artwork } from "../../attention-os/explainer/Artwork";
import "./amm-media.css";

/** The author's transparent artwork sits directly on the page, uncropped. */
export function AmmFeature() {
  const AMM = useAmmContent();
  const art = MEDIA.illustration;
  return <div className="amm-feature">
    <Artwork priority image={{ ...art, full: AMM.artwork.src, title: AMM.artwork.title, alt: AMM.artwork.alt }} />
  </div>;
}
