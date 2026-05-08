import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { filter } from 'rxjs';

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
  breadcrumbs: any[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  toggleSidebar() {
    this.isSidebarClosed = !this.isSidebarClosed;

    if (this.isSidebarClosed) {
      this.isCollapsed = false;
    }
  }

  activeCollapse: string | null = null;

  toggleCollapse(key: string, event: Event) {
    event.preventDefault();
    this.activeCollapse = this.activeCollapse === key ? null : key;
  }

  isOpen(key: string): boolean {
    return this.activeCollapse === key;
  }
  closeAllMenus() {
    this.activeCollapse = null;
  }

  logout() {
    this.router.navigate(['/login']);
  }
  ngOnInit() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.breadcrumbs = this.buildBreadcrumb(this.route.root);
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
}
