import { Component, computed, OnDestroy, OnInit, signal } from "@angular/core";
import { Button } from "../../shared/components/button/button";
import { RouterLink } from "@angular/router";
import { Icons } from "../../shared/components/icons/icons";
import { provideIcons } from "@ng-icons/core";
import { FeatureCard } from "./feature-card/feature-card";

import {
  lucideArrowRight,
  lucideBarChart3,
  lucideCalendarRange,
  lucideCheckCircle2,
  lucideCircleDot,
  lucideClipboardList,
  lucideClock,
  lucideFolderKanban,
  lucideKanbanSquare,
  lucideLayers,
  lucidePlay,
  lucideReceiptText,
  lucideShieldCheck,
  lucideSparkles,
  lucideTimer,
  lucideTrendingUp,
  lucideUsers,
  lucideWorkflow,
  lucideZap,
} from "@ng-icons/lucide";
import { simpleGithub } from "@ng-icons/simple-icons";

@Component({
  selector: "aos-landing-page",
  imports: [Button, RouterLink, Icons, FeatureCard],
  providers: [
    provideIcons({
      lucideUsers,
      lucideClipboardList,
      lucideKanbanSquare,
      lucideCalendarRange,
      lucideTimer,
      lucideReceiptText,
      lucideWorkflow,
      lucideTrendingUp,
      lucideBarChart3,
      lucideSparkles,
      lucideArrowRight,
      lucideCheckCircle2,
      lucideShieldCheck,
      lucideZap,
      lucideLayers,
      lucideClock,
      lucideFolderKanban,
      lucideCircleDot,
      lucidePlay,
      simpleGithub,
    }),
  ],
  templateUrl: "./landing-page.html",
})
export class LandingPage implements OnInit, OnDestroy {
  private timerIntervalId?: ReturnType<typeof setInterval>;
  readonly timerSeconds = signal<number>(3 * 3600 + 42 * 60 + 19);

  readonly formattedTimer = computed(() => {
    const total = this.timerSeconds();
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  });

  ngOnInit(): void {
    this.timerIntervalId = setInterval(() => {
      this.timerSeconds.update(s => s + 1);
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
    }
  }
}
