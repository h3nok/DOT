export interface StayLogoProps {
  size?: number;
  className?: string;
  themeVariant?: "patriot" | "hearth" | "midnight" | "sovereign";
  animationState?: "sync" | "beacon" | "tectonic" | "blueprint";
  highlightElement?: "anchor" | "constellation" | "compass" | null;
  interactive?: boolean;
}

export const StayLogo = ({
  size = 48,
  className = "",
  themeVariant = "patriot",
  animationState = "sync",
  highlightElement = null,
  interactive = false,
}: StayLogoProps) => {
  const getThemeColors = () => {
    void themeVariant;
    return {
      primary: "currentColor",
      secondary: "currentColor",
      accent: "currentColor",
      glow: "color-mix(in oklch, currentColor 20%, transparent)",
    };
  };

  const colors = getThemeColors();
  const isBlueprint = animationState === "blueprint";
  const isBeacon = animationState === "beacon";
  const isTectonic = animationState === "tectonic";

  const getOpacity = (element: "anchor" | "constellation" | "compass") => {
    if (!highlightElement) return 1;
    return highlightElement === element ? 1 : 0.2;
  };

  const getGlowFilter = (element: "anchor" | "constellation" | "compass") => {
    if (highlightElement === element) {
      return "drop-shadow(0 0 8px currentColor)";
    }
    return undefined;
  };

  return (
    <div
      className={`relative flex items-center justify-center select-none transition-transform duration-500 ${interactive ? "hover:scale-105 active:scale-95 cursor-pointer" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      <style>{`
        @keyframes stay-rotate-mesh {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes stay-pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 4px color-mix(in oklch, currentColor 18%, transparent)); opacity: 0.7; }
          50% { filter: drop-shadow(0 0 16px color-mix(in oklch, currentColor 32%, transparent)); opacity: 1; }
        }
        @keyframes stay-pulse-dot {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes stay-orbit-ring-cw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes stay-orbit-ring-ccw {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes stay-orbit-ring-cw-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(180deg); }
        }
        @keyframes stay-orbit-ring-ccw-slow {
          0% { transform: rotate(180deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes stay-float-anchor {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2.2px); }
        }
        @keyframes stay-float-anchor-delayed {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-1.5px) scale(1.05); }
        }
        @keyframes stay-beacon-ping {
          0% { transform: scale(0.65); opacity: 0.95; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes stay-star-breathing {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.18); filter: brightness(1.35); }
        }
        @keyframes stay-packet-flow {
          0% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }

        .stay-orbit-ring-ccw {
          animation: stay-orbit-ring-ccw 18s linear infinite;
          transform-origin: center;
        }
        .stay-orbit-ring-cw {
          animation: stay-orbit-ring-cw 22s linear infinite;
          transform-origin: center;
        }
        .stay-orbit-ring-ccw-slow {
          animation: stay-orbit-ring-ccw-slow 35s linear infinite;
          transform-origin: center;
        }
        .stay-orbit-ring-cw-slow {
          animation: stay-orbit-ring-cw-slow 40s linear infinite;
          transform-origin: center;
        }
        .stay-animate-float-anchor {
          animation: stay-float-anchor 3.5s ease-in-out infinite;
          transform-origin: 50px 51px;
        }
        .stay-animate-float-anchor-delayed {
          animation: stay-float-anchor-delayed 3.5s ease-in-out infinite;
          animation-delay: 0.8s;
          transform-origin: 50px 46px;
        }
        .stay-animate-beacon-wave {
          animation: stay-beacon-ping 2.5s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          transform-origin: 50px 51px;
        }
        .stay-animate-star-glow-1 {
          animation: stay-star-breathing 3.5s ease-in-out infinite;
          transform-origin: 50px 16px;
        }
        .stay-packet-flow-line {
          stroke-dasharray: 6, 14;
          animation: stay-packet-flow 1.8s linear infinite;
        }
        .stay-animate-pulse-dot {
          animation: stay-pulse-dot 2s ease-in-out infinite;
        }
      `}</style>

      {/* Soft background ambient halo */}
      {!isBlueprint && (
        <div
          className="absolute inset-1 rounded-full blur-lg transition-all duration-700 animate-pulse"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, currentColor 12%, transparent) 0%, color-mix(in oklch, currentColor 6%, transparent) 50%, transparent 100%)",
            opacity: highlightElement ? 0.4 : 0.8,
          }}
        ></div>
      )}

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full relative z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Patriot Gradients */}
          <linearGradient
            id="patriotCrimsonShared"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient
            id="libertyBlueShared"
            x1="0%"
            y1="100%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient
            id="goldSunsetShared"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.7" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
          </linearGradient>

          {/* Hearth Gradients */}
          <linearGradient
            id="hearthEmberShared"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient
            id="hearthGoldShared"
            x1="0%"
            y1="100%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.75" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient
            id="hearthEarthShared"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.65" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.25" />
          </linearGradient>

          {/* Midnight Gradients */}
          <linearGradient
            id="cyberNeonShared"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient
            id="cyberTealShared"
            x1="0%"
            y1="100%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.75" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
          </linearGradient>

          {/* Sovereign Gradients */}
          <linearGradient
            id="sovereignGoldShared"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient
            id="sovereignSilverShared"
            x1="0%"
            y1="100%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient
            id="sovereignTitaniumShared"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* Outer Orbiting Compass Rings (Representing regional proximity boundaries) */}
        <g
          className="transition-all duration-500"
          style={{
            opacity: getOpacity("compass"),
            filter: getGlowFilter("compass"),
          }}
          stroke={colors.secondary}
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            strokeWidth="1.2"
            strokeOpacity={isBlueprint ? "0.6" : "0.35"}
            strokeDasharray="4,6"
            className={
              isBlueprint
                ? ""
                : isTectonic
                  ? "stay-orbit-ring-ccw-slow"
                  : "stay-orbit-ring-ccw"
            }
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke={colors.primary}
            strokeWidth="0.8"
            strokeOpacity={isBlueprint ? "0.6" : "0.25"}
            strokeDasharray="40,2,10,2"
            className={
              isBlueprint
                ? ""
                : isTectonic
                  ? "stay-orbit-ring-cw-slow"
                  : "stay-orbit-ring-cw"
            }
          />
          {!isBlueprint && (
            <circle
              cx="50"
              cy="50"
              r="47.5"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeOpacity="0.1"
              className="text-foreground"
            />
          )}
        </g>

        {/* Star Constellation Mesh Connections (Decentralized American Peer Topology) */}
        <g
          className="transition-all duration-500"
          style={{
            opacity: getOpacity("constellation"),
            filter: getGlowFilter("constellation"),
          }}
        >
          <g
            stroke="currentColor"
            strokeWidth="0.8"
            strokeOpacity={isBlueprint ? "0.4" : "0.15"}
            className="text-foreground/40"
          >
            <line x1="50" y1="16" x2="81" y2="38.5" />
            <line x1="81" y1="38.5" x2="69" y2="75" />
            <line x1="69" y1="75" x2="31" y2="75" />
            <line x1="31" y1="75" x2="19" y2="38.5" />
            <line x1="19" y1="38.5" x2="50" y2="16" />

            <line x1="50" y1="16" x2="69" y2="75" />
            <line x1="50" y1="16" x2="31" y2="75" />
            <line x1="81" y1="38.5" x2="19" y2="38.5" />
            <line x1="81" y1="38.5" x2="31" y2="75" />
            <line x1="19" y1="38.5" x2="69" y2="75" />
          </g>

          {!isBlueprint && (
            <g
              stroke={colors.secondary}
              strokeWidth="1.2"
              strokeLinecap="round"
            >
              <line
                x1="50"
                y1="16"
                x2="81"
                y2="38.5"
                strokeDasharray="10, 20"
                className="stay-packet-flow-line"
                style={{ animationDelay: "0s" }}
              />
              <line
                x1="81"
                y1="38.5"
                x2="69"
                y2="75"
                strokeDasharray="10, 20"
                className="stay-packet-flow-line"
                style={{ animationDelay: "0.3s" }}
              />
              <line
                x1="69"
                y1="75"
                x2="31"
                y2="75"
                strokeDasharray="10, 20"
                className="stay-packet-flow-line"
                style={{ animationDelay: "0.6s" }}
              />
              <line
                x1="31"
                y1="75"
                x2="19"
                y2="38.5"
                strokeDasharray="10, 20"
                className="stay-packet-flow-line"
                style={{ animationDelay: "0.9s" }}
              />
              <line
                x1="19"
                y1="38.5"
                x2="50"
                y2="16"
                strokeDasharray="10, 20"
                className="stay-packet-flow-line"
                style={{ animationDelay: "1.2s" }}
              />
            </g>
          )}
        </g>

        {/* Central Anchor Pin (Staying rooted in local physical community spaces) */}
        <g
          className="transition-all duration-500"
          style={{
            opacity: getOpacity("anchor"),
            filter: getGlowFilter("anchor"),
          }}
        >
          {isBeacon && (
            <path
              d="M50 31 C40.5 31 32 37.5 31 46 C31 60 50 72 50 72 C50 72 69 60 69 46 C68 37.5 59.5 31 50 31 Z"
              stroke={colors.primary}
              strokeWidth="1"
              fill="none"
              className="stay-animate-beacon-wave"
              style={{ transformOrigin: "50px 51px" }}
            />
          )}

          <path
            d="M50 31 C41.5 31 34 37.5 34 46 C34 58.5 50 71 50 71 C50 71 66 58.5 66 46 C66 37.5 58.5 31 50 31 Z"
            fill={colors.primary}
            stroke="#ffffff"
            strokeWidth="0.5"
            strokeOpacity="0.2"
            className={isBlueprint ? "" : "stay-animate-float-anchor"}
            style={{ transformOrigin: "50px 51px" }}
          />

          <circle
            cx="50"
            cy="46"
            r="8"
            fill={"currentColor"}
            fillOpacity="0.35"
            stroke="#ffffff"
            strokeWidth="0.6"
            strokeOpacity="0.4"
            className={isBlueprint ? "" : "stay-animate-float-anchor-delayed"}
            style={{ transformOrigin: "50px 46px" }}
          />

          <circle
            cx="50"
            cy="46"
            r="3.5"
            fill={colors.accent}
            className={isBlueprint ? "" : "stay-animate-pulse-dot"}
          />

          {/* Anchor flukes representing mechanical anchoring */}
          <path
            d="M 44 64 C 42 66, 38 65, 36 62 C 35 60, 36 58, 38 58 C 40 58, 41 60, 41 62"
            stroke={colors.primary}
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            className={isBlueprint ? "" : "stay-animate-float-anchor"}
            style={{ transformOrigin: "50px 51px" }}
          />
          <path
            d="M 56 64 C 58 66, 62 65, 64 62 C 65 60, 64 58, 62 58 C 60 58, 59 60, 59 62"
            stroke={colors.primary}
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            className={isBlueprint ? "" : "stay-animate-float-anchor"}
            style={{ transformOrigin: "50px 51px" }}
          />
        </g>

        {/* Outer Constellation Star Nodes */}
        <g
          className="transition-all duration-500"
          style={{ opacity: getOpacity("constellation") }}
        >
          <g className="stay-animate-star-glow-1">
            <circle
              cx="50"
              cy="16"
              r="3.5"
              fill="#ffffff"
              stroke={colors.secondary}
              strokeWidth="1.5"
            />
            <polygon
              points="50,13 51,15 53.5,16 51,17 50,19 49,17 46.5,16 49,15"
              fill="#ffffff"
              className="origin-center"
            />
          </g>

          <circle
            cx="81"
            cy="38.5"
            r="3"
            fill={colors.primary}
            className="stay-animate-pulse-dot"
            style={{ animationDelay: "0.4s" }}
          />
          <circle
            cx="69"
            cy="75"
            r="3.2"
            fill={colors.accent}
            className="stay-animate-pulse-dot"
            style={{ animationDelay: "0.8s" }}
          />
          <circle
            cx="31"
            cy="75"
            r="3.2"
            fill={colors.secondary}
            className="stay-animate-pulse-dot"
            style={{ animationDelay: "1.2s" }}
          />
          <circle
            cx="19"
            cy="38.5"
            r="3"
            fill={colors.primary}
            className="stay-animate-pulse-dot"
            style={{ animationDelay: "1.6s" }}
          />
        </g>
      </svg>
    </div>
  );
};

export default StayLogo;
