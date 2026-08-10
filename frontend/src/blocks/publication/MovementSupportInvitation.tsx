import { ArrowUpRight, Coffee, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { BookAction } from "./BookPrimitives";

export function MovementSupportInvitation({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={`book-support-invitation${compact ? " is-compact" : ""}`}
      aria-labelledby={compact ? "book-support-title-compact" : "book-support-title"}
    >
      <div className="book-support-mark" aria-hidden="true">
        <Coffee className="h-5 w-5" />
      </div>
      <div className="book-support-copy">
        <p className="book-overline">Reader-supported work</p>
        <h2 id={compact ? "book-support-title-compact" : "book-support-title"}>
          Help build what comes next.
        </h2>
        <p>
          DOT takes no advertising. Contributions help keep Lumen grounded,
          deepen the reader, and fund the next public experiments.
        </p>
        <div className="book-support-trust">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          One-time, private by default, with no change in access or standing.
        </div>
      </div>
      <BookAction asChild variant="secondary">
        <Link to="/?support=open">
          Support the work
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </BookAction>
    </section>
  );
}

export default MovementSupportInvitation;
