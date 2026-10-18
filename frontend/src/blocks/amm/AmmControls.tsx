import { useRef, type ComponentProps, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { DotButton, type DotButtonProps } from '../../shared/DotButton';
import './amm-controls.css';

/** Publication variants of the existing native button/link primitive. */
export function AmmButton({ variant = 'secondary', className = '', ...props }: DotButtonProps & { variant?: 'primary' | 'secondary' }) {
  return <DotButton {...props} className={`amm-button amm-button--${variant} ${className}`} />;
}

/** A labelled, resizable authoring field using the shared appearance tokens. */
export function AmmTextField({ label, id, ...props }: ComponentProps<'textarea'> & { id: string; label: string }) {
  return <div className="amm-text-field"><label htmlFor={id}>{label}</label><textarea id={id} {...props} /></div>;
}

/** One native link for an edition's artwork and copy, with one keyboard stop. */
export function AmmReadingLink({ label, className = '', ...props }: ComponentProps<typeof Link> & { label: string }) {
  return <Link {...props} aria-label={label} className={`amm-reading-link ${className}`} />;
}

/** A finite choice: pointer activation and arrow keys share the same state. */
export function AmmChoiceGroup({ label, options, selected, onChange }: {
  label: string;
  options: ReadonlyArray<{ id: string; label: string }>;
  selected: number;
  onChange: (index: number) => void;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % options.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    else return;
    event.preventDefault();
    onChange(next);
    buttons.current[next]?.focus();
  }
  return <div className="amm-choice-group" role="group" aria-label={label}>
    {options.map((option, index) => <button key={option.id} type="button"
      aria-pressed={selected === index} tabIndex={selected === index ? 0 : -1}
      ref={node => { buttons.current[index] = node; }}
      onClick={() => onChange(index)} onKeyDown={event => navigate(event, index)}>
      <span>0{index + 1}</span>{option.label}
    </button>)}
  </div>;
}
