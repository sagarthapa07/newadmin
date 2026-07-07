import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailSettingEdit } from './email-setting-edit';

describe('EmailSettingEdit', () => {
  let component: EmailSettingEdit;
  let fixture: ComponentFixture<EmailSettingEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailSettingEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailSettingEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
