import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Bold,
  ChevronDown,
  Heading2,
  Italic,
  Link2,
  Quote,
  Sigma,
} from "lucide-react";

import {
  CLAIM_LEVELS,
  EDITORIAL_FORMS,
  type ClaimLevel,
  type EditorialFormId,
} from "../../../attention-os/reader/editorialGrammar";

export type InlineFormat = "bold" | "italic" | "link";

interface EditorialToolbarProps {
  disabled?: boolean;
  onInlineFormat: (format: InlineFormat) => void;
  onHeading: () => void;
  onQuote: () => void;
  onEquation: () => void;
  onEditorialForm: (form: EditorialFormId) => void;
  onClaimLevel: (level: ClaimLevel) => void;
}

const iconButtonClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--organism-accent-soft)] disabled:opacity-40";

const menuButtonClass =
  "inline-flex h-8 items-center gap-1.5 px-2.5 dot-meta font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--organism-accent-soft)] disabled:opacity-40";

const menuContentClass =
  "dot-surface z-[70] min-w-64 p-1.5";

const menuItemClass =
  "group cursor-default px-3 py-2.5 outline-none transition-colors data-[highlighted]:bg-foreground/[0.06]";

function ToolButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={iconButtonClass}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function EditorialToolbar({
  disabled,
  onInlineFormat,
  onHeading,
  onQuote,
  onEquation,
  onEditorialForm,
  onClaimLevel,
}: EditorialToolbarProps) {
  return (
    <div
      className="flex min-h-10 flex-wrap items-center gap-0.5 border-b border-border/60 px-3 py-1"
      role="toolbar"
      aria-label="Manuscript formatting"
    >
      <ToolButton label="Heading" disabled={disabled} onClick={onHeading}>
        <Heading2 className="h-4 w-4" aria-hidden="true" />
      </ToolButton>
      <ToolButton
        label="Bold"
        disabled={disabled}
        onClick={() => onInlineFormat("bold")}
      >
        <Bold className="h-4 w-4" aria-hidden="true" />
      </ToolButton>
      <ToolButton
        label="Italic"
        disabled={disabled}
        onClick={() => onInlineFormat("italic")}
      >
        <Italic className="h-4 w-4" aria-hidden="true" />
      </ToolButton>
      <ToolButton
        label="Link"
        disabled={disabled}
        onClick={() => onInlineFormat("link")}
      >
        <Link2 className="h-4 w-4" aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Quote" disabled={disabled} onClick={onQuote}>
        <Quote className="h-4 w-4" aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Display equation" disabled={disabled} onClick={onEquation}>
        <Sigma className="h-4 w-4" aria-hidden="true" />
      </ToolButton>

      <span className="mx-1 h-5 w-px bg-border/70" aria-hidden="true" />

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" className={menuButtonClass} disabled={disabled}>
            Passage
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className={menuContentClass} sideOffset={6} align="start">
            <DropdownMenu.Label className="px-3 pb-1.5 pt-1 font-mono dot-micro uppercase text-muted-foreground">
              Editorial form
            </DropdownMenu.Label>
            {EDITORIAL_FORMS.map((form) => (
              <DropdownMenu.Item
                key={form.id}
                className={menuItemClass}
                onSelect={() => onEditorialForm(form.id)}
              >
                <span className="block text-xs font-semibold text-foreground">
                  {form.label}
                </span>
                <span className="mt-0.5 block max-w-60 leading-relaxed text-muted-foreground">
                  {form.purpose}
                </span>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" className={menuButtonClass} disabled={disabled}>
            Claim
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className={menuContentClass} sideOffset={6} align="start">
            <DropdownMenu.Label className="px-3 pb-1.5 pt-1 font-mono dot-micro uppercase text-muted-foreground">
              Epistemic level
            </DropdownMenu.Label>
            {CLAIM_LEVELS.map((level) => (
              <DropdownMenu.Item
                key={level.id}
                className={menuItemClass}
                onSelect={() => onClaimLevel(level.id)}
              >
                <span className="block text-xs font-semibold capitalize text-foreground">
                  {level.label}
                </span>
                <span className="mt-0.5 block max-w-60 leading-relaxed text-muted-foreground">
                  {level.purpose}
                </span>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
