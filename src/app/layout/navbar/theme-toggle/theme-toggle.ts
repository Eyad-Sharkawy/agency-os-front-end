import { Component, inject, input } from "@angular/core";
import { Button } from "../../../shared/components/button/button";
import { Icons } from "../../../shared/components/icons/icons";
import { provideIcons } from "@ng-icons/core";
import { lucideMoon, lucideSun } from "@ng-icons/lucide";
import { Theme } from "../../../core/services/theme";

@Component({
  selector: "aos-theme-toggle",
  imports: [Button, Icons],
  providers: [provideIcons({ lucideSun, lucideMoon })],
  template: `
    <aos-button
      variant="ghost"
      [class]="buttonClass()"
      [ariaLabel]="themeService.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      (click)="themeService.toggleTheme()"
      (keydown.enter)="themeService.toggleTheme()"
    >
      <div class="relative flex size-4 items-center justify-center">
        <aos-icons
          name="lucideSun"
          strokeWidth="1.75"
          class="absolute inset-0 text-amber-500 transition-all duration-300 ease-in-out"
          [class.opacity-0]="themeService.theme() === 'light'"
          [class.rotate-90]="themeService.theme() === 'light'"
          [class.scale-75]="themeService.theme() === 'light'"
          [class.opacity-100]="themeService.theme() === 'dark'"
          [class.rotate-0]="themeService.theme() === 'dark'"
          [class.scale-100]="themeService.theme() === 'dark'"
        />
        <aos-icons
          name="lucideMoon"
          strokeWidth="1.75"
          class="text-on-surface-variant absolute inset-0 transition-all duration-300 ease-in-out"
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
  readonly buttonClass = input<string>("size-9 rounded-md");
}
