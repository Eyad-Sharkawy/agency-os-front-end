import { Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import { lucideMenu } from "@ng-icons/lucide";
import { filter, map } from "rxjs";
import { ProfileModal } from "./features/profile/profile-modal";
import { WorkspaceManageModal } from "./features/workspaces/components/workspace-manage-modal/workspace-manage-modal";
import { Footer } from "./layout/footer/footer";
import { Navbar } from "./layout/navbar/navbar";

@Component({
  selector: "aos-root",
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer, WorkspaceManageModal, ProfileModal],
  providers: provideIcons({ lucideMenu }),
  templateUrl: "./app.html",
})
export class App {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects || e.url),
    ),
    { initialValue: this.router.url },
  );

  readonly isNavigating = toSignal(
    this.router.events.pipe(
      filter(
        e =>
          e instanceof NavigationStart ||
          e instanceof NavigationEnd ||
          e instanceof NavigationCancel ||
          e instanceof NavigationError,
      ),
      map(e => e instanceof NavigationStart),
    ),
    { initialValue: false },
  );

  readonly isAppRoute = computed(() => {
    const url = this.currentUrl();
    return url.startsWith("/w/") || url.startsWith("/app");
  });
}
