import { Component, OnInit, Input, OnChanges, Output, EventEmitter } from '@angular/core';
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
  @Output() tabChange = new EventEmitter<number>();

  constructor(private api: Api) {}

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

  // selectedState: string[] = [];
  // multipleSelectedCounties: Record<string, string[]> = {};
  multipleActiveState: string | null = null;

  // stateIndex map — save ke waqt chahiye hoga
  stateIndexMap: Record<string, number> = {};
  countyIndexMap: Record<string, number> = {}; // "countyName||stateName" -> countyIndex
  countryIndex = 230; // US hardcoded

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

  // ================= LIFECYCLE =================

  ngOnInit(): void {
    this.api.getAllStates().subscribe((res: any) => {
      console.log('FULL RESPONSE', JSON.stringify(res, null, 2)); // pehle ye dekho
      const states = res.states || [];
      const mapped = states.map((s: State) => ({
        item_id: s.stateIndex,
        item_text: s.stateName,
      }));
      this.countiesKeyDropDowns.states.data = [...mapped];
      this.multipleStatesDropdown.data = [...mapped];
      states.forEach((s: State) => {
        this.stateIndexMap[s.stateName] = s.stateIndex;
      });

      // States load hone KE BAAD counties load karo
      if (this.grantId) {
        this.loadSavedCounties();
      }
    });
  }

  // ngOnChanges se loadSavedCounties HATAAO

  // ngOnChanges(): void {
  //   // grantId baad mein aaye toh bhi kaam kare
  //   if (this.grantId && this.multipleStatesDropdown.data.length) {
  //     this.loadSavedCounties();
  //   }
  // }

  checkIfFullState(state: string): boolean {
    const all = this.countiySubCountyMap[state] || [];

    const selected = this.selectedSubCounties[state] || [];

    return all.length > 0 && all.length === selected.length;
  }

  loadSavedCounties(): void {
    this.api.getSelectedCounties(this.grantId!).subscribe({
      next: (res) => {
        const data: any[] = res.temp || [];
        if (!data.length) return;
        this.selectedState = [];
        this.selectedSubCounties = {};
        this.countiySubCountyMap = {};
        data.forEach((item) => {
          const stateName = item.stateName;
          const countyName = item.countyName;
          const countyIndex = item.countyIndex;
          this.stateIndexMap[stateName] = item.stateIndex;
          this.countyIndexMap[`${countyName}||${stateName}`] = countyIndex;
          if (!this.selectedState.includes(stateName)) {
            this.selectedState.push(stateName);
          }
          if (!this.selectedSubCounties[stateName]) {
            this.selectedSubCounties[stateName] = [];
          }
          if (!this.selectedSubCounties[stateName].includes(countyName)) {
            this.selectedSubCounties[stateName].push(countyName);
          }
          if (!this.countiySubCountyMap[stateName]) {
            this.countiySubCountyMap[stateName] = [];
          }
          if (!this.countiySubCountyMap[stateName].includes(countyName)) {
            this.countiySubCountyMap[stateName].push(countyName);
          }
        });

        this.multipleStatesDropdown.selected = this.multipleStatesDropdown.data.filter((item) =>
          this.selectedState.includes(item.item_text),
        );

        this.selectedState.forEach((state) => {
          this.loadCountiesForState(state);
        });

        const lastState = this.selectedState.slice(-1)[0];

        if (lastState) {
          this.multipleActiveState = lastState;
        }

        const totalStates = this.multipleStatesDropdown.data.length;

        const selectedStatesCount = this.selectedState.length;

        const allStatesSelected = selectedStatesCount === totalStates;

        const allStatesFullSelected = this.selectedState.every((state) =>
          this.checkIfFullState(state),
        );
        if (allStatesSelected && allStatesFullSelected) {
          this.grantMode = 'all';
        } else if (selectedStatesCount === 1) {
          this.grantMode = 'single';
          const state = this.selectedState[0];
          this.countiesKeyDropDowns.states.selected = [
            {
              item_id: this.stateIndexMap[state],
              item_text: state,
            },
          ];
          this.selectedState = [state];
          this.activeStatesForCounties = state;
          this.loadCountiesForState(state, () => {
            this.selectedSubCounties[state] = [...(this.selectedSubCounties[state] || [])];
            this.singleFullStateMode = this.checkIfFullState(state);
          });
        } else {
          this.grantMode = 'multiple';
          this.multipleFullStateMode = allStatesFullSelected;
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
    this.selectedSubCounties[state] = checked ? [...(this.countiySubCountyMap[state] || [])] : [];
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

    // Counties load karo — grid ke liye
    this.loadCountiesForState(stateName);

    if (!this.selectedSubCounties[stateName]) {
      this.selectedSubCounties[stateName] = [];
    }
  }

  toggleMultipleCounty(state: string, county: string, checked: boolean) {
    if (!this.selectedSubCounties[state]) {
      this.selectedSubCounties[state] = [];
    }

    if (checked) {
      if (!this.selectedSubCounties[state].includes(county)) {
        this.selectedSubCounties[state].push(county);
      }
    } else {
      this.selectedSubCounties[state] = this.selectedSubCounties[state].filter((c) => c !== county);
    }

    if (this.selectedSubCounties[state].length === 0) {
      this.selectedState = this.selectedState.filter((s) => s !== state);
      delete this.selectedSubCounties[state];
      this.multipleStatesDropdown.selected = this.multipleStatesDropdown.selected.filter(
        (item: DropdownItem) => item.item_text !== state,
      );

      this.multipleActiveState = this.selectedState.slice(-1)[0] || null;
    }
  }

  onMultipleToggleChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.multipleFullStateMode = checked;
    this.selectedState.forEach((state) => {
      this.selectedSubCounties[state] = checked ? [...(this.countiySubCountyMap[state] || [])] : [];
    });
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
  removeState(state: string) {
    this.selectedState = this.selectedState.filter((s) => s !== state);
    delete this.selectedSubCounties[state];
    this.countiesKeyDropDowns.states.selected = this.countiesKeyDropDowns.states.selected.filter(
      (item: DropdownItem) => item.item_text !== state,
    );
    if (this.activeStatesForCounties === state) this.activeStatesForCounties = null;
  }

  removeCountyFromState(state: string, county: string) {
    this.selectedSubCounties[state] =
      this.selectedSubCounties[state]?.filter((c) => c !== county) || [];
  }

  isAllCountiesSelected(state: string): boolean {
    const all = this.countiySubCountyMap[state] || [];
    const selected = this.selectedSubCounties[state] || [];
    return all.length > 0 && all.length === selected.length;
  }

  toggleSelectAllCounties(state: string, checked: boolean) {
    this.selectedSubCounties[state] = checked ? [...(this.countiySubCountyMap[state] || [])] : [];
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

    const buildPayload = (state: string, counties: string[]) => {
      const stateIndex = this.stateIndexMap[state] ?? 0;

      // STATES PAYLOAD
      if (!addedStates.has(state)) {
        addedStates.add(state);

        USGrantStates.push({
          countryIndex: 230,
          grantIndex: this.grantId,
          recordIndex: 0,
          stateIndex: stateIndex,
          stateName: state,
        });
      }

      // COUNTIES PAYLOAD
      counties.forEach((county) => {
        const countyIndex = this.countyIndexMap[`${county}||${state}`] ?? 0;

        usGrantCounties.push({
          countryIndex: 230,
          countryName: 'United States',

          countyIndex: countyIndex,
          countyName: county,

          stateIndex: stateIndex,
          stateName: state,
        });
      });
    };

    // SINGLE
    if (this.grantMode === 'single') {
      const state = this.selectedState[0];

      if (state) {
        buildPayload(state, this.selectedSubCounties[state] || []);
      }
    }

    // MULTIPLE
    if (this.grantMode === 'multiple') {
      this.selectedState.forEach((state) => {
        buildPayload(state, this.selectedSubCounties[state] || []);
      });
    }

    // ALL
    if (this.grantMode === 'all') {
      Object.keys(this.countiySubCountyMap).forEach((state) => {
        buildPayload(state, this.countiySubCountyMap[state] || []);
      });
    }

    // TAGS API PAYLOAD
    const tagsPayload = {
      memberIndex: this.grantId,
    };

    // STATES PAYLOAD
    const statesPayload = {
      USGrantStates,
      grantIndex: this.grantId,
      userEmail: 'ritu@fundsforngos.org',
      userIndex: 5,
    };

    // COUNTIES PAYLOAD
    const countiesPayload = {
      grantIndex: this.grantId,
      usGrantCounties,
      userIndex: 5,
      userEmail: 'ritu@fundsforngos.org',
    };

    console.log('TAGS PAYLOAD', tagsPayload);
    console.log('STATES PAYLOAD', statesPayload);
    console.log('COUNTIES PAYLOAD', countiesPayload);

    // API CHAIN
    this.api.updateGrantTags(this.grantId, tagsPayload).subscribe({
      next: () => {
        console.log('TAGS UPDATED');

        this.api.insertGrantStatesJSON(statesPayload).subscribe({
          next: () => {
            console.log('STATES SAVED');

            this.api.insertGrantCounties(countiesPayload).subscribe({
              next: () => {
                console.log('COUNTIES SAVED');

                this.successMessage = 'States & Counties saved successfully';

                setTimeout(() => {
                  this.successMessage = '';
                }, 4000);
              },

              error: (err) => {
                console.error('COUNTIES SAVE ERROR', err);
                this.errorMessage = 'Counties save failed';
              },
            });
          },
          error: (err) => {
            console.error('STATES SAVE ERROR', err);
            this.errorMessage = 'States save failed';
          },
        });
      },
      error: (err) => {
        console.error('TAGS UPDATE ERROR', err);
        this.errorMessage = 'Tags update failed';
      },
    });
  }
}
