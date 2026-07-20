import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from '../../shared/component/header/header';
import { CalendarDetails } from '../calendar-details/calendar-details';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { Api } from '../Services/api';
import { GrantDetail } from '../../datatype';
import { Input } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-addnew-edit',
  imports: [
    CommonModule,
    FormsModule,
    Header,
    CalendarDetails,
    AlertMessage,
  ],
  templateUrl: './addnew-edit.html',
  styleUrl: './addnew-edit.scss',
})
export class AddnewEdit {
  opportunityForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  menuItems = [
    { id: 1, label: 'Calender Details' },
    { id: 2, label: 'Geo Location' },
    { id: 3, label: 'Focus Areas' },
    { id: 4, label: 'Focus Groups' },
    { id: 5, label: 'Counties' },
    { id: 6, label: 'Seo/Social Media' },
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

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.getGrantDetails(+id);
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

  isTabLocked(id: number): boolean {
    return id !== 1 && !this.grantData?.id;
  }

  setActive(id: number) {
    if (this.isTabLocked(id)) {
      this.errorMessage = 'Please save this Opportunity first before proceeding to other tabs.';
      setTimeout(() => (this.errorMessage = ''), 4000);
      return;
    }
    this.activeItem = id;
  }

  onSave() {
    console.log(this.opportunityForm.value);
  }

  gotoPreview() {
    this.router.navigate(['/preview']);
  }
}