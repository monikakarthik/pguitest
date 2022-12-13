import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CnfAccountComponent } from './cnf-account.component';

describe('CnfAccountComponent', () => {
  let component: CnfAccountComponent;
  let fixture: ComponentFixture<CnfAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CnfAccountComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CnfAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
