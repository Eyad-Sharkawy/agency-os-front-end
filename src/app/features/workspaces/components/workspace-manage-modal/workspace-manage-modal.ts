import { Component, effect, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideAlertTriangle,
  lucideArrowRightLeft,
  lucideCheck,
  lucideCheckCircle2,
  lucideCrown,
  lucideLoader2,
  lucideMail,
  lucidePencil,
  lucideSend,
  lucideSettings,
  lucideShield,
  lucideTrash2,
  lucideUserMinus,
  lucideUserPlus,
  lucideUsers,
  lucideX,
} from "@ng-icons/lucide";
import {
  WorkspaceMemberResponse,
  WorkspaceResponse,
  WorkspaceRole,
} from "../../../../core/api/models/workspace.models";
import { WorkspaceService } from "../../../../core/api/services/workspace.service";
import { InvitationService } from "../../../../core/api/services/invitation.service";
import { AuthStore } from "../../../../core/auth/auth.store";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { Select, SelectOption } from "../../../../shared/components/select/select";

export type ManageTab = "general" | "members" | "invite" | "danger";

@Component({
  selector: "aos-workspace-manage-modal",
  standalone: true,
  imports: [FormsModule, Button, Icons, Select],
  providers: [
    provideIcons({
      lucideSettings,
      lucideX,
      lucidePencil,
      lucideUsers,
      lucideUserPlus,
      lucideUserMinus,
      lucideTrash2,
      lucideCheck,
      lucideCheckCircle2,
      lucideAlertCircle,
      lucideAlertTriangle,
      lucideLoader2,
      lucideSend,
      lucideMail,
      lucideCrown,
      lucideShield,
      lucideArrowRightLeft,
    }),
  ],
  template: `
    @if (isOpen() && workspace()) {
      <div
        role="dialog"
        aria-modal="true"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      >
        <div
          class="border-outline-variant/60 bg-surface-container-lowest flex w-full max-w-xl flex-col overflow-hidden rounded-3xl border shadow-2xl transition-all"
        >
          <!-- Modal Header -->
          <div
            class="border-outline-variant/50 bg-surface-container-low/50 flex items-center justify-between border-b px-6 py-4"
          >
            <div class="flex items-center gap-2.5">
              <div
                class="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg"
              >
                <aos-icons name="lucideSettings" class="size-4" />
              </div>
              <div>
                <h2 class="text-on-surface text-base font-bold">Manage Workspace</h2>
                <p class="text-on-surface-variant font-mono text-xs">
                  {{ workspace()?.tenantId }}
                </p>
              </div>
            </div>

            <aos-button variant="ghost" class="size-8" ariaLabel="Close modal" (click)="onClose()">
              <aos-icons name="lucideX" class="size-4" />
            </aos-button>
          </div>

          <!-- Navigation Tabs -->
          <div
            class="border-outline-variant/40 bg-surface-container-lowest flex overflow-x-auto border-b px-6 pt-2"
          >
            <button
              type="button"
              (click)="setTab('general')"
              [class.border-primary]="activeTab() === 'general'"
              [class.text-primary]="activeTab() === 'general'"
              [class.border-transparent]="activeTab() !== 'general'"
              [class.text-on-surface-variant]="activeTab() !== 'general'"
              class="flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-bold whitespace-nowrap transition-colors"
            >
              <aos-icons name="lucidePencil" class="size-3.5" />
              <span>General</span>
            </button>

            <button
              type="button"
              (click)="setTab('members')"
              [class.border-primary]="activeTab() === 'members'"
              [class.text-primary]="activeTab() === 'members'"
              [class.border-transparent]="activeTab() !== 'members'"
              [class.text-on-surface-variant]="activeTab() !== 'members'"
              class="flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-bold whitespace-nowrap transition-colors"
            >
              <aos-icons name="lucideUsers" class="size-3.5" />
              <span>Members</span>
              @if (members().length > 0) {
                <span
                  class="bg-surface-container-high text-on-surface-variant py-0.2 ml-1 rounded-full px-1.5 text-[10px] font-bold"
                >
                  {{ members().length }}
                </span>
              }
            </button>

            <button
              type="button"
              (click)="setTab('invite')"
              [class.border-primary]="activeTab() === 'invite'"
              [class.text-primary]="activeTab() === 'invite'"
              [class.border-transparent]="activeTab() !== 'invite'"
              [class.text-on-surface-variant]="activeTab() !== 'invite'"
              class="flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-bold whitespace-nowrap transition-colors"
            >
              <aos-icons name="lucideUserPlus" class="size-3.5" />
              <span>Invite Users</span>
            </button>

            @if (workspace()?.role === "OWNER") {
              <button
                type="button"
                (click)="setTab('danger')"
                [class.border-error]="activeTab() === 'danger'"
                [class.text-error]="activeTab() === 'danger'"
                [class.border-transparent]="activeTab() !== 'danger'"
                [class.text-on-surface-variant]="activeTab() !== 'danger'"
                class="flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-bold whitespace-nowrap transition-colors"
              >
                <aos-icons name="lucideTrash2" class="size-3.5" />
                <span>Danger Zone</span>
              </button>
            }
          </div>

          <!-- Modal Body Content -->
          <div class="max-h-[70vh] overflow-y-auto p-6">
            <!-- TAB 1: General (Edit Name) -->
            @if (activeTab() === "general") {
              <form (ngSubmit)="submitUpdateName()" class="space-y-4">
                @if (updateNameSuccess()) {
                  <div
                    class="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                  >
                    <aos-icons name="lucideCheckCircle2" class="size-4 shrink-0" />
                    <span>{{ updateNameSuccess() }}</span>
                  </div>
                }

                @if (updateNameError()) {
                  <div
                    class="border-error/30 bg-error/10 text-error flex items-center gap-2 rounded-xl border p-3 text-xs font-medium"
                  >
                    <aos-icons name="lucideAlertCircle" class="size-4 shrink-0" />
                    <span>{{ updateNameError() }}</span>
                  </div>
                }

                <div>
                  <label
                    for="modalWorkspaceNameInput"
                    class="text-on-surface block text-xs font-bold sm:text-sm"
                  >
                    Workspace Name
                  </label>
                  <input
                    id="modalWorkspaceNameInput"
                    type="text"
                    [ngModel]="editName()"
                    (ngModelChange)="editName.set($event)"
                    name="editWorkspaceName"
                    required
                    minlength="2"
                    [disabled]="isUpdatingName() || workspace()?.role !== 'OWNER'"
                    class="border-outline-variant/70 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-primary/20 mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs transition-all focus:ring-2 focus:outline-none sm:text-sm"
                  />
                  @if (workspace()?.role !== "OWNER") {
                    <p class="text-on-surface-variant mt-1 text-[11px]">
                      Only the workspace Owner can modify the organization name.
                    </p>
                  }
                </div>

                <div>
                  <span class="text-on-surface block text-xs font-bold sm:text-sm">
                    Contact / Billing Email
                  </span>
                  <div
                    class="border-outline-variant/60 bg-surface-container-low/70 text-on-surface-variant mt-1.5 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm"
                  >
                    <aos-icons name="lucideMail" class="text-primary size-4 shrink-0" />
                    <span class="text-on-surface truncate font-medium">{{
                      workspace()?.contactEmail || "N/A"
                    }}</span>
                  </div>
                </div>

                @if (workspace()?.role === "OWNER") {
                  <div class="flex justify-end pt-2">
                    <aos-button
                      variant="primary"
                      type="submit"
                      [disabled]="
                        isUpdatingName() ||
                        !editName().trim() ||
                        editName().trim() === workspace()?.name
                      "
                    >
                      @if (isUpdatingName()) {
                        <aos-icons name="lucideLoader2" class="mr-1.5 size-3.5 animate-spin" />
                        <span>Saving...</span>
                      } @else {
                        <aos-icons name="lucideCheck" class="mr-1.5 size-3.5" />
                        <span>Save Changes</span>
                      }
                    </aos-button>
                  </div>
                }
              </form>
            }

            <!-- TAB 2: Members Management -->
            @else if (activeTab() === "members") {
              <div class="space-y-4">
                <!-- Feedback Alerts -->
                @if (memberActionSuccess()) {
                  <div
                    class="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                  >
                    <aos-icons name="lucideCheckCircle2" class="size-4 shrink-0" />
                    <span>{{ memberActionSuccess() }}</span>
                  </div>
                }

                @if (memberActionError()) {
                  <div
                    class="border-error/30 bg-error/10 text-error flex items-center gap-2 rounded-xl border p-3 text-xs font-medium"
                  >
                    <aos-icons name="lucideAlertCircle" class="size-4 shrink-0" />
                    <span>{{ memberActionError() }}</span>
                  </div>
                }

                <!-- Confirmation Modal: Transfer Ownership -->
                @if (transferTarget()) {
                  <div class="space-y-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
                    <div class="flex items-start gap-2.5">
                      <aos-icons name="lucideCrown" class="mt-0.5 size-5 shrink-0 text-amber-500" />
                      <div>
                        <h4 class="text-on-surface text-xs font-bold sm:text-sm">
                          Transfer Workspace Ownership
                        </h4>
                        <p class="text-on-surface-variant mt-1 text-xs leading-relaxed">
                          Are you sure you want to transfer ownership to
                          <strong
                            >{{ transferTarget()?.firstName }}
                            {{ transferTarget()?.lastName }} (&#64;{{
                              transferTarget()?.username
                            }})</strong
                          >? You will be demoted to an <strong>ADMIN</strong>.
                        </p>
                      </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-1">
                      <aos-button
                        variant="outlined"
                        size="sm"
                        [disabled]="memberActionLoading() !== null"
                        (click)="transferTarget.set(null)"
                      >
                        Cancel
                      </aos-button>
                      <aos-button
                        variant="primary"
                        size="sm"
                        [disabled]="memberActionLoading() !== null"
                        (click)="confirmTransferOwnership()"
                      >
                        @if (memberActionLoading() === transferTarget()?.userId) {
                          <aos-icons name="lucideLoader2" class="mr-1 size-3 animate-spin" />
                          <span>Transferring...</span>
                        } @else {
                          <aos-icons name="lucideCrown" class="mr-1 size-3" />
                          <span>Confirm Transfer</span>
                        }
                      </aos-button>
                    </div>
                  </div>
                }

                <!-- Confirmation Modal: Remove Member -->
                @if (removeTarget()) {
                  <div class="border-error/40 bg-error/10 space-y-3 rounded-2xl border p-4">
                    <div class="flex items-start gap-2.5">
                      <aos-icons
                        name="lucideAlertTriangle"
                        class="text-error mt-0.5 size-5 shrink-0"
                      />
                      <div>
                        <h4 class="text-error text-xs font-bold sm:text-sm">
                          Remove Member from Workspace
                        </h4>
                        <p class="text-on-surface-variant mt-1 text-xs leading-relaxed">
                          Are you sure you want to remove
                          <strong
                            >{{ removeTarget()?.firstName }} {{ removeTarget()?.lastName }} (&#64;{{
                              removeTarget()?.username
                            }})</strong
                          >? They will lose access to all projects, tasks, and data in this
                          workspace.
                        </p>
                      </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-1">
                      <aos-button
                        variant="outlined"
                        size="sm"
                        [disabled]="memberActionLoading() !== null"
                        (click)="removeTarget.set(null)"
                      >
                        Cancel
                      </aos-button>
                      <aos-button
                        variant="danger"
                        size="sm"
                        [disabled]="memberActionLoading() !== null"
                        (click)="confirmRemoveMember()"
                      >
                        @if (memberActionLoading() === removeTarget()?.userId) {
                          <aos-icons name="lucideLoader2" class="mr-1 size-3 animate-spin" />
                          <span>Removing...</span>
                        } @else {
                          <aos-icons name="lucideUserMinus" class="mr-1 size-3" />
                          <span>Remove Member</span>
                        }
                      </aos-button>
                    </div>
                  </div>
                }

                <!-- Members List Header & Refresh -->
                <div class="flex items-center justify-between">
                  <span class="text-on-surface text-xs font-bold tracking-wider uppercase">
                    Team Members ({{ members().length }})
                  </span>
                  <aos-button
                    variant="ghost"
                    size="sm"
                    [disabled]="isLoadingMembers()"
                    (click)="loadMembers()"
                  >
                    @if (isLoadingMembers()) {
                      <aos-icons name="lucideLoader2" class="size-3.5 animate-spin" />
                    } @else {
                      <span class="text-[11px]">Refresh</span>
                    }
                  </aos-button>
                </div>

                <!-- Loading / Error States -->
                @if (isLoadingMembers()) {
                  <div
                    class="text-on-surface-variant flex flex-col items-center justify-center py-8"
                  >
                    <aos-icons name="lucideLoader2" class="text-primary mb-2 size-6 animate-spin" />
                    <span class="text-xs">Loading members...</span>
                  </div>
                } @else if (membersError()) {
                  <div
                    class="border-error/30 bg-error/10 text-error flex items-center gap-2 rounded-xl border p-3 text-xs font-medium"
                  >
                    <aos-icons name="lucideAlertCircle" class="size-4 shrink-0" />
                    <span>{{ membersError() }}</span>
                  </div>
                } @else {
                  <!-- Members Listing -->
                  <div
                    class="divide-outline-variant/30 border-outline-variant/50 bg-surface-container-low divide-y overflow-hidden rounded-2xl border"
                  >
                    @for (member of members(); track member.userId) {
                      <div
                        class="hover:bg-surface-container-high/40 flex flex-col justify-between gap-3 p-3.5 transition-colors sm:flex-row sm:items-center"
                      >
                        <!-- Member Info -->
                        <div class="flex min-w-0 items-center gap-3">
                          <div
                            class="bg-primary/10 text-primary border-primary/20 flex size-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold"
                          >
                            {{ getInitials(member) }}
                          </div>
                          <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-1.5">
                              <span class="text-on-surface truncate text-xs font-bold sm:text-sm">
                                {{ member.firstName }} {{ member.lastName }}
                              </span>
                              @if (isSelf(member)) {
                                <span
                                  class="bg-primary/10 text-primary border-primary/20 py-0.2 rounded-md border px-1.5 text-[10px] font-bold"
                                >
                                  You
                                </span>
                              }
                              <span class="text-on-surface-variant truncate font-mono text-[11px]">
                                &#64;{{ member.username }}
                              </span>
                            </div>
                            <p class="text-on-surface-variant truncate text-[11px]">
                              {{ member.email }}
                            </p>
                          </div>
                        </div>

                        <!-- Member Role & Actions -->
                        <div class="flex shrink-0 items-center gap-2 self-end sm:self-center">
                          <!-- OWNER BADGE (Cannot change role directly) -->
                          @if (member.role === "OWNER") {
                            <span
                              class="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400"
                            >
                              <aos-icons name="lucideCrown" class="size-3" />
                              <span>OWNER</span>
                            </span>
                          } @else {
                            <!-- Role Dropdown for non-owners -->
                            @if (canModifyRole(member)) {
                              <div class="w-32">
                                <aos-select
                                  [options]="getMemberRoleOptions()"
                                  [value]="member.role"
                                  size="sm"
                                  [disabled]="memberActionLoading() === member.userId"
                                  (valueChange)="onRoleChange(member, $event)"
                                />
                              </div>
                            } @else {
                              <!-- Static Badge if cannot modify -->
                              <span
                                class="border-outline-variant/60 bg-surface-container text-on-surface-variant rounded-lg border px-2 py-1 text-[11px] font-semibold"
                              >
                                {{ member.role }}
                              </span>
                            }

                            <!-- Transfer Ownership Action (Only Owner can transfer to another member) -->
                            @if (workspace()?.role === "OWNER" && !isSelf(member)) {
                              <button
                                type="button"
                                title="Transfer Ownership"
                                aria-label="Transfer Ownership"
                                [disabled]="memberActionLoading() !== null"
                                (click)="transferTarget.set(member)"
                                class="text-on-surface-variant flex size-7 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-amber-500/10 hover:text-amber-500"
                              >
                                <aos-icons name="lucideCrown" class="size-3.5" />
                              </button>
                            }

                            <!-- Remove Member Action -->
                            @if (canRemoveMember(member)) {
                              <button
                                type="button"
                                title="Remove Member"
                                aria-label="Remove Member"
                                [disabled]="memberActionLoading() !== null"
                                (click)="removeTarget.set(member)"
                                class="text-on-surface-variant hover:text-error hover:bg-error/10 flex size-7 cursor-pointer items-center justify-center rounded-lg transition-colors"
                              >
                                <aos-icons name="lucideTrash2" class="size-3.5" />
                              </button>
                            }
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- TAB 3: Invite Users -->
            @else if (activeTab() === "invite") {
              <form (ngSubmit)="submitInviteUser()" class="space-y-4">
                @if (inviteSuccess()) {
                  <div
                    class="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                  >
                    <aos-icons name="lucideCheckCircle2" class="size-4 shrink-0" />
                    <span>{{ inviteSuccess() }}</span>
                  </div>
                }

                @if (inviteError()) {
                  <div
                    class="border-error/30 bg-error/10 text-error flex items-center gap-2 rounded-xl border p-3 text-xs font-medium"
                  >
                    <aos-icons name="lucideAlertCircle" class="size-4 shrink-0" />
                    <span>{{ inviteError() }}</span>
                  </div>
                }

                <div>
                  <label
                    for="modalInviteTargetInput"
                    class="text-on-surface block text-xs font-bold sm:text-sm"
                  >
                    Username or Email Address
                  </label>
                  <p class="text-on-surface-variant text-[11px]">
                    Enter the teammate's registered username or email to send an invitation.
                  </p>
                  <div class="relative mt-1.5">
                    <aos-icons
                      name="lucideUserPlus"
                      class="text-on-surface-variant pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
                    />
                    <input
                      id="modalInviteTargetInput"
                      type="text"
                      placeholder="e.g. alex_dev or teammate@example.com"
                      [ngModel]="inviteTarget()"
                      (ngModelChange)="inviteTarget.set($event)"
                      name="inviteTarget"
                      required
                      [disabled]="isInviting()"
                      class="border-outline-variant/70 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-primary/20 w-full rounded-xl border py-2.5 pr-4 pl-10 text-xs transition-all focus:ring-2 focus:outline-none sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <span class="text-on-surface mb-1.5 block text-xs font-bold sm:text-sm">
                    Workspace Role
                  </span>
                  <aos-select
                    [options]="getInviteRoleOptions()"
                    [value]="inviteRole()"
                    [disabled]="isInviting()"
                    (valueChange)="inviteRole.set($event)"
                  />
                </div>

                <div class="flex justify-end pt-2">
                  <aos-button
                    variant="primary"
                    type="submit"
                    [disabled]="isInviting() || !inviteTarget().trim()"
                  >
                    @if (isInviting()) {
                      <aos-icons name="lucideLoader2" class="mr-1.5 size-3.5 animate-spin" />
                      <span>Sending Invitation...</span>
                    } @else {
                      <aos-icons name="lucideSend" class="mr-1.5 size-3.5" />
                      <span>Send Invitation</span>
                    }
                  </aos-button>
                </div>
              </form>
            }

            <!-- TAB 4: Danger Zone (Delete) -->
            @else if (activeTab() === "danger" && workspace()?.role === "OWNER") {
              <form (ngSubmit)="submitDeleteWorkspace()" class="space-y-4">
                @if (deleteError()) {
                  <div
                    class="border-error/30 bg-error/10 text-error flex items-center gap-2 rounded-xl border p-3 text-xs font-medium"
                  >
                    <aos-icons name="lucideAlertCircle" class="size-4 shrink-0" />
                    <span>{{ deleteError() }}</span>
                  </div>
                }

                <div class="border-error/30 bg-error/10 rounded-2xl border p-4">
                  <div class="flex items-start gap-2.5">
                    <aos-icons name="lucideAlertTriangle" class="text-error size-5 shrink-0" />
                    <div>
                      <h3 class="text-error text-xs font-bold sm:text-sm">Delete this workspace</h3>
                      <p class="text-on-surface-variant mt-1 text-[11px] leading-relaxed">
                        Once deleted, all isolated tenant schemas, CRM contacts, Kanban boards, and
                        invoices associated with <strong>{{ workspace()?.name }}</strong> will be
                        permanently removed. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    for="modalDeleteConfirmInput"
                    class="text-on-surface block text-xs font-bold"
                  >
                    Type
                    <span class="text-error font-mono font-bold select-all">{{
                      workspace()?.name
                    }}</span>
                    to confirm:
                  </label>
                  <input
                    id="modalDeleteConfirmInput"
                    type="text"
                    [ngModel]="deleteConfirmName()"
                    (ngModelChange)="deleteConfirmName.set($event)"
                    name="deleteConfirm"
                    placeholder="Enter workspace name exactly"
                    [disabled]="isDeleting()"
                    class="border-error/50 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 focus:border-error focus:ring-error/20 mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs transition-all focus:ring-2 focus:outline-none sm:text-sm"
                  />
                </div>

                <div class="flex justify-end pt-2">
                  <aos-button
                    variant="danger"
                    type="submit"
                    [disabled]="isDeleting() || deleteConfirmName().trim() !== workspace()?.name"
                  >
                    @if (isDeleting()) {
                      <aos-icons name="lucideLoader2" class="mr-1.5 size-3.5 animate-spin" />
                      <span>Deleting Workspace...</span>
                    } @else {
                      <aos-icons name="lucideTrash2" class="mr-1.5 size-3.5" />
                      <span>Delete Workspace</span>
                    }
                  </aos-button>
                </div>
              </form>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class WorkspaceManageModal {
  private readonly workspaceService = inject(WorkspaceService);
  private readonly invitationService = inject(InvitationService);
  private readonly authStore = inject(AuthStore);

  readonly isOpen = input<boolean>(false);
  readonly workspace = input<WorkspaceResponse | null>(null);
  readonly initialTab = input<ManageTab>("general");

  readonly closed = output<void>();
  readonly updated = output<WorkspaceResponse>();
  readonly deleted = output<string>();
  readonly tabChange = output<ManageTab>();

  readonly activeTab = signal<ManageTab>("general");

  // Tab 1: General State
  readonly editName = signal<string>("");
  readonly isUpdatingName = signal<boolean>(false);
  readonly updateNameSuccess = signal<string | null>(null);
  readonly updateNameError = signal<string | null>(null);

  // Tab 2: Members State
  readonly members = signal<WorkspaceMemberResponse[]>([]);
  readonly isLoadingMembers = signal<boolean>(false);
  readonly membersError = signal<string | null>(null);
  readonly memberActionSuccess = signal<string | null>(null);
  readonly memberActionError = signal<string | null>(null);
  readonly memberActionLoading = signal<string | null>(null);
  readonly transferTarget = signal<WorkspaceMemberResponse | null>(null);
  readonly removeTarget = signal<WorkspaceMemberResponse | null>(null);

  // Tab 3: Invite State
  readonly inviteTarget = signal<string>("");
  readonly inviteRole = signal<WorkspaceRole>("MEMBER");
  readonly isInviting = signal<boolean>(false);
  readonly inviteSuccess = signal<string | null>(null);
  readonly inviteError = signal<string | null>(null);

  // Tab 4: Delete State
  readonly deleteConfirmName = signal<string>("");
  readonly isDeleting = signal<boolean>(false);
  readonly deleteError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const ws = this.workspace();
      const tab = this.initialTab();
      if (ws) {
        this.editName.set(ws.name);
        this.activeTab.set(tab);
        this.resetState();
        if (tab === "members" || this.isOpen()) {
          this.loadMembers();
        }
      }
    });
  }

  setTab(tab: ManageTab): void {
    this.activeTab.set(tab);
    this.tabChange.emit(tab);
    this.memberActionSuccess.set(null);
    this.memberActionError.set(null);
    if (tab === "members") {
      this.loadMembers();
    }
  }

  loadMembers(): void {
    const ws = this.workspace();
    if (!ws) return;

    this.isLoadingMembers.set(true);
    this.membersError.set(null);

    this.workspaceService.getMembers(ws.tenantId).subscribe({
      next: members => {
        this.isLoadingMembers.set(false);
        this.members.set(members);
      },
      error: (err: unknown) => {
        this.isLoadingMembers.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to load workspace members.");
        this.membersError.set(detail);
      },
    });
  }

  getInitials(member: WorkspaceMemberResponse): string {
    const first = member.firstName?.[0] ?? "";
    const last = member.lastName?.[0] ?? "";
    return (first + last).toUpperCase() || member.username?.slice(0, 2).toUpperCase() || "U";
  }

  getMemberRoleOptions(): SelectOption<WorkspaceRole>[] {
    const opts: SelectOption<WorkspaceRole>[] = [
      { label: "MEMBER", value: "MEMBER", description: "Standard Access" },
      { label: "ADMIN", value: "ADMIN", description: "Workspace Management" },
    ];
    if (this.workspace()?.role === "OWNER") {
      opts.push({ label: "CLIENT", value: "CLIENT", description: "External Portal Access" });
    }
    return opts;
  }

  getInviteRoleOptions(): SelectOption<WorkspaceRole>[] {
    const opts: SelectOption<WorkspaceRole>[] = [
      { label: "MEMBER (Standard Access)", value: "MEMBER" },
      { label: "ADMIN (Workspace Management)", value: "ADMIN" },
    ];
    if (this.workspace()?.role === "OWNER") {
      opts.push({ label: "CLIENT (External Portal Access)", value: "CLIENT" });
    }
    return opts;
  }

  isSelf(member: WorkspaceMemberResponse): boolean {
    const currentUser = this.authStore.user();
    if (!currentUser) return false;
    return (
      (!!currentUser.id && currentUser.id === member.userId) ||
      (!!currentUser.username &&
        currentUser.username.toLowerCase() === member.username.toLowerCase()) ||
      (!!currentUser.email && currentUser.email.toLowerCase() === member.email.toLowerCase())
    );
  }

  canModifyRole(member: WorkspaceMemberResponse): boolean {
    if (this.isSelf(member)) return false;
    const currentRole = this.workspace()?.role;
    if (member.role === "OWNER") return false;
    if (currentRole === "OWNER") return true;
    if (currentRole === "ADMIN" && member.role === "MEMBER") return true;
    return false;
  }

  canRemoveMember(member: WorkspaceMemberResponse): boolean {
    if (this.isSelf(member)) return false;
    const currentRole = this.workspace()?.role;
    if (member.role === "OWNER") return false;
    if (currentRole === "OWNER") return true;
    if (currentRole === "ADMIN" && member.role === "MEMBER") return true;
    return false;
  }

  onRoleChange(member: WorkspaceMemberResponse, newRole: WorkspaceRole): void {
    const ws = this.workspace();
    if (!ws || member.role === newRole) return;

    this.memberActionLoading.set(member.userId);
    this.memberActionSuccess.set(null);
    this.memberActionError.set(null);

    this.workspaceService
      .updateMemberRole(ws.tenantId, member.userId, { role: newRole })
      .subscribe({
        next: () => {
          this.memberActionLoading.set(null);
          this.memberActionSuccess.set(`Updated role of @${member.username} to ${newRole}.`);
          this.loadMembers();
        },
        error: (err: unknown) => {
          this.memberActionLoading.set(null);
          const detail =
            (err as { error?: { detail?: string } })?.error?.detail ||
            (err instanceof Error ? err.message : "Failed to update member role.");
          this.memberActionError.set(detail);
        },
      });
  }

  confirmRemoveMember(): void {
    const ws = this.workspace();
    const target = this.removeTarget();
    if (!ws || !target) return;

    this.memberActionLoading.set(target.userId);
    this.memberActionSuccess.set(null);
    this.memberActionError.set(null);

    this.workspaceService.removeMember(ws.tenantId, target.userId).subscribe({
      next: () => {
        this.memberActionLoading.set(null);
        this.memberActionSuccess.set(`Removed @${target.username} from workspace.`);
        this.removeTarget.set(null);
        this.loadMembers();
      },
      error: (err: unknown) => {
        this.memberActionLoading.set(null);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to remove member.");
        this.memberActionError.set(detail);
      },
    });
  }

  confirmTransferOwnership(): void {
    const ws = this.workspace();
    const target = this.transferTarget();
    if (!ws || !target) return;

    this.memberActionLoading.set(target.userId);
    this.memberActionSuccess.set(null);
    this.memberActionError.set(null);

    this.workspaceService.transferOwnership(ws.tenantId, { newOwnerId: target.userId }).subscribe({
      next: () => {
        this.memberActionLoading.set(null);
        this.memberActionSuccess.set(
          `Ownership transferred to @${target.username}. You are now an ADMIN.`,
        );
        this.transferTarget.set(null);
        this.loadMembers();
        // Update current workspace object role to ADMIN locally and notify parent
        const updatedWs: WorkspaceResponse = {
          ...ws,
          role: "ADMIN",
        };
        this.updated.emit(updatedWs);
      },
      error: (err: unknown) => {
        this.memberActionLoading.set(null);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to transfer ownership.");
        this.memberActionError.set(detail);
      },
    });
  }

  onClose(): void {
    this.resetState();
    this.closed.emit();
  }

  submitUpdateName(): void {
    const ws = this.workspace();
    const name = this.editName().trim();
    if (!ws || !name || name === ws.name) return;

    this.isUpdatingName.set(true);
    this.updateNameSuccess.set(null);
    this.updateNameError.set(null);

    this.workspaceService
      .updateWorkspace(ws.tenantId, {
        name,
        contactEmail: ws.contactEmail,
      })
      .subscribe({
        next: updated => {
          this.isUpdatingName.set(false);
          this.updateNameSuccess.set("Workspace name updated successfully!");
          this.updated.emit(updated);
        },
        error: (err: unknown) => {
          this.isUpdatingName.set(false);
          const detail =
            (err as { error?: { detail?: string } })?.error?.detail ||
            (err instanceof Error ? err.message : "Failed to update workspace name.");
          this.updateNameError.set(detail);
        },
      });
  }

  submitInviteUser(): void {
    const ws = this.workspace();
    const target = this.inviteTarget().trim();
    if (!ws || !target) {
      this.inviteError.set("Username or email is required.");
      return;
    }

    this.isInviting.set(true);
    this.inviteSuccess.set(null);
    this.inviteError.set(null);

    const isEmail = target.includes("@");
    const payload = {
      username: isEmail ? undefined : target,
      email: isEmail ? target.toLowerCase() : undefined,
      role: this.inviteRole(),
    };

    this.invitationService.inviteUser(ws.tenantId, payload).subscribe({
      next: () => {
        this.isInviting.set(false);
        this.inviteSuccess.set(`Invitation sent to ${target}!`);
        this.inviteTarget.set("");
      },
      error: (err: unknown) => {
        this.isInviting.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to send invitation.");
        this.inviteError.set(detail);
      },
    });
  }

  submitDeleteWorkspace(): void {
    const ws = this.workspace();
    if (!ws || this.deleteConfirmName().trim() !== ws.name) return;

    this.isDeleting.set(true);
    this.deleteError.set(null);

    this.workspaceService.deleteWorkspace(ws.tenantId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.deleted.emit(ws.tenantId);
        this.onClose();
      },
      error: (err: unknown) => {
        this.isDeleting.set(false);
        const detail =
          (err as { error?: { detail?: string } })?.error?.detail ||
          (err instanceof Error ? err.message : "Failed to delete workspace.");
        this.deleteError.set(detail);
      },
    });
  }

  private resetState(): void {
    this.updateNameSuccess.set(null);
    this.updateNameError.set(null);
    this.isUpdatingName.set(false);

    this.memberActionSuccess.set(null);
    this.memberActionError.set(null);
    this.memberActionLoading.set(null);
    this.transferTarget.set(null);
    this.removeTarget.set(null);

    this.inviteTarget.set("");
    this.inviteRole.set("MEMBER");
    this.inviteSuccess.set(null);
    this.inviteError.set(null);
    this.isInviting.set(false);

    this.deleteConfirmName.set("");
    this.deleteError.set(null);
    this.isDeleting.set(false);
  }
}
