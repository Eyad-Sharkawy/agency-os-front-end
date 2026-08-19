import { booleanAttribute, Component, computed, input } from "@angular/core";

type BUTTON_VARIANTS = "primary" | "secondary" | "inverted" | "outlined" | "danger" | "ghost";
type BUTTON_TYPES = "button" | "submit" | "reset";

@Component({
  selector: "aos-button",
  host: {
    class: "inline-flex items-center justify-center shrink-0 select-none",
    "[attr.aria-label]": "null"
  },
  template: `
    <button
      [class]="computedClasses()"
      [type]="type()"
      [attr.aria-label]="ariaLabel() || null"
      [disabled]="disabled()"
    >
      <ng-content />
    </button>
  `,
})
export class Button {
  readonly variant = input.required<BUTTON_VARIANTS>();
  readonly type = input<BUTTON_TYPES>("button");
  readonly ariaLabel = input<string | undefined>(undefined, { alias: "aria-label" });
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });

  protected readonly computedClasses = computed<string>(() => {
    const baseClasses =
      "inline-flex items-center justify-center cursor-pointer text-center font-medium text-sm rounded-md h-full w-full transition-colors duration-150 ease-in-out disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed";
    const paddingClasses = "px-4 py-1.5";

    switch (this.variant()) {
      case "primary":
        return `${baseClasses} ${paddingClasses} bg-primary text-on-primary hover:brightness-105 active:brightness-95 shadow-sm`;

      case "secondary":
        return `${baseClasses} ${paddingClasses} bg-surface-container-high text-on-surface hover:bg-surface-container-highest active:bg-surface-dim`;

      case "inverted":
        return `${baseClasses} ${paddingClasses} bg-on-surface text-surface hover:opacity-90 active:opacity-80 shadow-sm`;

      case "outlined":
        return `${baseClasses} ${paddingClasses} bg-transparent border border-outline text-on-surface hover:bg-surface-container-low active:bg-surface-container`;

      case "danger":
        return `${baseClasses} ${paddingClasses} bg-error text-on-error hover:brightness-105 active:brightness-95 shadow-sm`;

      case "ghost":
        return `${baseClasses} bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high active:bg-surface-container-highest`;
    }
  });
}
