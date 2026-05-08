import { Component, EventEmitter, Output } from '@angular/core';
import { Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-message.html',
  styleUrls: ['./alert-message.scss'],
})

export class AlertMessage {
  @Input() type: 'success' | 'error' | 'warning' = 'success';

  @Input() message: string = '';
  @Output() close = new EventEmitter<void>();
  onClose() {
    this.close.emit();
  }
}
