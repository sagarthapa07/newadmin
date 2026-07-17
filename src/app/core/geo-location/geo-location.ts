import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../Services/api';
import { SimpleChanges } from '@angular/core';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import {
  DropdownItem,
  SaveCitiesPayload,
  SaveInsularPayload,
  SaveStatesPayload,
  SaveTownshipPayload,
} from '../../datatype';
import { Input } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

type GeoKey = 'cities' | 'township' | 'insular' | 'states';

@Component({
  selector: 'app-geo-location',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertMessage],
  templateUrl: './geo-location.html',
  styleUrl: './geo-location.scss',
})
export class GeoLocationComponent implements OnInit {
  @Input() grantId?: number;
  @Output() tabChange = new EventEmitter<number>();
  showPasteModal = false;
  pasteText = '';
  successMessage = '';
  errorMessage = '';

  constructor(
    private router: Router,
    private api: Api,
    private cd: ChangeDetectorRef,
  ) {}

  showGeoModal: boolean = false;
  geoModalType: 'cities' | 'township' | null = null;

  newGeoName: string = '';

  shouldShowAdd(key: string): boolean {
    return key === 'township' || key === 'cities';
  }

  geoDropdowns: {
    township: {
      label: string;
      data: DropdownItem[];
      selected: DropdownItem[];
    };
    insular: {
      label: string;
      data: DropdownItem[];
      selected: DropdownItem[];
    };
    cities: {
      label: string;
      data: DropdownItem[];
      selected: DropdownItem[];
    };
    states: {
      label: string;
      data: DropdownItem[];
      selected: DropdownItem[];
    };
  } = {
    township: {
      label: 'Township',
      data: [],
      selected: [],
    },
    insular: {
      label: 'Insular Areas',
      data: [],
      selected: [],
    },
    cities: {
      label: 'Cities',
      data: [],
      selected: [],
    },
    states: {
      label: 'States',
      data: [],
      selected: [],
    },
  };

  geoKeys: GeoKey[] = [];

  // ---- search text per card ----
  searchText: Record<GeoKey, string> = {
    township: '',
    insular: '',
    cities: '',
    states: '',
  };

  // ---- selected-summary panel state ----
  summaryCollapsed: Record<GeoKey, boolean> = {
    township: false,
    insular: false,
    cities: false,
    states: false,
  };
  summaryShowAll: Record<GeoKey, boolean> = {
    township: false,
    insular: false,
    cities: false,
    states: false,
  };
  summaryPreviewCount = 5;

