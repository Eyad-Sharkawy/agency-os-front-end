import { booleanAttribute, Component, computed, input, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgTemplateOutlet } from "@angular/common";

type BUTTON_VARIANTS =
  "primary" | "secondary" | "inverted" | "outlined" | "pill-outline" | "danger" | "ghost";
type BUTTON_TYPES = "button" | "submit" | "reset";
type BUTTON_SIZES = "xs" | "sm" | "md" | "lg";
type BUTTON_SHAPES = "pill" | "rounded" | "square" | "circle";
type BUTTON_JUSTIFY = "center" | "start" | "between" | "end";

@Component({
  selector: "aos-button",
  imports: [RouterLink, NgTemplateOutlet],
  host: {
    class: "inline-flex items-center justify-center shrink-0 select-none",
    "[class.w-full]": "fullWidth()",
    "[class.pointer-events-none]": "effectiveDisabled()",
    "[class.rounded-none]": "shape() === 'square'",
    "[attr.aria-disabled]": "effectiveDisabled() ? 'true' : null",
    "[attr.aria-label]": "null",
    "[attr.aria-expanded]": "null",
    "[attr.aria-controls]": "null",
    "(click)": "handleHostClick($event)",
  },
  template: `
    <ng-template #buttonContent>
      <ng-content />
    </ng-template>

    @if (href()) {
      <!-- External Link -->
      <a
        [class]="computedClasses()"
        [href]="effectiveDisabled() ? null : href()"
        [target]="target()"
        [rel]="target() === '_blank' ? 'noopener noreferrer' : rel() || null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-disabled]="effectiveDisabled() ? 'true' : null"
      >
        <ng-container [ngTemplateOutlet]="buttonContent" />
      </a>
    } @else if (routerLink()) {
      <!-- Internal Router Link -->
      <a
        [class]="computedClasses()"
        [routerLink]="effectiveDisabled() ? null : routerLink()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-disabled]="effectiveDisabled() ? 'true' : null"
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
        [disabled]="effectiveDisabled()"
      >
        <ng-container [ngTemplateOutlet]="buttonContent" />
      </button>
    }
  `,
})
export class Button {
  readonly variant = input.required<BUTTON_VARIANTS>();
  readonly size = input<BUTTON_SIZES>("md");
  readonly shape = input<BUTTON_SHAPES>("pill");
  readonly type = input<BUTTON_TYPES>("button");
  readonly justify = input<BUTTON_JUSTIFY>("center");
  readonly fullWidth = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly buttonClass = input<string>("");
  readonly href = input<string | undefined>(undefined);
  readonly routerLink = input<string | unknown[] | undefined>(undefined);
  readonly target = input<string | undefined>(undefined);
  readonly rel = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaExpanded = input<string | undefined>(undefined);
  readonly ariaControls = input<string | undefined>(undefined);
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly disableOnClick = input<boolean, unknown>(false, { transform: booleanAttribute });

  private readonly clicked = signal(false);
  readonly effectiveDisabled = computed(() => this.disabled() || this.clicked());

  protected handleHostClick(event: MouseEvent): void {
    if (this.effectiveDisabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (this.disableOnClick()) {
      this.clicked.set(true);
    }
  }

  protected readonly computedClasses = computed<string>(() => {
    const baseClasses =
      "inline-flex items-center cursor-pointer font-sans font-medium leading-[1.71] tracking-normal transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4c6ee6] focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none w-full h-full";

    let justifyClasses: string;
    switch (this.justify()) {
      case "start":
        justifyClasses = "justify-start text-left";
        break;
      case "between":
        justifyClasses = "justify-between text-left";
        break;
      case "end":
        justifyClasses = "justify-end text-right";
        break;
      case "center":
      default:
        justifyClasses = "justify-center text-center";
        break;
    }

    let sizeClasses = "";
    if (this.shape() === "circle") {
      switch (this.size()) {
        case "xs":
          sizeClasses = "size-6 min-h-6 min-w-6 text-xs";
          break;
        case "sm":
          sizeClasses = "size-8 min-h-8 min-w-8 text-xs";
          break;
        case "md":
          sizeClasses = "size-9 min-h-9 min-w-9 text-sm";
          break;
        case "lg":
          sizeClasses = "size-11 min-h-11 min-w-11 text-base";
          break;
      }
    } else {
      switch (this.size()) {
        case "xs":
          sizeClasses = "text-xs px-2.5 py-1 min-h-6";
          break;
        case "sm":
          sizeClasses = "text-xs px-3.5 py-1.5 min-h-8";
          break;
        case "md":
          sizeClasses = "text-sm px-4.5 py-2 min-h-9";
          break;
        case "lg":
          sizeClasses = "text-sm px-6 py-3 min-h-11";
          break;
      }
    }

    let shapeClasses = "";
    switch (this.shape()) {
      case "pill":
        shapeClasses = "rounded-pill";
        break;
      case "rounded":
        shapeClasses = "rounded-md";
        break;
      case "square":
        shapeClasses = "rounded-xs";
        break;
      case "circle":
        shapeClasses = "rounded-full p-0 flex items-center justify-center shrink-0";
        break;
    }

    let variantClasses = "";
    switch (this.variant()) {
      case "primary":
        variantClasses = "bg-primary text-on-primary hover:opacity-90 active:scale-[0.99]";
        break;

      case "secondary":
        variantClasses =
          "bg-transparent text-ink hover:underline underline-offset-4 active:opacity-75";
        break;

      case "inverted":
        variantClasses = "bg-white text-[#17171c] hover:bg-soft-stone active:scale-[0.99]";
        break;

      case "outlined":
      case "pill-outline":
        variantClasses =
          "bg-transparent border border-hairline text-ink hover:border-ink hover:bg-soft-stone/40 active:bg-soft-stone";
        break;

      case "danger":
        variantClasses = "bg-error text-white hover:opacity-90 active:scale-[0.99]";
        break;

      case "ghost":
        variantClasses =
          "bg-transparent text-ink/80 hover:text-ink hover:bg-soft-stone/60 active:bg-soft-stone";
        break;
    }

    const disabledClasses = this.effectiveDisabled()
      ? "opacity-40 cursor-not-allowed pointer-events-none"
      : "";

    return `${baseClasses} ${justifyClasses} ${sizeClasses} ${shapeClasses} ${variantClasses} ${disabledClasses} ${this.buttonClass()}`.trim();
  });
}
