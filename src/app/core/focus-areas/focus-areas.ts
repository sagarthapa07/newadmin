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
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-focus-area',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertMessage],
  templateUrl: './focus-areas.html',
  styleUrl: './focus-areas.scss',
})
export class FocusAreaComponent implements OnInit, OnChanges {
  @Input() draftId: string = '';
  @ViewChild('issueContainer') issueContainer!: ElementRef;
  @Input() grantId?: number;
  @Output() tabChange = new EventEmitter<number>();

  issues: Issue[] = [];
  activeIssue: Issue | null = null;
  selectedMap = new Map<number, number[]>();
  showPasteModal = false;
  pasteText = '';
  pasteLoading = false;
  selectedNames = new Map<number, { id: number; name: string }[]>();
  toastMessage = '';
  errorMessage = '';
  clientIP: string = '';
  isSaving = false;

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
    if (this.isSaving) return;
    if (!this.grantId) {
      this.errorMessage = 'Grant ID missing hai — save nahi ho sakta';
      this.cd.detectChanges();
      setTimeout(() => {
        this.errorMessage = '';
        this.cd.detectChanges();
      }, 3000);
      return;
    }

    if (this.selectedMap.size === 0) {
      this.showSuccessMessage('No focus areas selected');
      return;
    }

    const grantId = this.grantId;

    const rows: SaveFocusAreaRow[] = [];
    this.selectedMap.forEach((subIds, issueId) => {
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
    this.isSaving = true;
    this.api.saveFocusAreas(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.activeIssue = null;
        this.changedMap.clear();
        this.showSuccessMessage('Focus Areas Saved Successfully');
      },
      error: (err) => {
        this.isSaving = false;
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
    this.tabChange.emit(2);
  }

  goToFocusGroup() {
    this.tabChange.emit(4);
  }

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

  // ---- Sirf poore-poore (whole) sub-issue name ki saari occurrences dhoondta hai text mein,
  // start/end character position ke saath — taaki baad mein "overlap" check kar sakein.
  private findMatchRanges(text: string, subName: string): { start: number; end: number }[] {
    const normalized = subName.trim().toLowerCase();
    if (!normalized) return [];

    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

    const ranges: { start: number; end: number }[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      ranges.push({ start: match.index, end: match.index + match[0].length });
      // zero-length match se infinite loop bachne ke liye
      if (match[0].length === 0) {
        regex.lastIndex++;
      }
    }

    return ranges;
  }

  // ---- Check karta hai ki do character-ranges overlap kar rahe hain ya nahi
  private rangesOverlap(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
    return a.start < b.end && b.start < a.end;
  }

  generateFromText(): void {
    if (!this.pasteText.trim()) {
      alert('Please paste some text');
      return;
    }

    const text: string = this.pasteText.toLowerCase();

    // Saare issues ke saare sub-issues ek hi flat list mein le aao,
    // kyunki overlap alag-alag issues ke sub-issues ke beech bhi ho sakta hai
    // (e.g. issue A mein "Marketing" aur issue B mein "Digital Marketing")
    const allSubs: { issue: Issue; sub: SubIssue }[] = [];
    for (const issue of this.issues) {
      for (const sub of issue.subIssues || []) {
        allSubs.push({ issue, sub });
      }
    }

    // Zyada words wala (jyada specific/lamba) naam pehle match karo —
    // taaki "Digital Marketing" jaisa poora phrase pehle claim ho jaaye,
    // aur uske andar wala chhota word jaise "Marketing" dobara/adhura match na ho.
    allSubs.sort((a, b) => {
      const wordsA = a.sub.name.trim().split(/\s+/).length;
      const wordsB = b.sub.name.trim().split(/\s+/).length;
      if (wordsB !== wordsA) return wordsB - wordsA;
      return b.sub.name.length - a.sub.name.length;
    });

    const claimedRanges: { start: number; end: number }[] = [];
    const matchedByIssue = new Map<number, number[]>();

    for (const { issue, sub } of allSubs) {
      const occurrences = this.findMatchRanges(text, sub.name);

      // Sirf wahi occurrence lo jo abhi tak kisi lambe/pehle-match-hue phrase se overlap nahi karti
      const freeOccurrence = occurrences.find(
        (occ) => !claimedRanges.some((claimed) => this.rangesOverlap(occ, claimed)),
      );

      if (freeOccurrence) {
        claimedRanges.push(freeOccurrence);
        const existing = matchedByIssue.get(issue.id) || [];
        existing.push(sub.id);
        matchedByIssue.set(issue.id, existing);
      }
    }

    matchedByIssue.forEach((matchedSubIds, issueId) => {
      const existing = this.selectedMap.get(issueId) || [];
      const merged = Array.from(new Set([...existing, ...matchedSubIds]));
      this.selectedMap.set(issueId, merged);

      const changed = this.changedMap.get(issueId) || [];
      const newlyAdded = matchedSubIds.filter((id) => !changed.includes(id));
      if (newlyAdded.length > 0) {
        this.changedMap.set(issueId, [...changed, ...newlyAdded]);
      }
    });

    this.showPasteModal = false;
  }

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