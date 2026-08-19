import { Component, signal } from '@angular/core';
import { LogoComponent } from './shared/components/logo/logo';
import { provideIcons } from '@ng-icons/core';
import { simpleGithub } from '@ng-icons/simple-icons';
import { Icons } from './shared/components/icons/icons';

@Component({
  selector: 'aos-root',
  imports: [LogoComponent, Icons],
  providers: provideIcons({ simpleGithub }),
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('agency-os');
}
