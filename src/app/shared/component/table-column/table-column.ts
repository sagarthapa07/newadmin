import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
export interface TableColumn {
  key: string;
  label: string;
  customTemplate?: boolean;
}
@Component({
  selector: 'app-table-column',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table-column.html',
  styleUrl: './table-column.scss',
})
export class TableColumnComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() isLoading = false;
  @Input() showCheckbox = true;
  @Input() pageIndex = 1;
  @Input() pageSize = 25;
  @Input() totalCount = 0;
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() selectionChange = new EventEmitter<any[]>();

  @ContentChild('cellTemplate') cellTemplate!: TemplateRef<any>;

  selectAll = false;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    let start = Math.max(this.pageIndex - 1, 2);
    let end = Math.min(this.pageIndex + 1, this.totalPages - 1);
    if (this.pageIndex <= 3) {
      start = 2;
      end = 5;
    }
    if (this.pageIndex >= this.totalPages - 2) {
      start = this.totalPages - 4;
      end = this.totalPages - 1;
    }
    start = Math.max(start, 2);
    end = Math.min(end, this.totalPages - 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  toggleSelectAll(event: any) {
    this.selectAll = event.target.checked;
    this.data.forEach((item) => (item.selected = this.selectAll));
    this.emitSelection();
  }

  onItemChange() {
    this.selectAll = this.data.every((item) => item.selected);
    this.emitSelection();
  }

  emitSelection() {
    this.selectionChange.emit(this.data.filter((x) => x.selected));
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.pageChange.emit(page);
  }

  onPageSizeChange() {
    this.pageSizeChange.emit(this.pageSize);
  }
}
