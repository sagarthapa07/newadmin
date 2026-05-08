import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../Services/api';
import { AlertMessage } from '../../shared/component/alert-message/alert-message';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-seo-social',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertMessage],
  templateUrl: './seo-social.html',
  styleUrl: './seo-social.scss',
})
export class SeoSocialComponent implements OnInit, OnChanges {
  @Input() grantId!: number;
  @Output() tabChange = new EventEmitter<number>();

  opportunityForm: FormGroup;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private api: Api,
  ) {
    this.opportunityForm = this.fb.group({
      linkUrl: [''],
      'M-title': [''],
      'M-author': [''],
      'M-keywords': [''],
      shortInfo: [''],
      'F-Handler': [''],
      'T-Handler': [''],
      'G-Handler': [''],
      'I-Handler': [''],
    });
  }

  ngOnInit(): void {
    if (this.grantId) {
      this.getSeoSocialData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['grantId']?.currentValue) {
      this.getSeoSocialData();
    }
  }

  getSeoSocialData() {
    this.api.getSeoSocial(this.grantId).subscribe({
      next: (res) => {
        console.log('FULL RESPONSE', res);

        const data = res?.rec;

        console.log('REC DATA', data);

        if (!data) return;

        this.opportunityForm.patchValue({
          linkUrl: data.friendlyURLText ?? '',
          'M-title': data.metaTitle ?? '',
          'M-author': data.metaAuthor ?? '',
          'M-keywords': data.metaKeywords ?? '',
          shortInfo: data.metaDescription ?? '',
          'F-Handler': data.facebookHandler ?? '',
          'T-Handler': data.twitterHandler ?? '',
          'G-Handler': data.googlePlusHandler ?? '',
          'I-Handler': data.instagramHandler ?? '',
        });

        console.log('FORM VALUE', this.opportunityForm.value);
      },

      error: (err) => {
        console.log('SEO API ERROR', err);
      },
    });
  }

  onSave() {
    const form = this.opportunityForm.value;

    const payload = {
      userIndex: 5,
      userEmail: 'ritu@fundsforngos.org',

      urlIndex: 0,
      urlRecordType: 'UG',

      refIndex: this.grantId,

      friendlyURLText: form.linkUrl,
      metaTitle: form['M-title'],
      metaAuthor: form['M-author'],
      metaKeywords: form['M-keywords'],
      metaDescription: form.shortInfo,

      facebookHandler: form['F-Handler'],
      twitterHandler: form['T-Handler'],
      googlePlusHandler: form['G-Handler'],
      instagramHandler: form['I-Handler'],
    };

    console.log('PAYLOAD', payload);

    this.api.updateSeoSocial(this.grantId, payload).subscribe({
      next: (res) => {
        console.log('UPDATE SUCCESS', res);

        this.toastType = 'success';
        this.toastMessage = 'SEO/Social Media updated successfully';

        setTimeout(() => {
          this.toastMessage = '';
        }, 3000);
      },

      error: (err) => {
        console.log('UPDATE ERROR', err);

        this.toastType = 'error';
        this.toastMessage = 'Failed to update SEO/Social Media';

        setTimeout(() => {
          this.toastMessage = '';
        }, 3000);
      },
    });
  }

  goToCounties() {
    this.tabChange.emit(5);
  }

  goToCalenderArea() {
    this.tabChange.emit(1);
  }
}
