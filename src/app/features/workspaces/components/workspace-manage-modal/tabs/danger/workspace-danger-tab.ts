import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideAlertTriangle,
  lucideLoader2,
  lucideTrash2,
} from "@ng-icons/lucide";
import { Button } from "../../../../../../shared/components/button/button";
import { Icons } from "../../../../../../shared/components/icons/icons";
import { WorkspaceManagement } from "../../../../services/workspace-management";

@Component({
  selector: "aos-workspace-danger-tab",
  standalone: true,
  imports: [FormsModule, Button, Icons],
  providers: [
    provideIcons({
      lucideAlertCircle,
      lucideAlertTriangle,
      lucideLoader2,
      lucideTrash2,
    }),
  ],
  templateUrl: "workspace-danger-tab.html",
})
export class WorkspaceDangerTab {
  readonly wm = inject(WorkspaceManagement);

  readonly workspace = this.wm.selectedManageWorkspace;
  readonly deleteConfirmName = this.wm.deleteConfirmName;
  readonly isDeleting = this.wm.isDeleting;
  readonly deleteError = this.wm.deleteError;

  submitDeleteWorkspace(): void {
    this.wm.submitDeleteWorkspace();
  }
}
