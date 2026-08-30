import {
  booleanAttribute,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideCheck, lucideChevronDown } from "@ng-icons/lucide";
import { Icons } from "../icons/icons";

export interface SelectOption<T = unknown> {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
}

export type SELECT_SIZES = "sm" | "md" | "lg";
export type SELECT_VARIANTS = "outlined" | "filled" | "ghost";

@Component({
  selector: "aos-select",
  standalone: true,
  imports: [Icons],
  providers: [provideIcons({ lucideChevronDown, lucideCheck })],
  host: {
    class: "relative inline-block text-left",
    "[class.w-full]": "fullWidth()",
  },
  template: `
    <div class="relative w-full">
      <!-- Trigger Button -->
      <button
        type="button"
        [disabled]="disabled()"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-expanded]="isOpen()"
        (click)="toggleOpen()"
        (keydown)="onKeydown($event)"
        [class]="triggerClasses()"
      >
        <span class="truncate">
          {{ selectedLabel() || placeholder() }}
        </span>

        <!-- Custom Chevron Arrow -->
        <span
          class="pointer-events-none shrink-0 transition-transform duration-200 ease-in-out"
          [class.rotate-180]="isOpen()"
          [class.text-primary]="isOpen()"
        >
          <aos-icons name="lucideChevronDown" [class]="iconSizeClasses()" />
        </span>
      </button>

      <!-- Dropdown Options Menu -->
      @if (isOpen()) {
        <div
          role="listbox"
          [attr.aria-activedescendant]="activeOptionId()"
          class="border-hairline bg-canvas text-ink animate-in fade-in zoom-in-95 absolute right-0 z-[60] mt-1.5 max-h-60 w-full min-w-[150px] overflow-auto rounded-sm border p-1 shadow-2xl duration-100 focus:outline-none"
        >
          @for (option of options(); track option.value; let idx = $index) {
            <div
              role="option"
              tabindex="0"
              [id]="'select-opt-' + idx"
              [attr.aria-selected]="isSelected(option.value)"
              [attr.aria-disabled]="option.disabled"
              (click)="selectOption(option)"
              (keydown.enter)="selectOption(option)"
              (keydown.space)="selectOption(option)"
              class="hover:bg-soft-stone focus:bg-soft-stone flex cursor-pointer items-center justify-between rounded-xs px-2.5 py-2 font-mono text-xs transition-colors focus:outline-none"
              [class.bg-soft-stone]="isSelected(option.value)"
              [class.font-semibold]="isSelected(option.value)"
              [class.text-brand-green]="isSelected(option.value)"
              [class.opacity-40]="option.disabled"
              [class.cursor-not-allowed]="option.disabled"
            >
              <div class="flex min-w-0 flex-col pr-2">
                <span class="truncate font-medium">{{ option.label }}</span>
                @if (option.description) {
                  <span class="text-muted text-[10px]">{{ option.description }}</span>
                }
              </div>

              @if (isSelected(option.value)) {
                <aos-icons name="lucideCheck" class="text-brand-green size-3.5 shrink-0" />
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class Select<T = unknown> {
  private readonly elementRef = inject(ElementRef);

  readonly options = input.required<SelectOption<T>[]>();
  readonly value = input<T | undefined>(undefined);
  readonly placeholder = input<string>("Select an option...");
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly size = input<SELECT_SIZES>("md");
  readonly variant = input<SELECT_VARIANTS>("outlined");
  readonly fullWidth = input<boolean, unknown>(true, { transform: booleanAttribute });

  readonly valueChange = output<T>();

  readonly isOpen = signal<boolean>(false);

  readonly selectedOption = computed(() => {
    const val = this.value();
    return this.options().find(opt => opt.value === val) ?? null;
  });

  readonly selectedLabel = computed(() => {
    return this.selectedOption()?.label ?? "";
  });

  readonly activeOptionId = computed(() => {
    const val = this.value();
    const idx = this.options().findIndex(opt => opt.value === val);
    return idx >= 0 ? `select-opt-${idx}` : undefined;
  });

  protected readonly triggerClasses = computed<string>(() => {
    const base =
      "flex items-center justify-between gap-2 rounded-full text-left transition-all duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-green/40 disabled:opacity-40 disabled:cursor-not-allowed";

    const widthClass = this.fullWidth() ? "w-full" : "w-auto";

    let sizeClasses = "px-3.5 py-2 text-xs sm:text-sm font-mono";
    if (this.size() === "sm") {
      sizeClasses = "px-3 py-1 text-xs font-mono";
    } else if (this.size() === "lg") {
      sizeClasses = "px-4 py-2.5 text-sm sm:text-base font-mono";
    }

    let variantClasses =
      "border border-hairline bg-canvas text-ink hover:border-ink focus:border-ink";
    if (this.variant() === "filled") {
      variantClasses =
        "border border-transparent bg-soft-stone text-ink hover:bg-soft-stone/80 focus:border-ink";
    } else if (this.variant() === "ghost") {
      variantClasses =
        "border border-transparent bg-transparent text-ink hover:bg-soft-stone focus:border-hairline";
    }

    const openClasses = this.isOpen() ? "border-ink ring-1 ring-brand-green/30" : "";

    return `${base} ${widthClass} ${sizeClasses} ${variantClasses} ${openClasses}`;
  });

  protected readonly iconSizeClasses = computed<string>(() => {
    if (this.size() === "sm") return "size-3";
    if (this.size() === "lg") return "size-4.5";
    return "size-3.5";
  });

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleOpen(): void {
    if (!this.disabled()) {
      this.isOpen.update(open => !open);
    }
  }

  selectOption(option: SelectOption<T>): void {
    if (option.disabled) return;
    this.valueChange.emit(option.value);
    this.isOpen.set(false);
  }

  isSelected(val: T): boolean {
    return this.value() === val;
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    if (event.key === "Escape") {
      this.isOpen.set(false);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.toggleOpen();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!this.isOpen()) {
        this.isOpen.set(true);
      } else {
        this.navigateOptions(1);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!this.isOpen()) {
        this.isOpen.set(true);
      } else {
        this.navigateOptions(-1);
      }
    }
  }

  private navigateOptions(delta: number): void {
    const opts = this.options().filter(o => !o.disabled);
    if (opts.length === 0) return;
    const curIdx = opts.findIndex(o => o.value === this.value());
    const nextIdx = (curIdx + delta + opts.length) % opts.length;
    this.selectOption(opts[nextIdx]);
  }
}
