import { Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import { lucideArrowLeft, lucideBuilding2, lucideShieldAlert } from "@ng-icons/lucide";
import { WorkspaceStore } from "../../core/multitenancy/workspace.store";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";

@Component({
  selector: "aos-unauthorized",
  standalone: true,
  imports: [RouterLink, Button, Icons],
  providers: [
    provideIcons({
      lucideShieldAlert,
      lucideArrowLeft,
      lucideBuilding2,
    }),
  ],
  templateUrl: "./unauthorized.html",
})
export class UnauthorizedComponent {
  readonly workspaceStore = inject(WorkspaceStore);

  readonly activeWorkspace = computed(() => this.workspaceStore.activeWorkspace());
  readonly activeRole = computed(() => this.workspaceStore.activeRole() || "Guest");
  readonly workspaceName = computed(() => this.activeWorkspace()?.name || "this workspace");

  readonly overviewRoute = computed(() => {
    const ws = this.activeWorkspace();
    const id = ws?.tenantId || ws?.id;
    return id ? `/w/${id}` : "/workspaces";
  });
}
