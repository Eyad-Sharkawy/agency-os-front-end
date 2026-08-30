import { Component, computed, inject } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import {
  lucideCheckCircle2,
  lucideExternalLink,
  lucideGlobe,
  lucideKey,
  lucideLink2,
  lucideShieldCheck,
} from "@ng-icons/lucide";
import { simpleGithub } from "@ng-icons/simple-icons";
import { ENVIRONMENT } from "../../../../core/tokens/enviroment/environment.token";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";

@Component({
  selector: "aos-profile-linked-accounts-tab",
  standalone: true,
  imports: [Icons, Button],
  providers: [
    provideIcons({
      lucideLink2,
      lucideExternalLink,
      lucideGlobe,
      lucideShieldCheck,
      lucideCheckCircle2,
      lucideKey,
      simpleGithub,
    }),
  ],
  templateUrl: "./profile-linked-accounts-tab.html",
})
export class ProfileLinkedAccountsTab {
  private readonly env = inject(ENVIRONMENT);

  readonly keycloakConsoleUrl = computed(() => {
    return `${this.env.keycloak.url}/realms/${this.env.keycloak.realm}/account/#/personal-info/linked-accounts`;
  });

  openKeycloakConsole(): void {
    if (typeof window !== "undefined") {
      window.open(this.keycloakConsoleUrl(), "_blank", "noopener,noreferrer");
    }
  }
}
