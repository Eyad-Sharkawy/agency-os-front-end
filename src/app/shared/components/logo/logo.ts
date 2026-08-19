import { Component, computed, input } from "@angular/core";

// noinspection AngularNgOptimizedImage
@Component({
  selector: "aos-logo",
  standalone: true,
  host: {
    class: "inline-flex items-center justify-center shrink-0 select-none",
  },
  template: `
    <img
      [src]="logoSrc()"
      [alt]="altText()"
      class="h-full w-full rounded-[inherit] object-contain"
      loading="eager"
      decoding="async"
    />
  `,
})
export class LogoComponent {
  readonly variant = input<"icon" | "full">("icon");
  readonly altText = input<string>("Agency OS Logo");

  protected readonly logoSrc = computed(() => {
    return this.variant() === "full" ? "logo/logo.svg" : "logo/logo-mark.svg";
  });
}
