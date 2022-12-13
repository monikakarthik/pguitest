import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GlobalService } from 'src/app/services/global.service';
@Component({
  selector: 'app-wallet-selection',
  templateUrl: './wallet-selection.component.html',
  styleUrls: ['./wallet-selection.component.scss']
})
export class WalletSelectionComponent implements OnInit {
  walletList:any=[{}];
  selectedWallet:any;
  constructor(
    public global:GlobalService,
    public dialogRef: MatDialogRef<WalletSelectionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    ) { 
      console.log('Data: ' + JSON.stringify(data));
      this.walletList=data;
    }

  ngOnInit(): void {
  }
  close(data: string){
    this.dialogRef.close(data);
  }
}
