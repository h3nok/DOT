declare module "*/scripts/channel-inquiry-video.mjs" {
  export interface InquiryCaption {
    start: number;
    end: number;
    layout?: "center" | "split";
    badge?: string;
    eyebrow: string;
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
    captions: InquiryCaption[];
  }

  export const INQUIRY_VIDEOS: InquiryVideoSpec[];
  export function inquiryTypeTicks(video: InquiryVideoSpec): number[];
  export function inquirySubtitles(video: InquiryVideoSpec): string;
  export function mountInquiryCanvas(
    canvas: HTMLCanvasElement,
    options: {
      video: InquiryVideoSpec;
      identity: Record<string, unknown>;
      theme?: "dark" | "light";
    },
  ): {
    seek: (seconds: number) => void;
  };
}
