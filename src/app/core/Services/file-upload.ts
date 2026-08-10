import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FileUpload {
  private uploadUrl = this.isLocal()
    ? 'https://sne1bukm2g.execute-api.us-east-1.amazonaws.com/US-RestAPI-Local-UploadFile'
    : 'https://cw8n8zcyn1.execute-api.us-east-1.amazonaws.com/US-RestAPI-Live-UploadFile';

  constructor(private http: HttpClient) {}
  private isLocal(): boolean {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
  }

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
