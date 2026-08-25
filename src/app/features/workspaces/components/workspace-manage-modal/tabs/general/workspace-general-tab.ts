import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideCheck,
  lucideCheckCircle2,
  lucideLoader2,
  lucideMail,
} from "@ng-icons/lucide";
import { Button } from "../../../../../../shared/components/button/button";
import { Icons } from "../../../../../../shared/components/icons/icons";
import { WorkspaceManagement } from "../../../../services/workspace-management";

@Component({
  selector: "aos-workspace-general-tab",
  standalone: true,
  imports: [FormsModule, Button, Icons],
  providers: [
    provideIcons({
      lucideCheckCircle2,
      lucideAlertCircle,
      lucideMail,
      lucideLoader2,
      lucideCheck,
    }),
  ],
  templateUrl: "workspace-general-tab.html",
})
export class WorkspaceGeneralTab {
  readonly wm = inject(WorkspaceManagement);

  readonly workspace = this.wm.selectedManageWorkspace;
  readonly editName = this.wm.editName;
  readonly isUpdatingName = this.wm.isUpdatingName;
  readonly updateNameSuccess = this.wm.updateNameSuccess;
  readonly updateNameError = this.wm.updateNameError;

  submitUpdateName(): void {
    this.wm.submitUpdateName();
  }
}
