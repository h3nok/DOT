import { useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, CornerDownLeft } from "lucide-react";
import AMM from "../../content/amm.json";

/** A finite, reader-controlled explanation of the manuscript's process lens. */
export function AmmAnalysis() {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const { steps } = AMM.analysis;
  const step = steps[selected];
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % steps.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + steps.length - 1) % steps.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = steps.length - 1;
    else return;
    event.preventDefault();
    setSelected(next);
    tabs.current[next]?.focus();
  }
  return (
    <section id="amm-analysis" className="amm-analysis" aria-labelledby="amm-analysis-title">
      <header className="amm-section-heading">
        <div><p className="amm-eyebrow">01 / The analytical spine</p><h2 id="amm-analysis-title">{AMM.analysis.title}</h2></div>
        <p>{AMM.analysis.description}</p>
      </header>
      <div className="amm-process">
        <div className="amm-process-tabs" role="tablist" aria-label="Explore the AMM analysis">
          {steps.map((item, index) => <button key={item.id} id={`amm-tab-${item.id}`} role="tab" type="button" aria-selected={selected === index} aria-controls={`amm-panel-${item.id}`} tabIndex={selected === index ? 0 : -1} ref={node => { tabs.current[index] = node; }} onClick={() => setSelected(index)} onKeyDown={event => navigate(event, index)}><span className="amm-step-number">0{index + 1}</span><span>{item.label}</span><ArrowRight aria-hidden="true" /></button>)}
        </div>
        {steps.map((item, index) => <div key={item.id} hidden={selected !== index} role="tabpanel" id={`amm-panel-${item.id}`} aria-labelledby={`amm-tab-${item.id}`} tabIndex={0} className="amm-process-panel">
          {selected === index && <>
            <div className="amm-process-diagram" aria-label={`${step.diagram.join(" → ")}. ${step.connection}`}>
              <span className="amm-eyebrow">Within the model</span>
              <div className="amm-process-nodes" aria-hidden="true">{step.diagram.map((label, i) => <div key={label}><span className={`amm-node amm-node--${i}`}><i />{label}</span>{i < 2 && <ArrowDown />}</div>)}</div>
              <p><CornerDownLeft aria-hidden="true" />{step.connection}</p>
            </div>
            <div className="amm-process-explanation"><p className="amm-eyebrow">{step.label}</p><h3>{step.title}</h3><p>{step.description}</p><div className="amm-analysis-question"><span>Ask of the arrangement</span><p>{step.question}</p></div><Link to={`${AMM.introduction.route}#${step.anchor}`}>Examine it in the introduction <ArrowRight aria-hidden="true" /></Link></div>
          </>}
        </div>)}
        <p className="amm-process-return"><CornerDownLeft aria-hidden="true" /> Consequences return as conditions. The next encounter begins there.</p>
      </div>
      <details className="amm-method"><summary>The connection to DOT—and how to read this model</summary><div><p>{AMM.analysis.lineage} <Link to={AMM.analysis.lineageRoute}>Explore DOT’s Experience Loop <ArrowRight aria-hidden="true" /></Link></p><p>{AMM.analysis.evidence}</p><blockquote>{step.quote}<cite>— The Anatomy of the Host</cite></blockquote></div></details>
    </section>
  );
}
