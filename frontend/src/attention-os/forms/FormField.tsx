import { useId, type ReactNode } from "react";
import "./forms.css";

interface FieldControl {
  id: string;
  "aria-describedby"?: string;
}

/** A native control with a persistent label and associated guidance. */
export function FormField({ label, hint, optional = false, children }: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: (control: FieldControl) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="intent-field">
      <label htmlFor={id}>{label}{optional && <span>Optional</span>}</label>
      {children({ id, "aria-describedby": hint ? `${id}-hint` : undefined })}
      {hint && <p id={`${id}-hint`} className="intent-field-hint">{hint}</p>}
    </div>
  );
}
