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
import { ImageCroper } from '../../shared/component/image-croper/image-croper';
import { Output, EventEmitter } from '@angular/core';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';

@Component({
  standalone: true,
  selector: 'app-calendar-details',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Editor, ImageCroper, AlertMessage],
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
  ) {
    this.opportunityForm = this.fb.group({
      title: ['', Validators.required],
      friendlyURL: ['', Validators.required],
      linkUrl: ['', Validators.required],
      postDate: ['', Validators.required],
      deadlineDate: ['', Validators.required],
      isOngoing: [false],
      shortInfo: ['', Validators.required],
      donorType: ['US Donors'],
      donorAgency: ['', Validators.required],
      donorAgencyOther: [''],
      grantType: ['', Validators.required],
      grantDuration: ['', Validators.required],
      grantSize: ['', Validators.required],
      status: [''],
      letterText: ['', Validators.required],
      img: ['', Validators.required],
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
    if (this.data) {
      this.fillForm(this.data);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      const currentData = changes['data'].currentValue;
      const previousData = changes['data'].previousValue;
      // check if valid data hai
      if (currentData && currentData !== previousData) {
        this.fillForm(currentData);
      }
    }
  }

  fillForm(data: GrantDetail) {
    this.opportunityForm.patchValue({
      title: data.title,
      friendlyURL: data.friendlyURL,
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
    });
    this.editorData = data.letterText;
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
    const form = this.opportunityForm.value;

    const formData = new FormData();

    formData.append('img', form.img);
    formData.append('title', form.title);
    formData.append('friendlyURL', form.friendlyURL);
    formData.append('linkURL', form.linkUrl);
    formData.append('postDate', form.postDate);
    formData.append('deadlineDate', form.deadlineDate);
    formData.append('isOngoing', form.isOngoing);
    formData.append('shortInfo', form.shortInfo);
    formData.append('donorType', form.donorType);
    formData.append('donorAgency', form.donorAgency);
    formData.append('grantType', form.grantType);
    formData.append('grantDuration', form.grantDuration);
    formData.append('grantSize', form.grantSize);
    formData.append('status', form.status);
    formData.append('letterText', form.letterText);

    this.api.updateGrant(this.data?.id!, formData).subscribe({
      next: (res) => {
        this.successMessage = 'Calendar Details updated successfully';
        setTimeout(() => {
          this.successMessage = '';
        }, 4000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to update Calendar Details';
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      },
    });
  }
  onImageCropped(file: File) {
    this.opportunityForm.patchValue({ img: file });

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
}
