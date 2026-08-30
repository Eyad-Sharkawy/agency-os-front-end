import { Component } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucidePlus, lucideSearch, lucideUsers } from "@ng-icons/lucide";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";

@Component({
  selector: "aos-clients",
  standalone: true,
  imports: [Button, Icons],
  providers: [provideIcons({ lucideUsers, lucidePlus, lucideSearch })],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 class="text-ink font-display text-2xl font-bold tracking-tight">Clients</h1>
          <p class="text-body-muted text-sm">
            Manage your client organizations, billing contacts, and project contracts.
          </p>
        </div>
        <aos-button variant="primary" size="sm">
          <aos-icons name="lucidePlus" class="size-4" />
          <span class="ml-1.5 font-mono text-xs">Add Client</span>
        </aos-button>
      </div>

      <div class="border-hairline bg-canvas rounded-md border p-12 text-center">
        <div
          class="bg-soft-stone text-muted mx-auto flex size-12 items-center justify-center rounded-full"
        >
          <aos-icons name="lucideUsers" class="size-6" />
        </div>
        <h3 class="text-ink mt-4 text-base font-semibold">Client Directory Ready</h3>
        <p class="text-body-muted mx-auto mt-1 max-w-sm text-xs">
          Client services and API integrations are connected. Use the Add Client action to create
          your first client profile.
        </p>
      </div>
    </div>
  `,
})
export class ClientsComponent {}
