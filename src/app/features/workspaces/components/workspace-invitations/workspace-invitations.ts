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
      <div class="border-brand-green/40 bg-soft-stone/40 mt-8 rounded-sm border p-6 shadow-xs">
        <div class="border-hairline flex items-center justify-between border-b pb-3">
          <div class="flex items-center gap-2.5">
            <div
              class="border-brand-green/40 bg-brand-green/10 text-brand-green flex size-8 items-center justify-center rounded-full border"
            >
              <aos-icons name="lucideSend" class="size-4" />
            </div>
            <div>
              <h2 class="text-ink font-sans text-sm font-semibold sm:text-base">
                Pending Invitations ({{ invitations().length }})
              </h2>
              <p class="text-body-muted text-xs">
                You've been invited to join the following workspaces.
              </p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (invitation of invitations(); track invitation.id) {
            <div
              class="border-hairline bg-canvas flex flex-col justify-between rounded-sm border p-4 shadow-xs"
            >
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-ink font-sans text-sm font-semibold">{{
                    invitation.workspaceName
                  }}</span>
                  <span
                    [class]="getRoleBadgeClass(invitation.role)"
                    class="rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase"
                  >
                    {{ invitation.role }}
                  </span>
                </div>
                <p class="text-body-muted mt-1 font-mono text-xs">
                  Invited by
                  <span class="text-ink font-medium">&#64;{{ invitation.invitedByUsername }}</span>
                </p>
              </div>

              <div class="border-hairline mt-4 flex items-center gap-2 border-t pt-3">
                <aos-button
                  variant="primary"
                  (click)="onAccept(invitation)"
                  (keydown.enter)="onAccept(invitation)"
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
                  (keydown.enter)="onDecline(invitation)"
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
        return "bg-brand-green/10 text-brand-green border border-brand-green/30";
      case "ADMIN":
        return "bg-action-blue/10 text-action-blue border border-action-blue/30";
      case "MEMBER":
        return "bg-soft-stone text-ink border border-hairline";
      case "CLIENT":
        return "bg-soft-stone text-slate border border-hairline";
      default:
        return "bg-soft-stone text-muted border border-hairline";
    }
  }
}
