import { useId, useState } from "react";
import type { NotebookPrompt } from "./types";

type Answers = Record<string, string>;

function read(key: string): Answers {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Answers) : {};
  } catch {
    return {};
  }
}

function write(key: string, answers: Answers) {
  try {
    if (Object.values(answers).some((value) => value.trim())) window.sessionStorage.setItem(key, JSON.stringify(answers));
    else window.sessionStorage.removeItem(key);
  } catch {
    // Storage can be unavailable (private windows, blocked site data). The page still works.
  }
}

/**
 * A private worksheet: the reader applies a method to their own case, in their
 * own words. Answers stay in this tab only (sessionStorage) and are never sent.
 * The reader can save them as a text file or clear them at once. No score, no
 * count, no reminder (L5, L6, L9).
 */
export function Notebook({ storageKey, title, prompts, privacy, fileName, labels }: {
  storageKey: string;
  title: string;
  prompts: ReadonlyArray<NotebookPrompt>;
  /** Says plainly where the words are kept. */
  privacy: string;
  fileName: string;
  labels: { save: string; clear: string; confirmClear: string; keep: string; saved: string; cleared: string };
}) {
  const [answers, setAnswers] = useState<Answers>(() => (typeof window === "undefined" ? {} : read(storageKey)));
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState("");
  const base = useId();

  const change = (id: string, value: string) => {
    const next = { ...answers, [id]: value };
    setAnswers(next);
    write(storageKey, next);
  };
  const filled = prompts.some((prompt) => answers[prompt.id]?.trim());
  const save = () => {
    const text = [title, "", ...prompts.flatMap((prompt) => [prompt.label, prompt.prompt, "", answers[prompt.id]?.trim() || "—", ""])].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(labels.saved);
  };
  const clear = () => {
    setAnswers({});
    write(storageKey, {});
    setConfirming(false);
    setStatus(labels.cleared);
  };

  return (
    <form className="inq-notebook" aria-label={title} onSubmit={(event) => event.preventDefault()}>
      <p className="inq-notebook-privacy">{privacy}</p>
      {prompts.map((prompt, index) => {
        const id = `${base}-${prompt.id}`;
        return (
          <div key={prompt.id} className="inq-notebook-field">
            <label htmlFor={id}><span className="inq-notebook-step" aria-hidden="true">{index + 1}</span>{prompt.label}</label>
            <p id={`${id}-prompt`} className="inq-notebook-prompt">{prompt.prompt}</p>
            <textarea id={id} aria-describedby={`${id}-prompt`} rows={4} value={answers[prompt.id] ?? ""}
              onChange={(event) => change(prompt.id, event.target.value)} />
          </div>
        );
      })}
      <div className="inq-notebook-actions">
        <button type="button" className="inq-button" onClick={save} disabled={!filled}>{labels.save}</button>
        {confirming ? <>
          <button type="button" className="inq-button inq-button--quiet" onClick={clear}>{labels.confirmClear}</button>
          <button type="button" className="inq-button inq-button--quiet" onClick={() => setConfirming(false)}>{labels.keep}</button>
        </> : <button type="button" className="inq-button inq-button--quiet" onClick={() => setConfirming(true)} disabled={!filled}>{labels.clear}</button>}
      </div>
      <p className="inq-status" role="status" aria-live="polite">{status}</p>
    </form>
  );
}
