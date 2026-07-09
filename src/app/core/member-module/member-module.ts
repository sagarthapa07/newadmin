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
import { DropdownItem } from '../../datatype';
import { IDropdownSettings, NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { Export } from '../Services/export';
import {
  TableColumn,
  TableColumnComponent,
} from '../../shared/component/table-column/table-column';

@Component({
  selector: 'app-member-module',
  imports: [
    FormsModule,
    NgbDatepickerModule,
    CommonModule,
    Header,
    RouterLink,
    NgMultiSelectDropDownModule,
    TableColumnComponent,
  ],
  templateUrl: './member-module.html',
  styleUrl: './member-module.scss',
})
export class MemberModule {
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
  selectedState: string[] = [];
  activeStatesForCounties: string | null = null;
  singleFullStateMode = false;
  stateModeMap: Record<string, boolean> = {};
  selectedSubCounties: Record<string, string[]> = {};
  selectedStatus: string | null = null;
  selectedPlanId = 0;

  columns: TableColumn[] = [
    { key: 'nameEmail', label: 'Full Name and Email Address', customTemplate: true },
    { key: 'plan', label: 'Plan' },
    { key: 'countryExpiry', label: 'Country Extd. Exp Dt.', customTemplate: true },
    { key: 'regActivation', label: 'Reg. Date Activ. Date', customTemplate: true },
    { key: 'status', label: 'Status', customTemplate: true },
    { key: 'memberType', label: 'Type', customTemplate: true },
    { key: 'edit', label: 'Edit', customTemplate: true },
  ];

  onPageSizeChangeHandler(size: number) {
    this.pageSize = size;
    this.pageIndex = 1;
    this.getData();
  }

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

  countieSettings: IDropdownSettings = {
    singleSelection: true,
    idField: 'item_id',
    textField: 'item_text',
    allowSearchFilter: true,
    enableCheckAll: false,
    closeDropDownOnSelection: false,
  };

  constructor(
    public formatter: NgbDateParserFormatter,
    private api: Api,
    private cdr: ChangeDetectorRef,
    private route: Router,
    private exportService: Export,
  ) {}

  ngOnInit() {
    this.getData();
    this.loadStates();
    const data = localStorage.getItem('searchHistory');
    this.searchHistory = data ? JSON.parse(data) : [];
  }

  onFilterSearch() {
    this.pageIndex = 1;
    this.getData();
  }
  singleStateDropdown: { data: DropdownItem[]; selected: DropdownItem[] } = {
    data: [],
    selected: [],
  };

  getStatusClass(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE':
        return 'status-active';
      case 'NEW':
        return 'status-new';
      case 'EXPIRED':
        return 'status-expired';
      case 'BLOCKED':
        return 'status-blocked';
      default:
        return 'status-default';
    }
  }

  getMemberTypeClass(memberType: string): string {
    switch (memberType) {
      case '_PAID_REG_':
        return 'type-paid';
      case '_FREE_REG_':
        return 'type-free';
      default:
        return 'type-default';
    }
  }

  getData() {
    this.isLoading = true;

    const payload = {
      memberStatus: this.selectedStatus || null,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      palnId: this.selectedPlanId || 0,
      searchText: this.searchText || null,
      state: this.selectedState.length ? this.selectedState[0] : null,
    };

    this.api.getAllMembers(payload).subscribe({
      next: (res: any) => {
        this.grants = res.result || [];
        this.totalCount = res.result?.length || 0;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
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
    this.route.navigate(['premium-members/edit-member', id]);
  }
  onSingleStateChange() {
    const selected = this.singleStateDropdown.selected;
    this.selectedState = selected.length > 0 ? [selected[0].item_text] : [];
  }

  loadStates() {
    this.api.getAllStates().subscribe({
      next: (res: any) => {
        this.singleStateDropdown.data = (res.states || []).map((s: any) => ({
          item_id: s.stateIndex,
          item_text: s.stateName,
        }));
      },
    });
  }

  exportSelectedMembers() {
    const selectedMembers = this.grants.filter((x) => x.selected);

    if (selectedMembers.length === 0) {
      alert('Please select at least one member.');
      return;
    }

    const excelData = selectedMembers.map((item, index) => ({
      'S.No': index + 1,
      'First Name': item.firstName,
      'Last Name': item.lastName,
      Email: item.email,
      Plan: item.plan,
      Country: item.country,
      'Registration Date': item.registrationDate,
      'Activation Date': item.activationDate,
      'Expiry Date': item.expiryDate,
      Status: item.memberStatus,
      'Member Type': item.memberType,
    }));

    this.exportService.exportToExcel(excelData, 'Member_Export', 'Members');
  }
}
