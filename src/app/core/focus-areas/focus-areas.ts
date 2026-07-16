import { Component, OnInit, HostListener, ElementRef, ViewChild, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../Services/api';
import { forkJoin, lastValueFrom } from 'rxjs';
import {
  FocusSubArea,
  GetFocusSubAreasResponse,
  SaveFocusAreaRow,
  SaveFocusAreasPayload,
} from '../../datatype';
import { Input } from '@angular/core';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { ChangeDetectorRef } from '@angular/core';
import { Issue, SubIssue } from '../edit/issues.data';
import { Common } from '../Services/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-focus-area',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertMessage],
  templateUrl: './focus-areas.html',
  styleUrl: './focus-areas.scss',
})
export class FocusAreaComponent implements OnInit, OnChanges {
  @ViewChild('issueContainer') issueContainer!: ElementRef;
  @Input() grantId?: number;

  issues: Issue[] = [];
  activeIssue: Issue | null = null;
  selectedMap = new Map<number, number[]>();
  showPasteModal = false;
  pasteText = '';
  pasteLoading = false; // true while sub-issues load on modal open (fallback only, usually already cached)
  selectedNames = new Map<number, { id: number; name: string }[]>();
  toastMessage = '';
  errorMessage = '';
  clientIP: string = '';

  constructor(
    private router: Router,
    private api: Api,
    private cd: ChangeDetectorRef,
    private common: Common,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.loadFocusAreas();
    this.fetchClientIP();
  }

  private fetchClientIP(): void {
    this.http.get<{ ip: string }>('https://api.ipify.org?format=json').subscribe({
      next: (res) => {
        this.clientIP = res.ip;
      },
      error: (err) => {
        console.error('IP fetch failed', err);
        this.clientIP = '';
      },
    });
  }

  ngOnChanges(changes: any): void {
    if (changes['grantId'] && changes['grantId'].currentValue) {
      this.loadSelectedFocusAreas(changes['grantId'].currentValue);
    }
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent) {
    if (!this.issueContainer) return;

    const clickedInside = this.issueContainer.nativeElement.contains(event.target);

    if (!clickedInside) {
      this.activeIssue = null;
    }
  }

  loadFocusAreas() {
    this.api.getFocusAreas().subscribe({
      next: (res) => {
        if (res.successCode === 1) {
          this.issues = res.usFocusAreas.map((item) => ({
            id: item.issueIndex,
            name: item.issueName,
            subIssues: [],
            loaded: false,
          }));

          // Prefetch all sub-issues in parallel right away so clicking
          // an issue later opens the popover instantly (no per-click API wait).
          this.preloadAllSubIssues();
        }
      },
    });
  }

  private preloadAllSubIssues(): void {
    if (!this.issues.length) return;

    const requests = this.issues.map((issue) => this.api.getFocusSubAreas(issue.id));

    forkJoin(requests).subscribe({
      next: (results: GetFocusSubAreasResponse[]) => {
        results.forEach((res, index) => {
          const issue = this.issues[index];
          if (res.successCode === 1) {
            issue.subIssues = res.myList.map((sub: FocusSubArea) => ({
              id: sub.subIssueIndex,
              name: sub.subIssueName,
            }));
            issue.loaded = true;
          }
        });
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Preload sub issues failed', err);
      },
    });
  }

  loadSelectedFocusAreas(grantId: number): void {
    this.api.getSelectedFocusAreas(grantId).subscribe({
      next: (res) => {
        this.selectedMap.clear();
        this.selectedNames.clear();

        res.tempUSGrantFocusAreas.forEach((item) => {
          const ids = this.selectedMap.get(item.issueIndex) || [];
          ids.push(item.subIssueIndex);
          this.selectedMap.set(item.issueIndex, ids);

          const names = this.selectedNames.get(item.issueIndex) || [];
          names.push({
            id: item.subIssueIndex,
            name: item.subIssueName.trim(),
          });
          this.selectedNames.set(item.issueIndex, names);
        });
      },
    });
  }

  showSuccessMessage(msg: string) {
    this.toastMessage = msg;
    this.cd.detectChanges();
    setTimeout(() => {
      this.toastMessage = '';
      this.cd.detectChanges();
    }, 3000);
  }

