import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GlobalService } from 'src/app/services/global.service';

@Component({
  selector: 'app-cnf-account',
  templateUrl: './cnf-account.component.html',
  styleUrls: ['./cnf-account.component.scss']
})
export class CnfAccountComponent implements OnInit {
  params: any = {};
  mobileNo: any;

  constructor(
    public global: GlobalService,
    public dialogRef: MatDialogRef<CnfAccountComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,) {
    console.log('Data: ' + JSON.stringify(data));
    this.params = data;
    this.mobileNo = data.mobileNo;
  }

  
  ngOnInit(): void {
  }
  close(data: string){
    this.dialogRef.close(data);
  }
}
