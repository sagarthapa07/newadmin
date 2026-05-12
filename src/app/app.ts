import { Component,signal } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import {ViewEncapsulation} from'@angular/core';
import { CalenderOpportunity } from "./core/calender-opportunity/calender-opportunity";
import { Editor } from './shared/component/editor/editor';
// import {NgxCroppedEvent, NgxPhotoEditorService} from "ngx-photo-editor";



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CKEditorModule, FormsModule, RouterOutlet, CalenderOpportunity,Editor],
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


  //  output?: NgxCroppedEvent;

  // // constructor() {}

  // fileChangeHandler($event: any) {
  //   this.service.open($event, {
  //     aspectRatio: 4 / 3,
  //     autoCropArea: 1
  //   }).subscribe(data => {
  //     this.output = data;
  //   });
  // }
}