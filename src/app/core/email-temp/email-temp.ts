import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Header } from '../../shared/component/header/header';
import { Api } from '../Services/api';
import { Auth } from '../Services/auth';
import {
  TableColumnComponent,
  TableColumn,
} from '../../shared/component/table-column/table-column';

@Component({
  selector: 'app-email-temp',
  imports: [CommonModule, FormsModule, Header, TableColumnComponent],
  templateUrl: './email-temp.html',
  styleUrl: './email-temp.scss',
})
export class EmailTemp {
  emailTemplates: any[] = [];
  searchText = '';
  pageIndex = 1;
  pageSize = 25;
  totalCount = 0;
  isLoading = false;
  searchHistory: string[] = [];
  showSuggestions = false;

  columns: TableColumn[] = [
    { key: 'emailModule', label: 'Module' },
    { key: 'templateInfo', label: 'Template Info' },
    { key: 'emailHeader', label: 'Email Header' },
    { key: 'recipientType', label: 'Recipient Type' },
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
    const data = localStorage.getItem('emailTemplatesSearchHistory');
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
      userId: userId,
      userMail: userMail,
      clientIP: clientIP,
    };

    this.api.getAllEmailTemplates(payload).subscribe({
      next: (res: any) => {
        this.emailTemplates = res.templates || [];
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
      localStorage.setItem('emailTemplatesSearchHistory', JSON.stringify(this.searchHistory));
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
      console.error('Template ID missing', id);
      return;
    }
    this.router.navigate(['/email-templates/edit', id]);
  }
}