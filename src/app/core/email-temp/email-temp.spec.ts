import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailTemp } from './email-temp';

describe('EmailTemp', () => {
  let component: EmailTemp;
  let fixture: ComponentFixture<EmailTemp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailTemp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailTemp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
