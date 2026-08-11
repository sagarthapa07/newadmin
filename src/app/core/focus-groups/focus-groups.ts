import { Component, HostListener, ElementRef, ViewChild, Inject, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IDropdownSettings, NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { PLATFORM_ID } from '@angular/core';
import { Api } from '../Services/api';
import { forkJoin } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

import {
  Beneficiary,
  DropdownItem,
  Entity,
  GetBeneficiariesResponse,
  GetSelectedBeneficiariesResponse,
  GetSelectedSubEntitiesResponse,
  InsertBeneficiaryRow,
  InsertSubEntityRow,
  SelectedBeneficiary,
  SelectedSubEntity,
  SubEntity,
  FocusGroupState,
} from '../../datatype';
import { Input } from '@angular/core';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';

@Component({
  selector: 'app-focus-groups',
  standalone: true,
  imports: [CommonModule, FormsModule, NgMultiSelectDropDownModule, AlertMessage],
  templateUrl: './focus-groups.html',
  styleUrls: ['./focus-groups.scss'],
})
export class FocusGroupsComponent implements OnChanges {
  objectKeys = Object.keys;
  @ViewChild('editorOutlineElement')
  private editorOutline!: ElementRef<HTMLDivElement>;
  @ViewChild('editorWordCountElement')
  private editorWordCount!: ElementRef<HTMLDivElement>;
  @ViewChild('issueContainer') issueContainer!: ElementRef;
  @Input() grantId?: number;
  @Output() tabChange = new EventEmitter<number>();

  public isBrowser = false;
  activeBtn: string = 'calendar';
  opportunityForm: FormGroup;
  isSaving = false;
  showPasteModal = false;
  pasteText = '';
  pasteLoading = false;

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent) {
    if (!this.issueContainer) return;
  }

  originalState: FocusGroupState = {
    beneficiaries: [],
    entities: {},
  };

  allSubEntities: Record<number, SubEntity[]> = {};
  subEntitiesList: SubEntity[] = [];
  hoverTimer: ReturnType<typeof setTimeout> | null = null;
  issueMap = new Map<number, string>();
  selectedMap = new Map<number, number[]>();
  activeEntityForSubGrid: string | null = null;
  isLoading = true;
  previousEntity: string | null = null;

  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private api: Api,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.opportunityForm = this.fb.group({
      title: [''],
      linkUrl: [''],
      postDate: [''],
      deadlineDate: [''],
      isOngoing: [false],
      shortInfo: [''],
      donorType: ['US Donors'],
      donorAgency: [''],
      donorAgencyOther: [''],
      grantType: [''],
      grantDuration: [''],
      grantSize: [''],
      status: ['Draft'],
      letterText: [''],
    });
  }

  showGeoModal: boolean = false;
  geoModalType: 'cities' | 'township' | null = null;
  newGeoName: string = '';

  shouldShowAdd(key: string): boolean {
    return key === 'township' || key === 'cities';
  }

  saveForm() {
    console.log(this.opportunityForm.value);
  }

  onSave() {
    console.log('Save clicked', this.opportunityForm.value);
  }

  gotoPreview() {
    this.router.navigate(['/preview']);
  }

  menuItems = [
    'Calender Details',
    'Geo Location',
    'Focus Areas',
    'Focus Groups',
    'Counties',
    'Seo/Social Media',
  ];

  activeItem = 'Calender Details';

  setActive(item: string) {
    this.activeItem = item;
  }

  readonly multiSelectSettings: IDropdownSettings = {
    singleSelection: false,
    idField: 'item_id',
    textField: 'item_text',
    selectAllText: 'Select All',
    unSelectAllText: 'UnSelect All',
    itemsShowLimit: 2,
    allowSearchFilter: true,
    enableCheckAll: false,
  };

  // Use for Focus Group
  readonly entitySettings: IDropdownSettings = {
    singleSelection: false,
    idField: 'item_id',
    textField: 'item_text',
    allowSearchFilter: true,
    closeDropDownOnSelection: false,
    enableCheckAll: false,
    itemsShowLimit: 3,
  };

  savedEntities: string[] = [];
  savedBeneficiaries: string[] = [];

  focusGroupKeyDropdowns: {
    beneficiaries: {
      label: string;
      data: DropdownItem[];
      selected: DropdownItem[];
    };
    entities: {
      label: string;
      data: DropdownItem[];
      selected: DropdownItem[];
    };
  } = {
    beneficiaries: {
      label: 'Beneficiaries',
      data: [],
      selected: [],
    },
    entities: {
      label: 'Entities',
      data: [],
      selected: [],
    },
  };

  loadEntities() {
    this.api.getEntities().subscribe({
      next: (res) => {
        const mapped = res.usEntities.map((item: Entity) => ({
          item_id: item.entIndex,
          item_text: item.entName,
        }));

        this.focusGroupKeyDropdowns.entities.data = mapped;
        if (this.grantId) {
          this.loadSelectedFocusGroups(this.grantId);
        }
      },
    });
  }

  handleSelectedBeneficiaries(res: GetSelectedBeneficiariesResponse) {
    const data = res.tempUSGrantBeneficiaries;
    this.savedBeneficiaries = data.map((item) => item.beneficiaryName);
    this.focusGroupKeyDropdowns.beneficiaries.selected =
      this.focusGroupKeyDropdowns.beneficiaries.data.filter((item) =>
        this.savedBeneficiaries
          .map((x) => x.toLowerCase().trim())
          .includes(item.item_text.toLowerCase().trim()),
      );

    this.originalState.beneficiaries = [...this.savedBeneficiaries];
  }

  handleSelectedEntities(res: GetSelectedSubEntitiesResponse) {
    const data = res.tempUSGrantSubEnt;

    this.savedEntities = [];
    this.selectedSubEntities = {};

    data.forEach((item) => {
      const entity = item.entityName;
      const sub = item.subEntName;

      if (!this.savedEntities.includes(entity)) {
        this.savedEntities.push(entity);
      }

      if (!this.selectedSubEntities[entity]) {
        this.selectedSubEntities[entity] = [];
      }

      if (!this.selectedSubEntities[entity].includes(sub)) {
        this.selectedSubEntities[entity].push(sub);
      }
    });
    this.focusGroupKeyDropdowns.entities.selected =
      this.focusGroupKeyDropdowns.entities.data.filter((item) =>
        this.savedEntities
          .map((x) => x.toLowerCase().trim())
          .includes(item.item_text.toLowerCase().trim()),
      );
    this.originalState.entities = JSON.parse(JSON.stringify(this.selectedSubEntities));
  }

  ngOnChanges() {
    if (this.grantId) {
      this.loadInitialData();
    }
  }

  loadInitialData() {
    forkJoin({
      beneficiaries: this.api.getBeneficiaries(),
      entities: this.api.getEntities(),
      selectedSubs: this.api.getSelectedFocusGroups(this.grantId!),
      selectedBenef: this.api.getSelectedBeneficiaries(this.grantId!),
    }).subscribe(({ beneficiaries, entities, selectedSubs, selectedBenef }) => {
      this.focusGroupKeyDropdowns.beneficiaries.data = beneficiaries.tempUSBeneficiaries.map(
        (b) => ({
          item_id: b.beneficiaryIndex,
          item_text: b.beneficiaryName,
        }),
      );

      this.focusGroupKeyDropdowns.entities.data = entities.usEntities.map((e) => ({
        item_id: e.entIndex,
        item_text: e.entName,
      }));

      this.handleSelectedEntities(selectedSubs);
      this.handleSelectedBeneficiaries(selectedBenef);
    });
  }
  loadSelectedFocusGroups(grantId: number) {
    this.api.getSelectedFocusGroups(grantId).subscribe({
      next: (res: GetSelectedSubEntitiesResponse) => {
        const data = res.tempUSGrantSubEnt;

        this.savedEntities = [];
        this.selectedSubEntities = {};

        data.forEach((item: SelectedSubEntity) => {
          const entity = item.entityName;
          const sub = item.subEntName;

          if (!this.savedEntities.includes(entity)) {
            this.savedEntities.push(entity);
          }

          if (!this.selectedSubEntities[entity]) {
            this.selectedSubEntities[entity] = [];
          }

          if (!this.selectedSubEntities[entity].includes(sub)) {
            this.selectedSubEntities[entity].push(sub);
          }
        });

        this.focusGroupKeyDropdowns.entities.selected =
          this.focusGroupKeyDropdowns.entities.data.filter((item) =>
            this.savedEntities
              .map((x) => x.toLowerCase().trim())
              .includes(item.item_text.toLowerCase().trim()),
          );
        this.originalState.entities = JSON.parse(JSON.stringify(this.selectedSubEntities));
      },
    });
  }

  loadSelectedBeneficiaries(grantId: number) {
    this.api.getSelectedBeneficiaries(grantId).subscribe({
      next: (res: GetSelectedBeneficiariesResponse) => {
        const data = res.tempUSGrantBeneficiaries;
        this.savedBeneficiaries = data.map((item: SelectedBeneficiary) => item.beneficiaryName);
        this.focusGroupKeyDropdowns.beneficiaries.selected =
          this.focusGroupKeyDropdowns.beneficiaries.data.filter((item) =>
            this.savedBeneficiaries
              .map((x) => x.toLowerCase().trim())
              .includes(item.item_text.toLowerCase().trim()),
          );
        this.originalState.beneficiaries = [...this.savedBeneficiaries];
      },
    });
  }

  loadBeneficiaries() {
    this.api.getBeneficiaries().subscribe({
      next: (res: GetBeneficiariesResponse) => {
        const mapped = res.tempUSBeneficiaries.map((item: Beneficiary) => ({
          item_id: item.beneficiaryIndex,
          item_text: item.beneficiaryName,
        }));
        this.focusGroupKeyDropdowns.beneficiaries.data = mapped;
        if (this.grantId) {
          this.loadSelectedBeneficiaries(this.grantId);
        }
      },
    });
  }

  goToFocusGroup() {
    this.tabChange.emit(3);
  }

  goToCounties() {
    this.tabChange.emit(5);
  }

  entitySubEntityMap: Record<string, string[]> = {
    Organizations: [
      'Arts and Culture Organization',
      'Community Foundation',
      'For-Profit Organisation',
      'Hispanic Organizations',
      'Hotels and Restaurants',
      'Libraries',
      "Media or Journalists' Organization",
      'Municipalities',
      'Neighborhood Groups',
      'Nonprofits with 501(c)(11)',
      'Nonprofits with 501(c)(19)',
      'Schools',
      'Tribal Government',
      'Youth Organizations',
    ],
    Individuals: [
      'Academicians',
      'Faculty Members',
      'Filmmakers/Directors',
      'Hispanic',
      'Immigrants',
      'Institutions',
    ],
    Centres: ['Centres'],
    Businesses: ['Business'],
  };
  selectedSubEntities: Record<string, string[]> = {};

  removeBeneficiary(name: string) {
    this.savedBeneficiaries = this.savedBeneficiaries.filter((b) => b !== name);
    this.focusGroupKeyDropdowns.beneficiaries.selected =
      this.focusGroupKeyDropdowns.beneficiaries.selected.filter(
        (item: DropdownItem) => item.item_text !== name,
      );
  }

  onEntityChange() {
    const selected = this.focusGroupKeyDropdowns.entities.selected;
    if (!selected.length) {
      this.activeEntityForSubGrid = null;
      this.subEntitiesList = [];
      return;
    }

    const currentEntity = selected[selected.length - 1];
    const currentEntityName = currentEntity.item_text;
    if (this.previousEntity) {
      const previousSubEntities = this.selectedSubEntities[this.previousEntity] || [];
      if (previousSubEntities.length === 0) {
        this.focusGroupKeyDropdowns.entities.selected =
          this.focusGroupKeyDropdowns.entities.selected.filter(
            (e) => e.item_text !== this.previousEntity,
          );
        delete this.selectedSubEntities[this.previousEntity];
      }
    }
    this.previousEntity = currentEntityName;
    this.activeEntityForSubGrid = currentEntityName;
    const entId = currentEntity.item_id;
    if (this.allSubEntities[entId]) {
      this.subEntitiesList = this.allSubEntities[entId];
    } else {
      this.api.getSubEntities(entId).subscribe((res) => {
        this.subEntitiesList = res.subEntities || [];

        this.allSubEntities[entId] = res.subEntities || [];
      });
    }
  }

  toggleSubEntity(entity: string, sub: string, checked: boolean) {
    if (!this.selectedSubEntities[entity]) {
      this.selectedSubEntities[entity] = [];
    }
    if (checked) {
      if (!this.selectedSubEntities[entity].includes(sub)) {
        this.selectedSubEntities[entity].push(sub);
      }
      const entityObj = this.focusGroupKeyDropdowns.entities.data.find(
        (e) => e.item_text === entity,
      );

      const exists = this.focusGroupKeyDropdowns.entities.selected.find(
        (e) => e.item_text === entity,
      );

      if (entityObj && !exists) {
        this.focusGroupKeyDropdowns.entities.selected = [
          ...this.focusGroupKeyDropdowns.entities.selected,
          entityObj,
        ];
      }
    } else {
      this.selectedSubEntities[entity] = this.selectedSubEntities[entity].filter((s) => s !== sub);
      if (this.selectedSubEntities[entity].length === 0) {
        delete this.selectedSubEntities[entity];
        this.focusGroupKeyDropdowns.entities.selected =
          this.focusGroupKeyDropdowns.entities.selected.filter((item) => item.item_text !== entity);
      }
    }
  }
  syncEntityDropdown(entityName: string) {
    const entityObj = this.focusGroupKeyDropdowns.entities.data.find(
      (e) => e.item_text === entityName,
    );
    if (!entityObj) return;
    const hasSubEntities = this.selectedSubEntities[entityName]?.length > 0;
    const alreadySelected = this.focusGroupKeyDropdowns.entities.selected.find(
      (e) => e.item_text === entityName,
    );
    if (hasSubEntities && !alreadySelected) {
      this.focusGroupKeyDropdowns.entities.selected = [
        ...this.focusGroupKeyDropdowns.entities.selected,
        entityObj,
      ];
    }
  }
  removeSubEntity(entity: string, sub: string) {
    this.selectedSubEntities[entity] = this.selectedSubEntities[entity].filter((s) => s !== sub);

    if (this.selectedSubEntities[entity].length === 0) {
      delete this.selectedSubEntities[entity];
      this.syncEntityDropdown(entity);
    }
  }

  saveFocusGroup(type: string) {
    const selected: DropdownItem[] = this.focusGroupKeyDropdowns.entities.selected;

    if (!selected || selected.length === 0) {
      return;
    }
    if (type === 'beneficiaries') {
      this.savedBeneficiaries = selected.map((item: DropdownItem) => item.item_text);
    }

    if (type === 'entities') {
      const entityName = selected[0].item_text;
      if (!this.savedEntities.includes(entityName)) {
        this.savedEntities.push(entityName);
      }
    }
  }

  removeEntity(entityName: string) {
    delete this.selectedSubEntities[entityName];
    this.focusGroupKeyDropdowns.entities.selected =
      this.focusGroupKeyDropdowns.entities.selected.filter((item) => item.item_text !== entityName);
  }
  onBeneficiaryChange() {
    const selected = this.focusGroupKeyDropdowns.beneficiaries.selected;
    this.savedBeneficiaries = selected.map((item: DropdownItem) => item.item_text);
  }

  saveAllFocusGroup() {
    if (this.isSaving) return;
    this.successMessage = '';
    this.errorMessage = '';
    const subEntityPayload = this.getSubEntitiesPayload();
    const beneficiariesPayload = this.getBeneficiariesPayload();
    console.log('SAVE START');
    this.isSaving = true;
    // FIRST API
    this.api.insertSubEntities(subEntityPayload).subscribe({
      next: (subRes) => {
        // SECOND API
        this.api.insertBeneficiaries(beneficiariesPayload).subscribe({
          next: (beneficiaryRes) => {
            this.isSaving = false;
            // SUCCESS MESSAGE
            this.successMessage = 'Your Entities and Beneficiaries have been saved successfully.';
            // update original state
            this.cd.detectChanges();
            this.originalState.entities = JSON.parse(JSON.stringify(this.selectedSubEntities));
            this.originalState.beneficiaries = [...this.savedBeneficiaries];

            setTimeout(() => {
              this.successMessage = '';
              this.cd.detectChanges();
            }, 4000);
          },

          error: (err) => {
            this.isSaving = false;
            this.errorMessage = err?.error?.message || 'Beneficiary save failed';
            this.cd.detectChanges();
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          },
        });
      },

      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err?.error?.message || 'Sub Entity save failed';
        this.cd.detectChanges();
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      },
    });
  }
  getSubEntitiesPayload() {
    const rows: InsertSubEntityRow[] = [];

    Object.keys(this.selectedSubEntities).forEach((entityName) => {
      const entityObj = this.focusGroupKeyDropdowns.entities.data.find(
        (e) => e.item_text === entityName,
      );

      if (!entityObj) return;
      const entId = entityObj.item_id;
      const subList = this.selectedSubEntities[entityName];
      subList.forEach((subName) => {
        const subObj = this.allSubEntities[entId]?.find((s) => s.subEntName === subName);

        rows.push({
          entIndex: entId,
          entitiyName: entityName,
          subEntIndex: subObj?.subEntIndex ?? 0,
          subEntName: subName,
        });
      });
    });

    return {
      grantIndex: String(this.grantId ?? ''),
      grantSubEntities: rows,
    };
  }

  getBeneficiariesPayload() {
    const rows: InsertBeneficiaryRow[] = this.focusGroupKeyDropdowns.beneficiaries.selected.map(
      (item) => ({
        beneficiaryIndex: item.item_id,
        beneficiaryName: item.item_text,
      }),
    );

    return {
      grantIndex: String(this.grantId),
      grantBeneficiaries: rows,
    };
  }
  clearFocusGroup() {
    this.selectedSubEntities = {};
    this.savedEntities = [];
    this.savedBeneficiaries = [];
    this.focusGroupKeyDropdowns.entities.selected = [];
    this.focusGroupKeyDropdowns.beneficiaries.selected = [];
  }

  saveSubEntitiesToApi() {
    const rows: InsertSubEntityRow[] = [];
    Object.keys(this.selectedSubEntities).forEach((entityName) => {
      const entityObj = this.focusGroupKeyDropdowns.entities.data.find(
        (e) => e.item_text === entityName,
      );
      if (!entityObj) return;
      const entId = entityObj.item_id;
      const subList = this.selectedSubEntities[entityName];
      subList.forEach((subName) => {
        const subObj = this.allSubEntities[entId]?.find((s) => s.subEntName === subName);
        rows.push({
          entIndex: entId,
          entitiyName: entityName,
          subEntIndex: subObj?.subEntIndex ?? 0,
          subEntName: subName,
        });
      });
    });
    const payload = {
      grantIndex: String(this.grantId ?? ''),
      grantSubEntities: rows,
    };
    this.api.insertSubEntities(payload).subscribe({
      next: (res) => console.log(' SubEntities Saved', res),
      error: (err) => console.log(' Error', err),
    });
  }

  saveBeneficiariesToApi() {
    const rows: InsertBeneficiaryRow[] = this.focusGroupKeyDropdowns.beneficiaries.selected.map(
      (item) => ({
        beneficiaryIndex: item.item_id,
        beneficiaryName: item.item_text,
      }),
    );
    const payload = {
      grantIndex: String(this.grantId),
      grantBeneficiaries: rows,
    };
    this.api.insertBeneficiaries(payload).subscribe({
      next: (res) => console.log('Saved', res),
    });
  }

  normalize(obj: any) {
    return JSON.stringify(
      Object.keys(obj)
        .sort()
        .reduce((res, key) => {
          res[key] = [...obj[key]].sort();
          return res;
        }, {} as any),
    );
  }

  hasChanges(): boolean {
    const currentEntities = this.normalize(this.selectedSubEntities);
    const originalEntities = this.normalize(this.originalState.entities);
    const currentBeneficiaries = JSON.stringify([...this.savedBeneficiaries].sort());
    const originalBeneficiaries = JSON.stringify([...this.originalState.beneficiaries].sort());
    return currentEntities !== originalEntities || currentBeneficiaries !== originalBeneficiaries;
  }

  onEntityDeSelect(item: any) {
    const entityName = item.item_text;
    const subEntities = this.selectedSubEntities[entityName] || [];
    if (subEntities.length > 0) {
      const originalEntity = this.focusGroupKeyDropdowns.entities.data.find(
        (e) => e.item_id === item.item_id,
      );

      if (!originalEntity) return;
      this.focusGroupKeyDropdowns.entities.selected = [
        ...this.focusGroupKeyDropdowns.entities.selected.filter((e) => e.item_id !== item.item_id),
        originalEntity,
      ];
      this.activeEntityForSubGrid = entityName;
      if (this.allSubEntities[item.item_id]) {
        this.subEntitiesList = [...this.allSubEntities[item.item_id]];
      } else {
        this.api.getSubEntities(item.item_id).subscribe((res) => {
          this.subEntitiesList = res.subEntities || [];
          this.allSubEntities[item.item_id] = res.subEntities || [];
        });
      }
      return;
    }
    delete this.selectedSubEntities[entityName];
  }

  openPasteModal() {
    this.pasteText = '';
    this.showPasteModal = true;
    this.preloadAllSubEntities();
  }

  closePasteModal() {
    this.showPasteModal = false;
  }
  private preloadAllSubEntities(): void {
    const allEntities = this.focusGroupKeyDropdowns.entities.data;
    if (!allEntities.length) return;

    // Jinki sub-entities pehle se cache nahi hain, unhi ke liye API call karo
    const pending = allEntities.filter((e) => !this.allSubEntities[e.item_id]);
    if (!pending.length) return;

    const requests = pending.map((e) => this.api.getSubEntities(e.item_id));

    forkJoin(requests).subscribe({
      next: (results) => {
        pending.forEach((entity, idx) => {
          this.allSubEntities[entity.item_id] = results[idx]?.subEntities || [];
        });
      },
      error: (err) => {
        console.error('Preload sub entities failed', err);
      },
    });
  }

  private isTextMatching(text: string, name: string): boolean {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return false;
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(text);
  }

  generateFromText(): void {
    if (!this.pasteText.trim()) {
      return;
    }

    const text = this.pasteText.toLowerCase();

    // ---- Match Beneficiaries (whole word) ----
    const matchedBeneficiaries = this.focusGroupKeyDropdowns.beneficiaries.data.filter((b) =>
      this.isTextMatching(text, b.item_text),
    );

    if (matchedBeneficiaries.length) {
      const existingIds = new Set(
        this.focusGroupKeyDropdowns.beneficiaries.selected.map((x) => x.item_id),
      );
      const toAdd = matchedBeneficiaries.filter((b) => !existingIds.has(b.item_id));
      this.focusGroupKeyDropdowns.beneficiaries.selected = [
        ...this.focusGroupKeyDropdowns.beneficiaries.selected,
        ...toAdd,
      ];
      this.onBeneficiaryChange();
    }

    // ---- Match Entities (whole word) — ab sub-entities pehle se cached hain ----
    const matchedEntities = this.focusGroupKeyDropdowns.entities.data.filter((e) =>
      this.isTextMatching(text, e.item_text),
    );

    matchedEntities.forEach((entity) => {
      const subs: SubEntity[] = this.allSubEntities[entity.item_id] || [];

      const exists = this.focusGroupKeyDropdowns.entities.selected.find(
        (x) => x.item_text === entity.item_text,
      );
      if (!exists) {
        this.focusGroupKeyDropdowns.entities.selected = [
          ...this.focusGroupKeyDropdowns.entities.selected,
          entity,
        ];
      }

      if (!this.selectedSubEntities[entity.item_text]) {
        this.selectedSubEntities[entity.item_text] = [];
      }

      // Uski saari sub-entities mark karo
      subs.forEach((s: SubEntity) => {
        if (!this.selectedSubEntities[entity.item_text].includes(s.subEntName)) {
          this.selectedSubEntities[entity.item_text].push(s.subEntName);
        }
      });
    });

    if (matchedEntities.length) {
      const lastEntity = matchedEntities[matchedEntities.length - 1];
      this.activeEntityForSubGrid = lastEntity.item_text;
      this.subEntitiesList = this.allSubEntities[lastEntity.item_id] || [];
    }

    this.showPasteModal = false;
    this.cd.detectChanges();
  }
}
