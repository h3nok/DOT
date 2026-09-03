import { Editable } from "../../../content/editable";
import { HERO_CONCEPTS, type Concept } from "./heroData";

type ClaimLevel = Concept["level"];

const LEVEL_LABEL: Record<ClaimLevel, string> = {
  observation: "Observation",
  model: "Model",
  hypothesis: "Hypothesis",
};

/**
 * A finite, open ledger of Book One's vocabulary.
 *
 * Nothing rotates or waits behind interaction: the reader can compare every
 * definition and its epistemic level at once. The typography carries the
 * hierarchy, so these read as entries in an argument rather than a card wall.
 */
export function HeroConcepts() {
  return (
    <ol className="home-concept-ledger" aria-label="Book One concept index">
      {HERO_CONCEPTS.map((concept, index) => (
        <li key={concept.id} className="home-concept-ledger-item">
          <span className="home-concept-ledger-number" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="home-concept-ledger-entry">
            <div className="home-concept-ledger-heading">
              <h3>{concept.term}</h3>
              <span
                className="home-concept-level"
                title="Book One distinguishes observation, model, hypothesis, and speculation."
              >
                {LEVEL_LABEL[concept.level]}
              </span>
            </div>
            <Editable
              id={concept.id}
              as="p"
              multiline
              text={concept.text}
              className="home-concept-ledger-definition"
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default HeroConcepts;
