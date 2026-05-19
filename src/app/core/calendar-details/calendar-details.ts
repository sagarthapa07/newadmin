import { Component, ElementRef, ViewChild, HostListener, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

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

@Component({
  standalone: true,
  selector: 'app-calendar-details',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Editor, AlertMessage, ImageCropper],
  templateUrl: './calendar-details.html',
  styleUrls: ['./calendar-details.scss'],
})
export class CalendarDetails {
  objectKeys = Object.keys;
  @ViewChild('editorOutlineElement') private editorOutline!: ElementRef<HTMLDivElement>;
  @ViewChild('editorWordCountElement') private editorWordCount!: ElementRef<HTMLDivElement>;
  @ViewChild('issueContainer') issueContainer!: ElementRef;
  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;
  @Input() data: GrantDetail | null = null;
  @Output() tabChange = new EventEmitter<number>();

  key: any;

  // public Editor: any;
  public isBrowser = false;
  activeBtn: string = 'calendar';
  donorList: any[] = [];
  showDropdown = false;
  opportunityForm: FormGroup;
  previewUrl: string = '';
  successMessage = '';
  errorMessage = '';
  fullImageUrl: string = '';

  selectedImage: any;
  resizeImages: any[] = [];
  uploadedImageUrl = '';

  @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.dropdownContainer && !this.dropdownContainer.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private api: Api,
    private fileUploadService: FileUpload,
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
  saveForm() {
    console.log(this.opportunityForm.value);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.opportunityForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
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

  ngOnInit(): void {
    // ONLY IF DATA EXISTS
    if (this.data?.id) {
      this.fillForm(this.data);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      const currentData = changes['data'].currentValue;
      const previousData = changes['data'].previousValue;
      // ONLY EDIT CASE
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

    const apiImage = data.grantLogoImage;
    if (apiImage) {
      const imagePath = apiImage.replace('|', '/');

      // Thumbnail (60x60 display)
      this.previewUrl =
        'https://s3.amazonaws.com/cdn.grantsforusapp/' +
        imagePath.replace('2026/', '2026/img.USGrants/thumb-80-px/');

      // Modal ke liye - 450px (best quality available)
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
  onSearchDonor(event: any) {
    const value = event.target.value;

    if (!value) {
      this.showDropdown = false;
      return;
    }
    this.api.searchDonors('DU', value).subscribe((res) => {
      console.log(res);
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
  onSave() {
    if (this.opportunityForm.invalid || this.isEditorEmpty()) {
      this.opportunityForm.markAllAsTouched();

      return;
    }

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
      console.log('FINAL SAVE PAYLOAD', payload);
      // =========================
      // EDIT CASE
      // =========================

      if (this.data?.id) {
        this.api.updateGrant(this.data.id, payload).subscribe({
          next: (res) => {
            console.log('UPDATE SUCCESS', res);

            this.successMessage = 'Grant updated successfully';
          },
          error: (err) => {
            console.log(err);

            this.errorMessage = 'Update failed';
          },
        });
      }
      // =========================
      // ADD NEW CASE
      // =========================
      else {
        this.api.insertGrant(payload).subscribe({
          next: (res: any) => {
            console.log('INSERT SUCCESS', res);
            // NEW GRANT INDEX
            const newGrantId = res?.grantIndex || res?.data?.grantIndex;
            if (newGrantId) {
              // IMPORTANT
              this.data = {
                ...payload.grantData,

                id: newGrantId,
              };
              // RELOAD DETAILS
              this.api.getGrantById(newGrantId).subscribe({
                next: (detailRes) => {
                  const mapped = detailRes.usGrantDataWithURL?.grantData;
                  console.log('RELOADED', mapped);
                  this.successMessage = 'Grant created successfully';
                },
              });
            }
          },
          error: (err) => {
            console.log(err);
            this.errorMessage = 'Insert failed';
          },
        });
      }
    };

    // =========================
    // IMAGE UPLOAD FIRST
    // =========================

    if (this.resizeImages?.length) {
      this.fileUploadService.uploadImages(this.resizeImages).subscribe({
        next: (res) => {
          console.log('UPLOAD SUCCESS', res);

          if (res.successCode === 1) {
            // uploaded image path
            const uploadedImagePath = res.filePath || res.data || '';

            // SAVE AFTER IMAGE UPLOAD
            saveGrant(uploadedImagePath);
          } else {
            this.errorMessage = 'Image upload failed';
          }
        },

        error: (err) => {
          console.log('UPLOAD ERROR', err);

          this.errorMessage = 'Image upload failed';
        },
      });
    } else {
      // NO IMAGE CHANGED
      saveGrant();
    }
  }

  onImageCropped(images: any[]) {
    if (!images?.length) return;
    const mainImage = images[0];
    // IMPORTANT FIX
    mainImage.dirPath = 'img.USGrants/thumb-600-px/';
    this.opportunityForm.patchValue({
      img: mainImage.image,
    });

    // IMPORTANT
    this.resizeImages = [mainImage];
    this.previewUrl = mainImage.base64;
    this.fullImageUrl = mainImage.base64;
    console.log('FINAL IMAGE OBJECT', this.resizeImages);
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
  onFileSelect(event: any) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result as string;

      this.resizeImages = [
        {
          name: 'grant-logo',

          fileExtension: file.name.split('.').pop(),

          image: file,

          // IMPORTANT FIX
          dirPath: 'img.USGrants/thumb-600-px/',

          base64: base64,
        },
      ];
    };

    reader.readAsDataURL(file);
  }
  uploadImage() {
    this.fileUploadService.uploadImages(this.resizeImages).subscribe({
      next: (res) => {
        console.log('UPLOAD SUCCESS', res);

        if (res.successCode === 1) {
          this.uploadedImageUrl = res.filePath;

          console.log(this.uploadedImageUrl);
        }
      },

      error: (err) => {
        console.log('UPLOAD ERROR', err);
      },
    });
  }
}
