declare module "*/scripts/channel-inquiry-video.mjs" {
  export type TrailerDiagramMode =
    | "seed"
    | "outer_scan"
    | "intersection"
    | "canvas_build"
    | "painting_mesh"
    | "high_entropy"
    | "coherence"
    | "finale";

  export interface TrailerSceneSpec {
    id: string;
    number: number;
    start: number;
    end: number;
    timecode: string;
    mode: TrailerDiagramMode;
    actHeader: string;
    primaryStatement: string;
    systemSubtleTag: string;
    focusTerm?: string;
    lines: string[];
    notes?: string[];
    concept?: string;
    axiom?: string;
    audio?: {
      rootHz: number;
      harmonicHz: number;
      thirdHz?: number;
      octaveHz?: number;
      filterHz: number;
      pulseBpm: number;
      tensionNoise: number;
      shockwave?: boolean;
      mp3Url: string;
    };
  }

  export interface InquiryCaption {
    id?: string;
    number?: number;
    start: number;
    end: number;
    layout?: "center" | "split";
    mode?: TrailerDiagramMode;
    badge?: string;
    eyebrow: string;
    actHeader?: string;
    primaryStatement?: string;
    systemSubtleTag?: string;
    focusTerm?: string;
    lines: string[];
    note?: string;
    notes?: string[];
    concept?: string;
    axiom?: string;
  }

  export interface InquiryVideoSpec {
    name: string;
    baseName?: string;
    title: string;
    duration: number;
    samples: number[];
    scenes?: TrailerSceneSpec[];
    captions: InquiryCaption[];
  }

  export const TRAILER_SCENES: TrailerSceneSpec[];
  export const TRAILER_VOICE_OFFSET_SECONDS: number;
  export const INQUIRY_VIDEOS: InquiryVideoSpec[];
  export function inquiryTypeTicks(video: InquiryVideoSpec): number[];
  export function inquirySubtitles(video: InquiryVideoSpec): string;
  export function mountInquiryCanvas(
    canvas: HTMLCanvasElement,
    options: {
      video: InquiryVideoSpec;
      identity: Record<string, unknown>;
      theme?: "dark" | "light";
      diagramOnly?: boolean;
    },
  ): {
    seek: (seconds: number) => void;
  };
}
