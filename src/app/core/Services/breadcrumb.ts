import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface Breadcrumb {
  label: string;
  url: string;
}

const SEGMENT_LABELS: { [key: string]: string } = {
  'dashboard': 'Dashboard',
  'calendar-opportunity': 'Calendar Opportunity',
  'edit': 'Edit',
  'add-new': 'Add New',
  'premium-members': 'Premium Members',
  'memberModule': 'Member Module',
  'edit-member': 'Edit Member',
  'edit-invoice': 'Edit Invoice',
  'add-member': 'Add New Member',
  'member-search': 'Member Advanced Search',
  'invoice': 'Invoice',
  'invoice-details': 'Invoice Details',
};

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private breadcrumbsSubject = new BehaviorSubject<Breadcrumb[]>([]);
  breadcrumbs$ = this.breadcrumbsSubject.asObservable();

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.breadcrumbsSubject.next(this.buildBreadcrumbs());
      });
  }

  private buildBreadcrumbs(): Breadcrumb[] {
    const urlWithoutQuery = this.router.url.split('?')[0];
    const segments = urlWithoutQuery.split('/').filter(seg => seg.length > 0);
    const breadcrumbs: Breadcrumb[] = [];
    let accumulatedUrl = '';
    segments.forEach(path => {
      accumulatedUrl += `/${path}`;

      const isDynamicId = /^\d+$/.test(path) || /^[0-9a-fA-F-]{8,}$/.test(path);
      if (isDynamicId) return;


      if (path === 'dashboard') return;

      const label = SEGMENT_LABELS[path] || this.toTitleCase(path);
      breadcrumbs.push({ label, url: accumulatedUrl });
    });

    return breadcrumbs;
  }

  private toTitleCase(text: string): string {
    return text
      .replace(/-/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}