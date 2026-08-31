import { Component, inject, input } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideMoon, lucideSun } from "@ng-icons/lucide";
import { Theme } from "../../../core/services/theme";
import { Button } from "../../../shared/components/button/button";
import { Icons } from "../../../shared/components/icons/icons";

@Component({
  selector: "aos-theme-toggle",
  imports: [Icons, Button],
  providers: [provideIcons({ lucideSun, lucideMoon })],
  template: `
    <aos-button
      variant="ghost"
      size="xs"
      shape="circle"
      type="button"
      [class]="buttonClass()"
      [ariaLabel]="themeService.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      (click)="themeService.toggleTheme()"
    >
      <div class="pointer-events-none relative flex size-5.5 items-center justify-center">
        <aos-icons
          name="lucideSun"
          strokeWidth="2"
          class="absolute inset-0 size-5.5 text-amber-500 transition-all duration-300 ease-in-out"
          [class.opacity-0]="themeService.theme() === 'light'"
          [class.rotate-90]="themeService.theme() === 'light'"
          [class.scale-75]="themeService.theme() === 'light'"
          [class.opacity-100]="themeService.theme() === 'dark'"
          [class.rotate-0]="themeService.theme() === 'dark'"
          [class.scale-100]="themeService.theme() === 'dark'"
        />
        <aos-icons
          name="lucideMoon"
          strokeWidth="2"
          class="text-ink absolute inset-0 size-5.5 transition-all duration-300 ease-in-out"
          [class.opacity-0]="themeService.theme() === 'dark'"
          [class.-rotate-90]="themeService.theme() === 'dark'"
          [class.scale-75]="themeService.theme() === 'dark'"
          [class.opacity-100]="themeService.theme() === 'light'"
          [class.rotate-0]="themeService.theme() === 'light'"
          [class.scale-100]="themeService.theme() === 'light'"
        />
      </div>
    </aos-button>
  `,
})
export class ThemeToggle {
  readonly themeService = inject(Theme);
  readonly buttonClass = input<string>("size-10 rounded-full !p-0");
}
