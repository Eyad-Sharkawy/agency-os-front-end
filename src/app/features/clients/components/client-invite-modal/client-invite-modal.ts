import { Component, computed, effect, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideCheck,
  lucideCheckCircle2,
  lucideInfo,
  lucideLoader2,
  lucideMail,
  lucideShieldCheck,
  lucideUserPlus,
  lucideX,
} from "@ng-icons/lucide";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { ClientManagement } from "../../services/client-management";

@Component({
  selector: "aos-client-invite-modal",
  standalone: true,
  imports: [FormsModule, Button, Icons],
  providers: [
    provideIcons({
      lucideUserPlus,
      lucideX,
      lucideMail,
      lucideCheck,
      lucideCheckCircle2,
      lucideLoader2,
      lucideAlertCircle,
      lucideShieldCheck,
      lucideInfo,
    }),
  ],
  templateUrl: "./client-invite-modal.html",
})
export class ClientInviteModal {
  readonly cm = inject(ClientManagement);

  readonly isOpen = computed(() => this.cm.isInviteModalOpen());
  readonly client = computed(() => this.cm.selectedClient());
  readonly isInviting = computed(() => this.cm.isInviting());
  readonly successMessage = computed(() => this.cm.inviteSuccess());
  readonly errorMessage = computed(() => this.cm.inviteError());

  readonly targetInput = signal("");

  constructor() {
    effect(() => {
      const isOpen = this.isOpen();
      const client = this.client();

      if (isOpen && client) {
        this.targetInput.set(this.cm.inviteTarget() || client.email || "");
      } else if (!isOpen) {
        this.targetInput.set("");
      }
    });
  }

  readonly isTargetValid = computed(() => {
    const val = this.targetInput().trim();
    if (!val) return false;
    if (val.includes("@")) {
      const atIdx = val.indexOf("@");
      const dotIdx = val.lastIndexOf(".");
      return atIdx > 0 && dotIdx > atIdx + 1 && dotIdx < val.length - 1 && !/\s/.test(val);
    }
    return val.length >= 3;
  });

  onClose(): void {
    if (!this.isInviting()) {
      this.cm.closeModals();
    }
  }

  onSubmit(): void {
    if (!this.isTargetValid() || this.isInviting()) return;
    this.cm.inviteClientUser(this.targetInput().trim()).subscribe();
  }
}
