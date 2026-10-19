import { memo } from "react";
import artwork from "../assets/osce3-outline.svg?raw";

// Trusted, local SVG markup renders with the card instead of waiting for an
// external image download/decode. Keep its animation beneath the dimming layer.
const Osce3Artwork = memo(function Osce3Artwork() {
  return <div className="cert-badge-outline" aria-hidden="true" dangerouslySetInnerHTML={{ __html: artwork }} />;
});

export default Osce3Artwork;
