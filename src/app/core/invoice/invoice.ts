import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../../shared/component/header/header';
import { Api } from '../Services/api';
import { DropdownItem } from '../../datatype';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { Export } from '../Services/export';
import {
  TableColumnComponent,
  TableColumn,
} from '../../shared/component/table-column/table-column';

@Component({
  selector: 'app-invoice',
  imports: [
    FormsModule,
    NgbDatepickerModule,
    CommonModule,
    Header,
    RouterLink,
    NgMultiSelectDropDownModule,
    TableColumnComponent,
  ],
  templateUrl: './invoice.html',
  styleUrl: './invoice.scss',
})
export class Invoice {
  open = false;
  grants: any[] = [];
  pageIndex = 1;
  pageSize = 25;
  totalCount = 0;
  isLoading = false;
  selectAll = false;
  selectedMonth = '';
  monthList: { label: string; value: string }[] = [];
  columns: TableColumn[] = [
    { key: 'invoiceNumber', label: 'Invoice Number', customTemplate: true },
    { key: 'dates', label: 'Invoice Date | Expiry Date', customTemplate: true },
    { key: 'fullName', label: 'Full Name', customTemplate: true },
    { key: 'payerEmail', label: 'Email Address' },
    { key: 'planInfo', label: 'Plan / Payment / Type', customTemplate: true },
  ];

  onPageSizeChangeHandler(size: number) {
    this.pageSize = size;
    this.pageIndex = 1;
    this.getInvoices();
  }

  constructor(
    public formatter: NgbDateParserFormatter,
    private api: Api,
    private cdr: ChangeDetectorRef,
    private route: Router,
    private exportService: Export,
  ) {}

  ngOnInit() {
    this.generateMonths();
    this.getInvoices();
  }
  generateMonths() {
    const today = new Date();

    for (let i = 0; i < 13; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);

      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');

      this.monthList.push({
        label: `${year}-${date.toLocaleString('default', { month: 'long' })}`,
        value: `${year}${month}`,
      });
    }
    this.selectedMonth = this.monthList[0].value;
  }

  getInvoices() {
    this.isLoading = true;

    const payload = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      dateVal: this.selectedMonth,
      userId: 5,
      userMail: 'ritu@fundsforngos.org',
      clientIP: '115.247.76.82',
    };

    this.api.getAllInvoices(payload).subscribe({
      next: (res: any) => {
        this.grants = res.invoice || [];
        this.totalCount = res.invoiceCount || 0;
        this.isLoading = false;
      },

      error: (err) => {
        this.isLoading = false;
      },
    });
  }
  onMonthChange() {
    this.pageIndex = 1;
    this.getInvoices();
  }
  singleStateDropdown: { data: DropdownItem[]; selected: DropdownItem[] } = {
    data: [],
    selected: [],
  };

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
    this.getInvoices();
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

  goToInvoice(invoiceIndex: number) {
    this.route.navigate(['/premium-members/invoice-details', invoiceIndex]);
  }
}
