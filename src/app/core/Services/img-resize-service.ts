import { Injectable } from '@angular/core';
import { Api } from './api';

interface ImageDetails {
  width: number;
  height: number;
  dirPath: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImgResizeService {
  constructor(private API: Api) {}
  public dataURItoBlob(dataURI: string): Blob {
    const binary = atob(dataURI.split(',')[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: 'image/jpeg' });
  }

  public random(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let str = '';
    for (let i = 0; i < length; i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
  }

  public async imgResize(croppedFile: File, dirPath: string, recType: string): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      const imgUrl = this.random(25);

      let sizeImg: ImageDetails[] = [];

      if (recType === 'TC') {
        sizeImg = [
          { width: 600, height: 400, dirPath: `${dirPath}/thumb-600-px/`, name: imgUrl },
          { width: 450, height: 300, dirPath: `${dirPath}/thumb-450-px/`, name: imgUrl },
          { width: 320, height: 213, dirPath: `${dirPath}/thumb-320-px/`, name: imgUrl },
          { width: 120, height: 80, dirPath: `${dirPath}/thumb-120-px/`, name: imgUrl },
          { width: 80, height: 53, dirPath: `${dirPath}/thumb-80-px/`, name: imgUrl },
        ];
      } else if (recType === 'CU') {
        sizeImg = [
          { width: 600, height: 600, dirPath: `${dirPath}/thumb-600-px/`, name: imgUrl },
          { width: 450, height: 300, dirPath: `${dirPath}/thumb-450-px/`, name: imgUrl },
          { width: 320, height: 213, dirPath: `${dirPath}/thumb-320-px/`, name: imgUrl },
          { width: 120, height: 80, dirPath: `${dirPath}/thumb-120-px/`, name: imgUrl },
          { width: 80, height: 53, dirPath: `${dirPath}/thumb-80-px/`, name: imgUrl },
        ];
      } else {
        sizeImg = [
          { width: 600, height: 600, dirPath: `${dirPath}/thumb-600-px/`, name: imgUrl },
          { width: 450, height: 450, dirPath: `${dirPath}/thumb-450-px/`, name: imgUrl },
          { width: 320, height: 320, dirPath: `${dirPath}/thumb-320-px/`, name: imgUrl },
          { width: 120, height: 120, dirPath: `${dirPath}/thumb-120-px/`, name: imgUrl },
          { width: 80, height: 80, dirPath: `${dirPath}/thumb-80-px/`, name: imgUrl },
        ];
      }

      const reader = new FileReader();
      reader.readAsDataURL(croppedFile);

      reader.onload = async (event: ProgressEvent<FileReader>) => {
        const imgElement = document.createElement('img');
        imgElement.src = event.target?.result as string;

        // Make the imgElement.onload callback async
        imgElement.onload = async () => {
          const resizeImages: any[] = [];

          for (let i = 0; i < sizeImg.length; i++) {
            const canvas = document.createElement('canvas');

            const MAX_WIDTH = sizeImg[i].width;
            const MAX_HEIGHT = sizeImg[i].height;

            canvas.width = MAX_WIDTH;
            canvas.height = MAX_HEIGHT;

            const ctx = canvas.getContext('2d');

            ctx?.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

            const srcEncoded = ctx?.canvas.toDataURL('image/jpeg');

            if (srcEncoded) {
              const blobImg = this.dataURItoBlob(srcEncoded);

              const img = new File([blobImg], `${sizeImg[i].name}.jpg`, { type: 'image/jpeg' });

              const resize = {
                image: img,
                width: MAX_WIDTH,
                height: MAX_HEIGHT,
                size: sizeImg[i].width,
                dirPath: sizeImg[i].dirPath,
                name: sizeImg[i].name,
                fileExtension: 'jpg',
                base64: srcEncoded,
              };

              resizeImages.push(resize);
            }
          }

          if (resizeImages.length > 0) {
            resolve(resizeImages);
          } else {
            reject(new Error("It didn't work!"));
          }
        };
      };
    });
  }
}
