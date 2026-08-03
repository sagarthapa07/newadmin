import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDate, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../../shared/component/header/header';
import { Api } from '../Services/api';
import { HostListener } from '@angular/core';
import { DatePicker } from '../../shared/component/date-picker/date-picker';
import { ViewChild } from '@angular/core';
import { Export } from '../Services/export';
import { environment } from '../../../environments/environment';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import {
  TableColumn,
  TableColumnComponent,
} from '../../shared/component/table-column/table-column';

@Component({
  selector: 'app-calender-opportunity',
  imports: [
    FormsModule,
    NgbDatepickerModule,
    CommonModule,
    Header,
    RouterLink,
    DatePicker,
    TableColumnComponent,
    AlertMessage,
  ],
  templateUrl: './calender-opportunity.html',
  styleUrl: './calender-opportunity.scss',
})
export class CalenderOpportunity {
  alertMessage = '';
  alertType: 'success' | 'error' | 'warning' = 'success';
  searchText = '';
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

  columns: TableColumn[] = [
    { key: 'grantTitle', label: 'Opportunity' },
    { key: 'postDate', label: 'Post Date', customTemplate: true },
    { key: 'deadLineDate', label: 'Deadline', customTemplate: true },
    { key: 'viewCount', label: 'View' },
    { key: 'status', label: 'Status', customTemplate: true },
    { key: 'actions', label: 'Actions', customTemplate: true },
  ];

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
    private exportService: Export,
  ) {}

  ngOnInit() {
    this.getData();
    const data = localStorage.getItem('searchHistory');
    this.searchHistory = data ? JSON.parse(data) : [];
  }

  getStatusClass(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'PUBLISHED':
        return 'status-published';
      case 'DRAFT':
        return 'status-draft';
      default:
        return 'status-default';
    }
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

  clearDateFilter(event?: MouseEvent) {
    event?.stopPropagation();
    this.fromDate = null;
    this.toDate = null;
    if (this.picker) {
      this.picker.fromDate = null;
      this.picker.toDate = null;
    }
    this.open = false;
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

  
  exportSelectedGrants() {
    const selected = this.grants.filter((x) => x.selected);

    if (selected.length === 0) {
      alert('Please select at least one grant.');
      return;
    }

    const ids = selected.map((x) => x.grantIndex).join(',');

    this.api.exportUSGrants(ids).subscribe({
      next: (res: any) => {
        console.log('Export API response:', res);

        const csvData = res.collections.map((item: any) => ({
          id: item.id,
          Title: item.title,
          Categories: item.categories,
          Tags: item.tags,
          States: item.states,
          Counties: item.counties,
          Donors: item.donors,
          Cities: item.cities,
          Townships: item.townships,
          'Insular Areas': item.insularAreas,
          Deadlines: item.deadlines,
          Beneficiaries: item.beneficiaries,
          Content: item.content,
        }));

        this.exportService.exportToCsv(csvData, 'Grant_Export');
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  onSelectionChange(selected: any[]) {
    const selectedIndexes = new Set(selected.map((s) => s.grantIndex));
    this.grants.forEach((item) => {
      item.selected = selectedIndexes.has(item.grantIndex);
    });
    this.selectAll = this.grants.length > 0 && this.grants.every((item) => item.selected);
  }

  onPageSizeChangeHandler(size: number) {
    this.pageSize = size;
    this.pageIndex = 1;
    this.getData();
  }

  getFullUrl(item: any): string | null {
    if (!item?.friendlyUrl) {
      console.error('friendlyUrl missing', item);
      return null;
    }
    return `${environment.copyURl}/${item.friendlyUrl}`;
  }

  copyUrl(item: any) {
    const fullUrl = this.getFullUrl(item);
    if (!fullUrl) {
      this.alertType = 'error';
      this.alertMessage = 'URL not found for this grant.';
      return;
    }

    navigator.clipboard.writeText(fullUrl).then(
      () => {
        this.alertType = 'success';
        this.alertMessage = 'URL copied to clipboard!';
      },
      (err) => {
        console.error('Copy failed', err);
        this.alertType = 'error';
        this.alertMessage = 'Failed to copy URL.';
      },
    );
  }
  openUrl(item: any) {
    const fullUrl = this.getFullUrl(item);
    if (!fullUrl) {
      this.alertType = 'error';
      this.alertMessage = 'URL not found for this grant.';
      return;
    }
    window.open(fullUrl, '_blank');
  }

  onAlertClose() {
    this.alertMessage = '';
  }
}