  ngOnInit(): void {
    this.geoKeys = Object.keys(this.geoDropdowns) as GeoKey[];
    this.loadGeoData(() => {
      if (this.grantId) {
        this.loadSelectedGeoData(this.grantId);
      }
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['grantId']?.currentValue) {
      this.loadSelectedGeoData(this.grantId!);
    }
  }

  loadGeoData(callback?: () => void) {
    forkJoin({
      cities: this.api.getCities(),
      states: this.api.getStates(),
      township: this.api.getTownShips(),
      insular: this.api.getInsularAreas(),
    }).subscribe((res) => {
      this.geoDropdowns.cities.data = res.cities.usCities.map((c) => ({
        item_id: c.cityIndex,
        item_text: c.cityName.trim(),
      }));

      this.geoDropdowns.states.data = res.states.usStates.map((s) => ({
        item_id: s.stateIndex,
        item_text: s.stateName.trim(),
      }));

      this.geoDropdowns.township.data = res.township.usTownships.map((t) => ({
        item_id: t.townshipIndex,
        item_text: t.townshipName.trim(),
      }));

      this.geoDropdowns.insular.data = res.insular.usInsularAreas.map((i) => ({
        item_id: i.areaIndex,
        item_text: i.areaName.trim(),
      }));

      if (callback) callback();
    });
  }

  loadSelectedGeoData(grantId: number) {
    // Cities
    this.api.getSelectedCities(grantId).subscribe((res: any) => {
      this.geoDropdowns.cities.selected =
        res.tempUSGrantCities?.map((c: any) => ({
          item_id: c.cityIndex,
          item_text: c.cityName.trim(),
        })) || [];
    });

    // States
    this.api.getSelectedStates(grantId).subscribe((res: any) => {
      this.geoDropdowns.states.selected =
        res.tempUSGrantStates?.map((s: any) => ({
          item_id: s.stateIndex,
          item_text: s.stateName.trim(),
        })) || [];
    });

    // Township
    this.api.getSelectedTownships(grantId).subscribe((res: any) => {
      this.geoDropdowns.township.selected =
        res.tempData?.map((t: any) => ({
          item_id: t.townshipIndex,
          item_text: t.townshipName.trim(),
        })) || [];
    });

    // Insular
    this.api.getSelectedInsular(grantId).subscribe((res: any) => {
      this.geoDropdowns.insular.selected =
        res.tempData?.map((i: any) => ({
          item_id: i.areaIndex,
          item_text: i.areaName.trim(),
        })) || [];
    });

    this.cd.detectChanges();
  }

  goToFocusAreas() {
    this.tabChange.emit(3);
  }

  goToCalenderArea() {
    this.tabChange.emit(1);
  }
  closeGeoModal() {
    this.showGeoModal = false;
    this.geoModalType = null;
    this.newGeoName = '';
  }
  openGeoModal(type: GeoKey) {
    if (type !== 'cities' && type !== 'township') {
      return;
    }
    this.geoModalType = type as 'cities' | 'township';
    this.showGeoModal = true;
  }
  saveGeoItem() {
    if (!this.newGeoName.trim() || !this.geoModalType) {
      return;
    }

    const trimmedName = this.newGeoName.trim();

    // Duplicate Check (case-insensitive)
    const exists = this.geoDropdowns[this.geoModalType].data.some(
      (item: DropdownItem) => item.item_text.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (exists) {
      return;
    }

    const newItem = {
      item_id: Date.now(),
      item_text: trimmedName,
    };

    this.geoDropdowns[this.geoModalType].data.push(newItem);
    this.geoDropdowns[this.geoModalType].selected.push(newItem);
    console.log(`New ${this.geoModalType} added:`, newItem);
    this.closeGeoModal();
  }
  saveGeo(type: GeoKey) {
    const selectedItems = this.geoDropdowns[type].selected;
    if (!selectedItems || selectedItems.length === 0) {
      console.log(`${this.geoDropdowns[type].label} : No selection`);
      return;
    }
    // sirf names nikaal rahe hain
    const names = selectedItems.map((item: DropdownItem) => item.item_text);
    console.log(`${this.geoDropdowns[type].label} : ${names.join(', ')}`);
  }
  removeGeoItem(type: GeoKey, item: DropdownItem) {
    this.geoDropdowns[type].selected = this.geoDropdowns[type].selected.filter(
      (selectedItem: DropdownItem) => selectedItem.item_id !== item.item_id,
    );
  }

  // ---------------------------------------------------------------------
  // SEARCH + SELECT ALL (per card)
  // ---------------------------------------------------------------------
  filteredItems(key: GeoKey): DropdownItem[] {
    const term = (this.searchText[key] || '').toLowerCase().trim();
    const data = this.geoDropdowns[key].data || [];
    if (!term) return data;
    return data.filter((item) => item.item_text.toLowerCase().includes(term));
  }

  isItemSelected(key: GeoKey, item: DropdownItem): boolean {
    return this.geoDropdowns[key].selected.some((s) => s.item_id === item.item_id);
  }

  toggleGeoItem(key: GeoKey, item: DropdownItem, checked: boolean) {
    if (checked) {
      if (!this.isItemSelected(key, item)) {
        this.geoDropdowns[key].selected = [...this.geoDropdowns[key].selected, item];
      }
    } else {
      this.geoDropdowns[key].selected = this.geoDropdowns[key].selected.filter(
        (s) => s.item_id !== item.item_id,
      );
    }
  }

  isAllFilteredSelected(key: GeoKey): boolean {
    const items = this.filteredItems(key);
    if (!items.length) return false;
    return items.every((item) => this.isItemSelected(key, item));
  }

  toggleSelectAll(key: GeoKey, checked: boolean) {
    const items = this.filteredItems(key);
    if (checked) {
      const existingIds = new Set(this.geoDropdowns[key].selected.map((s) => s.item_id));
      const toAdd = items.filter((item) => !existingIds.has(item.item_id));
      this.geoDropdowns[key].selected = [...this.geoDropdowns[key].selected, ...toAdd];
    } else {
      const idsToRemove = new Set(items.map((item) => item.item_id));
      this.geoDropdowns[key].selected = this.geoDropdowns[key].selected.filter(
        (s) => !idsToRemove.has(s.item_id),
      );
    }
  }

  // ---------------------------------------------------------------------
  // SELECTED SUMMARY PANEL
  // ---------------------------------------------------------------------
  totalSelectedCount(): number {
    return (Object.keys(this.geoDropdowns) as GeoKey[]).reduce(
      (sum, key) => sum + this.geoDropdowns[key].selected.length,
      0,
    );
  }

  toggleSummaryCollapse(key: GeoKey) {
    this.summaryCollapsed[key] = !this.summaryCollapsed[key];
  }

  toggleSummaryShowAll(key: GeoKey) {
    this.summaryShowAll[key] = !this.summaryShowAll[key];
  }

  clearGeoCategory(key: GeoKey) {
    this.geoDropdowns[key].selected = [];
    this.summaryShowAll[key] = false;
  }

  visibleSummaryChips(key: GeoKey): DropdownItem[] {
    const selected = this.geoDropdowns[key].selected;
    if (this.summaryShowAll[key]) return selected;
    return selected.slice(0, this.summaryPreviewCount);
  }

  openPasteModal() {
    this.pasteText = '';
    this.showPasteModal = true;
  }

  closePasteModal() {
    this.showPasteModal = false;
  }

  // ---------------------------------------------------------------------
  // AUTO SELECTION FROM PASTED TEXT
  // Scans the pasted text and auto-checks any township / insular area /
  // city / state whose name appears in it (case-insensitive match).
  // ---------------------------------------------------------------------
  generateFromText() {
    if (!this.pasteText.trim()) {
      return;
    }
    const text = this.pasteText.toLowerCase();

    (Object.keys(this.geoDropdowns) as GeoKey[]).forEach((key) => {
      const data = this.geoDropdowns[key].data;
      const newlySelected = [...this.geoDropdowns[key].selected];

      data.forEach((item) => {
        const name = item.item_text.toLowerCase();
        if (name.length < 3) return; // skip too-short names to avoid false matches

        const alreadyIn = newlySelected.some((s) => s.item_id === item.item_id);
        if (!alreadyIn && text.includes(name)) {
          newlySelected.push(item);
        }
      });

      this.geoDropdowns[key].selected = newlySelected;
    });

    this.cd.detectChanges();
    this.showPasteModal = false;
  }

  clearAll() {
    (Object.keys(this.geoDropdowns) as (keyof typeof this.geoDropdowns)[]).forEach((key) => {
      this.geoDropdowns[key].selected = [];
    });
  }

  saveAll(): void {
    console.log('CURRENT GRANT ID', this.grantId);
    console.log('SELECTED STATES', this.geoDropdowns.states.selected);
    console.log('SELECTED CITIES', this.geoDropdowns.cities.selected);
    if (!this.grantId) {
      console.log('NO GRANT ID FOUND');

      return;
    }

    const grantId = this.grantId;

    // Cities
    const citiesPayload: SaveCitiesPayload = {
      grantIndex: String(grantId),
      grantCities: this.geoDropdowns.cities.selected.map((item) => ({
        cityIndex: item.item_id,
        cityName: item.item_text,
      })),
    };
    // Insular
    const insularPayload: SaveInsularPayload = {
      grantIndex: grantId,
      grantInsularAreas: this.geoDropdowns.insular.selected.map((item) => ({
        areaIndex: item.item_id,
        areaName: item.item_text,
      })),
    };

    // Township
    const townshipPayload: SaveTownshipPayload = {
      grantIndex: grantId,
      grantTownships: this.geoDropdowns.township.selected.map((item) => ({
        townshipIndex: item.item_id,
        townshipName: item.item_text,
      })),
    };

    // States
    const statesPayload: SaveStatesPayload = {
      grantIndex: grantId,
      usGrantStates: this.geoDropdowns.states.selected.map((item) => ({
        countryIndex: 230,
        grantIndex: grantId,
        recordIndex: 0,
        stateIndex: item.item_id,
        stateName: item.item_text,
      })),
      userEmail: 'ritu@fundsforngos.org',
      userIndex: 5,
    };

    console.log('Cities Payload:', citiesPayload);
    console.log('Insular Payload:', insularPayload);
    console.log('Township Payload:', townshipPayload);
    console.log('States Payload:', statesPayload);

    forkJoin({
      cities: this.api.insertGrantCities(citiesPayload),
      insular: this.api.insertGrantInsular(insularPayload),
      township: this.api.insertGrantTownships(townshipPayload),
      states: this.api.insertGrantStates(statesPayload),
    }).subscribe({
      next: (response) => {
        this.successMessage = 'Geo Location data saved successfully';
        this.cd.detectChanges();
        setTimeout(() => {
          this.successMessage = '';
          this.cd.detectChanges();
        }, 4000);
      },

      error: (error) => {
        console.error('Save Error:', error);
        this.errorMessage = error?.error?.message || 'Failed to save Geo Location data';
        this.cd.detectChanges();
        setTimeout(() => {
          this.errorMessage = '';
          this.cd.detectChanges();
        }, 5000);
      },
    });
  }
}