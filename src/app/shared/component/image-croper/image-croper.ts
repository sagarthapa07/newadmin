import {Component} from '@angular/core';
import {NgxCroppedEvent, NgxPhotoEditorService} from "ngx-photo-editor";


@Component({
  selector: 'app-image-croper',
  standalone: true,
  imports: [],
  templateUrl: './image-croper.html',
  styleUrl: './image-croper.scss',
})
export class ImageCroper {
  output?: NgxCroppedEvent;

  constructor(private service: NgxPhotoEditorService) {}

  fileChangeHandler($event: any) {
    this.service.open($event, {
      aspectRatio: 4 / 3,
      autoCropArea: 1
    }).subscribe(data => {
      this.output = data;
    });
  }
}