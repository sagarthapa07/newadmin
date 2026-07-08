import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailSettingAdd } from './email-setting-add';

describe('EmailSettingAdd', () => {
  let component: EmailSettingAdd;
  let fixture: ComponentFixture<EmailSettingAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailSettingAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailSettingAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
