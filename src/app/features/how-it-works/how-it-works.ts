import { Component, computed, OnDestroy, OnInit, signal } from "@angular/core";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";
import { RouterLink } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import {
  lucideArrowRight,
  lucideBuilding2,
  lucideCheckCircle2,
  lucideClock,
  lucideCpu,
  lucideFileText,
  lucideFolderKanban,
  lucideLayers,
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
  selector: "aos-how-it-works",
  imports: [Button, Icons, RouterLink],
  providers: [
    provideIcons({
      lucideSparkles,
      lucideArrowRight,
      lucideCheckCircle2,
      lucideUsers,
      lucideFolderKanban,
      lucideTimer,
      lucideReceiptText,
      lucideLayers,
      lucideShieldCheck,
      lucideZap,
      lucideClock,
      lucideTrendingUp,
      lucideBuilding2,
      lucideFileText,
      lucideWorkflow,
      lucideCpu,
      simpleGithub,
    }),
  ],
  templateUrl: "./how-it-works.html",
  styleUrl: "./how-it-works.css",
})
export class HowItWorks implements OnInit, OnDestroy {
  private timerIntervalId?: ReturnType<typeof setInterval>;
  readonly timerSeconds = signal<number>(3 * 3600 + 14 * 60 + 22);

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
