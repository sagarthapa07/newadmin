import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Header } from '../../shared/component/header/header';
import { Api } from '../Services/api';
import { Auth } from '../Services/auth'; // apna actual path daalna
import {
  TableColumnComponent,
  TableColumn,
} from '../../shared/component/table-column/table-column';

@Component({
  selector: 'app-business-plans',
  imports: [CommonModule, FormsModule, Header, TableColumnComponent, RouterLink],
  templateUrl: './business-plans.html',
  styleUrl: './business-plans.scss',
})
export class BusinessPlans {
  plans: any[] = [];
  searchText = '';
  pageIndex = 1;
  pageSize = 25;
  totalCount = 0;
  isLoading = false;
  searchHistory: string[] = [];
  showSuggestions = false;

  columns: TableColumn[] = [
    { key: 'planName', label: 'Plan Name' },
    { key: 'planCode', label: 'Plan Code' },
    { key: 'amount', label: 'Amount', customTemplate: true },
    { key: 'duration', label: 'Duration', customTemplate: true },
    { key: 'planType', label: 'Plan Type' },
    { key: 'validity', label: 'Valid From - To', customTemplate: true },
    { key: 'status', label: 'Status', customTemplate: true },
    { key: 'edit', label: 'Edit', customTemplate: true },
  ];

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-wrapper')) {
      this.showSuggestions = false;
    }
  }

  constructor(
    private api: Api,
    private auth: Auth,
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit() {
    const data = localStorage.getItem('businessPlansSearchHistory');
    this.searchHistory = data ? JSON.parse(data) : [];
    this.getData();
  }

  getClientIP() {
    return this.http.get<any>('https://api.ipify.org?format=json');
  }

  getUserMail(): string {
    const user = this.auth.getUser();
    return user?.emailId || '';
  }

  getUserId(): number {
    const user = this.auth.getUser();
    return user?.userIndex || 0;
  }

  getData() {
    this.isLoading = true;

    const userMail = this.getUserMail();
    const userId = this.getUserId();

    this.getClientIP().subscribe({
      next: (ipRes: any) => {
        this.callApi(userId, userMail, ipRes?.ip || '');
      },
      error: () => {
        this.callApi(userId, userMail, '');
      },
    });
  }

  private callApi(userId: number, userMail: string, clientIP: string) {
    const payload = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      searchText: this.searchText || null,
      userId: userId,
      userMail: userMail,
      clientIP: clientIP,
    };

    this.api.planAdvanceSearch(payload).subscribe({
      next: (res: any) => {
        this.plans = res.result || [];
        this.totalCount = res.recCount || 0;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('API error:', err);
        this.isLoading = false;
      },
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.pageIndex = page;
    this.getData();
  }

  onPageSizeChangeHandler(size: number) {
    this.pageSize = size;
    this.pageIndex = 1;
    this.getData();
  }

  onSearch() {
    const value = this.searchText.trim();

    this.searchHistory = this.searchHistory.filter((x) => x !== value);
    if (value) {
      this.searchHistory.unshift(value);
      this.searchHistory = this.searchHistory.slice(0, 5);
      localStorage.setItem('businessPlansSearchHistory', JSON.stringify(this.searchHistory));
    }

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

  goToEdit(id: number) {
    if (!id) {
      console.error('Plan ID missing', id);
      return;
    }
    this.router.navigate(['/masters/business-plan-edit', id]);
  }
  getStatusClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'status-active';
      case 'Draft':
        return 'status-draft';
      case 'Publish':
        return 'status-Publish';
      default:
        return 'status-default';
    }
  }
}
