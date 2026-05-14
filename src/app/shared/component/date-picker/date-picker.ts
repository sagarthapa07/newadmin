import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbCalendar, NgbDate, NgbDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { inject } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDatepicker],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.scss',
})
export class DatePicker {
  @Output() dateSelected = new EventEmitter<any>();
  @Input() fromDate: NgbDate | null = null;
  @Input() toDate: NgbDate | null = null;

  calendar = inject(NgbCalendar);

  hoveredDate: NgbDate | null = null;

  onDateSelection(date: NgbDate) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;

      this.toDate = null;
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
    } else {
      this.fromDate = date;

      this.toDate = null;
    }
  }
  isHovered(date: NgbDate) {
    return (
      this.fromDate &&
      !this.toDate &&
      this.hoveredDate &&
      date.after(this.fromDate) &&
      date.before(this.hoveredDate)
    );
  }

  isInside(date: NgbDate) {
    return this.fromDate && this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }
  isRange(date: NgbDate) {
    return (
      (this.fromDate && date.equals(this.fromDate)) ||
      (this.toDate && date.equals(this.toDate)) ||
      this.isInside(date) ||
      this.isHovered(date)
    );
  }
  applySelection() {
    if (this.fromDate && !this.toDate) {
      this.toDate = this.fromDate;
    }

    this.dateSelected.emit({
      from: this.fromDate,
      to: this.toDate,
    });
  }
}
