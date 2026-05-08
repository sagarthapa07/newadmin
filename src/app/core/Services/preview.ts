import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Preview {
  private formData: any;

  setData(data: any) {
    this.formData = data;
  }

  getData() {
    return this.formData;
  }
}
