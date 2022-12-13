import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentSelectionComponent } from './payment-selection/payment-selection.component';
import { ThreeDsComponent } from './three-ds/three-ds.component';

const routes: Routes = [
  { 
    path: '', redirectTo: 'payment-selection', pathMatch: 'full' 
  }, {
    path: 'payment-selection', component: PaymentSelectionComponent, 
  }, {
    path: 'three-ds', component: ThreeDsComponent
  }];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
