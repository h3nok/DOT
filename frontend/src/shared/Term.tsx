import * as HoverCard from "@radix-ui/react-hover-card";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { doctrineNodes } from "../content/doctrine/doctrineData";

const TERM_STYLE =
  "underline decoration-[color:var(--organism-accent-soft)] decoration-1 underline-offset-[3px] transition-colors hover:text-[color:var(--organism-accent-strong)] hover:decoration-[color:var(--organism-accent-strong)]";

export function Term({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const node = doctrineNodes.find((n) => n.id === id);

  if (!node) {
    return (
      <Link to={`/doctrine/${encodeURIComponent(id)}`} className={TERM_STYLE}>
        {children}
      </Link>
    );
  }

  return (
    <HoverCard.Root openDelay={180} closeDelay={150}>
      <HoverCard.Trigger asChild>
        <Link to={`/doctrine/${encodeURIComponent(id)}`} className={TERM_STYLE}>
          {children}
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="top"
          align="center"
          sideOffset={8}
          className="z-[80] w-72 rounded-xl border border-border/60 bg-background/95 p-4 text-foreground shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="dot-label text-[color:var(--organism-accent-strong)] font-semibold">
              {node.source.claimLevel}
            </span>
            <span className="font-mono text-[10px] uppercase text-muted-foreground/60">
              {node.kind}
            </span>
          </div>
          <h4 className="mt-1.5 font-serif text-sm font-semibold text-foreground">
            {node.title}
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {node.oneLine}
          </p>
          <div className="mt-3 border-t border-border/30 pt-2 text-right">
            <Link
              to={`/doctrine/${encodeURIComponent(id)}`}
              className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-[color:var(--organism-accent-strong)] hover:underline"
            >
              Explore in concept map
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
          <HoverCard.Arrow className="fill-border/60" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
