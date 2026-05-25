import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDate, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../../shared/component/header/header';
import { Api } from '../Services/api';
import { HostListener } from '@angular/core';
import { DatePicker } from '../../shared/component/date-picker/date-picker';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-member-module',
  imports: [FormsModule, NgbDatepickerModule, CommonModule, Header, RouterLink, DatePicker],
  templateUrl: './member-module.html',
  styleUrl: './member-module.scss',
})
export class MemberModule {
  searchText = '';
  // NEw oneee
  open = false;
  fromDate: NgbDate | null = null;
  toDate: NgbDate | null = null;
  minToDate: NgbDateStruct | null = null;
  grants: any[] = [];
  pageIndex = 1;
  pageSize = 25;
  totalCount = 0;
  searchHistory: string[] = [];
  showSuggestions = false;
  isLoading = false;
  selectAll = false;
  hoveredDate: NgbDate | null = null;

  @ViewChild('picker') picker!: DatePicker;
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-wrapper')) {
      this.showSuggestions = false;
    }
    if (!target.closest('.date-range-wrapper') && !target.closest('ngb-datepicker')) {
      this.open = false;
    }
  }

  constructor(
    public formatter: NgbDateParserFormatter,
    private api: Api,
    private cdr: ChangeDetectorRef,
    private route: Router,
  ) {}

  ngOnInit() {
    this.getData();
    const data = localStorage.getItem('searchHistory');
    this.searchHistory = data ? JSON.parse(data) : [];
  }
  getData() {
    this.isLoading = true;

    const payload = {
      memberId: '',
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      platform: '',
      searchText: this.searchText,
      searchType: '',
      fromDate: this.formatDate(this.fromDate),
      toDate: this.formatDate(this.toDate),
      userIP: '',
      viewType: '',
    };

    this.api.getGrants(payload).subscribe({
      next: (res) => {
        this.grants = res.pageUSGrants || [];
        this.totalCount = res.recCount || 0;
        this.selectAll = false;
        this.grants.forEach((item) => (item.selected = false));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  clearDateFilter() {
    this.fromDate = null;
    this.toDate = null;
    this.minToDate = null;
    this.pageIndex = 1;
    this.getData();
  }

  onDateChange(event: any) {
    this.fromDate = event.from;
    this.toDate = event.to;
    this.open = false;
    this.pageIndex = 1;
    this.getData();
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
    return this.toDate && date.after(this.fromDate!) && date.before(this.toDate);
  }

  isRange(date: NgbDate) {
    return (
      date.equals(this.fromDate!) ||
      date.equals(this.toDate!) ||
      this.isInside(date) ||
      this.isHovered(date)
    );
  }

  toggle() {
    this.open = true;
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  // visible page k liye hai ye
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

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.pageIndex = page;
    this.getData();
  }

  onFromSelect(date: NgbDate) {
    this.fromDate = date;

    this.minToDate = {
      year: date.year,
      month: date.month,
      day: date.day,
    };

    // agar toDate pehle se chhoti hai → reset
    if (this.toDate && this.toDate.before(date)) {
      this.toDate = null;
    }
  }

  onToSelect(date: NgbDate) {
    this.toDate = date;
    this.open = false;
    this.pageIndex = 1;
    this.getData();
  }
  get displayValue(): string {
    return this.fromDate && this.toDate
      ? `${this.formatter.format(this.fromDate)} to ${this.formatter.format(this.toDate)}`
      : '';
  }

  formatDate(date: NgbDate | null): string | null {
    if (!date) return null;

    const mm = String(date.month).padStart(2, '0');
    const dd = String(date.day).padStart(2, '0');

    return `${date.year}-${mm}-${dd}`;
  }

  menuItems = [
    { title: 'Dashboard', icon: 'fa-house', key: 'dashboard' },
    { title: 'Components', icon: 'fa-puzzle-piece', key: 'components' },
    { title: 'Online Resources', icon: 'fa-globe', key: 'resources' },
    { title: 'Premium Members', icon: 'fa-people-group', key: 'premium' },
  ];

  get filteredMenu() {
    if (!this.searchText) return this.menuItems;

    return this.menuItems.filter((item) =>
      item.title.toLowerCase().includes(this.searchText.toLowerCase()),
    );
  }

  toggleSelectAll(event: any) {
    console.log('CLICK HUA', event.target.checked);
    this.selectAll = event.target.checked;
    this.grants.forEach((item) => {
      item.selected = this.selectAll;
    });
  }
  onItemChange() {
    this.selectAll = this.grants.every((item) => item.selected);
  }
  onSearch() {
    const value = this.searchText.trim();
    if (!value) {
      this.searchText = '';
    }
    this.searchHistory = this.searchHistory.filter((item) => item !== value);
    this.searchHistory.unshift(value);
    this.searchHistory = this.searchHistory.slice(0, 5);
    localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    this.pageIndex = 1;
    this.getData();
    this.showSuggestions = false;
  }

  selectSuggestion(value: string) {
    this.searchText = value;
    this.onSearch();
  }
  onInputChange() {
    if (!this.searchText || !this.searchText.trim()) {
      this.pageIndex = 1;
      this.getData();
    }
  }

  goToEdit(id: number | undefined) {
    if (!id) {
      console.error('ID missing', id);
      return;
    }
    this.route.navigate(['/calendar-opportunity/edit', id]);
  }

}
