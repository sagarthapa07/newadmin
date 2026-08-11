import { Component, ElementRef, ViewChild, HostListener, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Editor } from '../../shared/component/editor/editor';
import { Api } from '../Services/api';
import { Input } from '@angular/core';
import { GrantDetail } from '../../datatype';
import { Output, EventEmitter } from '@angular/core';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { ImageCropper } from '../../shared/component/image-cropper/image-cropper';
import { FileUpload } from '../Services/file-upload';
import { LoaderService } from '../Services/loader-service';
import { Loader } from '../../shared/component/loader/loader';

@Component({
  standalone: true,
  selector: 'app-calendar-details',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Editor, AlertMessage, ImageCropper,Loader],
  templateUrl: './calendar-details.html',
  styleUrls: ['./calendar-details.scss'],
})
export class CalendarDetails {
  objectKeys = Object.keys;
  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;
  @Input() data: GrantDetail | null = null;
  @Output() tabChange = new EventEmitter<number>();
  @ViewChild('grantTypeContainer') grantTypeContainer!: ElementRef;
  @ViewChild('grantDurationContainer') grantDurationContainer!: ElementRef;
  @ViewChild('grantSizeContainer') grantSizeContainer!: ElementRef;

  key: any;
  public isBrowser = false;
  activeBtn: string = 'calendar';
  donorList: any[] = [];
  showDropdown = false;
  opportunityForm: FormGroup;
  previewUrl: string = '';
  successMessage = '';
  errorMessage = '';
  isSaving = false;
  fullImageUrl: string = '';
  selectedImage: any;
  resizeImages: any[] = [];
  uploadedImageUrl = '';
  showGrantTypeDropdown = false;
  selectedGrantType = '';
  showGrantDurationDropdown = false;
  selectedGrantDuration = '';
  showGrantSizeDropdown = false;
  selectedGrantSize = '';
  formSubmitted = false;

  grantTypeList = [
    'Awards and Prizes',
    'Endowment',
    'Exhibition',
    'Fellowship',
    'Grant',
    'In-Kind',
    'Matching Grants',
    'Program',
    'Reimbursement',
    'Scholarship',
    'Seed Money or Start-up Grant',
    'Training or Mentorship',
    'Travel Grant',
  ];

  grantDurationList = [
    'Less than 1 Year',
    '1 Year',
    '2 Year',
    '3 Year',
    '4 Year',
    '5 Year',
    '5–10 Years',
    'more then 5 Years',
    'more then 10 Years',
    'Grant Duration Not Mentioned',
  ];

  grantSizeList = [
    'Not Available',
    'Less than $1000',
    '$1000 to $10,000',
    '$10,000 to $100,000',
    '$100,000 to $500,000',
    '$500,000 to $1 million',
    'More than $1 million',
    'Not Mentioned',
    'Less than $50,000',
    '$50,000 to $500,000',
    '$500,000 to $1 Million',
    '$1 Million to $50 Million',
    '$50 Million to $100 Million',
    'More than $100 Million',
  ];

  get shortInfoLength(): number {
    return this.opportunityForm.get('shortInfo')?.value?.length || 0;
  }

