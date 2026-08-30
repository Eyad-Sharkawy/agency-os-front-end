import { Component } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideFolderKanban, lucidePlus } from "@ng-icons/lucide";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";

@Component({
  selector: "aos-projects",
  standalone: true,
  imports: [Button, Icons],
  providers: [provideIcons({ lucideFolderKanban, lucidePlus })],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 class="text-ink font-display text-2xl font-bold tracking-tight">Projects</h1>
          <p class="text-body-muted text-sm">
            Track active deliverables, project budgets, timelines, and milestones.
          </p>
        </div>
        <aos-button variant="primary" size="sm">
          <aos-icons name="lucidePlus" class="size-4" />
          <span class="ml-1.5 font-mono text-xs">New Project</span>
        </aos-button>
      </div>

      <div class="border-hairline bg-canvas rounded-md border p-12 text-center">
        <div
          class="bg-soft-stone text-muted mx-auto flex size-12 items-center justify-center rounded-full"
        >
          <aos-icons name="lucideFolderKanban" class="size-6" />
        </div>
        <h3 class="text-ink mt-4 text-base font-semibold">Project Engine Ready</h3>
        <p class="text-body-muted mx-auto mt-1 max-w-sm text-xs">
          Project lifecycle workflows and budget models are configured for this workspace.
        </p>
      </div>
    </div>
  `,
})
export class ProjectsComponent {}
