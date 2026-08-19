import { Component, input } from "@angular/core";
import { NgIcon } from "@ng-icons/core";

@Component({
  selector: "aos-icons",
  standalone: true,
  imports: [NgIcon],
  host: {
    class:
      "max-w-full max-h-full inline-flex items-center justify-center shrink-0 leading-none select-none",
    "[attr.aria-hidden]": "true",
  },
  template: `
    <ng-icon [name]="name()" size="100%" [strokeWidth]="strokeWidth()" class="h-full w-full" />
  `,
})
export class Icons {
  readonly name = input.required<string>();
  readonly strokeWidth = input<number | string>(2);
}
