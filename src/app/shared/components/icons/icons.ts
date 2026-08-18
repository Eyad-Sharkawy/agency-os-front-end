import { Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const SIZE_MAP: Record<IconSize, string> = {
  xs: 'text-xs', // 12px
  sm: 'text-sm', // 14px
  md: 'text-base', // 16px (default)
  lg: 'text-lg', // 18px
  xl: 'text-xl', // 20px
  '2xl': 'text-2xl', // 24px
};

@Component({
  selector: 'aos-icons',
  imports: [NgIcon],
  host: {
    class: 'inline-flex items-center justify-center shrink-0 leading-none select-none',
    '[attr.aria-hidden]': 'true',
  },
  template: `
    <ng-icon [name]="name()" [class]="computedClasses()" [strokeWidth]="strokeWidth()" />
  `,
})
export class Icons {
  readonly name = input.required<string>();
  readonly size = input<IconSize>('md');
  readonly customClass = input<string>('');
  readonly strokeWidth = input<number | string>(2);

  protected readonly computedClasses = computed(() => {
    const sizeClass = SIZE_MAP[this.size()] || SIZE_MAP.md;
    return `${sizeClass} ${this.customClass()}`.trim();
  });
}
