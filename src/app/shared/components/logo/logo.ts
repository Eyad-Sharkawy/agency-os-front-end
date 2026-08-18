import { Component, computed, input } from '@angular/core';

// noinspection AngularNgOptimizedImage
@Component({
  selector: 'aos-logo',
  standalone: true,
  host: {
    class: 'inline-flex items-center shrink-0 select-none',
  },
  template: `
    <img
      [src]="logoSrc()"
      [alt]="altText()"
      [class]="logoClass()"
      loading="eager"
      decoding="async"
    />
  `,
})
export class LogoComponent {
  readonly variant = input<'full' | 'icon'>('full');
  readonly altText = input<string>('Agency OS Logo');
  readonly customClass = input<string>('');

  protected readonly logoSrc = computed(() => {
    return this.variant() === 'full' ? 'logo/logo.svg' : 'logo/logo-mark.svg';
  });

  protected readonly logoClass = computed(() => {
    if (this.customClass()) return this.customClass();
    return this.variant() === 'full' ? 'h-8 w-auto object-contain' : 'h-8 w-8 object-contain';
  });
}
