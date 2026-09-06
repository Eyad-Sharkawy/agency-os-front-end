import { Component, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { AuthStore } from "../../core/auth/stores/auth.store";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";
import { provideIcons } from "@ng-icons/core";
import { simpleGithub } from "@ng-icons/simple-icons";
import {
  lucideArrowRight,
  lucideBuilding,
  lucideCheck,
  lucideCheckCircle2,
  lucideCopy,
  lucideLayers,
  lucidePause,
  lucidePlay,
  lucideReceiptText,
  lucideShieldCheck,
  lucideSparkles,
  lucideTimer,
  lucideUsers,
  lucideZap,
} from "@ng-icons/lucide";

export interface DemoPersona {
  id: string;
  name: string;
  title: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "CLIENT";
  username: string;
  email: string;
  avatarInitials: string;
  colorClass: string;
  badgeClass: string;
  description: string;
  highlightText: string;
  highlightIcon: string;
  capabilities: string[];
}

@Component({
  selector: "aos-demo",
  standalone: true,
  imports: [Button, RouterLink, Icons],
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideCheckCircle2,
      lucideShieldCheck,
      lucideZap,
      lucideLayers,
      lucideTimer,
      lucideUsers,
      lucideReceiptText,
      lucideSparkles,
      lucidePlay,
      lucidePause,
      lucideBuilding,
      lucideCopy,
      lucideCheck,
      simpleGithub,
    }),
  ],
  templateUrl: "./demo.html",
})
export class DemoComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly loggingInUser = signal<string | null>(null);
  readonly copiedUser = signal<string | null>(null);
  readonly copiedPassword = signal<boolean>(false);
  readonly copiedField = signal<string | null>(null);

  readonly personas: DemoPersona[] = [
    {
      id: "owner-alex",
      name: "Alex Vance",
      title: "Agency Founder & CEO",
      role: "OWNER",
      username: "alex_owner",
      email: "alex.owner@agency-os.dev",
      avatarInitials: "AV",
      colorClass: "border-emerald-500/40 bg-emerald-500/5",
      badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      description:
        "Complete sovereign control over financial realization, rate cards, and team management.",
      highlightText: "Executive Realization & PDF Billing",
      highlightIcon: "lucideReceiptText",
      capabilities: [
        "View company-wide revenue & profitability metrics",
        "Generate and download PDF invoices with Apache PDFBox",
        "Manage global rate cards and client contracts",
        "Invite and configure permissions for new team members",
      ],
    },
    {
      id: "admin-marcus",
      name: "Marcus Wright",
      title: "VP of Engineering & Operations",
      role: "ADMIN",
      username: "marcus_admin",
      email: "marcus.admin@agency-os.dev",
      avatarInitials: "MW",
      colorClass: "border-purple-500/40 bg-purple-500/5",
      badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      description:
        "Technical sprint planning, deliverable scoping, and client relationship management.",
      highlightText: "Sprint & Client Operations",
      highlightIcon: "lucideLayers",
      capabilities: [
        "Create and manage client deliverable projects",
        "Assign tasks to developers and UI designers",
        "Track milestone deadlines on the shared calendar",
        "Review team timesheets and logged hours",
      ],
    },
    {
      id: "admin-rachel",
      name: "Rachel Adams",
      title: "Head of Delivery & Client Success",
      role: "ADMIN",
      username: "rachel_admin",
      email: "rachel.admin@agency-os.dev",
      avatarInitials: "RA",
      colorClass: "border-purple-500/40 bg-purple-500/5",
      badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      description: "Client delivery schedules, invoice approvals, and client communication lead.",
      highlightText: "Delivery & Invoice Reviews",
      highlightIcon: "lucideShieldCheck",
      capabilities: [
        "Review client feedback and status changes",
        "Approve time logs prior to monthly invoicing",
        "Track client retainer utilization caps",
        "Supervise project timelines and milestones",
      ],
    },
    {
      id: "member-sarah",
      name: "Sarah Chen",
      title: "Lead Full-Stack Engineer",
      role: "MEMBER",
      username: "sarah_member",
      email: "sarah.member@agency-os.dev",
      avatarInitials: "SC",
      colorClass: "border-sky-500/40 bg-sky-500/5",
      badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/30",
      description: "Hands-on development with active real-time stopwatch tracking.",
      highlightText: "Live Running Stopwatch Active",
      highlightIcon: "lucideTimer",
      capabilities: [
        "Active live stopwatch running in real-time",
        "Interactive drag-and-drop Kanban task board",
        "Direct billable time entries logged to tasks",
        "Assigned to Kubernetes and JWT security tasks",
      ],
    },
    {
      id: "member-liam",
      name: "Liam Rodriguez",
      title: "Senior UI/UX Designer",
      role: "MEMBER",
      username: "liam_member",
      email: "liam.member@agency-os.dev",
      avatarInitials: "LR",
      colorClass: "border-sky-500/40 bg-sky-500/5",
      badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/30",
      description: "Design systems, Figma tokens, and interactive component specs.",
      highlightText: "Paused Stopwatch Ready to Resume",
      highlightIcon: "lucidePause",
      capabilities: [
        "Accumulated 45-minute paused stopwatch",
        "Design token architecture deliverables",
        "Drag tasks across TODO, IN_PROGRESS, REVIEW",
        "Personal developer timesheet breakdown",
      ],
    },
    {
      id: "member-james",
      name: "James Wilson",
      title: "Cloud & DevOps Architect",
      role: "MEMBER",
      username: "james_member",
      email: "james.member@agency-os.dev",
      avatarInitials: "JW",
      colorClass: "border-sky-500/40 bg-sky-500/5",
      badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/30",
      description: "Terraform IaC, Prometheus telemetry, and multi-region Kubernetes deployments.",
      highlightText: "Infrastructure & Timesheets",
      highlightIcon: "lucideZap",
      capabilities: [
        "Assigned to cloud migration & monitoring tasks",
        "Direct hour logging against sprint tickets",
        "Collaborative task assignees with lead engineer",
        "Real-time task state transitions",
      ],
    },
    {
      id: "client-david",
      name: "David Miller",
      title: "VP of Engineering at Cybernetic Co.",
      role: "CLIENT",
      username: "david_client",
      email: "david.client@cybernetic.co",
      avatarInitials: "DM",
      colorClass: "border-amber-500/40 bg-amber-500/5",
      badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      description:
        "Client portal view restricted strictly to Cybernetic Co. deliverables and invoices.",
      highlightText: "Cybernetic Co. Portal (Isolated)",
      highlightIcon: "lucideBuilding",
      capabilities: [
        "Access only Cybernetic Co. projects & milestones",
        "View paid and issued PDF invoices",
        "Strict database-level multi-tenant isolation",
        "Restricted from internal developer timesheets",
      ],
    },
    {
      id: "client-elena",
      name: "Elena Rostova",
      title: "Product Director at Velocity Labs",
      role: "CLIENT",
      username: "elena_client",
      email: "elena.client@velocitylabs.io",
      avatarInitials: "ER",
      colorClass: "border-amber-500/40 bg-amber-500/5",
      badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      description:
        "Client portal view restricted strictly to Velocity Labs projects and billed items.",
      highlightText: "Velocity Labs Portal (Isolated)",
      highlightIcon: "lucideBuilding",
      capabilities: [
        "Access only Velocity Labs Design System deliverables",
        "View and track Velocity Labs billing invoices",
        "Zero visibility into other agency clients",
        "Instant portal login verification",
      ],
    },
  ];

  async launchDemo(persona: DemoPersona): Promise<void> {
    this.loggingInUser.set(persona.username);
    try {
      const success = await this.authStore.loginDemo(persona.username, "DemoPass123!");
      if (success) {
        await this.router.navigate(["/workspaces"]);
      }
    } finally {
      this.loggingInUser.set(null);
    }
  }

  copyUsername(persona: DemoPersona, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    navigator.clipboard?.writeText(persona.username);
    this.copiedField.set(`${persona.username}-user`);
    setTimeout(() => {
      if (this.copiedField() === `${persona.username}-user`) {
        this.copiedField.set(null);
      }
    }, 2000);
  }

  copyCredentials(persona: DemoPersona, event: Event): void {
    event.stopPropagation();
    const text = `Username: ${persona.username}\nPassword: DemoPass123!`;
    navigator.clipboard?.writeText(text);
    this.copiedUser.set(persona.username);
    setTimeout(() => {
      if (this.copiedUser() === persona.username) {
        this.copiedUser.set(null);
      }
    }, 2000);
  }

  copyPassword(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    navigator.clipboard?.writeText("DemoPass123!");
    this.copiedPassword.set(true);
    setTimeout(() => {
      this.copiedPassword.set(false);
    }, 2000);
  }
}
