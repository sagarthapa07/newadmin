import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { filter } from 'rxjs';
import { Auth } from '../../../core/Services/auth';
import { Api } from '../../../core/Services/api';
import { Breadcrumb, BreadcrumbService } from '../../../core/Services/breadcrumb';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbCollapseModule, RouterModule, FontAwesomeModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  isCollapsed = true;
  isSidebarClosed = true;
  isSidebarHovered = false;
  breadcrumbs: Breadcrumb[] = [];

  activeCollapse: string | null = null;
  activeSubCollapse: string | null = null;

  // ---- top bar state ----
  searchText = '';
  notifications: string[] = []; // TODO: wire this up to your real notifications API/service
  showNotifications = false;
  showProfileMenu = false;
  isDarkMode = false;

  // ---- profile (name/role) ----
  userName = 'User';
  userRole = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: Auth,
    private api: Api,
    private breadcrumbService: BreadcrumbService,
  ) {}

  ngOnInit() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.breadcrumbs = this.buildBreadcrumb(this.route.root);
    });

    this.breadcrumbService.breadcrumbs$.subscribe((crumbs) => {
      this.breadcrumbs = crumbs;
    });

    this.loadUserProfile();

    this.isDarkMode = localStorage.getItem('theme') === 'dark';
    this.applyDarkMode();
  }

  // =========================================================================
  // SIDEBAR (hover-to-peek + click-to-pin, both drive the same "expanded" state
  // so the top bar / breadcrumb shifts in sync with the sidebar width)
  // =========================================================================
  toggleSidebar() {
    this.isSidebarClosed = !this.isSidebarClosed;
    if (this.isSidebarClosed) {
      this.isCollapsed = false;
    }
  }

  onSidebarEnter() {
    this.isSidebarHovered = true;
  }

  onSidebarLeave() {
    this.isSidebarHovered = false;
    this.closeAllMenus();
  }

  isSidebarExpanded(): boolean {
    return !this.isSidebarClosed || this.isSidebarHovered;
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

  // =========================================================================
  // BREADCRUMB (unchanged logic)
  // =========================================================================
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

  // =========================================================================
  // TOP BAR: search / notifications / dark mode / profile dropdown
  // =========================================================================
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notif-wrapper')) {
      this.showNotifications = false;
    }
    if (!target.closest('.profile-wrapper')) {
      this.showProfileMenu = false;
    }
  }

  onSearch() {
    // TODO: hook this up to a real global-search endpoint once one exists.
    console.log('Search:', this.searchText);
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false;
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyDarkMode();
  }

  private applyDarkMode() {
    document.body.classList.toggle('dark-theme', this.isDarkMode);
  }

  // =========================================================================
  // PROFILE — name/role primarily from the auth cookie; falls back to an
  // API call only if the cookie payload doesn't have them.
  // =========================================================================
  private loadUserProfile(): void {
    const cookieUser = this.auth.getUser();
    if (!cookieUser) return;

    this.userName = cookieUser.userName || cookieUser.name || cookieUser.emailId || 'User';
    this.userRole = cookieUser.userRole || cookieUser.role || '';

    // Auth.setSession() abhi cookie me sirf jo bhi "user" object login response se
    // aata hai wahi save karta hai. Agar us object me userName/userRole already
    // hai to upar ki 2 lines se hi kaam ban jayega. Agar nahi hai, yahan se
    // fallback API try karo — apna asli endpoint/field names yahan daal dena:
    if (!this.userRole && cookieUser.userIndex) {
      this.api.getUserRecords({ userIndex: cookieUser.userIndex }).subscribe({
        next: (res: any) => {
          const record = res?.data?.[0] || res?.records?.[0] || res;
          if (record) {
            this.userName = record.userName || record.name || this.userName;
            this.userRole = record.userRole || record.role || this.userRole;
          }
        },
        error: (err) => {
          console.log('Profile fallback fetch failed', err);
        },
      });
    }
  }

  logout() {
    this.auth.logout();
  }
}