import { Component, input, output } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideCheck, lucideLoader2, lucideSend, lucideX } from "@ng-icons/lucide";
import { WorkspaceInvitationResponse } from "../../../../core/api/models/invitation.models";
import { WorkspaceRole } from "../../../../core/api/models/workspace.models";
import { Icons } from "../../../../shared/components/icons/icons";
import { Button } from "../../../../shared/components/button/button";

@Component({
  selector: "aos-workspace-invitations",
  standalone: true,
  imports: [Icons, Button],
  providers: [
    provideIcons({
      lucideSend,
      lucideCheck,
      lucideX,
      lucideLoader2,
    }),
  ],
  template: `
    @if (invitations().length > 0) {
      <div class="border-primary/30 bg-primary/5 mt-8 rounded-2xl border p-4 shadow-sm sm:p-6">
        <div class="flex items-center justify-between pb-3">
          <div class="flex items-center gap-2">
            <div
              class="bg-primary/20 text-primary flex size-8 items-center justify-center rounded-lg"
            >
              <aos-icons name="lucideSend" class="size-4" />
            </div>
            <div>
              <h2 class="text-on-surface text-sm font-bold sm:text-base">
                Pending Invitations ({{ invitations().length }})
              </h2>
              <p class="text-on-surface-variant text-xs">
                You've been invited to join the following workspaces.
              </p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3">
          @for (invitation of invitations(); track invitation.id) {
            <div
              class="border-outline-variant/60 bg-surface flex flex-col justify-between rounded-xl border p-4 shadow-xs"
            >
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-on-surface text-sm font-bold">{{
                    invitation.workspaceName
                  }}</span>
                  <span
                    [class]="getRoleBadgeClass(invitation.role)"
                    class="rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase"
                  >
                    {{ invitation.role }}
                  </span>
                </div>
                <p class="text-on-surface-variant mt-1 text-xs">
                  Invited by
                  <span class="text-on-surface font-medium"
                    >&#64;{{ invitation.invitedByUsername }}</span
                  >
                </p>
              </div>

              <div class="border-outline-variant/40 mt-4 flex items-center gap-2 border-t pt-3">
                <aos-button
                  variant="primary"
                  (click)="onAccept(invitation)"
                  [disabled]="processingId() === invitation.id"
                  class="flex-1"
                >
                  @if (processingId() === invitation.id) {
                    <aos-icons name="lucideLoader2" class="mr-1 size-3.5 animate-spin" />
                  } @else {
                    <aos-icons name="lucideCheck" class="mr-1 size-3.5" />
                  }
                  Accept
                </aos-button>

                <aos-button
                  variant="outlined"
                  (click)="onDecline(invitation)"
                  [disabled]="processingId() === invitation.id"
                  class="flex-1"
                >
                  <aos-icons name="lucideX" class="mr-1 size-3.5" />
                  Decline
                </aos-button>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class WorkspaceInvitations {
  readonly invitations = input.required<WorkspaceInvitationResponse[]>();
  readonly processingId = input<string | null>(null);

  readonly accept = output<WorkspaceInvitationResponse>();
  readonly decline = output<WorkspaceInvitationResponse>();

  onAccept(invitation: WorkspaceInvitationResponse): void {
    this.accept.emit(invitation);
  }

  onDecline(invitation: WorkspaceInvitationResponse): void {
    this.decline.emit(invitation);
  }

  getRoleBadgeClass(role?: WorkspaceRole): string {
    switch (role) {
      case "OWNER":
        return "bg-primary/15 text-primary border-primary/25";
      case "ADMIN":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25";
      case "MEMBER":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25";
      case "CLIENT":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25";
      default:
        return "bg-surface-container-high text-on-surface-variant border-outline-variant";
    }
  }
}
