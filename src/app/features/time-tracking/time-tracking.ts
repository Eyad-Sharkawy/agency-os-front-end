import { Component } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideClock, lucidePlay, lucidePlus } from "@ng-icons/lucide";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";

@Component({
  selector: "aos-time-tracking",
  standalone: true,
  imports: [Button, Icons],
  providers: [provideIcons({ lucideClock, lucidePlay, lucidePlus })],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 class="text-ink font-display text-2xl font-bold tracking-tight">Time Tracking</h1>
          <p class="text-body-muted text-sm">
            Record billable hours, review team timesheets, and log project activity.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <aos-button variant="outlined" size="sm">
            <aos-icons name="lucidePlus" class="size-4" />
            <span class="ml-1.5 font-mono text-xs">Manual Entry</span>
          </aos-button>
          <aos-button variant="primary" size="sm">
            <aos-icons name="lucidePlay" class="size-4" />
            <span class="ml-1.5 font-mono text-xs">Start Timer</span>
          </aos-button>
        </div>
      </div>

      <div class="border-hairline bg-canvas rounded-md border p-12 text-center">
        <div
          class="bg-soft-stone text-muted mx-auto flex size-12 items-center justify-center rounded-full"
        >
          <aos-icons name="lucideClock" class="size-6" />
        </div>
        <h3 class="text-ink mt-4 text-base font-semibold">Timesheet Ledger Ready</h3>
        <p class="text-body-muted mx-auto mt-1 max-w-sm text-xs">
          Granular time entry tracking and billable rate calculations are initialized.
        </p>
      </div>
    </div>
  `,
})
export class TimeTrackingComponent {}
