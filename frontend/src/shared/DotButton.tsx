import { useId, type ComponentProps, type ReactNode } from "react";
import { Link } from "react-router-dom";
import "./dot-button.css";

interface ActionContent {
  label: string;
  description?: string;
  icon?: ReactNode;
  endIcon?: ReactNode;
  className?: string;
}

type NativeProps<T> = Omit<T, keyof ActionContent | "children" | "aria-labelledby" | "aria-describedby">;

export type DotButtonProps = ActionContent & (
  | (NativeProps<ComponentProps<"button">> & { to?: never; href?: never })
  | (NativeProps<ComponentProps<typeof Link>> & { to: string; href?: never; disabled?: never })
  | (NativeProps<ComponentProps<"a">> & { href: string; to?: never; disabled?: never })
);

/** Shared primary action: native button for commands, a real link for navigation.
 * Its description is separate from the accessible name; icons are decorative. */
export function DotButton({
  label,
  description,
  icon,
  endIcon,
  className = "",
  ...props
}: DotButtonProps) {
  const id = useId();
  const attributes = {
    className: `dot-button ${className}`.trim(),
    "aria-labelledby": `${id}-label`,
    "aria-describedby": description ? `${id}-description` : undefined,
    "data-description": description ? "true" : undefined,
  };
  const content = (
    <>
      {icon && <span className="dot-button__icon" aria-hidden="true">{icon}</span>}
      <span className="dot-button__copy">
        <strong id={`${id}-label`}>{label}</strong>
        {description && <span id={`${id}-description`}>{description}</span>}
      </span>
      {endIcon && <span className="dot-button__end-icon" aria-hidden="true">{endIcon}</span>}
    </>
  );

  if (props.to !== undefined) {
    return <Link {...props} {...attributes} data-directional="true">{content}</Link>;
  }
  if (props.href !== undefined) {
    return <a {...props} {...attributes} data-directional="true">{content}</a>;
  }
  return <button {...props} {...attributes} type={props.type ?? "button"}>{content}</button>;
}
