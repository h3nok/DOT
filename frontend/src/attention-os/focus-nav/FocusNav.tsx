import React from "react";

export interface FocusNavAction {
  label: string;
  href?: string;
  onSelect?: () => void;
}

interface FocusNavProps {
  primary: FocusNavAction;
  secondary?: FocusNavAction[];
  className?: string;
}

export const FocusNav: React.FC<FocusNavProps> = ({
  primary,
  secondary = [],
  className = "",
}) => {
  const renderAction = (
    action: FocusNavAction,
    kind: "primary" | "secondary",
  ) => {
    const classes =
      kind === "primary"
        ? "px-4 py-2 rounded-lg bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider"
        : "px-3 py-1.5 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground font-mono text-[10px] uppercase tracking-wider";

    if (action.href) {
      return (
        <a
          key={action.label}
          href={action.href}
          className={classes}
          onClick={action.onSelect}
        >
          {action.label}
        </a>
      );
    }

    return (
      <button
        key={action.label}
        type="button"
        className={classes}
        onClick={action.onSelect}
      >
        {action.label}
      </button>
    );
  };

  return (
    <nav
      className={`flex items-center gap-3 ${className}`}
      aria-label="Single focus navigation"
    >
      {renderAction(primary, "primary")}
      {secondary.map((action) => renderAction(action, "secondary"))}
    </nav>
  );
};
