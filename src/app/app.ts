import { Component,signal } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import {ViewEncapsulation} from'@angular/core';
import { Footer } from "./shared/component/footer/footer";



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CKEditorModule, FormsModule, RouterOutlet, Footer],
  templateUrl: './app.html',
  encapsulation: ViewEncapsulation.None,
  styleUrl:'./app.scss'
})




export class App {
  protected readonly title = signal('us-admin');
  showHeader = true;
  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.showHeader = !event.url.includes('login');
      }
    });
  }
}