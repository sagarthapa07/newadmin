import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SeoSocialComponent } from '../seo-social/seo-social';
import { CountiesComponent } from '../counties/counties';
import { FocusAreaComponent } from '../focus-areas/focus-areas';
import { GeoLocationComponent } from '../geo-location/geo-location';
import { Header } from '../../shared/component/header/header';
import { FocusGroupsComponent } from '../focus-groups/focus-groups';
import { CalendarDetails } from '../calendar-details/calendar-details';
import { Api } from '../Services/api';
import { GrantDetail } from '../../datatype';
import { Input } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { DraftService } from '../Services/grant-draft';
import { Common } from '../Services/common';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';

@Component({
  standalone: true,
  selector: 'app-example',
  imports: [
    CommonModule,
    FormsModule,
    SeoSocialComponent,
    CountiesComponent,
    FocusAreaComponent,
    GeoLocationComponent,
    Header,
    FocusGroupsComponent,
    CalendarDetails,
    AlertMessage,
  ],
  templateUrl: './edit.html',
  styleUrl: './edit.scss',
})
export class Edit {
  opportunityForm: FormGroup;
  isLoading = false;
  draftId: string = '';

  menuItems = [
    {
      id: 1,
      label: 'Calender Details',
      icon: 'bi-calendar3',
      badge: 'Add / Edit',
      description: 'FundsForNGO Premium',
    },
    {
      id: 2,
      label: 'Geo Location',
      icon: 'bi-geo-alt',
      badge: 'Geo Location',
      description: 'Choose the geographies that are relevant for this opportunity.',
    },
    {
      id: 3,
      label: 'Focus Areas',
      icon: 'bi-bullseye',
      badge: 'Select Focus Areas',
      description: 'Choose the focus areas that best match this opportunity.',
    },
    {
      id: 4,
      label: 'Focus Groups',
      icon: 'bi-people',
      badge: 'Select Focus Groups',
      description:
        'Choose the beneficiaries, entities and organizations relevant to this opportunity.',
    },
    {
      id: 5,
      label: 'Counties',
      icon: 'bi-layers',
      badge: 'Opportunity Coverage',
      description: 'Select states and counties to define the coverage for this opportunity.',
    },
    {
      id: 6,
      label: 'Seo/Social Media',
      icon: 'bi-share',
      badge: 'SEO & Social Media',
      description: 'Manage SEO information and social media references for your opportunity.',
    },
  ];

  activeItem = 1;
  grantData: GrantDetail | null = null;
  @Input() grantId?: number;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private api: Api,
    private cd: ChangeDetectorRef,
    private draftService: DraftService,
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

  get activeTab() {
    return this.menuItems.find((item) => item.id === this.activeItem);
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'null' && id !== 'undefined' && +id > 0) {
      this.draftId = `grant_${id}`;
      this.getGrantDetails(+id);
    } else {
      this.grantData = null;
    }
  }
  getGrantDetails(id: number) {
    this.isLoading = true;
    this.api.getGrantById(id).subscribe({
      next: (res) => {
        const mapped = this.mapGrantData(res);
        this.grantData = mapped;
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.log('API ERROR:', err);
        this.isLoading = false;
      },
    });
  }
  formatDate(date: string): string {
    return date ? date.split('T')[0] : '';
  }
  mapGrantData(res: any) {
    const data = res.usGrantDataWithURL.grantData;
    const url = res.usGrantDataWithURL.urlData;
    return {
      id: data.grantIndex,
      title: data.grantTitle,
      friendlyURLText: url?.friendlyURLText || '',
      linkUrl: data.linkURL,
      postDate: this.formatDate(data.postDate),
      deadlineDate: this.formatDate(data.deadLineDate),
      isOngoing: data.onGoingGrants === 1,
      shortInfo: data.shortIntro,
      donorType: data.donorType === 'UD' ? 'US Donors' : data.donorType,
      donorAgency: data.donorAgency,
      donorAgencyOther: data.donorAgency,
      grantType: data.grantType?.split('|')[0]?.trim() || '',
      grantDuration: this.normalizeDuration(data.grantDuration),
      grantSize: data.grantSize?.trim() || '',
      status: data.status || '',
      letterText: data.grantContent || '',
      grantLogoImage: data.grantLogoImage || '',
      issueString: data.issueString,
      stateString: data.stateString,
      countyString: data.countyString,
      entityString: data.entityString,
      stCtType: data.stCtType,
    };
  }

  normalizeDuration(value: string): string {
    if (!value) return '';
    const clean = value.trim().toLowerCase();
    if (clean.includes('less than 1')) return 'Less than 1 Year';
    if (clean.includes('1 year')) return '1 Year';
    if (clean.includes('2 year')) return '2 Year';
    if (clean.includes('3 year')) return '3 Year';
    if (clean.includes('4 year')) return '4 Year';
    if (clean.includes('5 year')) return '5 Year';
    if (clean.includes('5–10')) return '5–10 Years';
    if (clean.includes('not mentioned')) return 'Grant Duration Not Mentioned';
    return '';
  }
  setActive(id: number) {
    this.activeItem = id;
  }

  onSave() {}

  gotoPreview() {
    this.router.navigate(['/preview']);
  }
  clearDraft() {
    if (!this.draftId) return;
    this.draftService.removeDraft(this.draftId);
    this.draftService.clearActiveDraftId();
  }
}
