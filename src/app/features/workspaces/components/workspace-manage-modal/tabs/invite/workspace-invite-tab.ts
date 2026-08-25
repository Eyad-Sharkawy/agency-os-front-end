import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideCheckCircle2,
  lucideLoader2,
  lucideSend,
  lucideUserPlus,
} from "@ng-icons/lucide";
import { WorkspaceRole } from "../../../../../../core/api/models";
import { Button } from "../../../../../../shared/components/button/button";
import { Icons } from "../../../../../../shared/components/icons/icons";
import { Select, SelectOption } from "../../../../../../shared/components/select/select";
import { WorkspaceManagement } from "../../../../services/workspace-management";

@Component({
  selector: "aos-workspace-invite-tab",
  standalone: true,
  imports: [FormsModule, Button, Icons, Select],
  providers: [
    provideIcons({
      lucideUserPlus,
      lucideCheckCircle2,
      lucideAlertCircle,
      lucideLoader2,
      lucideSend,
    }),
  ],
  templateUrl: "workspace-invite-tab.html",
})
export class WorkspaceInviteTab {
  readonly wm = inject(WorkspaceManagement);

  readonly inviteTarget = this.wm.inviteTarget;
  readonly inviteRole = this.wm.inviteRole;
  readonly isInviting = this.wm.isInviting;
  readonly inviteSuccess = this.wm.inviteSuccess;
  readonly inviteError = this.wm.inviteError;

  getInviteRoleOptions(): SelectOption<WorkspaceRole>[] {
    return this.wm.getInviteRoleOptions();
  }

  submitInviteUser(): void {
    this.wm.submitInviteUser();
  }
}
