import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletSelectionComponent } from './wallet-selection.component';

describe('WalletSelectionComponent', () => {
  let component: WalletSelectionComponent;
  let fixture: ComponentFixture<WalletSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WalletSelectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WalletSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
