import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Header } from '../../shared/component/header/header';
import { Api } from '../Services/api';
import { Auth } from '../Services/auth';
import {
  TableColumnComponent,
  TableColumn,
} from '../../shared/component/table-column/table-column';
import { Router } from '@angular/router';

@Component({
  selector: 'app-email-setting',
  imports: [CommonModule, FormsModule, Header, TableColumnComponent],
  templateUrl: './email-setting.html',
  styleUrl: './email-setting.scss',
})
export class EmailSetting {
  emailSettings: any[] = [];
  searchText = '';
  pageIndex = 1;
  pageSize = 25;
  totalCount = 0;
  isLoading = false;
  searchHistory: string[] = [];
  showSuggestions = false;

  columns: TableColumn[] = [
    { key: 'senderName', label: 'Sender Name' },
    { key: 'senderEmail', label: 'Sender Email' },
    { key: 'mailServer', label: 'Mail Server' },
    { key: 'smtpport', label: 'SMTP Port' },
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
    const user = this.auth.getUser();
    console.log('Full user object from cookie:', user);

    const data = localStorage.getItem('emailSettingsSearchHistory');
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
        const payload = {
          pageIndex: this.pageIndex,
          pageSize: this.pageSize,
          searchText: this.searchText || null,
          userId: userId,
          userMail: userMail,
          clientIP: ipRes?.ip || '',
        };

        console.log('Payload sent to API:', payload);

        this.api.getAllEmailSettings(payload).subscribe({
          next: (res: any) => {
            console.log('API response:', res);
            this.emailSettings = res.settings || [];
            this.totalCount = res.recCount || 0;
            this.isLoading = false;
          },
          error: (err) => {
            console.error('API error:', err);
            this.isLoading = false;
          },
        });
      },
      error: (err) => {
        console.error('IP fetch failed', err);
        this.callApiWithoutIP(userId, userMail);
      },
    });
  }

  private callApiWithoutIP(userId: number, userMail: string) {
    const payload = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      searchText: this.searchText || null,
      userId: userId,
      userMail: userMail,
      clientIP: '',
    };

    this.api.getAllEmailSettings(payload).subscribe({
      next: (res: any) => {
        this.emailSettings = res.result || [];
        this.totalCount = res.recCount || res.totalCount || 0;
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

    if (!value) {
      this.pageIndex = 1;
      this.getData();
      return;
    }

    this.searchHistory = this.searchHistory.filter((x) => x !== value);
    this.searchHistory.unshift(value);
    this.searchHistory = this.searchHistory.slice(0, 5);
    localStorage.setItem('emailSettingsSearchHistory', JSON.stringify(this.searchHistory));

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
      console.error('Email Setting ID missing', id);
      return;
    }
    this.router.navigate(['/email-setting-edit', id]);
  }
}
