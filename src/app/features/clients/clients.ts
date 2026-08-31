import { DatePipe } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import {
  lucideAlertCircle,
  lucideArrowUpRight,
  lucideBuilding2,
  lucideCheckCircle2,
  lucideFilter,
  lucideGrid,
  lucideLayoutList,
  lucideLoader2,
  lucidePencil,
  lucidePlus,
  lucideRefreshCw,
  lucideSearch,
  lucideTrash2,
  lucideUserPlus,
  lucideUsers,
  lucideX,
} from "@ng-icons/lucide";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";
import { ClientCard } from "./components/client-card/client-card";
import { ClientDeleteModal } from "./components/client-delete-modal/client-delete-modal";
import { ClientInviteModal } from "./components/client-invite-modal/client-invite-modal";
import { ClientModal } from "./components/client-modal/client-modal";
import { ClientFilterStatus, ClientManagement, ClientViewMode } from "./services/client-management";

@Component({
  selector: "aos-clients",
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    Button,
    Icons,
    ClientCard,
    ClientModal,
    ClientDeleteModal,
    ClientInviteModal,
  ],
  providers: [
    provideIcons({
      lucideUsers,
      lucidePlus,
      lucideSearch,
      lucideGrid,
      lucideLayoutList,
      lucideRefreshCw,
      lucideX,
      lucideBuilding2,
      lucideCheckCircle2,
      lucideAlertCircle,
      lucideLoader2,
      lucidePencil,
      lucideTrash2,
      lucideArrowUpRight,
      lucideFilter,
      lucideUserPlus,
    }),
  ],
  templateUrl: "./clients.html",
})
export class ClientsComponent implements OnInit {
  readonly cm = inject(ClientManagement);

  ngOnInit(): void {
    this.cm.loadClients();
  }

  onSearch(query: string): void {
    this.cm.setSearchQuery(query);
  }

  onStatusFilter(status: ClientFilterStatus): void {
    this.cm.setStatusFilter(status);
  }

  onViewMode(mode: ClientViewMode): void {
    this.cm.setViewMode(mode);
  }
}
