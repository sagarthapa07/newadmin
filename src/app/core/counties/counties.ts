import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IDropdownSettings, NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { Api } from '../Services/api';
import { County, DropdownItem, GetCountiesResponse, State } from '../../datatype';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { HttpClient } from '@angular/common/http';
import { Common } from '../Services/common';

@Component({
  selector: 'app-counties',
  standalone: true,
  imports: [CommonModule, FormsModule, NgMultiSelectDropDownModule, AlertMessage],
  templateUrl: './counties.html',
  styleUrl: './counties.scss',
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

  showPasteModal = false;
  pasteText = '';
  successMessage = '';
  errorMessage = '';

  clientIP: string = '';

  fullStatesList: string[] = [];
  withCountiesList: string[] = [];

  grantMode: 'single' | 'multiple' | 'all' = 'multiple';

  activeStatesForCounties: string | null = null;
  singleFullStateMode = false;
  multipleFullStateMode = false;
  selectedState: string[] = [];
  selectedSubCounties: Record<string, string[]> = {};
  multipleActiveState: string | null = null;
  stateModeMap: Record<string, boolean> = {};
  stateIndexMap: Record<string, number> = {};
  countyIndexMap: Record<string, number> = {};
  countryIndexMap: Record<string, number> = {};
  countryNameMap: Record<string, string> = {};
  countryIndex = 230;
  singleStateDropdown: { data: DropdownItem[]; selected: DropdownItem[] } = {
    data: [],
    selected: [],
  };

  countiesKeyDropDowns: {
    states: { label: string; data: DropdownItem[]; selected: DropdownItem[] };
  } = {
    states: { label: 'Select States', data: [], selected: [] },
  };

  multipleStatesDropdown: { data: DropdownItem[]; selected: DropdownItem[] } = {
    data: [],
    selected: [],
  };

  readonly multiSelectSettings: IDropdownSettings = {
    singleSelection: false,
    idField: 'item_id',
    textField: 'item_text',
    itemsShowLimit: 3,
    allowSearchFilter: true,
    enableCheckAll: false,
  };

  countieSettings: IDropdownSettings = {
    singleSelection: true,
    idField: 'item_id',
    textField: 'item_text',
    allowSearchFilter: true,
  };

  countiySubCountyMap: Record<string, string[]> = {};

  ngOnInit(): void {
    this.fetchClientIP();
    this.api.getAllStates().subscribe((res: any) => {
      const states = res.states || [];
      const mapped = states.map((s: State) => ({
        item_id: s.stateIndex,
        item_text: s.stateName,
      }));
      this.countiesKeyDropDowns.states.data = [...mapped];
      this.multipleStatesDropdown.data = [...mapped];
      this.singleStateDropdown.data = [...mapped];
      states.forEach((s: State) => {
        this.stateIndexMap[s.stateName] = s.stateIndex;
      });
      if (this.grantId) {
        this.loadSavedCounties();
      }
    });
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
  loadSavedCounties(): void {
    const stateTokens = this.stateString?.match(/[\[\{][^\]\}]+[\]\}]/g) || [];
    this.api.getSelectedCounties(this.grantId!).subscribe({
      next: (res) => {
        if (this.stCtType === '[ALL STATES]-[ALL COUNTIES]') {
          this.grantMode = 'all';
          return;
        }
        const isSelectedStates =
          this.stCtType === '[SELECTED STATES]-[MIXED COUNTIES]' ||
          this.stCtType === '[SELECTED STATES]-[SELECTED COUNTIES]';

        if (!isSelectedStates) return;
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
        const allStateNames = stateTokens.map((t) => t.slice(1, -1).trim());
        const hasCounties = !!this.countyString;

        // selectedState set karo
        this.selectedState = [...allStateNames];

        // SINGLE
        if (allStateNames.length === 1) {
          this.grantMode = 'single';
          const state = allStateNames[0];
          this.activeStatesForCounties = state;
          this.singleStateDropdown.selected = [
            { item_id: this.stateIndexMap[state], item_text: state },
          ];

          if (hasCounties) {
            this.singleFullStateMode = false;
            this.loadCountiesForState(state, () => {
              this.selectedSubCounties[state] = countyMap[state] || [];
              this.cd.detectChanges();
            });
          } else {
            this.singleFullStateMode = true;
            this.selectedSubCounties[state] = [];
            this.loadCountiesForState(state);
          }

          // MULTIPLE
        } else {
          this.grantMode = 'multiple';

          // dropdown selected set karo
          this.multipleStatesDropdown.selected = this.multipleStatesDropdown.data.filter((item) =>
            allStateNames.includes(item.item_text),
          );

          if (!hasCounties) {
            // Full State — saari states, koi county nahi
            this.multipleFullStateMode = true;
            allStateNames.forEach((state) => {
              this.selectedSubCounties[state] = [];
              this.loadCountiesForState(state);
            });
            this.multipleActiveState = allStateNames[0];
          } else {
            this.multipleFullStateMode = false;
            let firstLoaded = false;
            allStateNames.forEach((state) => {
              this.loadCountiesForState(state, () => {
                this.selectedSubCounties[state] = countyMap[state] || [];
                // pehli state jo load ho woh active ho
                if (!firstLoaded) {
                  firstLoaded = true;
                  this.multipleActiveState = state;
                }
                this.cd.detectChanges();
              });
            });
          }
        }
      },
      error: (err) => {
        console.error('Load Counties Error:', err);
      },
    });

    this.fullStatesList = stateTokens
      .filter((t) => t.startsWith('[') && t.endsWith(']'))
      .map((t) => t.slice(1, -1).trim());

    this.withCountiesList = stateTokens
      .filter((t) => t.startsWith('{') && t.endsWith('}'))
      .map((t) => t.slice(1, -1).trim());
  }

  loadCountiesForState(stateName: string, callback?: () => void): void {
    const stateId = this.stateIndexMap[stateName];
    if (!stateId) return;
    this.api.getCountiesByState(stateId).subscribe((res: GetCountiesResponse) => {
      const counties = res.usgeoCounties || [];
      this.countiySubCountyMap[stateName] = counties.map((c: County) => c.countyName);
      counties.forEach((c: County) => {
        this.countyIndexMap[`${c.countyName}||${stateName}`] = c.countyIndex;
      });
      if (callback) {
        callback();
      }
      this.cd.detectChanges();
    });
  }

  goToFocusGroup() {
    this.tabChange.emit(4);
  }

  goToSeo() {
    this.tabChange.emit(6);
  }

  openPasteModal() {
    this.pasteText = '';
    this.showPasteModal = true;
  }

  closePasteModal() {
    this.showPasteModal = false;
  }

  setGrantMode(mode: 'single' | 'multiple' | 'all') {
    this.grantMode = mode;
  }

  onSingleStateChange() {
    console.log('=== onSingleStateChange CALLED ===');
    const selected = this.singleStateDropdown.selected;
    console.log('selected:', selected);

    if (!selected.length) {
      this.selectedState = [];
      this.activeStatesForCounties = null;
      return;
    }

    const stateObj: DropdownItem = selected[0];
    const stateName = stateObj.item_text;

    if (!this.stateModeMap.hasOwnProperty(stateName)) {
      this.stateModeMap[stateName] = false;
    }

    console.log('stateModeMap[stateName] BEFORE assign:', this.stateModeMap[stateName]);
    this.singleFullStateMode = this.stateModeMap[stateName];
    console.log('singleFullStateMode SET TO:', this.singleFullStateMode);

    this.selectedState = [stateName];
    this.activeStatesForCounties = stateName;
    this.loadCountiesForState(stateName);

    if (!this.selectedSubCounties[stateName]) {
      this.selectedSubCounties[stateName] = [];
    }

    this.cd.detectChanges();
  }

  onSingleToggleChange(event: Event) {
    console.log('=== onSingleToggleChange CALLED ===');
    const checked = (event.target as HTMLInputElement).checked;
    console.log('checkbox checked value:', checked);

    this.singleFullStateMode = checked;
    const state = this.activeStatesForCounties;
    console.log('activeStatesForCounties:', state);
    if (!state) return;

    this.stateModeMap[state] = checked;
    console.log('stateModeMap AFTER update:', { ...this.stateModeMap });

    if (checked) {
      this.selectedSubCounties[state] = [];
    }


    this.cd.detectChanges();
  }

  // AFTER
  onMultipleStateChange() {
    const selected: DropdownItem[] = this.multipleStatesDropdown.selected;
    const selectedNames = selected.map((i) => i.item_text);

    if (!selected.length) {
      this.multipleActiveState = null;
      this.selectedState = [];
      this.fullStatesList = [];
      this.withCountiesList = [];
      return;
    }

    this.fullStatesList = this.fullStatesList.filter((s) => selectedNames.includes(s));
    this.withCountiesList = this.withCountiesList.filter((s) => selectedNames.includes(s));

    const lastSelected = selected[selected.length - 1];
    const stateName = lastSelected.item_text;

    this.selectedState = selectedNames;
    this.multipleActiveState = stateName;

    if (!this.stateModeMap.hasOwnProperty(stateName)) {
      this.stateModeMap[stateName] = false;
    }
    
    this.loadCountiesForState(stateName);

    if (!this.selectedSubCounties[stateName]) {
      this.selectedSubCounties[stateName] = [];
    }

    this.cd.detectChanges();
  }

  setStateMode(state: string, isFullState: boolean) {
    this.stateModeMap[state] = isFullState;

    if (isFullState) {
      this.selectedSubCounties[state] = [];
    }
  }

  toggleCounty(state: string, county: string, checked: boolean) {
    if (!this.selectedSubCounties[state]) this.selectedSubCounties[state] = [];
    if (checked) {
      if (!this.selectedSubCounties[state].includes(county)) {
        this.selectedSubCounties[state].push(county);
      }
    } else {
      this.selectedSubCounties[state] = this.selectedSubCounties[state].filter((c) => c !== county);
    }
  }

  clearAllSelections() {
    this.selectedState = [];
    this.selectedSubCounties = {};
    this.countiesKeyDropDowns.states.selected = [];
    this.multipleStatesDropdown.selected = [];
    this.multipleActiveState = null;
    this.activeStatesForCounties = null;
  }

  generateCountiesFromText() {
    const text = this.pasteText.toLowerCase();
    const states = Object.keys(this.countiySubCountyMap);
    const detected = states.filter((s) => text.includes(s.toLowerCase()));

    if (!detected.length) {
      alert('No state found');
      return;
    }

    const state = detected[0];
    this.selectedState = [state];
    this.activeStatesForCounties = state;
    this.selectedSubCounties[state] = [...this.countiySubCountyMap[state]];
    this.showPasteModal = false;
  }

  removeMultipleState(state: string) {
    this.selectedState = this.selectedState.filter((s) => s !== state);
    delete this.selectedSubCounties[state];

    // Yeh do lines add karo
    this.fullStatesList = this.fullStatesList.filter((s) => s !== state);
    this.withCountiesList = this.withCountiesList.filter((s) => s !== state);

    this.multipleStatesDropdown.selected = this.multipleStatesDropdown.selected.filter(
      (item: DropdownItem) => item.item_text !== state,
    );
    this.singleStateDropdown.selected = this.singleStateDropdown.selected.filter(
      (item: DropdownItem) => item.item_text !== state,
    );

    if (this.multipleActiveState === state) {
      this.multipleActiveState = this.selectedState.slice(-1)[0] || null;
    }
  }

  removeMultipleCounty(state: string, county: string) {
    this.selectedSubCounties[state] =
      this.selectedSubCounties[state]?.filter((c) => c !== county) || [];
  }

  isAllMultipleCountiesSelected(state: string): boolean {
    const all = this.countiySubCountyMap[state] || [];
    const selected = this.selectedSubCounties[state] || [];
    return all.length > 0 && all.length === selected.length;
  }

  toggleSelectAllMultiple(state: string, checked: boolean) {
    if (checked) {
      this.selectedSubCounties[state] = [...(this.countiySubCountyMap[state] || [])];
    } else {
      this.selectedSubCounties[state] = [];
      this.selectedState = this.selectedState.filter((s) => s !== state);
      delete this.selectedSubCounties[state];
      this.multipleStatesDropdown.selected = this.multipleStatesDropdown.selected.filter(
        (item: DropdownItem) => item.item_text !== state,
      );
      this.multipleActiveState = this.selectedState.slice(-1)[0] || null;
    }
  }

  saveStatesAndCounties(): void {
    if (!this.grantId) {
      this.errorMessage = 'Grant ID missing hai — save nahi ho sakta';
      setTimeout(() => (this.errorMessage = ''), 3000);
      return;
    }

    const userInfo = this.getUserInfoFromCookie(); // ADD THIS — ek hi baar nikal lo, sabme reuse hoga

    const usGrantCounties: any[] = [];
    const USGrantStates: any[] = [];
    const addedStates = new Set<string>();

    const buildStatePayload = (state: string) => {
      if (addedStates.has(state)) return;
      addedStates.add(state);
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
        const countyIndex = this.countyIndexMap[`${county}||${state}`] || 0;
        usGrantCounties.push({
          countryIndex: 230,
          countryName: 'United States',
          countyIndex,
          countyName: `${county}, ${state}`, // Bug 1 FIX
          stateIndex: this.stateIndexMap[state],
          stateName: state,
        });
      });
    };

    // =====================
    // ALL MODE
    // =====================
    if (this.grantMode === 'all') {
      const allStateNames = Object.keys(this.stateIndexMap);
      const stateString = allStateNames.map((s) => `[${s}]`).join('-');

      const tagsPayload = {
        CountyString: '',
        GrantIndex: this.grantId.toString(),
        StCtType: '[ALL STATES]-[ALL COUNTIES]',
        StateString: stateString,
        userEmail: userInfo.emailId, // CHANGED
        userIndex: userInfo.userIndex, // CHANGED
        clientIP: this.clientIP, // ADD THIS
      };

      allStateNames.forEach((state) => buildStatePayload(state));

      const statesPayload = {
        USGrantStates,
        grantIndex: this.grantId.toString(),
        userEmail: userInfo.emailId, // CHANGED
        userIndex: userInfo.userIndex, // CHANGED
        clientIP: this.clientIP, // ADD THIS
      };

      this.api.updateGrantTags(this.grantId!, tagsPayload).subscribe({
        next: () => {
          this.api.insertGrantStatesJSON(statesPayload).subscribe({
            next: () => {
              this.successMessage = 'Saved successfully!';
              setTimeout(() => (this.successMessage = ''), 4000);
            },
            error: () => (this.errorMessage = 'States save failed'),
          });
        },
        error: () => (this.errorMessage = 'Tags save failed'),
      });
      return;
    }

    // =====================
    // SINGLE MODE
    // =====================
    if (this.grantMode === 'single') {
      const state = this.selectedState[0];
      if (!state) return;

      buildStatePayload(state);

      const isFullState = this.singleFullStateMode;
      const stateString = isFullState ? `[${state}]` : `{${state}}`;

      let countyString = '';
      if (!isFullState) {
        const counties = this.selectedSubCounties[state] || [];
        buildCountyPayload(state, counties);
        countyString = usGrantCounties.map((c) => `[${c.countyName}]`).join('-'); // FIX: countyName already has state
      }

      const stCtType = '[SELECTED STATES]-[SELECTED COUNTIES]';

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

      this.saveTags(tagsPayload, statesPayload, countiesPayload);
      return;
    }

    // =====================
    // MULTIPLE MODE
    // =====================
    if (this.grantMode === 'multiple') {
      let hasFullStates = false;
      let hasWithCounties = false;

      const withCountiesParts: string[] = [];
      const fullStateParts: string[] = [];

      this.selectedState.forEach((state) => {
        buildStatePayload(state);

        const isFullState =
          this.stateModeMap[state] === true ||
          (this.stateModeMap[state] !== false && !this.selectedSubCounties[state]?.length);

        if (isFullState) {
          fullStateParts.push(`[${state}]`);
          hasFullStates = true;
        } else {
          withCountiesParts.push(`{${state}}`);
          hasWithCounties = true;
          const counties = this.selectedSubCounties[state] || [];
          buildCountyPayload(state, counties);
        }
      });

      const stateString = [...withCountiesParts, ...fullStateParts].join('-');

      const countyString = usGrantCounties.map((c) => `[${c.countyName}]`).join('-');

      const stCtType =
        hasFullStates && hasWithCounties
          ? '[SELECTED STATES]-[MIXED COUNTIES]'
          : '[SELECTED STATES]-[SELECTED COUNTIES]';

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

      this.saveTags(tagsPayload, statesPayload, countiesPayload);
    }
  }

  saveTags(tagsPayload: any, statesPayload: any, countiesPayload: any) {
    this.api.updateGrantTags(this.grantId!, tagsPayload).subscribe({
      next: () => this.saveStates(statesPayload, countiesPayload),
      error: () => (this.errorMessage = 'Tags save failed'),
    });
  }

  saveStates(statesPayload: any, countiesPayload: any) {
    this.api.insertGrantStatesJSON(statesPayload).subscribe({
      next: () => {
        if (!countiesPayload.usGrantCounties.length) {
          this.successMessage = 'Saved successfully!';
          setTimeout(() => (this.successMessage = ''), 4000);
          return;
        }
        this.saveCounties(countiesPayload);
      },
      error: () => {
        this.errorMessage = 'States save failed';
      },
    });
  }

  // AFTER
  onActiveStateToggleChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    console.log('Toggle changed to:', checked);
    console.log('multipleActiveState:', this.multipleActiveState);
    console.log('stateModeMap before:', { ...this.stateModeMap });

    if (!this.multipleActiveState) return;

    const state = this.multipleActiveState;
    this.stateModeMap[state] = checked;
    if (checked) {
      this.selectedSubCounties[state] = [];
      if (!this.fullStatesList.includes(state)) this.fullStatesList.push(state);
      this.withCountiesList = this.withCountiesList.filter((s) => s !== state);
    } else {
      if (!this.withCountiesList.includes(state)) this.withCountiesList.push(state);
      this.fullStatesList = this.fullStatesList.filter((s) => s !== state);
    }

    this.cd.detectChanges();
    console.log('stateModeMap after:', { ...this.stateModeMap });
  }
  onMultipleToggleChange(event: Event) {
    this.multipleFullStateMode = (event.target as HTMLInputElement).checked;

    if (this.multipleActiveState) {
      this.stateModeMap[this.multipleActiveState] = this.multipleFullStateMode;
      if (this.multipleFullStateMode) {
        this.selectedSubCounties[this.multipleActiveState] = [];
      }
    }
  }
  saveCounties(countiesPayload: any) {
    this.api.insertGrantCounties(countiesPayload).subscribe({
      next: () => {
        this.successMessage = 'Saved successfully!';
        setTimeout(() => (this.successMessage = ''), 4000);
      },
      error: () => (this.errorMessage = 'Counties save failed'),
    });
  }
}
