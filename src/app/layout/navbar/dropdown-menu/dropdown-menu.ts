import { Component, ElementRef, inject, model } from "@angular/core";
import { Button } from "../../../shared/components/button/button";
import { Icons } from "../../../shared/components/icons/icons";
import { provideIcons } from "@ng-icons/core";
import { simpleGithub } from "@ng-icons/simple-icons";
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: "aos-dropdown-menu",
  imports: [Button, Icons, RouterLink, RouterLinkActive],
  providers: [provideIcons({ simpleGithub })],
  templateUrl: "./dropdown-menu.html",
  styleUrl: "./dropdown-menu.css",
  host: {
    class: "contents",
    "(document:click)": "onDocumentClick($event)",
    "(keydown.escape)": "onEscape();",
  },
})
export class DropdownMenu {
  private elementRef = inject(ElementRef);

  readonly isOpen = model<boolean>(false);

  toggle(): void {
    this.isOpen.update(open => !open);
  }

  close(): void {
    this.isOpen.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  onEscape(): void {
    if (this.isOpen()) {
      this.close();
    }
  }
}
