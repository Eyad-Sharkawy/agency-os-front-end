import { Component, inject } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import {
  lucideKey,
  lucideLink2,
  lucideMonitor,
  lucideSlidersHorizontal,
  lucideUser,
  lucideUserCheck,
  lucideX,
} from "@ng-icons/lucide";
import { AuthStore } from "../../core/auth/stores/auth.store";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";
import { PROFILE_TAB, ProfileModalService } from "./services/profile-modal.service";
import { ProfileLinkedAccountsTab } from "./tabs/linked-accounts/profile-linked-accounts-tab";
import { ProfilePersonalTab } from "./tabs/personal/profile-personal-tab";
import { ProfileSecurityTab } from "./tabs/security/profile-security-tab";
import { ProfileSessionsTab } from "./tabs/sessions/profile-sessions-tab";

@Component({
  selector: "aos-profile-modal",
  standalone: true,
  imports: [
    Icons,
    Button,
    ProfilePersonalTab,
    ProfileSecurityTab,
    ProfileLinkedAccountsTab,
    ProfileSessionsTab,
  ],
  providers: [
    provideIcons({
      lucideUser,
      lucideKey,
      lucideLink2,
      lucideMonitor,
      lucideSlidersHorizontal,
      lucideX,
      lucideUserCheck,
    }),
  ],
  templateUrl: "./profile-modal.html",
})
export class ProfileModal {
  readonly profileModalService = inject(ProfileModalService);
  readonly authStore = inject(AuthStore);

  readonly isOpen = this.profileModalService.isOpen;
  readonly activeTab = this.profileModalService.activeTab;

  setTab(tab: PROFILE_TAB): void {
    this.profileModalService.setTab(tab);
  }

  onClose(): void {
    this.profileModalService.close();
  }
}
