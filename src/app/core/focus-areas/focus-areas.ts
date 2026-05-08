import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Issue, SubIssue } from '../edit/issues.data';
import { Api } from '../Services/api';
import { lastValueFrom } from 'rxjs';
import { FocusSubArea, GetFocusSubAreasResponse } from '../../datatype';
import { Input } from '@angular/core';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-focus-area',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertMessage],
  templateUrl: './focus-areas.html',
  styleUrl: './focus-areas.scss',
})
export class FocusAreaComponent implements OnInit {
  @ViewChild('issueContainer') issueContainer!: ElementRef;
  @Input() grantId?: number;

  issues: Issue[] = [];
  activeIssue: Issue | null = null;
  hoverTimer: number | undefined;
  selectedMap = new Map<number, number[]>();
  showPasteModal = false;
  pasteText = '';
  selectedNames = new Map<number, { id: number; name: string }[]>();
  toastMessage = '';
  errorMessage = '';

  constructor(
    private router: Router,
    private api: Api,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadFocusAreas();
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent) {
    if (!this.issueContainer) return;

    const clickedInside = this.issueContainer.nativeElement.contains(event.target);

    if (!clickedInside) {
      this.activeIssue = null;
    }
  }

  onHoverIssue(issue: Issue) {
    this.hoverTimer = setTimeout(() => {
      this.activeIssue = issue;
    }, 500);
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

          if (this.grantId) {
            this.loadSelectedFocusAreas(this.grantId);
          }
        }
      },
    });
  }
  loadSelectedFocusAreas(grantId: number): void {
    this.api.getSelectedFocusAreas(grantId).subscribe({
      next: (res) => {
        this.selectedMap.clear();
        this.selectedNames.clear();

        res.tempUSGrantFocusAreas.forEach((item) => {
          // ids
          const ids = this.selectedMap.get(item.issueIndex) || [];
          ids.push(item.subIssueIndex);
          this.selectedMap.set(item.issueIndex, ids);

          // names
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

  onLeaveIssue() {
    if (this.hoverTimer !== undefined) {
      clearTimeout(this.hoverTimer);
    }
  }

  loadSubIssues(issue: any) {
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

  onClickIssue(issue: any) {
    if (this.hoverTimer !== undefined) {
      clearTimeout(this.hoverTimer);
    }

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

  saveSelectedIssues() {
    const rows: any = [];

    this.changedMap.forEach((subIds, issueId) => {
      subIds.forEach((subId) => {
        rows.push({
          grantIndex: this.grantId,
          subIssueIndex: subId,
          subIssueName: this.getSubIssueName(issueId, subId),
          issueIndex: issueId,
          issueName: this.getIssueName(issueId),
          userIndex: null,
          userEmail: null,
        });
      });
    });

    const payload = {
      focusAreas: rows,
      grantID: String(this.grantId),
      issueID: rows[0].issueIndex,
      userEmail: 'ritu@fundsforngos.org',
      userIndex: 5,
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

  openPasteModal() {
    this.pasteText = '';
    this.showPasteModal = true;
  }

  closePasteModal() {
    this.showPasteModal = false;
  }

  getIssueName(issueId: number): string {
    return this.issues.find((issue: Issue) => issue.id === issueId)?.name || '';
  }

  getSubIssueName(issueId: number, subId: number): string {
    // if loaded
    const issue = this.issues.find((i) => i.id === issueId);

    const loadedName = issue?.subIssues.find((s) => s.id === subId)?.name;

    if (loadedName) return loadedName;

    // fallback selected api
    const savedName = this.selectedNames.get(issueId)?.find((x) => x.id === subId)?.name;

    return savedName || '';
  }

  private isTextMatching(text: string, subName: string): boolean {
    const normalizedSubName: string = subName.toLowerCase();

    // Full match
    if (text.includes(normalizedSubName)) {
      return true;
    }

    // Partial word match
    const words: string[] = normalizedSubName.split(' ');
    return words.some((word: string) => text.includes(word));
  }
  async generateFromText(): Promise<void> {
    if (!this.pasteText.trim()) {
      alert('Please paste some text');
      return;
    }

    const text: string = this.pasteText.toLowerCase();
    this.selectedMap.clear();

    for (const issue of this.issues) {
      try {
        // Load subIssues if not already loaded
        if (!issue.subIssues || issue.subIssues.length === 0) {
          const res: GetFocusSubAreasResponse = await lastValueFrom(
            this.api.getFocusSubAreas(issue.id),
          );

          if (res.successCode === 1) {
            issue.subIssues = res.myList.map((sub: FocusSubArea) => ({
              id: sub.subIssueIndex,
              name: sub.subIssueName,
            }));
          }
        }

        // Find matching subIssues
        const matchedSubIds: number[] = issue.subIssues
          .filter((sub: SubIssue) => this.isTextMatching(text, sub.name))
          .map((sub: SubIssue) => sub.id);

        // Save matches
        if (matchedSubIds.length > 0) {
          this.selectedMap.set(issue.id, matchedSubIds);
        }
      } catch (error) {
        console.error(`Error loading sub areas for issue ${issue.id}`, error);
      }
    }

    console.log('AUTO DATA:', this.selectedMap);
    this.showPasteModal = false;
  }

  removeIssueFromApi(issueId: number) {
    const payload = {
      focusAreas: [],
      grantID: String(this.grantId),
      issueID: issueId,
      userEmail: 'ritu@fundsforngos.org',
      userIndex: 5,
    };

    console.log('REMOVE PAYLOAD:', payload);

    this.api.saveFocusAreas(payload).subscribe({
      next: (res) => {
        console.log('Removed Success', res);
      },
      error: (err) => {
        console.log('Remove Error', err);
      },
    });
  }
}
