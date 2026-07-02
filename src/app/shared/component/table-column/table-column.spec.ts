import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableColumn } from './table-column';

describe('TableColumn', () => {
  let component: TableColumn;
  let fixture: ComponentFixture<TableColumn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableColumn]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableColumn);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
