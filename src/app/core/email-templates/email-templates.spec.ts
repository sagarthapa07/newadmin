import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailTemplates } from './email-templates';

describe('EmailTemplates', () => {
  let component: EmailTemplates;
  let fixture: ComponentFixture<EmailTemplates>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailTemplates]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailTemplates);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
