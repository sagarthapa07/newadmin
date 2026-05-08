import { Component } from '@angular/core';
import { LoaderService } from '../../../core/Services/loader-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  imports: [CommonModule],
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class Loader {
  isLoading = false;

  constructor(private loader: LoaderService) {
    this.loader.loading$.subscribe((res) => {
      this.isLoading = res;
    });
  }
}
