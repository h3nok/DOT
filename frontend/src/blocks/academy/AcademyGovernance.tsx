import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { academyAreasFor, academyPrograms } from "../../content/academy/academyData";

const invariants = [
  {
    index: "01",
    title: "The Observer in the Inquiry",
    role: "Consciousness is not a footnote to physical cosmology. The inquiry integrates the experiencing agent into the foundational architecture of reality.",
  },
  {
    index: "02",
    title: "Sovereign Attention",
    role: "No engagement feeds, infinite scrolls, or vanity metrics. Genuine intellectual progress requires stillness, intention, and cognitive sovereignty.",
  },
  {
    index: "03",
    title: "Epistemic Discipline",
    role: "Every assertion must explicitly declare its burden: Observation, Model, Hypothesis, or Speculation. No speculation may masquerade as fact.",
  },
  {
    index: "04",
    title: "Permanent Dissent & Open Seams",
    role: "Counter-arguments, unresolved debts, and negative results remain permanently in the public record rather than being quietly deleted.",
  },
] as const;

const standards = [
  {
    label: "Kind",
    value: "Definition · Diagram · Hypothesis · Objection · Response · Experiment · Excerpt · Essay",
  },
  {
    label: "Claim level",
    value: "Observation · Model · Hypothesis · Speculation",
  },
  {
    label: "Provenance",
    value: "Source · edition · relationship to earlier work",
  },
  {
    label: "Disposition",
    value: "Open · revised · inconclusive · not supported",
  },
] as const;

/** The Academy's charter and planned forms, opened deliberately by the reader. */
export function AcademyGovernance() {
  return (
    <details className="border-t border-border/60">
      <summary className="dot-page-container dot-page-wide cursor-pointer py-6 text-sm font-semibold">
        About the Academy: principles, programs, and editorial standards
      </summary>
      {/* ── Pillars of the Revolution ──────────────────────────────────── */}
      <section
        className="academy-section academy-invariants-section"
        aria-labelledby="academy-invariants-title"
      >
        <div className="dot-page-container dot-page-wide">
          <header className="academy-section-heading">
            <div>
              <p className="dot-label">The Intellectual Charter</p>
              <h2 id="academy-invariants-title">Four invariants of the new inquiry.</h2>
            </div>
            <p>
              An institution is defined by what it refuses to compromise. These
              principles govern every contribution, experiment, and debate.
            </p>
          </header>

          <div className="academy-invariants-grid">
            {invariants.map((item) => (
              <div key={item.index} className="academy-invariant-card">
                <span className="academy-invariant-index">{item.index}</span>
                <h3>{item.title}</h3>
                <p>{item.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Programs Under Assembly ────────────────────────────────────── */}
      <section
        id="academy-programs"
        className="academy-section academy-programs-section scroll-mt-16"
        aria-labelledby="academy-programs-title"
      >
        <div className="dot-page-container dot-page-wide">
          <header className="academy-section-heading">
            <div>
              <p className="dot-label">The Emerging Architecture</p>
              <h2 id="academy-programs-title">Three programs. Eight forms of work.</h2>
            </div>
            <p>
              The Academy organizes intellectual labor into three structured programs.
              Each form of work serves a distinct epistemic purpose.
            </p>
          </header>

          <div className="academy-programs-overview">
            {academyPrograms.map((program) => {
              const areas = academyAreasFor(program.id);
              return (
                <div key={program.id} className="academy-program-card">
                  <header className="academy-program-card__header">
                    <span className="academy-program-card__index">{program.index}</span>
                    <div>
                      <h3>{program.title}</h3>
                      <p>{program.purpose}</p>
                    </div>
                  </header>

                  <div className="academy-program-card__areas">
                    {areas.map((area) => (
                      <div
                        key={area.id}
                        className="academy-program-card__area-item"
                        data-phase={area.phase}
                      >
                        <div className="academy-program-card__area-head">
                          <span className="academy-program-card__area-title">{area.title}</span>
                          <span className="academy-program-card__area-status dot-label">
                            {area.phase === "available" ? "Available" : "In development"}
                          </span>
                        </div>
                        <p className="academy-program-card__area-role">{area.currentState}</p>
                        {area.href && (
                          <Link to={area.href} className="academy-program-card__area-link group">
                            <span>{area.action}</span>
                            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Epistemic Standards ────────────────────────────────────────── */}
      <section
        className="academy-section academy-standard-section"
        aria-labelledby="academy-standard-title"
      >
        <div className="dot-page-container dot-page-wide">
          <header className="academy-section-heading">
            <div>
              <p className="dot-label">The Academy Standard</p>
              <h2 id="academy-standard-title">Every contribution must show its burden.</h2>
            </div>
            <p>
              Readers must never guess what a work is, where it originated, or what
              evidence could overturn it.
            </p>
          </header>

          <dl className="academy-standards">
            {standards.map((standard, index) => (
              <div key={standard.label}>
                <dt>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {standard.label}
                </dt>
                <dd>{standard.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

    </details>
  );
}
