import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { GlobalService } from 'src/app/services/global.service';
import { RestService } from 'src/app/services/rest/rest.service';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.scss']
})
export class OtpComponent implements OnInit {
  mPin: any;
  otp: any;
  params: any = {};
  showOtp = false;
  mobileNo: any;
  sessionResp: any;
  timer=30;
  timerLabel='00:00';
  resendOtpResponse: any;
  constructor(
    public global: GlobalService,
    private rest: RestService,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<OtpComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    ) { 
      console.log('Data: ' + JSON.stringify(data));
      this.params= data;
      this.mobileNo=data.mobileNo;
    }

  ngOnInit(): void {
    this.initTimer();
    this.startTimer();
  }
  close(data: string){
    this.dialogRef.close(data);
  }


  initTimer() {
    this.timer=30;
  }
  startTimer() {
    this.timer--;
    setTimeout(() => {
      if(this.timer>0) {
        this.timerLabel='00:' + this.checkForSingleDigits();
        this.startTimer();
      }
    }, 1000);
  }
  checkForSingleDigits() {
    if(this.timer>9) {
      return this.timer;
    } else {
      return '0'+this.timer;
    }
  }
  async resendOtp() {
    this.timer=30;
    const loading = await this.global.showLoading('');
    const requestdata = {
      mobileno: this.mobileNo,
      sessionId: this.global.sessionId,
      reSendOtp: 'true'
    }
    let postData = {
      reqdata: this.global.encryptData(requestdata),
      reqtype: 'RESEND_OTP'
    }
    this.rest.postData('pg/api/txn', postData).subscribe((res:any) => {
      loading.close();
      this.global.showSuccessToast(this.translate.instant('OTP_SENT_CHECK_MOBILE'));
      this.resendOtpResponse = JSON.parse(this.global.decryptData(res.respdata));
    }, err => {
      loading.close();
      this.global.showErrorToast(this.translate.instant('FAILED_TO_RESEND_OTP'));
    });
  }
  changeView(showOtp:any) {
    console.log('Before: ' + this.showOtp);
    this.showOtp = !this.showOtp;
    console.log('After: ' + this.showOtp);
  }
  async verifyForm() {
    if (!this.otp || this.otp.length < 6) {

    } else {
      this.initValidateOtp();
    }
  }
  
  async initValidateOtp() {
    console.log('OTP: ' + this.otp);
    let otpPostData = {};
    if (this.params.txnType == 'CRD') {
      otpPostData = {
        otp: this.otp,
        sessionId: this.params.sessionId,
        cardno: this.params.cardno,
        customerName: this.params.customerName,
        expdate: this.params.expdate,
        cvv: this.params.cvv,
        txntype: this.params.txnType,
        mobileno: this.params.mobileNo
      };
      console.log('Card Payment Details: ' + JSON.stringify(otpPostData));
    } else if (this.params.txnType === 'WLT') {
      console.log('OTP Verification for Wallet Type Payment');
      if (this.params.walletType == "IB_WLT") {
        console.log('OTP for LMM wallet');
        otpPostData = {
          acctno: this.params.acctno,
          cardno: this.params.cardno,
          ccy: this.params.ccy,
          otp: this.otp,
          sessionId: this.global.sessionId,
          txntype: 'WLT',
          mobileno: this.params.mobileno,
          expdate: "1234",
          cvv: "245",
          walletType: this.params.walletType
        };
        console.log('IB_WLT Payment Details: ' + JSON.stringify(otpPostData));
      } else if (this.params.walletType == "LMM_WLT") {
        otpPostData = {
          acctno: this.params.acctno,
          cardno: "",
          ccy: this.params.ccy,
          otp: this.otp,
          sessionId: this.global.sessionId,
          txntype: 'WLT',
          mobileno: this.params.mobileno,
          expdate: "1234",
          cvv: "245",
          walletType: 'LMM_WLT',
          serviceTxnId: this.params.serviceTxnId,
        };
        console.log('LMM WLT Payment Details: ' + JSON.stringify(otpPostData));
      } else if (this.params.walletType == "UMONEY_WLT") {
        otpPostData = {
          acctno: this.params.acctno,
          cardno: "",
          ccy: this.params.ccy,
          otp: this.otp,
          sessionId: this.global.sessionId,
          txntype: 'WLT',
          mobileno: this.params.mobileno,
          expdate: "1234",
          cvv: "245",
          walletType: 'UMONEY_WLT',
        };
        console.log('UMoney WLT Payment Details: ' + JSON.stringify(otpPostData));
      }
    } else if (this.params.txnType == 'ACCT') {
      otpPostData = {
        accountNo: this.params.accNo,
        acctName: this.params.customerName,
        phone: this.params.mobileNo,
        otp: this.otp,
        sessionId: this.global.sessionId,
        txntype: 'ACCT',
        mobileno: this.params.mobileNo,
        cardno: "",
        expdate: "1234",
        cvv: "245",
      };
      console.log('Account Payment Request Details: ' + JSON.stringify(otpPostData));
    } else {
      this.dialogRef.close(null);
      this.global.showAlert(this.translate.instant('ALERT'), this.translate.instant('SELECT_VALID_TXN_TYPE'));
      return;
    }
    const loading = this.global.showLoading('');

    // console.log('Otp Post Data: ' + JSON.stringify(otpPostData));
    let postData = {
      reqdata: this.global.encryptData(otpPostData),
      reqtype: "OTP"
    };

    this.rest.postData('pg/api/txn', postData).subscribe((res: any) => {
      const otpRespData = this.global.decryptData(res.respdata);
      console.log('otpRespData: ' + otpRespData);
      const parsedOtpResp = JSON.parse(otpRespData);
      this.global.otpRespParams = parsedOtpResp;
      // Send request only 
      this.sendCallBackUrl(parsedOtpResp.merchrespdata);
      parsedOtpResp.otp = this.otp;
      this.checkOtpResp(parsedOtpResp, loading);
    }, err => {
      // show alert or do something if you need
      loading.close();
    });
  }
  async sendCallBackUrl(merchantData:any) {
    console.log('Sending call back request.');
    const postData = {
      respdata: merchantData,
    };
    this.rest.postDataToUrl(this.global.sessionResp.callbackurl, postData).subscribe(
      res => {
        console.log('Call back Resp: ' + JSON.stringify(res));
      }, err => {
        console.log('Call back Error: ' + JSON.stringify(err));
      }
    );
  }

  checkOtpResp(otpResp:any, loading:any) {
    loading.close();
    if(otpResp.statusCode === '1' || otpResp.statusCode == 1) {
      this.global.showErrorToast(this.translate.instant('OTP_VERIFY_FAILED_TRY_AGAIN'));
    } else if (otpResp.statusCode === '3' || otpResp.statusCode == 3) { 
      this.global.showAlert(this.translate.instant('ALERT'), this.translate.instant('INTERNAL_ISSUE_MSG'));
    } else {
      this.dialogRef.close(otpResp);
    }
  }
}
