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
      "inline-flex items-center justify-center cursor-pointer text-center font-medium text-sm w-full h-full min-h-9 transition-all duration-150 ease-in-out disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed";
    const pillPadding = "px-5 py-2 rounded-full";

    switch (this.variant()) {
      case "primary":
        return `${baseClasses} ${pillPadding} bg-primary text-on-primary hover:opacity-90 active:scale-[0.99] shadow-xs`;

      case "secondary":
        return `${baseClasses} px-2 py-1.5 rounded-sm bg-transparent text-ink hover:underline underline-offset-4 active:opacity-75`;

      case "inverted":
        return `${baseClasses} ${pillPadding} bg-white text-[#17171c] hover:bg-soft-stone active:scale-[0.99] shadow-xs`;

      case "outlined":
        return `${baseClasses} ${pillPadding} bg-transparent border border-hairline text-ink hover:border-ink hover:bg-soft-stone/40 active:bg-soft-stone`;

      case "danger":
        return `${baseClasses} ${pillPadding} bg-error text-white hover:opacity-90 active:scale-[0.99] shadow-xs`;

      case "ghost":
        return `${baseClasses} px-3 py-1.5 rounded-full bg-transparent text-ink/80 hover:text-ink hover:bg-soft-stone/60 active:bg-soft-stone`;
    }
  });
}