  @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.dropdownContainer && !this.dropdownContainer.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
    if (this.grantTypeContainer && !this.grantTypeContainer.nativeElement.contains(event.target)) {
      this.showGrantTypeDropdown = false;
    }
    if (
      this.grantDurationContainer &&
      !this.grantDurationContainer.nativeElement.contains(event.target)
    ) {
      this.showGrantDurationDropdown = false;
    }
    if (this.grantSizeContainer && !this.grantSizeContainer.nativeElement.contains(event.target)) {
      this.showGrantSizeDropdown = false;
    }
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private api: Api,
    private fileUploadService: FileUpload,
    private location: Location,
    private loader: LoaderService,
  ) {
    this.opportunityForm = this.fb.group({
      title: ['', Validators.required],
      friendlyURLText: ['', Validators.required],
      linkUrl: ['', Validators.required],
      postDate: ['', Validators.required],
      deadlineDate: ['', Validators.required],
      isOngoing: [false],
      shortInfo: ['', Validators.required],
      donorType: ['US Donors', Validators.required],
      donorAgency: [''],
      donorAgencyOther: ['', Validators.required],
      grantType: ['', Validators.required],
      grantDuration: ['', Validators.required],
      grantSize: ['', Validators.required],
      status: ['', Validators.required],
      letterText: ['', Validators.required],
      issueString: [''],
      stateString: [''],
      countyString: [''],
      stCtType: [''],
      entityString: [''],
      grantLogoImage: [''],
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.opportunityForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  goBack() {
    this.location.back();
  }

  clearAll() {
    this.opportunityForm.reset({
      donorType: 'US Donors',
      isOngoing: false,
    });
    this.previewUrl = '';
    this.fullImageUrl = '';
    this.resizeImages = [];
    this.selectedGrantType = '';
    this.selectedGrantDuration = '';
    this.selectedGrantSize = '';
    this.showGrantTypeDropdown = false;
    this.showGrantDurationDropdown = false;
    this.showGrantSizeDropdown = false;
  }

  selectDropdown(type: 'grantType' | 'grantDuration' | 'grantSize', item: string) {
    this.opportunityForm.patchValue({ [type]: item });

    if (type === 'grantType') {
      this.selectedGrantType = item;
      this.showGrantTypeDropdown = false;
    }
    if (type === 'grantDuration') {
      this.selectedGrantDuration = item;
      this.showGrantDurationDropdown = false;
    }
    if (type === 'grantSize') {
      this.selectedGrantSize = item;
      this.showGrantSizeDropdown = false;
    }
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

  ngOnInit(): void {
    if (this.data?.id) {
      this.fillForm(this.data);
    }
    this.opportunityForm.get('title')?.valueChanges.subscribe((value) => {
      if (this.data?.id) return;
      const friendlyUrl = value
        ?.toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      this.opportunityForm.patchValue({ friendlyURLText: friendlyUrl }, { emitEvent: false });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      const currentData = changes['data'].currentValue;
      const previousData = changes['data'].previousValue;
      if (currentData?.id && currentData !== previousData) {
        this.fillForm(currentData);
      }
    }
  }

  isEditorEmpty(): boolean {
    const value = this.opportunityForm.get('letterText')?.value || '';
    const plainText = value
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, '')
      .trim();
    return !plainText;
  }

  fillForm(data: any) {
    if (!data?.id) return;
    this.opportunityForm.patchValue({
      title: data.title,
      friendlyURLText: data.friendlyURLText,
      linkUrl: data.linkUrl,
      postDate: data.postDate,
      deadlineDate: data.deadlineDate,
      isOngoing: data.isOngoing,
      shortInfo: data.shortInfo,
      donorType: data.donorType,
      donorAgency: data.donorAgency,
      donorAgencyOther: data.donorAgencyOther,
      grantType: data.grantType,
      grantDuration: data.grantDuration,
      grantSize: data.grantSize,
      status: data.status,
      letterText: data.letterText,
      issueString: data.issueString,
      stateString: data.stateString,
      countyString: data.countyString,
      entityString: data.entityString,
      stCtType: data.stCtType,
    });
    this.selectedGrantType = data.grantType || '';
    this.selectedGrantDuration = data.grantDuration || '';
    this.selectedGrantSize = data.grantSize || '';

    const apiImage = data.grantLogoImage;
    if (apiImage) {
      const imagePath = apiImage.replace('|', '/');
      this.previewUrl =
        'https://s3.amazonaws.com/cdn.grantsforusapp/' +
        imagePath.replace('2026/', '2026/img.USGrants/thumb-80-px/');

      this.fullImageUrl =
        'https://s3.amazonaws.com/cdn.grantsforusapp/' +
        imagePath.replace('2026/', '2026/img.USGrants/thumb-450-px/');
    }
  }
  public editorData = '';

  goToGeoLocation() {
    this.onSave();
    this.tabChange.emit(2);
  }

  goToFocusAreas() {
    this.tabChange.emit(3);
  }

  goToFocusGroup() {
    this.tabChange.emit(4);
  }

  goToCounties() {
    this.tabChange.emit(5);
  }
  goToSeo() {
    this.tabChange.emit(6);
  }
  goToCalenderArea() {
    this.tabChange.emit(1);
  }

  isImageInvalid(): boolean {
    return this.formSubmitted && !this.previewUrl;
  }
  onSearchDonor(event: any) {
    const value = event.target.value;
    if (!value) {
      this.showDropdown = false;
      return;
    }
    this.api.searchDonors('DU', value).subscribe((res) => {
      this.donorList = res?.donorsList?.slice(0, 10) || [];
      this.showDropdown = true;
    });
  }
  selectDonor(item: any) {
    this.opportunityForm.patchValue({
      donorAgency: item.donorName,
      donorAgencyOther: item.donorName,
    });
    this.donorList = [];
    this.showDropdown = false;
  }
  formatDateISO(date: string): string {
    return new Date(date).toISOString();
  }

  getDateNumber(date: string): number {
    const d = new Date(date);
    return Number(
      `${d.getFullYear()}${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`,
    );
  }

  onSave(): void {
    if (this.isSaving) return;
    this.formSubmitted = true;
    if (this.opportunityForm.invalid || this.isEditorEmpty() || this.isImageInvalid()) {
      this.opportunityForm.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    this.loader.show();
    this.persistGrant((grantId: number) => {
      this.successMessage = 'Grant saved successfully';
    });
  }

  onImageCropped(images: any[]) {
    if (!images?.length) return;
    this.resizeImages = images;
    this.opportunityForm.patchValue({ img: images[0].image });
    this.previewUrl = images[0].base64;
    this.fullImageUrl = images[0].base64;
  }

  showImageModal = false;

  openImageModal() {
    if (this.fullImageUrl || this.previewUrl) {
      this.showImageModal = true;
    }
  }

  closeImageModal() {
    this.showImageModal = false;
  }

  goToPreview(): void {
    this.formSubmitted = true;
    if (this.opportunityForm.invalid || this.isEditorEmpty() || this.isImageInvalid()) {
      this.opportunityForm.markAllAsTouched();
      this.errorMessage = 'Please fill all required fields before preview.';
      return;
    }
    this.persistGrant((grantId: number) => {
      this.router.navigate(['/calendar-opportunity/edit/preview', grantId]);
    });
  }

  private persistGrant(onSuccess: (grantId: number) => void): void {
    const form = this.opportunityForm.value;

    const saveGrant = (imagePath: string = '') => {
      const payload: any = {
        userIndex: 5,
        userEmail: 'ritu@fundsforngos.org',
        grantData: {
          grantIndex: this.data?.id || 0,
          grantTitle: form.title,
          linkURL: form.linkUrl,
          postDate: this.formatDateISO(form.postDate),
          pdValue: this.getDateNumber(form.postDate),
          deadLineDate: this.formatDateISO(form.deadlineDate),
          ddValue: this.getDateNumber(form.deadlineDate),
          shortIntro: form.shortInfo,
          donorType: 'UD',
          donorIndex: 0,
          donorAgency: form.donorAgency,
          grantType: form.grantType,
          grantSize: form.grantSize,
          grantLogoImage: imagePath || this.data?.grantLogoImage || '',
          onGoingGrants: form.isOngoing ? 1 : 0,
          status: form.status,
          grantContent: form.letterText,
          grantDuration: form.grantDuration,
          stCtType: form.stCtType || '',
          stateString: form.stateString || '',
          countyString: form.countyString || '',
          issueString: form.issueString || '',
          entityString: form.entityString || '',
          viewCount: 0,
        },
        urlData: {
          urlIndex: 0,
          refIndex: this.data?.id || 0,
          urlRecordType: 'UG',
          friendlyURLText: form.friendlyURLText,
        },
      };

      if (this.data?.id) {
        this.api.updateGrant(this.data.id, payload).subscribe({
          next: (res: any) => {
            this.isSaving = false;
            this.loader.hide();
            if (res.successCode === 1) {
              onSuccess(this.data!.id!);
            } else {
              this.errorMessage = 'Grant update failed';
            }
          },
          error: (err) => {
            this.isSaving = false;
            this.loader.hide();
            console.error(err);
            this.errorMessage = 'Grant update failed';
          },
        });
      } else {
        this.api.insertGrant(payload).subscribe({
          next: (res: any) => {
            this.isSaving = false;
            this.loader.hide();
            const grantId = res?.result?.grantIndex;
            if (grantId) {
              this.data = { ...(this.data || {}), id: grantId } as any;

              onSuccess(grantId);
              this.router.navigate(['/calendar-opportunity/edit', grantId]);
            } else {
              this.errorMessage = 'Grant ID not found';
            }
          },
          error: (err) => {
            this.isSaving = false;
             this.loader.hide();
            console.log(err);
            this.errorMessage = 'Insert failed';
          },
        });
      }
    };

    if (this.resizeImages?.length) {
      this.fileUploadService.uploadImages(this.resizeImages).subscribe({
        next: (res) => {
          if (res.successCode === 1) {
            const fullPath = res.body[0].path;
            const uploadedImagePath = fullPath.split('/')[0] + '|' + fullPath.split('/').pop();
            saveGrant(uploadedImagePath);
          } else {
            this.isSaving = false;
            this.loader.hide();
            this.errorMessage = 'Image upload failed';
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.loader.hide();
          console.log('UPLOAD ERROR', err);
          this.errorMessage = 'Image upload failed';
        },
      });
    } else {
      saveGrant();
    }
  }
}
