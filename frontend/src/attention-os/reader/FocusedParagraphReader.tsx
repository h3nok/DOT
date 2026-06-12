import React from "react";
import { CornerDownRight } from "lucide-react";
import EnhancedMarkdown from "../../shared/components/ui/EnhancedMarkdown";

export interface FocusReaderParagraph {
  title: string;
  markdown: string;
}

interface FocusedParagraphReaderProps {
  paragraphs: FocusReaderParagraph[];
  activeIndex: number | null;
  bionicMode: boolean;
  onActiveIndexChange: (index: number | null) => void;
  className?: string;
}

export const FocusedParagraphReader: React.FC<FocusedParagraphReaderProps> = ({
  paragraphs,
  activeIndex,
  bionicMode,
  onActiveIndexChange,
  className = "",
}) => {
  return (
    <div
      className={`space-y-4 my-2 overflow-y-auto max-h-[380px] pr-2 custom-scrollbar ${className}`}
    >
      {paragraphs.map((paragraph, index) => {
        const isActive = activeIndex === index;
        const isAnyActive = activeIndex !== null;
        const isSibling = isAnyActive && !isActive;

        return (
          <div
            key={paragraph.title}
            onMouseEnter={() => onActiveIndexChange(index)}
            onMouseLeave={() => onActiveIndexChange(null)}
            onClick={() => onActiveIndexChange(isActive ? null : index)}
            className="transition-all duration-500 transform relative py-3.5 px-4 rounded-xl border border-transparent cursor-pointer"
            style={{
              opacity: isSibling ? 0.22 : 1.0,
              filter: isSibling ? "blur(1.5px) grayscale(50%)" : "none",
              transform: isSibling
                ? "scale(0.985)"
                : isActive
                  ? "scale(1.01)"
                  : "scale(1.0)",
              background: isActive
                ? "rgba(var(--primary-rgb), 0.04)"
                : "transparent",
              borderColor: isActive
                ? "rgba(var(--primary-rgb), 0.15)"
                : "transparent",
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <CornerDownRight
                className={`w-3.5 h-3.5 ${isActive ? "text-primary" : "text-muted-foreground/40"}`}
              />
              <span
                className={`font-mono text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-primary" : "text-muted-foreground/60"}`}
              >
                {paragraph.title}
              </span>
            </div>

            <EnhancedMarkdown
              content={paragraph.markdown}
              bionicMode={bionicMode}
              maxWidth="full"
              fontSize="sm"
              className="transition-all duration-300 select-text"
            />
          </div>
        );
      })}
    </div>
  );
};
