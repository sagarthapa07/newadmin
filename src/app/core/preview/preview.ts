import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import { Header } from '../../shared/component/header/header';
import { Api } from '../Services/api';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule, Header],
  templateUrl: './preview.html',
  styleUrl: './preview.scss',
})
export class Preview implements OnInit {
  grantId!: number;
  loading = true;
  errorMsg = '';

  data: any = null;
  description: SafeHtml = '';

  focusAreas: string[] = [];
  counties: string[] = [];
  states: string[] = [];

  visibleLimit = 5;
  showAllCounties = false;
  showAllStates = false;

  isFavorite = false;
  urlCopied = false;
  showAllFocusAreas = false;
  constructor(
    private route: ActivatedRoute,
    private api: Api,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.grantId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.grantId) {
      this.loadGrantData();
    } else {
      this.loading = false;
      this.errorMsg = 'Grant ID not found in route.';
    }
  }

  private extractArray(res: any, keys: string[] = []): any[] {
    if (Array.isArray(res)) return res;
    if (!res || typeof res !== 'object') return [];

    for (const key of ['data', 'result', 'list', ...keys]) {
      if (Array.isArray(res[key])) return res[key];
    }
    return [];
  }

  loadGrantData(): void {
    this.loading = true;
    this.errorMsg = '';

    forkJoin({
      grant: this.api.getGrantById(this.grantId),
      focusAreas: this.api.getSelectedFocusAreas(this.grantId),
      counties: this.api.getSelectedCounties(this.grantId),
      states: this.api.getSelectedStates(this.grantId),
    }).subscribe({
      next: (res: any) => {
        try {
          const grant =
            res.grant?.usGrantDataWithURL?.grantData ??
            res.grant?.data?.grantData ??
            res.grant?.result?.grantData ??
            res.grant?.grantData ??
            res.grant?.data ??
            res.grant?.result ??
            res.grant ??
            {};

          const urlData = res.grant?.usGrantDataWithURL?.urlData ?? {};

          this.data = {
            ...grant,
            title: grant.grantTitle,
            referenceUrl: grant.linkURL,
            postDate: grant.postDate,
            deadLineDate: grant.deadLineDate,
            donorName: grant.donorAgency,
            grantSize: grant.grantSize,
            grantDuration: grant.grantDuration,
            category: grant.grantType,
            status: grant.status || urlData.grantStatus,
            shortDescription: grant.shortIntro,
          };

          this.description = this.sanitizer.bypassSecurityTrustHtml(
            grant.grantContent || grant.letterText || '',
          );

          const apiImage = grant.grantLogoImage;
          if (apiImage) {
            const imagePath = apiImage.replace('|', '/');
            this.data.imageUrl =
              'https://s3.amazonaws.com/cdn.grantsforusapp/' +
              imagePath.replace('2026/', '2026/img.USGrants/thumb-450-px/');
          }

          this.focusAreas = this.extractArray(res.focusAreas, [
            'focusAreaList',
            'tempUSGrantFocusAreas',
          ]).map((f: any) => f.issueName ?? f.focusAreaName ?? f.name ?? f);

          this.counties = this.extractArray(res.counties, ['countyList', 'temp']).map((c: any) =>
            c.countyName && c.stateName ? `${c.countyName}` : (c.name ?? c),
          );

          this.states = this.extractArray(res.states, ['stateList', 'tempUSGrantStates']).map(
            (s: any) => s.stateName ?? s.name ?? s,
          );
        } catch (mapErr) {
          console.error('Mapping error in preview response:', mapErr, res);
          this.errorMsg = 'Some opportunity details could not be loaded.';
        } finally {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading grant preview:', err);
        this.errorMsg = 'Failed to load opportunity details.';
        this.loading = false;
      },
    });
  }

  get visibleCounties(): string[] {
    return this.showAllCounties ? this.counties : this.counties.slice(0, this.visibleLimit);
  }

  get visibleStates(): string[] {
    return this.showAllStates ? this.states : this.states.slice(0, this.visibleLimit);
  }

  toggleCounties(): void {
    this.showAllCounties = !this.showAllCounties;
  }

  toggleStates(): void {
    this.showAllStates = !this.showAllStates;
  }

  copyUrl(): void {
    if (!this.data?.referenceUrl) return;
    navigator.clipboard.writeText(this.data.referenceUrl).then(() => {
      this.urlCopied = true;
      setTimeout(() => (this.urlCopied = false), 1500);
    });
  }

  toggleFavorite(): void {
    this.isFavorite = !this.isFavorite;
  }

  get visibleFocusAreas(): string[] {
    return this.showAllFocusAreas ? this.focusAreas : this.focusAreas.slice(0, this.visibleLimit);
  }
  toggleFocusAreas(): void {
    this.showAllFocusAreas = !this.showAllFocusAreas;
  }
}