  loadSubIssues(issue: Issue) {
    this.api.getFocusSubAreas(issue.id).subscribe({
      next: (res) => {
        if (res.successCode === 1) {
          issue.subIssues = res.myList.map((sub) => ({
            id: sub.subIssueIndex,
            name: sub.subIssueName,
          }));
          issue.loaded = true;
        }
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  onClickIssue(issue: Issue) {
    this.activeIssue = issue;

    // Fallback: if preload hasn't finished yet (e.g. slow network),
    // load this specific issue's sub-issues on demand.
    if (!issue.loaded) {
      this.loadSubIssues(issue);
    }
  }

  changedMap = new Map<number, number[]>();

  toggleSub(issue: Issue, sub: SubIssue) {
    const selected = this.selectedMap.get(issue.id) || [];
    let changed = this.changedMap.get(issue.id) || [];

    if (selected.includes(sub.id)) {
      this.selectedMap.set(
        issue.id,
        selected.filter((id) => id !== sub.id),
      );
    } else {
      this.selectedMap.set(issue.id, [...selected, sub.id]);
    }

    if (!changed.includes(sub.id)) {
      changed.push(sub.id);
    }

    this.changedMap.set(issue.id, changed);
  }

  isSubSelected(issue: Issue, sub: SubIssue): boolean {
    return this.selectedMap.get(issue.id)?.includes(sub.id) || false;
  }

  toggleSelectAll(issue: Issue) {
    const allIds = issue.subIssues.map((s) => s.id);
    const selected = this.selectedMap.get(issue.id) || [];
    if (selected.length === allIds.length) {
      this.selectedMap.set(issue.id, []);
    } else {
      this.selectedMap.set(issue.id, allIds);
    }
  }

  isAllSelected(issue: Issue): boolean {
    return (this.selectedMap.get(issue.id)?.length || 0) === issue.subIssues.length;
  }

  clearIssue(issueId: number) {
    this.selectedMap.delete(issueId);
    this.changedMap.delete(issueId);

    if (this.activeIssue?.id === issueId) {
      this.activeIssue = null;
    }

    this.removeIssueFromApi(issueId);
  }

  hasAnySelected(issue: Issue): boolean {
    return (this.selectedMap.get(issue.id)?.length || 0) > 0;
  }

  private getUserInfoFromCookie(): { userIndex: number; emailId: string } {
    const rawCookie = this.common.getCookie('_US_ADMIN_AUTH_');

    if (!rawCookie) {
      return { userIndex: 0, emailId: '' };
    }

    try {
      const decrypted = this.common.decryptData(rawCookie);
      if (!decrypted) {
        return { userIndex: 0, emailId: '' };
      }
      const userData = JSON.parse(decrypted);
      return {
        userIndex: userData.userIndex,
        emailId: userData.emailId,
      };
    } catch (e) {
      console.error('Cookie parse error', e);
      return { userIndex: 0, emailId: '' };
    }
  }

  saveSelectedIssues(): void {
    if (!this.grantId) {
      this.errorMessage = 'Grant ID missing hai — save nahi ho sakta';
      this.cd.detectChanges();
      setTimeout(() => {
        this.errorMessage = '';
        this.cd.detectChanges();
      }, 3000);
      return;
    }

    if (this.changedMap.size === 0) {
      this.showSuccessMessage('No changes detected');
      return;
    }

    const grantId = this.grantId;

    const rows: SaveFocusAreaRow[] = [];
    this.changedMap.forEach((subIds, issueId) => {
      subIds.forEach((subId) => {
        rows.push({
          grantIndex: grantId,
          issueIndex: issueId,
          issueName: this.getIssueName(issueId),
          subIssueIndex: subId,
          subIssueName: this.getSubIssueName(issueId, subId),
        });
      });
    });

    const userInfo = this.getUserInfoFromCookie();

    const payload: SaveFocusAreasPayload = {
      grantID: grantId,
      focusAreas: rows,
      userId: userInfo.userIndex,
      userMail: userInfo.emailId,
      clientIP: this.clientIP,
    };

    this.api.saveFocusAreas(payload).subscribe({
      next: () => {
        this.activeIssue = null;
        this.changedMap.clear();
        this.showSuccessMessage('Focus Areas Saved Successfully');
      },
      error: (err) => {
        console.log('SAVE ERROR', err);
        this.errorMessage = 'Save Failed';
        this.cd.detectChanges();
        setTimeout(() => {
          this.errorMessage = '';
          this.cd.detectChanges();
        }, 3000);
      },
    });
  }

  get selectedEntries() {
    return Array.from(this.selectedMap.entries());
  }

  clearSingleSub(issueId: number, subId: number) {
    const selected = this.selectedMap.get(issueId) || [];
    const updated = selected.filter((id) => id !== subId);

    if (updated.length === 0) {
      this.selectedMap.delete(issueId);
      this.changedMap.delete(issueId);
      this.removeIssueFromApi(issueId);
    } else {
      this.selectedMap.set(issueId, updated);
    }
  }

  removeWholeIssue(issueId: number) {
    this.selectedMap.delete(issueId);
    this.changedMap.delete(issueId);
    this.removeIssueFromApi(issueId);
  }

  clearAll() {
    const issueIds = Array.from(this.selectedMap.keys());

    issueIds.forEach((issueId) => {
      this.removeIssueFromApi(issueId);
    });

    this.selectedMap.clear();
    this.changedMap.clear();
    this.activeIssue = null;
  }

  goToGeoLocation() {
    this.router.navigate(['/geo-location']);
  }

  goToFocusGroup() {
    this.router.navigate(['/focus-group']);
  }

  // ===== PASTE MODAL LOGIC =====

  async openPasteModal() {
    this.pasteText = '';
    this.showPasteModal = true;
    this.pasteLoading = true;

    try {
      await this.loadAllSubIssuesForPaste();
    } finally {
      this.pasteLoading = false;
      this.cd.detectChanges();
    }
  }

  private async loadAllSubIssuesForPaste(): Promise<void> {
    // Most issues are already preloaded by preloadAllSubIssues() on init,
    // so this only fetches whatever is still missing — and does it in
    // parallel instead of one-by-one, so it's fast even as a fallback.
    const pending = this.issues.filter((issue) => !issue.subIssues || issue.subIssues.length === 0);

    if (!pending.length) return;

    const requests = pending.map((issue) => this.api.getFocusSubAreas(issue.id));

    try {
      const results: GetFocusSubAreasResponse[] = await lastValueFrom(forkJoin(requests));
      results.forEach((res, index) => {
        const issue = pending[index];
        if (res.successCode === 1) {
          issue.subIssues = res.myList.map((sub: FocusSubArea) => ({
            id: sub.subIssueIndex,
            name: sub.subIssueName,
          }));
          issue.loaded = true;
        }
      });
    } catch (error) {
      console.error('Error loading sub areas for paste modal', error);
    }
  }

  closePasteModal() {
    this.showPasteModal = false;
  }

  private isTextMatching(text: string, subName: string): boolean {
    const normalized = subName.trim().toLowerCase();
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(text);
  }

  generateFromText(): void {
    if (!this.pasteText.trim()) {
      alert('Please paste some text');
      return;
    }

    const text: string = this.pasteText.toLowerCase();

    for (const issue of this.issues) {
      const matchedSubIds: number[] = (issue.subIssues || [])
        .filter((sub: SubIssue) => this.isTextMatching(text, sub.name))
        .map((sub: SubIssue) => sub.id);

      if (matchedSubIds.length > 0) {
        const existing = this.selectedMap.get(issue.id) || [];

        // Merge: purane + naye, duplicates hataa ke
        const merged = Array.from(new Set([...existing, ...matchedSubIds]));

        this.selectedMap.set(issue.id, merged);

        // changedMap me bhi add karo taaki Save pe ye bhi API ko jaaye
        const changed = this.changedMap.get(issue.id) || [];
        const newlyAdded = matchedSubIds.filter((id) => !changed.includes(id));
        if (newlyAdded.length > 0) {
          this.changedMap.set(issue.id, [...changed, ...newlyAdded]);
        }
      }
    }

    this.showPasteModal = false;
  }

  // ===== END PASTE MODAL LOGIC =====

  getIssueName(issueId: number): string {
    return this.issues.find((issue: Issue) => issue.id === issueId)?.name || '';
  }

  getSubIssueName(issueId: number, subId: number): string {
    const issue = this.issues.find((i) => i.id === issueId);
    const loadedName = issue?.subIssues.find((s) => s.id === subId)?.name;

    if (loadedName) return loadedName;

    const savedName = this.selectedNames.get(issueId)?.find((x) => x.id === subId)?.name;
    return savedName || '';
  }

  removeIssueFromApi(issueId: number): void {
    if (!this.grantId) return;

    const userInfo = this.getUserInfoFromCookie();

    const payload: SaveFocusAreasPayload = {
      grantID: this.grantId,
      focusAreas: [],
      userId: userInfo.userIndex,
      userMail: userInfo.emailId,
      clientIP: this.clientIP,
    };

    this.api.saveFocusAreas(payload).subscribe({
      next: (res) => {
        console.log('Removed Success', res);
      },
      error: (err) => {
        console.log('Remove Error', err);
      },
    });
  }

  get filteredSelectedEntries(): [number, number[]][] {
    return this.selectedEntries.filter((entry) => (entry[1]?.length ?? 0) > 0);
  }
}
