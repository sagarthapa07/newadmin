import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { filter } from 'rxjs';
import { Auth } from '../../../core/Services/auth';
import { Breadcrumb, BreadcrumbService } from '../../../core/Services/breadcrumb';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NgbCollapseModule, RouterModule, FontAwesomeModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  isCollapsed = true;
  isSidebarClosed = true;
  breadcrumbs: Breadcrumb[] = [];

  activeCollapse: string | null = null;
  activeSubCollapse: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: Auth,
    private breadcrumbService: BreadcrumbService,
  ) {}

  toggleSidebar() {
    this.isSidebarClosed = !this.isSidebarClosed;
    if (this.isSidebarClosed) {
      this.isCollapsed = false;
    }
  }

  toggleCollapse(key: string, event: Event) {
    event.preventDefault();
    this.activeCollapse = this.activeCollapse === key ? null : key;
    this.activeSubCollapse = null;
  }

  isOpen(key: string): boolean {
    return this.activeCollapse === key;
  }

  toggleSubCollapse(key: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.activeSubCollapse = this.activeSubCollapse === key ? null : key;
  }

  isSubOpen(key: string): boolean {
    return this.activeSubCollapse === key;
  }

  onLeafClick() {
    this.activeCollapse = null;
    this.activeSubCollapse = null;
  }

  closeAllMenus() {
    this.activeCollapse = null;
    this.activeSubCollapse = null;
  }

  ngOnInit() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.breadcrumbs = this.buildBreadcrumb(this.route.root);
    });

    this.breadcrumbService.breadcrumbs$.subscribe((crumbs) => {
      this.breadcrumbs = crumbs;
    });
  }

  buildBreadcrumb(route: ActivatedRoute, url: string = '', breadcrumbs: any[] = []): any[] {
    const children: ActivatedRoute[] = route.children;
    if (children.length === 0) {
      return breadcrumbs;
    }
    for (const child of children) {
      const routeURL: string = child.snapshot.url.map((segment) => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }
      const label = child.snapshot.data['breadcrumb'];
      if (label) {
        breadcrumbs.push({ label, url });
      }
      return this.buildBreadcrumb(child, url, breadcrumbs);
    }
    return breadcrumbs;
  }

  logout() {
    this.auth.logout();
  }
}
