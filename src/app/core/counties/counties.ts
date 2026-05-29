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
    const selected = this.countiesKeyDropDowns.states.selected;
    if (!selected.length) return;

    const stateObj: DropdownItem = selected[0];
    const stateName = stateObj.item_text;
    if (!this.selectedState.includes(stateName)) {
      this.selectedState.push(stateName);
    }

    this.activeStatesForCounties = stateName;
    this.loadCountiesForState(stateName);

    if (!this.selectedSubCounties[stateName]) {
      this.selectedSubCounties[stateName] = [];
    }
  }

  onSingleToggleChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.singleFullStateMode = checked;
    const state = this.activeStatesForCounties;

    if (!state) return;
    if (checked) {
      this.selectedSubCounties[state] = [];
    }
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

    // ARRAYS
    const usGrantCounties: any[] = [];
    const USGrantStates: any[] = [];
    const addedStates = new Set<string>();

    // STATE PAYLOAD BUILDER
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

    // COUNTY PAYLOAD BUILDER
    const buildCountyPayload = (state: string, counties: string[]) => {
      counties.forEach((county) => {
        usGrantCounties.push({
          countryIndex: 230,
          countryName: 'United States',
          countyIndex: this.countyIndexMap[`${county}||${state}`] ?? 0,
          countyName: county,
          stateIndex: this.stateIndexMap[state] ?? 0,
          stateName: state,
        });
      });
    };

    // SINGLE MODE
    if (this.grantMode === 'single') {
      const state = this.selectedState[0];
      if (state) {
        buildStatePayload(state);
        if (!this.singleFullStateMode) {
          buildCountyPayload(state, this.selectedSubCounties[state] || []);
        }
      }
    }

    // MULTIPLE MODE
    if (this.grantMode === 'multiple') {
      this.selectedState.forEach((state) => {
        buildStatePayload(state);
        if (!this.multipleFullStateMode) {
          buildCountyPayload(state, this.selectedSubCounties[state] || []);
        }
      });
    }

    // ALL MODE
    if (this.grantMode === 'all') {
      Object.keys(this.countiySubCountyMap).forEach((state) => {
        buildStatePayload(state);
        buildCountyPayload(state, this.countiySubCountyMap[state] || []);
      });
    }

    // STRINGS BANAO
    const fullStateMode = this.singleFullStateMode || this.multipleFullStateMode;

    const stateString = this.selectedState
      .map((state) => (fullStateMode ? `[${state}]` : `{${state}}`))
      .join('-');

    const countyString = Object.entries(this.selectedSubCounties)
      .flatMap(([state, counties]) => {
        if (this.stateModeMap[state]) {
          return [];
        }

        return counties.map((county) => `[${county}]`);
      })
      .join('-');

    const stCtType = fullStateMode
      ? '[SELECTED STATES]-[SELECTED COUNTIES]'
      : '[SELECTED STATES]-[MIXED COUNTIES]';

    // PAYLOADS
    const tagsPayload = {
      CountyString: countyString,
      GrantIndex: this.grantId.toString(),
      StCtType: stCtType,
      StateString: stateString,
      userEmail: 'ritu@fundsforngos.org',
      userIndex: 5,
    };

    const statesPayload = {
      USGrantStates: USGrantStates,
      grantIndex: this.grantId,
      userEmail: 'ritu@fundsforngos.org',
      userIndex: 5,
    };

    const countiesPayload = {
      grantIndex: this.grantId,
      usGrantCounties: usGrantCounties,
      userIndex: 5,
      userEmail: 'ritu@fundsforngos.org',
    };

    // API CALLS
    this.saveTags(tagsPayload, statesPayload, countiesPayload);
  }

  saveTags(tagsPayload: any, statesPayload: any, countiesPayload: any) {
    this.api.updateGrantTags(this.grantId!, tagsPayload).subscribe({
      next: () => this.saveStates(statesPayload, countiesPayload),
      error: () => (this.errorMessage = 'Tags save failed'),
    });
  }

  saveStates(statesPayload: any, countiesPayload: any) {
    const hasMixedCounties = countiesPayload.usGrantCounties.length > 0;

    this.api.insertGrantStatesJSON(statesPayload).subscribe({
      next: () => {
        if (!countiesPayload.usGrantCounties.length) {
          this.successMessage = 'Saved successfully!';
          return;
        }
        this.saveCounties(countiesPayload);
      },
      error: () => {
        this.errorMessage = 'States save failed';
      },
    });
  }

  onMultipleToggleChange(event: Event) {
    this.multipleFullStateMode = (event.target as HTMLInputElement).checked;
    if (this.multipleFullStateMode) {
      this.multipleActiveState = null;
      this.selectedState.forEach((state) => {
        this.selectedSubCounties[state] = [];
      });
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
