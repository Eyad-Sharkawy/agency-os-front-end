import { DatePipe } from "@angular/common";
import { Component, inject, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import {
  lucideArrowUpRight,
  lucideBuilding2,
  lucideCalendar,
  lucideMail,
  lucideMoreVertical,
  lucidePencil,
  lucideTrash2,
  lucideUserPlus,
} from "@ng-icons/lucide";
import { ClientResponse } from "../../../../core/api/models/client.models";
import { Button } from "../../../../shared/components/button/button";
import { Icons } from "../../../../shared/components/icons/icons";
import { ClientManagement } from "../../services/client-management";

@Component({
  selector: "aos-client-card",
  standalone: true,
  imports: [DatePipe, RouterLink, Icons, Button],
  providers: [
    provideIcons({
      lucideBuilding2,
      lucideMail,
      lucideCalendar,
      lucidePencil,
      lucideTrash2,
      lucideMoreVertical,
      lucideArrowUpRight,
      lucideUserPlus,
    }),
  ],
  templateUrl: "./client-card.html",
})
export class ClientCard {
  readonly cm = inject(ClientManagement);
  readonly client = input.required<ClientResponse>();

  onInvite(): void {
    this.cm.openInviteModal(this.client());
  }

  onEdit(): void {
    this.cm.openEditModal(this.client());
  }

  onDelete(): void {
    this.cm.openDeleteModal(this.client());
  }
}
