import { Component } from '@angular/core';
import { Header } from '../../shared/component/header/header';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Api } from '../Services/api';

@Component({
  selector: 'app-member-search',
  imports: [CommonModule, FormsModule, Header],
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

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.getData();
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
        console.log(res);

        this.members = res.result || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.log(err);
        this.isLoading = false;
      },
    });
  }

  onSearch() {
    this.pageIndex = 1;
    this.getData();
  }

  toggleSelectAll(event: any) {
    this.selectAll = event.target.checked;

    this.members.forEach((x) => {
      x.selected = this.selectAll;
    });
  }
}
