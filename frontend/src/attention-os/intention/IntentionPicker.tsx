import { useId, type ReactNode } from "react";
import type { IntentTone } from "../focus-nav/IntentCard";
import "../focus-nav/intent-card.css";
import "./intention-picker.css";

/** Native, keyboard-operable purpose selection. Attention budgeting is separate. */
export function IntentionPicker<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: ReadonlyArray<{ value: T; title: string; description: string; icon: ReactNode; tone: IntentTone }>;
  value: T;
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset className="intention-picker">
      <legend className="dot-label">{label}</legend>
      <div className="intention-picker-options">
        {options.map(option => (
          <label key={option.value} className="intention-option" data-tone={option.tone}>
            <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span className="intention-option-icon" aria-hidden="true">{option.icon}</span>
            <span className="intention-option-copy"><strong>{option.title}</strong><span>{option.description}</span></span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
