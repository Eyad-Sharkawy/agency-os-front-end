import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LogoComponent } from "../../shared/components/logo/logo";
import { Icons } from "../../shared/components/icons/icons";
import { provideIcons } from "@ng-icons/core";
import { simpleGithub } from "@ng-icons/simple-icons";
import { lucideArrowRight, lucideExternalLink, lucideHeart } from "@ng-icons/lucide";

@Component({
  selector: "aos-footer",
  imports: [RouterLink, LogoComponent, Icons],
  providers: [provideIcons({ simpleGithub, lucideHeart, lucideExternalLink, lucideArrowRight })],
  templateUrl: "./footer.html",
})
export class Footer {
  readonly currentYear = new Date().getFullYear();
}
