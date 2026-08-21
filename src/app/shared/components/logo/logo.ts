import { Component, computed, input } from "@angular/core";

// noinspection AngularNgOptimizedImage
@Component({
  selector: "aos-logo",
  standalone: true,
  host: {
    class:
      "inline-flex items-center justify-center shrink-0 select-none aspect-square overflow-hidden",
  },
  template: `
    <img
      [src]="logoSrc()"
      [alt]="altText()"
      width="24"
      height="24"
      class="size-full rounded-[inherit] object-contain"
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
