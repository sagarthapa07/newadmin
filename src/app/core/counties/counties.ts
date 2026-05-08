import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
export class CountiesComponent implements OnInit {
  constructor(
    private router: Router,
    private api: Api,
  ) {}

  showPasteModal = false;
  pasteText = '';

  grantMode: 'single' | 'multiple' | 'all' = 'single';

  activeStatesForCounties: string | null = null;

  singleFullStateMode = false;
  multipleFullStateMode = false;

  selectedState: string[] = [];
  selectedSubCounties: Record<string, string[]> = {};

  multipleSelectedStates: string[] = [];
  multipleSelectedCounties: Record<string, string[]> = {};
  multipleActiveState: string | null = null;

  countiesKeyDropDowns: {
    states: {
      label: string;
      data: DropdownItem[];
      selected: DropdownItem[];
    };
  } = {
    states: {
      label: 'Select States',
      data: [],
      selected: [],
    },
  };

  multipleStatesDropdown: {
    data: DropdownItem[];
    selected: DropdownItem[];
  } = {
    data: [],
    selected: [],
  };

  readonly multiSelectSettings: IDropdownSettings = {
    singleSelection: false,
    idField: 'item_id',
    textField: 'item_text',
    itemsShowLimit: 2,
    allowSearchFilter: true,
    enableCheckAll: false,
  };

  countieSettings: IDropdownSettings = {
    singleSelection: true,
    idField: 'item_id',
    textField: 'item_text',
    allowSearchFilter: true,
  };

  //  STATIC MAP (MAIN LOGIC)
  countiySubCountyMap: Record<string, string[]> = {
    California: ['Los Angeles', 'San Diego', 'Orange'],
    Texas: ['Harris', 'Dallas', 'Tarrant'],
    Florida: ['Miami-Dade', 'Broward', 'Palm Beach'],
  };

  ngOnInit(): void {
    this.api.getAllStates().subscribe((res: GetStatesResponse) => {
      console.log('API RESPONSE:', res);

      const states = res.usStates || [];

      this.countiesKeyDropDowns.states.data = states.map((s: State) => ({
        item_id: s.stateIndex,
        item_text: s.stateName,
      }));

      this.multipleStatesDropdown.data = this.countiesKeyDropDowns.states.data;

      // Force refresh (important for dropdown)
      setTimeout(() => {
        this.countiesKeyDropDowns.states.data = [...this.countiesKeyDropDowns.states.data];
      });
    });
  }

  // ================= NAVIGATION =================
  goToFocusGroup() {
    this.router.navigate(['/focus-areas']);
  }

  goToSeo() {
    this.router.navigate(['/calendar-details']);
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

    this.clearAllSelections();

    if (mode === 'all') {
      const allStates = Object.keys(this.countiySubCountyMap);

      this.multipleSelectedStates = [...allStates];

      allStates.forEach((state) => {
        this.multipleSelectedCounties[state] = [...this.countiySubCountyMap[state]];
      });
    }
  }

  // ================= SINGLE =================
  onSingleStateChange() {
    const selected = this.countiesKeyDropDowns.states.selected;

    if (!selected.length) {
      this.activeStatesForCounties = null;
      this.selectedState = [];
      return;
    }

    const stateObj: DropdownItem = selected[0];
    const stateName = stateObj.item_text;

    this.selectedState = [stateName];
    this.activeStatesForCounties = stateName;

    this.api.getCountiesByState(stateObj.item_id).subscribe((res: GetCountiesResponse) => {
      console.log('COUNTIES API RESPONSE:', res);

      const counties = res.usgeoCounties || [];

      this.countiySubCountyMap[stateName] = counties.map((c: County) => c.countyName);

      // refresh selection
      this.selectedSubCounties[stateName] = [];
    });
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

    this.api.getCountiesByState(lastSelected.item_id).subscribe((res: GetCountiesResponse) => {
      const counties = res.usgeoCounties || [];

      this.countiySubCountyMap[stateName] = counties.map((c: County) => c.countyName);

      if (!this.multipleSelectedCounties[stateName]) {
        this.multipleSelectedCounties[stateName] = [];
      }
    });
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
    if (!this.selectedSubCounties[state]) {
      this.selectedSubCounties[state] = [];
    }

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

    if (this.activeStatesForCounties === state) {
      this.activeStatesForCounties = null;
    }
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

    // active state ko force mat badlo
    if (this.multipleActiveState === state && this.multipleSelectedStates.length === 0) {
      this.multipleActiveState = null;
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

  saveStatesAndCounties() {
    if (this.grantMode === 'single') {
      const state = this.selectedState[0];
      const counties = this.selectedSubCounties[state] || [];
      console.log('Single Mode:', { state, counties });
    }

    if (this.grantMode === 'multiple') {
      const result = this.multipleSelectedStates.map((state) => ({
        state,
        counties: this.multipleSelectedCounties[state] || [],
      }));
      console.log('Multiple Mode:', result);
    }

    if (this.grantMode === 'all') {
      console.log('All States Selected');
    }
  }
}
