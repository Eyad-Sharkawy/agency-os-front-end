import { booleanAttribute, Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgTemplateOutlet } from "@angular/common";

type BUTTON_VARIANTS = "primary" | "secondary" | "inverted" | "outlined" | "danger" | "ghost";
type BUTTON_TYPES = "button" | "submit" | "reset";

@Component({
  selector: "aos-button",
  imports: [RouterLink, NgTemplateOutlet],
  host: {
    class: "inline-flex items-center justify-center shrink-0 select-none",
    "[attr.aria-label]": "null",
    "[attr.aria-expanded]": "null",
    "[attr.aria-controls]": "null",
  },
  template: `
    <ng-template #buttonContent>
      <ng-content />
    </ng-template>

    @if (href()) {
      <!-- External Link -->
      <a
        [class]="computedClasses()"
        [href]="href()"
        [target]="target()"
        [rel]="target() === '_blank' ? 'noopener noreferrer' : rel() || null"
        [attr.aria-label]="ariaLabel() || null"
      >
        <ng-container [ngTemplateOutlet]="buttonContent" />
      </a>
    } @else if (routerLink()) {
      <!-- Internal Router Link -->
      <a
        [class]="computedClasses()"
        [routerLink]="routerLink()"
        [attr.aria-label]="ariaLabel() || null"
      >
        <ng-container [ngTemplateOutlet]="buttonContent" />
      </a>
    } @else {
      <!-- Standard Action Button -->
      <button
        [class]="computedClasses()"
        [type]="type()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-expanded]="ariaExpanded() || null"
        [attr.aria-controls]="ariaControls() || null"
        [disabled]="disabled()"
      >
        <ng-container [ngTemplateOutlet]="buttonContent" />
      </button>
    }
  `,
})
export class Button {
  readonly variant = input.required<BUTTON_VARIANTS>();
  readonly type = input<BUTTON_TYPES>("button");
  readonly href = input<string | undefined>(undefined);
  readonly routerLink = input<string | unknown[] | undefined>(undefined);
  readonly target = input<string | undefined>(undefined);
  readonly rel = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaExpanded = input<string | undefined>(undefined);
  readonly ariaControls = input<string | undefined>(undefined);
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });

  protected readonly computedClasses = computed<string>(() => {
    const baseClasses =
      "inline-flex items-center justify-center cursor-pointer text-center font-medium text-sm rounded-md w-full h-full min-h-9 transition-colors duration-150 ease-in-out disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed";
    const paddingClasses = "px-4 py-2";

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
