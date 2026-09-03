import type { InputHTMLAttributes } from "react";

interface DotSwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

/** The design system's switch: accent when on, border-grey when off. */
export function DotSwitch({ checked, onChange, label }: DotSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="dot-switch"
      data-checked={checked || undefined}
    >
      <span className="dot-switch__thumb" />
    </button>
  );
}

interface DotSliderProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "min" | "max" | "step" | "onChange" | "className"
  > {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  className?: string;
}

/** The design system's range input: one track, one accent thumb. */
export function DotSlider({
  value,
  min,
  max,
  step = 0.05,
  onChange,
  label,
  className = "",
  ...rest
}: DotSliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      aria-label={label}
      className={`dot-slider ${className}`}
      {...rest}
    />
  );
}
