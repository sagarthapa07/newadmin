import { Component, OnInit, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IDropdownSettings, NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { Api } from '../Services/api';
import {
  County,
  DropdownItem,
  GetCountiesResponse,
  GetStatesResponse,
  State,
} from '../../datatype';

@Component({
  selector: 'app-counties',
  standalone: true,
  imports: [CommonModule, FormsModule, NgMultiSelectDropDownModule],
  templateUrl: './counties.html',
  styleUrl: './counties.scss',
})
export class CountiesComponent implements OnInit, OnChanges {
  @Input() grantId?: number;
  @Output() tabChange = new EventEmitter<number>();

  constructor(private api: Api) {}

  showPasteModal = false;
  pasteText = '';
  successMessage = '';
  errorMessage = '';

  grantMode: 'single' | 'multiple' | 'all' = 'multiple'; // default multiple since API returns multiple states

  activeStatesForCounties: string | null = null;
  singleFullStateMode = false;
  multipleFullStateMode = false;

  selectedState: string[] = [];
  selectedSubCounties: Record<string, string[]> = {};

  multipleSelectedStates: string[] = [];
  multipleSelectedCounties: Record<string, string[]> = {};
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
      console.log('STATES RESPONSE:', res); // pehle ye dekho

      const states = res.usStates || [];

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

  ngOnChanges(): void {
    // grantId baad mein aaye toh bhi kaam kare
    if (this.grantId && this.multipleStatesDropdown.data.length) {
      this.loadSavedCounties();
    }
  }

  // ================= LOAD SAVED DATA =================

  loadSavedCounties(): void {
    this.api.getSelectedCounties(this.grantId!).subscribe({
      next: (res) => {
        const data: any[] = res.temp || [];

        if (!data.length) return;

        // Reset
        this.multipleSelectedStates = [];
        this.multipleSelectedCounties = {};
        this.countiySubCountyMap = {};

        // Group by state
        data.forEach((item) => {
          const stateName = item.stateName;
          const countyName = item.countyName;
          const countyIndex = item.countyIndex;

          // stateIndex map
          this.stateIndexMap[stateName] = item.stateIndex;

          // countyIndex map — save ke liye chahiye
          this.countyIndexMap[`${countyName}||${stateName}`] = countyIndex;

          // multipleSelectedStates
          if (!this.multipleSelectedStates.includes(stateName)) {
            this.multipleSelectedStates.push(stateName);
          }

          // multipleSelectedCounties
          if (!this.multipleSelectedCounties[stateName]) {
            this.multipleSelectedCounties[stateName] = [];
          }
          this.multipleSelectedCounties[stateName].push(countyName);

          // countiySubCountyMap (for display)
          if (!this.countiySubCountyMap[stateName]) {
            this.countiySubCountyMap[stateName] = [];
          }
          if (!this.countiySubCountyMap[stateName].includes(countyName)) {
            this.countiySubCountyMap[stateName].push(countyName);
          }
        });

        // Dropdown selected set karo
        this.multipleStatesDropdown.selected = this.multipleStatesDropdown.data.filter((item) =>
          this.multipleSelectedStates.includes(item.item_text),
        );

        // Last active state set karo — last state ka subgrid open rahega
        const lastState = this.multipleSelectedStates.slice(-1)[0];
        if (lastState) {
          this.multipleActiveState = lastState;
          // Us state ke baaki counties bhi load karo (grid ke liye)
          this.loadCountiesForState(lastState);
        }

        // Mode multiple set karo
        this.grantMode = 'multiple';
      },
      error: (err) => {
        console.error('Load Counties Error:', err);
      },
    });
  }

  // ================= LOAD COUNTIES FOR STATE (GRID) =================

  loadCountiesForState(stateName: string): void {
    const stateId = this.stateIndexMap[stateName];
    if (!stateId) return;

    this.api.getCountiesByState(stateId).subscribe((res: GetCountiesResponse) => {
      const counties = res.usgeoCounties || [];

      // Full list set karo (grid ke liye)
      this.countiySubCountyMap[stateName] = counties.map((c: County) => c.countyName);

      // countyIndex map update karo
      counties.forEach((c: County) => {
        this.countyIndexMap[`${c.countyName}||${stateName}`] = c.countyIndex;
      });
    });
  }

  // ================= NAVIGATION =================

  goToFocusGroup() {
    this.tabChange.emit(4);
  }

  goToSeo() {
    this.tabChange.emit(6);
  }

  // ================= MODAL =================

  openPasteModal() {
    this.pasteText = '';
    this.showPasteModal = true;
  }

  closePasteModal() {
    this.showPasteModal = false;
  }

  // ================= MODE =================

  setGrantMode(mode: 'single' | 'multiple' | 'all') {
    this.grantMode = mode;
    // this.clearAllSelections();
  }

  // ================= SINGLE =================

  onSingleStateChange() {
    // const selected = this.countiesKeyDropDowns.states.selected;

    // if (!selected.length) {
    //   this.activeStatesForCounties = null;
    //   this.selectedState = [];
    //   return;
    // }

    // const stateObj: DropdownItem = selected[0];
    // const stateName = stateObj.item_text;

    // this.selectedState = [stateName];
    // this.activeStatesForCounties = stateName;

    // this.loadCountiesForState(stateName);
    // this.selectedSubCounties[stateName] = this.selectedSubCounties[stateName] || [];

    const selected = this.countiesKeyDropDowns.states.selected;
    if (!selected.length) return;

    const stateObj: DropdownItem = selected[0];
    const stateName = stateObj.item_text;

    // REPLACE mat karo — add karo
    if (!this.multipleSelectedStates.includes(stateName)) {
      this.multipleSelectedStates.push(stateName);
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

  // ================= MULTIPLE =================

  onMultipleStateChange() {
    const selected: DropdownItem[] = this.multipleStatesDropdown.selected;

    if (!selected.length) {
      this.multipleActiveState = null;
      return;
    }

    const lastSelected: DropdownItem = selected[selected.length - 1];
    const stateName = lastSelected.item_text;

    this.multipleSelectedStates = selected.map((i: DropdownItem) => i.item_text);
    this.multipleActiveState = stateName;

    // Counties load karo — grid ke liye
    this.loadCountiesForState(stateName);

    if (!this.multipleSelectedCounties[stateName]) {
      this.multipleSelectedCounties[stateName] = [];
    }
  }

  toggleMultipleCounty(state: string, county: string, checked: boolean) {
    if (!this.multipleSelectedCounties[state]) {
      this.multipleSelectedCounties[state] = [];
    }

    if (checked) {
      if (!this.multipleSelectedCounties[state].includes(county)) {
        this.multipleSelectedCounties[state].push(county);
      }
    } else {
      this.multipleSelectedCounties[state] = this.multipleSelectedCounties[state].filter(
        (c) => c !== county,
      );
    }

    if (this.multipleSelectedCounties[state].length === 0) {
      this.multipleSelectedStates = this.multipleSelectedStates.filter((s) => s !== state);
      delete this.multipleSelectedCounties[state];
      this.multipleActiveState = this.multipleSelectedStates.slice(-1)[0] || null;
    }
  }

  onMultipleToggleChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.multipleFullStateMode = checked;
    this.multipleSelectedStates.forEach((state) => {
      this.multipleSelectedCounties[state] = checked
        ? [...(this.countiySubCountyMap[state] || [])]
        : [];
    });
  }

  // ================= COMMON =================

  toggleCounty(state: string, county: string, checked: boolean) {
    if (!this.selectedSubCounties[state]) this.selectedSubCounties[state] = [];
    if (checked) {
      this.selectedSubCounties[state].push(county);
    } else {
      this.selectedSubCounties[state] = this.selectedSubCounties[state].filter((c) => c !== county);
    }
  }

  clearAllSelections() {
    this.selectedState = [];
    this.selectedSubCounties = {};
    this.multipleSelectedStates = [];
    this.multipleSelectedCounties = {};
    this.countiesKeyDropDowns.states.selected = [];
    this.multipleStatesDropdown.selected = [];
    this.multipleActiveState = null;
    this.activeStatesForCounties = null;
  }

  // ================= PASTE =================

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

  // ================= SINGLE HELPERS =================

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

  // ================= MULTIPLE HELPERS =================

  removeMultipleState(state: string) {
    this.multipleSelectedStates = this.multipleSelectedStates.filter((s) => s !== state);
    delete this.multipleSelectedCounties[state];
    if (this.multipleActiveState === state) {
      this.multipleActiveState = this.multipleSelectedStates.slice(-1)[0] || null;
    }
  }

  removeMultipleCounty(state: string, county: string) {
    this.multipleSelectedCounties[state] =
      this.multipleSelectedCounties[state]?.filter((c) => c !== county) || [];
  }

  isAllMultipleCountiesSelected(state: string): boolean {
    const all = this.countiySubCountyMap[state] || [];
    const selected = this.multipleSelectedCounties[state] || [];
    return all.length > 0 && all.length === selected.length;
  }

  toggleSelectAllMultiple(state: string, checked: boolean) {
    if (checked) {
      this.multipleSelectedCounties[state] = [...(this.countiySubCountyMap[state] || [])];
    } else {
      this.multipleSelectedCounties[state] = [];
      this.multipleSelectedStates = this.multipleSelectedStates.filter((s) => s !== state);
      delete this.multipleSelectedCounties[state];
      this.multipleStatesDropdown.selected = this.multipleStatesDropdown.selected.filter(
        (item: DropdownItem) => item.item_text !== state,
      );
      this.multipleActiveState = this.multipleSelectedStates.slice(-1)[0] || null;
    }
  }

  // ================= SAVE =================

  saveStatesAndCounties(): void {
    if (!this.grantId) return;

    const stateRows: any[] = [];

    const buildPayload = (state: string, counties: string[]) => {
      const stateIndex = this.stateIndexMap[state] ?? 0;
      counties.forEach((county) => {
        stateRows.push({
          countryIndex: this.countryIndex,
          grantIndex: this.grantId,
          recordIndex: 0,
          stateIndex: stateIndex,
          stateName: state,
        });
      });
    };

    if (this.grantMode === 'single') {
      const state = this.selectedState[0];
      if (state) buildPayload(state, this.selectedSubCounties[state] || []);
    }

    if (this.grantMode === 'multiple') {
      this.multipleSelectedStates.forEach((state) => {
        buildPayload(state, this.multipleSelectedCounties[state] || []);
      });
    }

    if (this.grantMode === 'all') {
      Object.keys(this.countiySubCountyMap).forEach((state) => {
        buildPayload(state, this.countiySubCountyMap[state] || []);
      });
    }

    // Duplicates remove — ek state ek baar
    const unique = stateRows.filter(
      (item, index, self) => index === self.findIndex((t) => t.stateIndex === item.stateIndex),
    );

    // ✅ Sahi payload structure
    const payload = {
      _USGrantStates: unique,
    };

    console.log('PAYLOAD:', payload);

    this.api.insertGrantStatesJSON(payload).subscribe({
      next: (res) => {
        this.successMessage = 'Saved successfully.';
        setTimeout(() => (this.successMessage = ''), 4000);
        if (this.multipleActiveState) {
          this.loadCountiesForState(this.multipleActiveState);
        }
      },
      error: (err) => {
        console.error('Save Error:', err);
        this.errorMessage = err?.error?.message || 'Save failed.';
        setTimeout(() => (this.errorMessage = ''), 5000);
      },
    });
  }
}
