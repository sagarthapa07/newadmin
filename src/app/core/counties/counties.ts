import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../Services/api';
import { County, GetCountiesResponse, State } from '../../datatype';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { HttpClient } from '@angular/common/http';
import { Common } from '../Services/common';

type GrantMode = 'all' | 'selected';
type SelectionType = 'single' | 'multiple';

@Component({
  selector: 'app-counties',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertMessage],
  templateUrl: './counties.html',
  styleUrl: './counties.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountiesComponent implements OnInit {
  @Input() grantId?: number;
  @Input() stCtType?: string;
  @Input() stateString?: string;
  @Input() countyString?: string;
  @Output() tabChange = new EventEmitter<number>();

  constructor(
    private api: Api,
    private cd: ChangeDetectorRef,
    private common: Common,
    private http: HttpClient,
  ) {}

  // ---------- top-level mode ----------
  grantMode: GrantMode = 'selected';
  selectionType: SelectionType = 'single';

  // ---------- messages ----------
  successMessage = '';
  errorMessage = '';
  clientIP = '';

  // ---------- states lookup ----------
  stateIndexMap: Record<string, number> = {};
  countyIndexMap: Record<string, number> = {};

  get allStateNames(): string[] {
    return Object.keys(this.stateIndexMap).sort();
  }

  // ---------- "Select State to View" — plain native select ----------
  viewingStateName: string | null = null;

  // ---------- selection state ----------
  selectedStates: string[] = []; // order-preserving list of chosen state names
  activeState: string | null = null; // state currently open in the counties editor
  stateModeMap: Record<string, boolean> = {}; // true = Full State, false = With Counties
  countiesByState: Record<string, string[]> = {}; // full county list per state (cached)
  selectedCounties: Record<string, string[]> = {}; // persisted per-state county selection

  // remembers the toggle's last position (Full State / With Counties) set
  // by the user — a brand-new state inherits this instead of always
  // defaulting to "With Counties"; it only changes when the user flips it
  private lastToggleMode = false;

  // ---------- county grid search ----------
  countySearchText = '';

  get filteredCounties(): string[] {
    if (!this.activeState) return [];
    const all = this.countiesByState[this.activeState] || [];
    const q = this.countySearchText.trim().toLowerCase();
    if (!q) return all;
    return all.filter((c) => c.toLowerCase().includes(q));
  }

  // ---------- paste / auto-select panel ----------
  pasteText = '';
  detectStatesEnabled = true;
  detectCountiesEnabled = true;

  // ---------- summary sidebar collapse state ----------
  private collapsedSummaryStates = new Set<string>();

  ngOnInit(): void {
    this.fetchClientIP();
    this.api.getAllStates().subscribe((res: any) => {
      const states = res.states || [];
      states.forEach((s: State) => (this.stateIndexMap[s.stateName] = s.stateIndex));

      if (this.grantId) {
        this.loadSavedGrantData();
      }
      this.cd.detectChanges();
    });
  }

  private fetchClientIP(): void {
    this.http.get<{ ip: string }>('https://api.ipify.org?format=json').subscribe({
      next: (res) => {
        this.clientIP = res.ip;
        this.cd.detectChanges();
      },
      error: () => {
        this.clientIP = '';
      },
    });
  }

  private getUserInfoFromCookie(): { userIndex: number; emailId: string } {
    const rawCookie = this.common.getCookie('_US_ADMIN_AUTH_');
    if (!rawCookie) return { userIndex: 0, emailId: '' };
    try {
      const decrypted = this.common.decryptData(rawCookie);
      if (!decrypted) return { userIndex: 0, emailId: '' };
      const userData = JSON.parse(decrypted);
      return { userIndex: userData.userIndex, emailId: userData.emailId };
    } catch (e) {
      console.error('Cookie parse error', e);
      return { userIndex: 0, emailId: '' };
    }
  }

  // =====================================================
  // MODE SWITCHES
  // =====================================================

  setGrantMode(mode: GrantMode) {
    this.grantMode = mode;
    this.cd.detectChanges();
  }

  setSelectionType(type: SelectionType) {
    if (this.selectionType === type) return;
    this.selectionType = type;
    this.resetSelections();
  }

  private resetSelections() {
    this.selectedStates = [];
    this.activeState = null;
    this.viewingStateName = null;
    this.stateModeMap = {};
    this.selectedCounties = {};
    this.lastToggleMode = false;
    this.countySearchText = '';
    this.collapsedSummaryStates.clear();
    this.cd.detectChanges();
  }

  // =====================================================
  // VALIDATION HELPERS — a state only "counts" as selected
  // once the user has marked counties on it or set it Full State
  // =====================================================

  private hasValidSelection(stateName: string): boolean {
    return (
      this.stateModeMap[stateName] === true ||
      (this.selectedCounties[stateName]?.length ?? 0) > 0
    );
  }

  private discardState(stateName: string) {
    this.selectedStates = this.selectedStates.filter((s) => s !== stateName);
    delete this.selectedCounties[stateName];
    delete this.stateModeMap[stateName];
  }

  // called whenever we're about to move away from the currently active
  // state — if the user never marked counties/Full State on it, it gets
  // auto-dropped from the selection
  private validateAndDropIfEmpty(stateName: string | null) {
    if (!stateName) return;
    if (this.hasValidSelection(stateName)) return;
    this.discardState(stateName);
  }

  // =====================================================
  // "SELECT STATE TO VIEW" — drives both Single and Multiple modes
  // =====================================================

  onStateViewChange() {
    const stateName = this.viewingStateName;
    if (!stateName) return;
    if (this.activeState === stateName) return; // already viewing it

    // moving away from a state in Multiple mode — validate it first
    if (this.selectionType === 'multiple' && this.activeState) {
      this.validateAndDropIfEmpty(this.activeState);
    }

    if (this.selectionType === 'single') {
      this.selectedStates = [stateName];
    } else if (!this.selectedStates.includes(stateName)) {
      this.selectedStates.push(stateName);
    }

    this.activateState(stateName);
  }

  private activateState(stateName: string) {
    this.activeState = stateName;
    this.viewingStateName = stateName;
    this.countySearchText = '';

    if (!this.stateModeMap.hasOwnProperty(stateName)) {
      // carry the toggle's current position forward instead of resetting it
      this.stateModeMap[stateName] = this.lastToggleMode;
    }
    if (!this.selectedCounties[stateName]) {
      this.selectedCounties[stateName] = [];
    }

    this.loadCountiesForState(stateName);
  }

  removeState(stateName: string) {
    this.discardState(stateName);

    if (this.viewingStateName === stateName) {
      this.viewingStateName = null;
    }
    if (this.activeState === stateName) {
      this.activeState = this.selectedStates[this.selectedStates.length - 1] || null;
      this.viewingStateName = this.activeState;
    }
    this.cd.detectChanges();
  }

  // =====================================================
  // COUNTIES LOADING
  // =====================================================

  loadCountiesForState(stateName: string, callback?: () => void): void {
    if (this.countiesByState[stateName]) {
      if (callback) callback();
      this.cd.detectChanges();
      return;
    }
    const stateId = this.stateIndexMap[stateName];
    if (!stateId) return;

    this.api.getCountiesByState(stateId).subscribe((res: GetCountiesResponse) => {
      const counties = res.usgeoCounties || [];
      this.countiesByState[stateName] = counties.map((c: County) => c.countyName);
      counties.forEach((c: County) => {
        this.countyIndexMap[`${c.countyName}||${stateName}`] = c.countyIndex;
      });
      if (callback) callback();
      this.cd.detectChanges();
    });
  }

  // =====================================================
  // COUNTY / FULL-STATE TOGGLES
  // =====================================================

  // fired by the "With Counties / Full State" buttons — a direct, explicit
  // user action, so it updates the current state's mode AND becomes the
  // new carry-forward default for the next state selected
  toggleFullState(stateName: string, isFull: boolean) {
    this.stateModeMap[stateName] = isFull;
    this.lastToggleMode = isFull;
    if (isFull) {
      this.selectedCounties[stateName] = [];
    }
    this.cd.detectChanges();
  }

  toggleCounty(stateName: string, county: string, checked: boolean) {
    if (!this.selectedCounties[stateName]) this.selectedCounties[stateName] = [];
    if (checked) {
      if (!this.selectedCounties[stateName].includes(county)) {
        this.selectedCounties[stateName].push(county);
      }
    } else {
      this.selectedCounties[stateName] = this.selectedCounties[stateName].filter(
        (c) => c !== county,
      );
    }
    this.cd.detectChanges();
  }

  removeCounty(stateName: string, county: string) {
    this.toggleCounty(stateName, county, false);
  }

  toggleSelectAllCounties(stateName: string, checked: boolean) {
    if (checked) {
      this.selectedCounties[stateName] = [...(this.countiesByState[stateName] || [])];
      this.stateModeMap[stateName] = true; // "select all" == Full State
      this.lastToggleMode = true;
    } else {
      this.selectedCounties[stateName] = [];
      this.stateModeMap[stateName] = false;
      this.lastToggleMode = false;
    }
    this.cd.detectChanges();
  }

  isAllCountiesSelected(stateName: string): boolean {
    const all = this.countiesByState[stateName] || [];
    const selected = this.selectedCounties[stateName] || [];
    return all.length > 0 && all.length === selected.length;
  }

  // =====================================================
  // PASTE / AUTO-SELECT PANEL
  // =====================================================

  autoSelectFromText(): void {
    const text = this.pasteText.trim();
    if (!text || !this.detectStatesEnabled) {
      this.pasteText = '';
      return;
    }

    const lowerText = text.toLowerCase();
    const detectedStates = this.allStateNames.filter((s) => lowerText.includes(s.toLowerCase()));

    if (!detectedStates.length) {
      this.showError('Text mein koi state detect nahi hui');
      return;
    }

    this.selectionType = detectedStates.length > 1 ? 'multiple' : 'single';
    if (this.selectionType === 'single') {
      this.selectedStates = [];
    }

    detectedStates.forEach((state) => {
      if (!this.selectedStates.includes(state)) {
        this.selectedStates.push(state);
      }
      if (!this.stateModeMap.hasOwnProperty(state)) {
        this.stateModeMap[state] = this.lastToggleMode;
      }
      if (!this.selectedCounties[state]) {
        this.selectedCounties[state] = [];
      }

      this.loadCountiesForState(state, () => {
        if (this.detectCountiesEnabled) {
          const counties = this.countiesByState[state] || [];
          const matched = counties.filter((c) => lowerText.includes(c.toLowerCase()));
          if (matched.length) {
            const existing = this.selectedCounties[state] || [];
            this.selectedCounties[state] = Array.from(new Set([...existing, ...matched]));
          }
        }
        this.cd.detectChanges();
      });
    });

    const lastState = detectedStates[detectedStates.length - 1];
    this.activateState(lastState);

    this.pasteText = '';
    this.cd.detectChanges();
  }

  // =====================================================
  // SUMMARY SIDEBAR
  // =====================================================

  get fullStates(): string[] {
    return this.selectedStates.filter((s) => this.stateModeMap[s] === true);
  }

  get withCountiesStates(): string[] {
    return this.selectedStates.filter((s) => this.stateModeMap[s] !== true);
  }

  get statesWithCountiesCount(): number {
    return this.withCountiesStates.length;
  }

  get fullStatesCount(): number {
    return this.fullStates.length;
  }

  get totalStatesCount(): number {
    return this.selectedStates.length;
  }

  toggleSummaryExpand(stateName: string) {
    if (this.collapsedSummaryStates.has(stateName)) {
      this.collapsedSummaryStates.delete(stateName);
    } else {
      this.collapsedSummaryStates.add(stateName);
    }
    this.cd.detectChanges();
  }

  isSummaryCollapsed(stateName: string): boolean {
    return this.collapsedSummaryStates.has(stateName);
  }

  // =====================================================
  // CLEAR ALL
  // =====================================================

  clearAllSelections() {
    this.resetSelections();
  }

  // =====================================================
  // LOAD EXISTING DATA (edit mode)
  // =====================================================

  private loadSavedGrantData(): void {
    if (this.stCtType === '[ALL STATES]-[ALL COUNTIES]') {
      this.grantMode = 'all';
      this.cd.detectChanges();
      return;
    }

    const isSelectedStates =
      this.stCtType === '[SELECTED STATES]-[MIXED COUNTIES]' ||
      this.stCtType === '[SELECTED STATES]-[SELECTED COUNTIES]';
    if (!isSelectedStates) return;

    this.grantMode = 'selected';

    const stateTokens = this.stateString?.match(/[\[\{][^\]\}]+[\]\}]/g) || [];
    const fullStateNames = stateTokens
      .filter((t) => t.startsWith('[') && t.endsWith(']'))
      .map((t) => t.slice(1, -1).trim());
    const withCountyStateNames = stateTokens
      .filter((t) => t.startsWith('{') && t.endsWith('}'))
      .map((t) => t.slice(1, -1).trim());

    const countyTokens =
      this.countyString?.match(/\[([^\]]+)\]/g)?.map((t) => t.slice(1, -1).trim()) || [];
    const countyMap: Record<string, string[]> = {};
    countyTokens.forEach((token) => {
      const lastComma = token.lastIndexOf(',');
      if (lastComma === -1) return;
      const countyName = token.slice(0, lastComma).trim();
      const stateName = token.slice(lastComma + 1).trim();
      if (!countyMap[stateName]) countyMap[stateName] = [];
      countyMap[stateName].push(countyName);
    });

    const allStateNames = [...withCountyStateNames, ...fullStateNames];
    this.selectedStates = allStateNames;
    this.selectionType = allStateNames.length > 1 ? 'multiple' : 'single';

    fullStateNames.forEach((state) => {
      this.stateModeMap[state] = true;
      this.selectedCounties[state] = [];
      this.loadCountiesForState(state);
    });

    withCountyStateNames.forEach((state) => {
      this.stateModeMap[state] = false;
      this.loadCountiesForState(state, () => {
        this.selectedCounties[state] = countyMap[state] || [];
        this.cd.detectChanges();
      });
    });

    if (allStateNames.length) {
      const last = allStateNames[allStateNames.length - 1];
      this.activeState = last;
      this.viewingStateName = last;
      this.lastToggleMode = this.stateModeMap[last] ?? false;
    }

    this.cd.detectChanges();
  }

  // =====================================================
  // SAVE
  // =====================================================

  saveStatesAndCounties(): void {
    if (!this.grantId) {
      this.showError('Grant ID missing hai — save nahi ho sakta');
      return;
    }

    // validate the currently open state too, so an empty trailing
    // selection doesn't sneak into the payload
    if (this.selectionType === 'multiple') {
      this.validateAndDropIfEmpty(this.activeState);
    }

    const userInfo = this.getUserInfoFromCookie();
    const usGrantCounties: any[] = [];
    const USGrantStates: any[] = [];

    const buildStatePayload = (state: string) => {
      USGrantStates.push({
        countryIndex: 230,
        grantIndex: this.grantId,
        recordIndex: 0,
        stateIndex: this.stateIndexMap[state] ?? 0,
        stateName: state,
      });
    };

    const buildCountyPayload = (state: string, counties: string[]) => {
      counties.forEach((county) => {
        usGrantCounties.push({
          countryIndex: 230,
          countryName: 'United States',
          countyIndex: this.countyIndexMap[`${county}||${state}`] || 0,
          countyName: `${county}, ${state}`,
          stateIndex: this.stateIndexMap[state],
          stateName: state,
        });
      });
    };

    let stateString = '';
    let countyString = '';
    let stCtType = '';

    if (this.grantMode === 'all') {
      const allStateNames = Object.keys(this.stateIndexMap);
      allStateNames.forEach((s) => buildStatePayload(s));
      stateString = allStateNames.map((s) => `[${s}]`).join('-');
      stCtType = '[ALL STATES]-[ALL COUNTIES]';
    } else {
      const fullParts: string[] = [];
      const withCountiesParts: string[] = [];

      this.selectedStates.forEach((state) => {
        buildStatePayload(state);
        if (this.stateModeMap[state] === true) {
          fullParts.push(`[${state}]`);
        } else {
          withCountiesParts.push(`{${state}}`);
          buildCountyPayload(state, this.selectedCounties[state] || []);
        }
      });

      stateString = [...withCountiesParts, ...fullParts].join('-');
      countyString = usGrantCounties.map((c) => `[${c.countyName}]`).join('-');
      stCtType =
        fullParts.length && withCountiesParts.length
          ? '[SELECTED STATES]-[MIXED COUNTIES]'
          : '[SELECTED STATES]-[SELECTED COUNTIES]';
    }

    const tagsPayload = {
      CountyString: countyString,
      GrantIndex: this.grantId.toString(),
      StCtType: stCtType,
      StateString: stateString,
      userEmail: userInfo.emailId,
      userIndex: userInfo.userIndex,
      clientIP: this.clientIP,
    };

    const statesPayload = {
      USGrantStates,
      grantIndex: this.grantId.toString(),
      userEmail: userInfo.emailId,
      userIndex: userInfo.userIndex,
      clientIP: this.clientIP,
    };

    const countiesPayload = {
      grantIndex: this.grantId.toString(),
      usGrantCounties,
      userIndex: userInfo.userIndex,
      userEmail: userInfo.emailId,
      clientIP: this.clientIP,
    };

    this.api.updateGrantTags(this.grantId, tagsPayload).subscribe({
      next: () => {
        this.api.insertGrantStatesJSON(statesPayload).subscribe({
          next: () => {
            if (!usGrantCounties.length) {
              this.showSuccess();
              return;
            }
            this.api.insertGrantCounties(countiesPayload).subscribe({
              next: () => this.showSuccess(),
              error: () => this.showError('Counties save failed'),
            });
          },
          error: () => this.showError('States save failed'),
        });
      },
      error: () => this.showError('Tags save failed'),
    });
  }

  private showSuccess() {
    this.successMessage = 'Saved successfully!';
    this.cd.detectChanges();
    setTimeout(() => {
      this.successMessage = '';
      this.cd.detectChanges();
    }, 4000);
  }

  private showError(msg: string) {
    this.errorMessage = msg;
    this.cd.detectChanges();
    setTimeout(() => {
      this.errorMessage = '';
      this.cd.detectChanges();
    }, 3000);
  }

  // =====================================================
  // WIZARD NAV
  // =====================================================

  goToFocusGroup() {
    this.tabChange.emit(4);
  }

  goToSeo() {
    this.tabChange.emit(6);
  }
}