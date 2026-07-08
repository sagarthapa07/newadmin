import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailTemplatesAdd } from './email-templates-add';

describe('EmailTemplatesAdd', () => {
  let component: EmailTemplatesAdd;
  let fixture: ComponentFixture<EmailTemplatesAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailTemplatesAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailTemplatesAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
