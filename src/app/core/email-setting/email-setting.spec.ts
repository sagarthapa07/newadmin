import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailSetting } from './email-setting';

describe('EmailSetting', () => {
  let component: EmailSetting;
  let fixture: ComponentFixture<EmailSetting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailSetting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailSetting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
