// import {
//   Component,
//   EventEmitter,
//   Input,
//   NgZone,
//   Output,
//   SimpleChanges,
//   TemplateRef,
//   ViewChild,
//   ViewEncapsulation,
// } from '@angular/core';
// import { NgxCroppedEvent, NgxPhotoEditorService } from 'ngx-photo-editor';
// import { NgbModal, NgbModalConfig, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
// import { ChangeDetectionStrategy } from '@angular/core';

// @Component({
//   selector: 'app-image-croper',
//   standalone: true,
//   imports: [],
//   templateUrl: './image-croper.html',
//   styleUrl: './image-croper.scss',
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class ImageCroper {
//   output?: NgxCroppedEvent;
//   private modalRef: NgbModalRef | null = null;
//   @ViewChild('imageView') private imageView: TemplateRef<ImageCroper> | undefined;

//   @Output() cropImage = new EventEmitter<any>();
//   @Input() label: string = '';
//   @Input() imgLink: string = '';
//   @Input() type: string = '';
//   @Input() aspectRatio: string = '';
//   @Input() cropSize: string = '';

//   imageLink: string = '';

//   constructor(
//     private service: NgxPhotoEditorService,
//     config: NgbModalConfig,
//     private modalService: NgbModal,
//     private zone: NgZone,
//   ) {
//     config.backdrop = 'static';
//     config.keyboard = false;
//     config.centered = true;
//   }

//   fileChangeHandler($event: any) {
//     const file = $event.target.files[0];

//     if (file) {
//       let width = 600;
//       let height = 600;

//       if (this.cropSize?.includes('x')) {
//         const [w, h] = this.cropSize.split('x').map(Number);
//         if (w && h) {
//           width = w;
//           height = h;
//         }
//       }

//       const ratio = width / height;

//       this.service
//         .open(file, {
//           // ✅ FIXED HERE
//           aspectRatio: ratio,
//           autoCropArea: 1,
//           resizeToWidth: width,
//           resizeToHeight: height,
//           cropBoxResizable: false,
//           centerIndicator: true,
//           modalMaxWidth: '600px',
//           applyBtnText: 'Crop',
//         })
//         .subscribe((data) => {
//           this.zone.run(() => {
//             this.output = data;
//             this.cropImage.emit(data.file);
//           });
//         });
//     }
//   }

//   ngOnChanges(changes: SimpleChanges) {
//     if (changes['imgLink'] && changes['imgLink'].currentValue) {
//       let image = changes['imgLink'].currentValue.split('|');
//       let type = this.type || changes['type']?.currentValue;

//       if (image) {
//         // this.imageLink = environment.urlObj(image[0])[type] + image[1];
//       }
//     }
//   }

//   showFullImg() {
//     this.modalRef = this.modalService.open(this.imageView, { size: 'md' });
//   }

//   close() {
//     this.modalRef?.close();
//   }
// }

import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'app-image-croper',
  standalone: true,
  imports: [CommonModule, ],
  templateUrl: './image-croper.html'
})
export class ImageCroper {

  imageChangedEvent: any = '';
  croppedImage: string = '';

  @Output() cropImage = new EventEmitter<File>();

  fileChangeHandler(event: any) {
    this.imageChangedEvent = event;
  }

  // imageCropped(event: ImageCroppedEvent) {
  //   this.croppedImage = event.base64!;
  // }

  save() {
    const file = this.base64ToFile(this.croppedImage);
    this.cropImage.emit(file);
  }

  base64ToFile(base64: string): File {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], 'image.png', { type: mime });
  }
}