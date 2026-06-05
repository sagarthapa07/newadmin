import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IDropdownSettings, NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { Api } from '../Services/api';
import { County, DropdownItem, GetCountiesResponse, State } from '../../datatype';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';

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
  ) {}

  showPasteModal = false;
  pasteText = '';
  successMessage = '';
  errorMessage = '';

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

  loadSavedCounties(): void {
    this.api.getSelectedCounties(this.grantId!).subscribe({
      next: (res) => {
        // STEP 1 — ALL STATES
        if (this.stCtType === '[ALL STATES]-[ALL COUNTIES]') {
          this.grantMode = 'all';
          return;
        }

        // STEP 2 — SELECTED STATES
        const isSelectedStates =
          this.stCtType === '[SELECTED STATES]-[MIXED COUNTIES]' ||
          this.stCtType === '[SELECTED STATES]-[SELECTED COUNTIES]';

        if (!isSelectedStates) return;

        // stateString se tokens nikalo
        const stateTokens = this.stateString?.match(/[\[\{][^\]\}]+[\]\}]/g) || [];

        // countyString se countyMap banao
        const countyTokens =
          this.countyString?.match(/\[([^\]]+)\]/g)?.map((t) => t.slice(1, -1).trim()) || [];

        const countyMap: Record<string, string[]> = {};
        countyTokens.forEach((token) => {
          const lastComma = token.lastIndexOf(',');
          if (lastComma === -1) return;
          const countyName = token.slice(0, lastComma).trim();
          const stateName = token.slice(lastComma + 1).trim();
          if (!countyMap[stateName]) countyMap[stateName] = [];
          countyMap[stateName].push(`${countyName}, ${stateName}`);
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
    const selected = this.singleStateDropdown.selected;

    // Agar deselect hua toh selectedState clear karo aur return
    if (!selected.length) {
      this.selectedState = [];
      this.activeStatesForCounties = null;
      return;
    }

    const stateObj: DropdownItem = selected[0];
    const stateName = stateObj.item_text;

    // Pehli baar state select ho rahi hai
    // Existing stateModeMap value preserve karo, naya state ho toh current toggle value use karo
    if (!this.stateModeMap.hasOwnProperty(stateName)) {
      this.stateModeMap[stateName] = this.singleFullStateMode;
    } else {
      // Agar pehle se map mein hai toh uski value se toggle sync karo
      this.singleFullStateMode = this.stateModeMap[stateName];
    }

    this.selectedState = [stateName];
    this.activeStatesForCounties = stateName;
    this.loadCountiesForState(stateName);

    if (!this.selectedSubCounties[stateName]) {
      this.selectedSubCounties[stateName] = [];
    }

    this.cd.detectChanges(); // ← force update
  }

  onSingleStateDeselect() {
    this.selectedState = [];
    this.activeStatesForCounties = null;
    this.selectedSubCounties = {};
    this.singleFullStateMode = false;
    this.cd.detectChanges();
  }

  onSingleToggleChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.singleFullStateMode = checked;
    const state = this.activeStatesForCounties;
    if (!state) return;

    this.stateModeMap[state] = checked;

    if (checked) {
      this.selectedSubCounties[state] = [];
    }

    this.cd.detectChanges(); // ← force update
  }

  onMultipleStateChange() {
    const selected: DropdownItem[] = this.multipleStatesDropdown.selected;

    if (!selected.length) {
      this.multipleActiveState = null;
      return;
    }

    const lastSelected: DropdownItem = selected[selected.length - 1];
    const stateName = lastSelected.item_text;

    this.selectedState = selected.map((i: DropdownItem) => i.item_text);
    this.multipleActiveState = stateName;

    if (!this.multipleFullStateMode) {
      this.loadCountiesForState(stateName);

      if (!this.selectedSubCounties[stateName]) {
        this.selectedSubCounties[stateName] = [];
      }
    }
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
    if (!this.grantId) return;

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
        // countyName already "Baldwin County, Alabama" format mein stored hai
        // countyIndex lookup: county value directly use karo
        const countyIndex = this.countyIndexMap[`${county}||${state}`] || 0;
        usGrantCounties.push({
          countryIndex: 230,
          countryName: 'United States',
          countyIndex,
          countyName: county, // already "Baldwin County, Alabama" format mein hai
          stateIndex: this.stateIndexMap[state],
          stateName: state,
        });
      });
    };

    // =====================
    // ALL MODE
    // =====================
    if (this.grantMode === 'all') {
      // Saari states [] bracket mein
      const allStateNames = Object.keys(this.stateIndexMap);

      const stateString = allStateNames.map((s) => `[${s}]`).join('-');

      const tagsPayload = {
        CountyString: '',
        GrantIndex: this.grantId.toString(),
        StCtType: '[ALL STATES]-[ALL COUNTIES]',
        StateString: stateString,
        userEmail: 'ritu@fundsforngos.org',
        userIndex: 5,
      };

      allStateNames.forEach((state) => buildStatePayload(state));

      const statesPayload = {
        USGrantStates,
        grantIndex: this.grantId.toString(),
        userEmail: 'ritu@fundsforngos.org',
        userIndex: 5,
      };

      // All mode: sirf 2 APIs
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
      return; // baaki logic skip
    }

    // =====================
    // SINGLE MODE
    // =====================
    if (this.grantMode === 'single') {
      const state = this.selectedState[0];
      if (!state) return;

      buildStatePayload(state);

      const isFullState = this.singleFullStateMode;
      // [] = Full State, {} = With Counties
      const stateString = isFullState ? `[${state}]` : `{${state}}`;

      let countyString = '';
      if (!isFullState) {
        const counties = this.selectedSubCounties[state] || [];
        buildCountyPayload(state, counties);
        countyString = counties.map((c) => `[${c}]`).join('-');
      }

      const stCtType = '[SELECTED STATES]-[SELECTED COUNTIES]';

      const tagsPayload = {
        CountyString: countyString,
        GrantIndex: this.grantId.toString(),
        StCtType: stCtType,
        StateString: stateString,
        userEmail: 'ritu@fundsforngos.org',
        userIndex: 5,
      };

      const statesPayload = {
        USGrantStates,
        grantIndex: this.grantId.toString(),
        userEmail: 'ritu@fundsforngos.org',
        userIndex: 5,
      };

      const countiesPayload = {
        grantIndex: this.grantId.toString(),
        usGrantCounties,
        userIndex: 5,
        userEmail: 'ritu@fundsforngos.org',
      };

      this.saveTags(tagsPayload, statesPayload, countiesPayload);
      return;
    }

    // =====================
    // MULTIPLE MODE
    // =====================
    if (this.grantMode === 'multiple') {
      // Per-state mode check:
      // stateModeMap[state] === true → Full State → [StateName]
      // stateModeMap[state] === false/undefined + counties selected → With Counties → {StateName}
      // stateModeMap[state] === false/undefined + no counties → Full State → [StateName]

      let hasFullStates = false;
      let hasWithCounties = false;

      const stateStringParts: string[] = [];

      this.selectedState.forEach((state) => {
        buildStatePayload(state);

        const isFullState =
          this.stateModeMap[state] === true ||
          (this.stateModeMap[state] !== false && !this.selectedSubCounties[state]?.length);

        if (isFullState) {
          stateStringParts.push(`[${state}]`);
          hasFullStates = true;
          // Full state mein counties nahi jaatein
        } else {
          stateStringParts.push(`{${state}}`);
          hasWithCounties = true;
          const counties = this.selectedSubCounties[state] || [];
          buildCountyPayload(state, counties);
        }
      });

      const stateString = stateStringParts.join('-');

      const countyString = usGrantCounties.map((c) => `[${c.countyName}]`).join('-');

      // stCtType logic:
      // Sirf Full States → [SELECTED STATES]-[SELECTED COUNTIES]
      // Sirf With Counties → [SELECTED STATES]-[SELECTED COUNTIES]
      // Mixed (dono) → [SELECTED STATES]-[MIXED COUNTIES]
      const stCtType =
        hasFullStates && hasWithCounties
          ? '[SELECTED STATES]-[MIXED COUNTIES]'
          : '[SELECTED STATES]-[SELECTED COUNTIES]';

      const tagsPayload = {
        CountyString: countyString,
        GrantIndex: this.grantId.toString(),
        StCtType: stCtType,
        StateString: stateString,
        userEmail: 'ritu@fundsforngos.org',
        userIndex: 5,
      };

      const statesPayload = {
        USGrantStates,
        grantIndex: this.grantId.toString(),
        userEmail: 'ritu@fundsforngos.org',
        userIndex: 5,
      };

      const countiesPayload = {
        grantIndex: this.grantId.toString(),
        usGrantCounties,
        userIndex: 5,
        userEmail: 'ritu@fundsforngos.org',
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

  onActiveStateToggleChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (!this.multipleActiveState) return;

    this.stateModeMap[this.multipleActiveState] = checked;

    if (checked) {
      // Full State select kiya — counties clear karo
      this.selectedSubCounties[this.multipleActiveState] = [];
    }
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
