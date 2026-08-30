import { Component } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucidePlus, lucideReceipt } from "@ng-icons/lucide";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";

@Component({
  selector: "aos-invoices",
  standalone: true,
  imports: [Button, Icons],
  providers: [provideIcons({ lucideReceipt, lucidePlus })],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 class="text-ink font-display text-2xl font-bold tracking-tight">Invoices</h1>
          <p class="text-body-muted text-sm">
            Generate invoices, monitor client payments, and track receivables.
          </p>
        </div>
        <aos-button variant="primary" size="sm">
          <aos-icons name="lucidePlus" class="size-4" />
          <span class="ml-1.5 font-mono text-xs">Create Invoice</span>
        </aos-button>
      </div>

      <div class="border-hairline bg-canvas rounded-md border p-12 text-center">
        <div
          class="bg-soft-stone text-muted mx-auto flex size-12 items-center justify-center rounded-full"
        >
          <aos-icons name="lucideReceipt" class="size-6" />
        </div>
        <h3 class="text-ink mt-4 text-base font-semibold">Invoicing System Ready</h3>
        <p class="text-body-muted mx-auto mt-1 max-w-sm text-xs">
          Generate branded invoices from logged hours and fixed project fees.
        </p>
      </div>
    </div>
  `,
})
export class InvoicesComponent {}
