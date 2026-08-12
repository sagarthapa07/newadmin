import { Injectable } from '@angular/core';
export interface GrantDraft {
  draftId: string;
  grantId?: number | null;
  title: string;
  tabs: {
    calendarDetails?: any;
    geoLocation?: any;
    focusAreas?: any;
    focusGroups?: any;
    counties?: any;
    seoSocial?: any;
  };
  lastUpdated: string;
}

@Injectable({ providedIn: 'root' })
export class DraftService {
  private readonly STORAGE_KEY = 'pendingGrantDrafts';
  private readonly ACTIVE_DRAFT_KEY = 'activeGrantDraftId';

  private getAll(): GrantDraft[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveAll(drafts: GrantDraft[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts));
  }

  // ===== har tab yahi method call karega apna slice save karne ke liye =====
  saveTabDraft(
    draftId: string,
    tabKey: keyof GrantDraft['tabs'],
    formValue: any,
    grantId?: number | null,
  ) {
    const drafts = this.getAll();
    const index = drafts.findIndex((d) => d.draftId === draftId);
    const existing = index > -1 ? drafts[index] : null;

    const draft: GrantDraft = {
      draftId,
      grantId: grantId ?? existing?.grantId ?? null,
      title: existing?.title || formValue?.title?.trim() || 'Untitled Opportunity',
      tabs: {
        ...(existing?.tabs || {}),
        [tabKey]: formValue,
      },
      lastUpdated: new Date().toISOString(),
    };

    if (index > -1) {
      drafts[index] = draft;
    } else {
      drafts.unshift(draft);
    }

    this.saveAll(drafts);
  }

  // ===== read =====
  getDraft(draftId: string): GrantDraft | null {
    return this.getAll().find((d) => d.draftId === draftId) || null;
  }

  getTabDraft(draftId: string, tabKey: keyof GrantDraft['tabs']): any {
    return this.getDraft(draftId)?.tabs?.[tabKey] || null;
  }

  getAllDrafts(): GrantDraft[] {
    return this.getAll().sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
    );
  }

  // ===== delete =====
  removeDraft(draftId: string) {
    this.saveAll(this.getAll().filter((d) => d.draftId !== draftId));
  }

  // ===== "current active draft" pointer =====
  // Naya opportunity fill karte waqt crash ho jaye to refresh/relogin ke baad
  // bhi wahi draftId continue ho — isliye ek pointer alag se rakhte hain.
  getActiveDraftId(): string | null {
    return localStorage.getItem(this.ACTIVE_DRAFT_KEY);
  }

  setActiveDraftId(draftId: string) {
    localStorage.setItem(this.ACTIVE_DRAFT_KEY, draftId);
  }

  clearActiveDraftId() {
    localStorage.removeItem(this.ACTIVE_DRAFT_KEY);
  }

  createNewDraftId(): string {
    const id = 'draft_' + Date.now();
    this.setActiveDraftId(id);
    return id;
  }
}
