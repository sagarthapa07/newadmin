import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FileUpload {
  private uploadUrl =
    'https://cw8n8zcyn1.execute-api.us-east-1.amazonaws.com/US-RestAPI-Live-UploadFile';

  constructor(private http: HttpClient) {}

  uploadImages(images: any[]): Observable<any> {
    const payload = {
      files: images.map((img) => ({
        fileName: `${img.name}.${img.fileExtension}`,
        fileType: img.image.type,
        dirPath: img.dirPath,
        fileContent: img.base64.split(',')[1],
      })),
    };
    return this.http.put(this.uploadUrl, payload);
  }
}
