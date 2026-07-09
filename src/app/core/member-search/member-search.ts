import { Component, HostListener } from '@angular/core';
import { Header } from '../../shared/component/header/header';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Api } from '../Services/api';
import { Router, RouterLink } from '@angular/router';
import { Export } from '../Services/export';
import {
  TableColumnComponent,
  TableColumn,
} from '../../shared/component/table-column/table-column';

@Component({
  selector: 'app-member-search',
  imports: [CommonModule, FormsModule, Header, TableColumnComponent, RouterLink],
  templateUrl: './member-search.html',
  styleUrl: './member-search.scss',
})
export class MemberSearch {
  members: any[] = [];
  searchText = '';
  pageIndex = 1;
  pageSize = 20;
  isLoading = false;
  selectAll = false;
  searchHistory: string[] = [];
  showSuggestions = false;
  totalCount = 0;

  columns: TableColumn[] = [
    { key: 'name', label: 'Full Name' },
    { key: 'email', label: 'Email Address', customTemplate: true },
    { key: 'transactionId', label: 'Transaction ID' },
    { key: 'paymentId', label: 'Payment ID' },
    { key: 'payerEmail', label: 'Payer Email' },
    { key: 'invoiceNumber', label: 'Invoice Number', customTemplate: true },
    { key: 'invoiceDate', label: 'Invoice Date', customTemplate: true },
  ];

  changePage(page: number) {
    this.pageIndex = page;
    this.getData();
  }
  onPageSizeChangeHandler(size: number) {
    this.pageSize = size;
    this.pageIndex = 1;
    this.getData();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!target.closest('.search-wrapper')) {
      this.showSuggestions = false;
    }
  }

  constructor(
    private api: Api,
    private router: Router,
    private exportService: Export,
  ) {}
  ngOnInit() {
    this.getData();

    const data = localStorage.getItem('memberSearchHistory');

    this.searchHistory = data ? JSON.parse(data) : [];
  }

  toggleSelectAll(event: any) {
    this.selectAll = event.target.checked;

    this.members.forEach((x) => {
      x.selected = this.selectAll;
    });
  }

  onSearch() {
    const value = this.searchText.trim();

    if (!value) {
      this.pageIndex = 1;
      this.getData();
      return;
    }

    this.searchHistory = this.searchHistory.filter((x) => x !== value);

    this.searchHistory.unshift(value);

    this.searchHistory = this.searchHistory.slice(0, 5);

    localStorage.setItem('memberSearchHistory', JSON.stringify(this.searchHistory));

    this.showSuggestions = false;

    this.pageIndex = 1;

    this.getData();
  }

  selectSuggestion(value: string) {
    this.searchText = value;

    this.onSearch();
  }
  onInputChange() {
    if (!this.searchText.trim()) {
      this.pageIndex = 1;

      this.getData();
    }
  }
  getData() {
    this.isLoading = true;

    const payload = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      searchText: this.searchText || null,
    };

    this.api.membersAdvanceSearch(payload).subscribe({
      next: (res: any) => {
        console.log(res.result);
        this.members = res.result || [];
        this.totalCount = res.totalCount || res.recCount || this.members.length;
        this.isLoading = false;
      },
      error: (err) => {
        console.log(err);
        this.isLoading = false;
      },
    });
  }

  openInvoice(memberId: number, invoiceId: number) {
    this.router.navigate(['/premium-members/edit-invoice', memberId, invoiceId]);
  }

  onItemChange() {
    this.selectAll = this.members.every((x) => x.selected);
  }
  exportSelectedInvoices() {
    const selectedItems = this.members.filter((x) => x.selected);

    if (selectedItems.length === 0) {
      alert('Please select at least one invoice.');
      return;
    }

    const excelData = selectedItems.map((item, index) => ({
      'S.No': index + 1,
      'Full Name': item.name,
      'Email Address': item.email,
      'Transaction ID': item.transactionId,
      'Payment ID': item.paymentId,
      'Payer Email': item.payerEmail,
      'Invoice Number': item.invoiceNumber,
      'Invoice Date': item.invoiceDate,
    }));

    this.exportService.exportToExcel(excelData, 'Member_Invoice_Search', 'Invoices');
  }
}
