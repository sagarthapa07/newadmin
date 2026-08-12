import { Component, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgbDate, NgbDateParserFormatter, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';

import { Header } from '../../shared/component/header/header';
import { DatePicker } from '../../shared/component/date-picker/date-picker';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import {
  TableColumn,
  TableColumnComponent,
} from '../../shared/component/table-column/table-column';
import { Export } from '../Services/export';
import { DraftService, GrantDraft } from '../Services/grant-draft';

@Component({
  selector: 'app-panding-grants',
  imports: [    CommonModule,
    FormsModule,
    NgbDatepickerModule,
    RouterLink,
    Header,
    DatePicker,
    AlertMessage,
    TableColumnComponent,],
  templateUrl: './panding-grants.html',
  styleUrl: './panding-grants.scss',
})
export class PandingGrants {
  alertMessage = '';
  alertType: 'success' | 'error' | 'warning' = 'success';

  searchText = '';
  open = false;
  fromDate: NgbDate | null = null;
  toDate: NgbDate | null = null;

  private allDrafts: GrantDraft[] = [];
  grants: any[] = [];
  pageIndex = 1;
  pageSize = 25;
  totalCount = 0;
  isLoading = false;

  columns: TableColumn[] = [
    { key: 'title', label: 'Opportunity' },
    { key: 'lastUpdated', label: 'Last Edited', customTemplate: true },
    { key: 'type', label: 'Type', customTemplate: true },
    { key: 'actions', label: 'Actions', customTemplate: true },
  ];

  @ViewChild('picker') picker!: DatePicker;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.date-range-wrapper') && !target.closest('ngb-datepicker')) {
      this.open = false;
    }
  }

  constructor(
    public formatter: NgbDateParserFormatter,
    private router: Router,
    private draftService: DraftService,
    private exportService: Export,
  ) {}

  ngOnInit() {
    this.loadDrafts();
  }

  loadDrafts() {
    this.isLoading = true;
    this.allDrafts = this.draftService.getAllDrafts();
    this.applyFilters();
    this.isLoading = false;
  }

  private applyFilters() {
    let filtered = [...this.allDrafts];

    const text = this.searchText.trim().toLowerCase();
    if (text) {
      filtered = filtered.filter((d) => (d.title || '').toLowerCase().includes(text));
    }

    if (this.fromDate && this.toDate) {
      const from = new Date(
        this.fromDate.year,
        this.fromDate.month - 1,
        this.fromDate.day,
      ).getTime();
      const to = new Date(
        this.toDate.year,
        this.toDate.month - 1,
        this.toDate.day,
        23,
        59,
        59,
      ).getTime();

      filtered = filtered.filter((d) => {
        const t = new Date(d.lastUpdated).getTime();
        return t >= from && t <= to;
      });
    }

    this.totalCount = filtered.length;
    const start = (this.pageIndex - 1) * this.pageSize;
    this.grants = filtered.slice(start, start + this.pageSize);
  }

  onSearch() {
    this.pageIndex = 1;
    this.applyFilters();
  }

  onInputChange() {
    if (!this.searchText.trim()) {
      this.pageIndex = 1;
      this.applyFilters();
    }
  }

  toggle() {
    this.open = true;
  }

  get displayValue(): string {
    return this.fromDate && this.toDate
      ? `${this.formatter.format(this.fromDate)} to ${this.formatter.format(this.toDate)}`
      : '';
  }

  onDateChange(event: any) {
    this.fromDate = event.from;
    this.toDate = event.to;
    this.open = false;
    this.pageIndex = 1;
    this.applyFilters();
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
    this.applyFilters();
  }

  changePage(page: number) {
    this.pageIndex = page;
    this.applyFilters();
  }

  onPageSizeChangeHandler(size: number) {
    this.pageSize = size;
    this.pageIndex = 1;
    this.applyFilters();
  }

  resumeDraft(item: GrantDraft) {
    this.draftService.setActiveDraftId(item.draftId);

    // Route paths must match the actual grant routes used elsewhere
    // (CalenderOpportunity.goToEdit / "Add New" button / insert-success
    // redirect in CalendarDetails) — those are all under `/calendar/list/...`,
    // not `/calendar-opportunity/...`. The old paths here didn't match any
    // route, so Resume silently failed to navigate.
    if (item.grantId) {
      this.router.navigate(['/calendar/list/edit', item.grantId]);
    } else {
      this.router.navigate(['/calendar/list/add-new']);
    }
  }

  deleteDraft(item: GrantDraft) {
    this.draftService.removeDraft(item.draftId);

    if (this.draftService.getActiveDraftId() === item.draftId) {
      this.draftService.clearActiveDraftId();
    }

    this.alertType = 'success';
    this.alertMessage = 'Pending grant removed.';
    this.loadDrafts();
  }

  exportPendingGrants() {
    if (!this.allDrafts.length) {
      alert('No pending grants to export.');
      return;
    }

    const csvData = this.allDrafts.map((d) => ({
      Title: d.title,
      'Grant ID': d.grantId || 'New (unsaved)',
      'Last Edited': new Date(d.lastUpdated).toLocaleString(),
    }));

    this.exportService.exportToCsv(csvData, 'Pending_Grants_Export');
  }

  onAlertClose() {
    this.alertMessage = '';
  }
}