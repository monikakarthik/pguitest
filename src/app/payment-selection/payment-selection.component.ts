import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BnNgIdleService } from 'bn-ng-idle';
import { GlobalService } from '../services/global.service';
import { RestService } from '../services/rest/rest.service';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-payment-selection',
  templateUrl: './payment-selection.component.html',
  styleUrls: ['./payment-selection.component.scss']
})
export class PaymentSelectionComponent implements OnInit {
  @ViewChild('ccNumber') ccNumberField: ElementRef;
  @ViewChild('ccExpiry') ccExpiryField: ElementRef;

  // OTP screen variables
  mPin: any;
  otp: any;
  params: any = {};
  showOtp = false;
  mobileNo: any;
  sessionResp: any;
  otpTimer = 30;
  otpTimerLabel = '00:00';
  resendOtpResponse: any;

  pageStatus = 1;
  breakpoint: number;
  sessionId: string = '';

  // Payment Selection Variables
  id: any;
  mobileNumber: any;
  paymentType = 'wallet';
  date: any;
  walletType = 'ib';
  isSubmitted = false;
  cardPaymentForm: FormGroup;
  txnAmount: any = 0;
  txnCurrency: any = '418';
  merchantRefNumber: any;
  txnFee: any = 0;
  serviceTax: any = 0;
  isOffus: string = '0';
  accountDetails: any = {
    accountNo: '',
    dob: ''
  };
  languageFlag = 'assets/svg/eng-flag.svg';
  resultScreenType: string = 'RESULT';
  txnStatus: string = 'F';
  txnResp: any = {};
  timer = 10;
  reloadWindow = false;
  txnResponse: any;
  constructor(
    public global: GlobalService,
    private activatedRoute: ActivatedRoute,
    private rest: RestService,
    private translate: TranslateService,
    public dialog: MatDialog,
    private fb: FormBuilder,
    private router: Router,
    private bnIdle: BnNgIdleService
  ) {
    const timeout = 120; // sec
    this.bnIdle.startWatching(timeout).subscribe((isTimedOut: boolean) => {
      if (isTimedOut) {
        console.log('session expired');
        this.global.showAlert('INVALID_SESSION', 'SESSION_EXPIRED_MSG');
        this.redirectUrl();
      }
    });
  }

  ngOnInit() {
    this.restrictRightClick();
    this.initCardDetails();
    this.checkDefaultLanguage();
    console.log(localStorage.getItem('RELOAD'));
    this.checkForThreeDsResp();
  }

  restrictRightClick() {
    document.addEventListener('contextmenu', event => event.preventDefault()); // (to restrict right click)
  }
  /* test () {
    this.txnResp =  {"amount":"250","redirecturl":"https://ibcooluat.iblaos.com/ibecommerce/home","statusMsg":"Issuer Down","merchrefno":"1663826442039","merchrespdata":"+XGg5fpHYuIYscfo0kUQxVJOojeeVfHMvrYacH8tkeuakgaPrQtTzR5S3r7Ykm7xOgqSxgMVqK3Qc1aZmRutYQr9YQs9eO2iF9hoKPL3dioq4zbIHzmkk29H66bL1TxRi4yd6KImOqbmUsyTndytAukO8JjT18SefeXL5hoSaTWujISepVEKKpY6wnZrKj+E","txnrefno":"226501113598","paymentMode":"OFFLINE","ccyCode":"LAK","customerId":"-966347043","txndatetime":"22-Sep-2022 01:01:48 PM","callbackurl":"https://ibcooluat.iblaos.com/pglandingserver/pg/txn","statusCode":"5"};
  } */
  checkForThreeDsResp() {
    const resp = this.global.threeDsResp;
    if (resp) {
      this.pageStatus = 4;
      this.txnResp = resp;
      if (resp.statusCode === '0' || resp.statusCode == 0) {
        this.txnStatus = 'S';
      } else {
        this.txnStatus = 'F';
      }
      this.global.threeDsResp = undefined;
      if (resp.paymentMode === 'ON') {
        setTimeout(() => {
          this.redirectUrl();
        }, 5000);
      }
    } else {
      setTimeout(() => {
        this.checkReload();
      }, 100);
    }
  }
  checkReload() {
    console.log(localStorage.getItem('RELOAD'));
    if (localStorage.getItem('RELOAD') === '1') {
      console.log('Reloading completed check the params');
      localStorage.removeItem('RELOAD');
      this.checkParamsAndSession();
    } else {
      console.log('Reloading window');
      localStorage.setItem('RELOAD', '1');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }
  initIdleMode() {
    console.log('Initiating session idle validation');

  }
  getTotalAmount() {
    if (!this.txnAmount) { this.txnAmount = 0 }
    if (!this.txnFee) { this.txnFee = 0 }
    if (!this.serviceTax) { this.serviceTax = 0 }
    const txnAmount = Number(this.txnAmount);
    const txnFee = Number(this.txnFee);
    const serviceTax = Number(this.serviceTax);
    return this.global.formatAmount(txnAmount + txnFee + serviceTax);
  }
  checkDefaultLanguage() {
    const lang = this.translate.getDefaultLang();
    console.log('Lang: ' + lang);
    if (lang && lang === 'en') {
      this.languageFlag = 'assets/svg/lao-flag.svg';
    } else {
      this.languageFlag = 'assets/svg/eng-flag.svg';
    }
  }
  changeSelectedLanguage() {
    const lang = this.translate.getDefaultLang();
    if (lang && lang === 'en') {
      this.languageFlag = 'assets/svg/eng-flag.svg';
      this.translate.setDefaultLang('la');
      this.translate.use('la');
    } else {
      this.languageFlag = 'assets/svg/lao-flag.svg';
      this.translate.setDefaultLang('en');
      this.translate.use('en');
    }
  }
  clearForm() {
    this.initCardDetails();
    this.mobileNumber = undefined;
    this.accountDetails.accountNo = undefined;
    this.accountDetails.dob = undefined;
  }
  initCardDetails() {
    this.cardPaymentForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.pattern('^[ 0-9]*$'), Validators.minLength(19)]],
      // cardExpiryMonth: ['', [Validators.required, Validators.pattern('^[ 0-9]*$'), Validators.minLength(2)]],
      // cardExpiryYear: ['', [Validators.required, Validators.pattern('^[ 0-9]*$'), Validators.minLength(2)]],
      cardExpiry: ['', [Validators.required, Validators.pattern('^[/0-9]*$'), Validators.minLength(5)]],
      cardCvv: ['', [Validators.required, Validators.pattern('^[0-9]*$'), Validators.minLength(3)]],
      cardHolderName: ['', [Validators.required, Validators.minLength(3)]]
    });
  }
  getWalletLogo(type) {
    if (type === 'lmm' || type === 'LMM') {
      return this.global.getImagePath('m-money.png');
    } else if (type === 'umoney' || type === 'UMONEY') {
      return this.global.getImagePath('umoney.png');
    }

    //Surya anna told to add these three items on 27th oct
    // else if (type === 'truemoney' || type === 'True Money') {
    //   return this.global.getImagePath('truemoney.png');
    // } 
    // else if (type === 'rabbitlinepay' || type === 'Rabbit Line Pay') {
    //   return this.global.getImagePath('rabbit.png');
    // } 
    // else if (type === 'promptpay' || type === 'Prompt Pay') {
    //   return this.global.getImagePath('prompt.png');
    // } 
    else {
      return this.global.getImagePath('ib-logo-60.png');
    }
  }

  getWalletDescription(type) {
    if (type === 'lmm' || type === 'LMM') {
      return this.translate.instant('LMM');
    } else if (type === 'umoney' || type === 'UMONEY') {
      return this.translate.instant('U_MONEY');
    }
    //Surya anna told to add these three items on 27th oct
    // else if (type === 'truemoney' || type === 'True Money') {
    //   return this.translate.instant('TRUE_MONEY');
    // }

    // else if (type === 'rabbitlinepay' || type === 'Rabbit Line Pay') {
    //   return this.translate.instant('RABBIT_LINE_PAY');
    // } 

    // else if (type === 'promptpay' || type === 'Prompt Pay') {
    //   return this.translate.instant('PROMPT_PAY');
    // }
    else {
      return this.translate.instant('IB_BANK');
    }
  }
  getPaymentType(data) {
    this.paymentType = data;
  }

  // Validate session start here
  checkParamsAndSession() {
    this.activatedRoute.queryParams.subscribe((params: any) => {
      console.log('params: ' + JSON.stringify(params));
      if (params.txn) {
        const txn = (params.txn).split(' ').join('+');
        this.global.sessionId = txn;
        this.sessionId = txn;
        this.validateSessionId(txn);
      } else {
        console.log('Invalid session');
        setTimeout(() => {
          this.showAlertAndRedirect(this.translate.instant('ALERT'), this.translate.instant('INVALID_SESSION'), '');
        }, 100);
      }
    });
  }
  validateSessionId(id: string) {
    this.sessionId = id;
    const requestdata = {
      sessionId: id
    };
    const postData = {
      reqdata: this.global.encryptData(requestdata),
      reqtype: "SNV"
    }
    this.rest.postData('pg/api/txn', postData).subscribe((res: any) => {
      const sessionResponse = JSON.parse(this.global.decryptData(res.respdata));
      this.txnResponse = sessionResponse;
      console.log(this.txnResponse + "this.txnResponse values monika");
      console.log(res.respdata + "res.respdata values monika yogi");
      this.global.sessionResp = sessionResponse;
      this.global.txnCurrency = sessionResponse.ccyCode;
      console.log(JSON.stringify(sessionResponse));
      console.log(this.global.sessionResp + "this.global.sessionResp values");
      console.log('Code: ' + sessionResponse.statusCode);
      if (sessionResponse.statusCode == 0 || sessionResponse.statusCode === '0') {
        this.setMerchantLogo(sessionResponse);
        // this.router.navigateByUrl('/payment-selection');
        this.initTxnDetails(sessionResponse);
        // Payment selection page
        setTimeout(() => {
          this.pageStatus = 2;
        }, 10);
      } else {
        this.showAlertAndRedirect(this.translate.instant('INVALID_SESSION'), this.translate.instant('SESSION_EXPIRED_MSG'), sessionResponse.redirecturl);
      }
    }, err => {
      console.log('Error: ' + JSON.stringify(err));
    });
  }
  initTxnDetails(resp: any) {
    console.log(JSON.stringify(resp));
    this.txnAmount = resp.amount;
    this.txnCurrency = resp.ccyCode;
    this.merchantRefNumber = resp.merchrefno;
    this.txnFee = resp.surcharge;
    this.serviceTax = resp.tax;
    this.global.redirectUrl = resp.redirecturl;
  }
  setMerchantLogo(resp: any) {
    this.global.merchantLogo = 'data:image/PNG;base64,' + resp.merchantLogo;
  }
  async showAlertAndRedirect(head: string, body: string, redirectUrl: string) {
    const alert = this.global.showAlert(head, body);
    alert.afterClosed().subscribe(result => {
      console.log('Alert Data: ' + result);
      this.redirectUrl();
    });
  }


  async showAlertAndreset(head: string, body: string) {
    const alert = this.global.showAlert(head, body);
    alert.afterClosed().subscribe(result => {
      console.log('Alert Data: ' + result);

    });
  }
  // Validate session endded

  // Wallet Payment code starts here
  async validateWalletPay() {
    console.log('Payment Type: Wallet');
    // this.pageStatus = 2;
    let requestdata: any = {};
    if (this.walletType == 'ib') {
      requestdata = {
        mobileno: this.mobileNumber,
        sessionId: this.global.sessionId,
        walletType: 'IB_WLT'
      };
    } else if (this.walletType == 'lmm') {
      requestdata = {
        mobileno: this.mobileNumber,
        sessionId: this.global.sessionId,
        walletType: 'LMM_WLT',
        ccy: this.global.sessionResp.ccysymbol,
        amount: this.global.sessionResp.amount
      };
    }
    else if (this.walletType == 'umoney') {
      requestdata = {
        mobileno: this.mobileNumber,
        sessionId: this.global.sessionId,
        walletType: 'UMONEY_WLT'
      };
    }
    console.log('Wallet Requestdata: ' + JSON.stringify(requestdata));
    let postData = {
      reqdata: this.global.encryptData(requestdata),
      reqtype: "WLT"
    };
    requestdata.txnType = 'WLT';
    const otpParams: any = requestdata;

    const loading = this.global.showLoading('');

    this.rest.postData('pg/api/txn', postData).subscribe(res => {
      this.validateWalletPayResp(res, otpParams, loading);
    }, err => {
      loading.close();
      this.global.showErrorToast(err.msg + ', Error Code: ' + err.code);
    });
  }
  async validateWalletPayResp(res, otpParams, loading) {
    loading.close();
    const resp = this.global.decryptData(res.respdata);
    console.log('Wallet Resp: ' + resp);
    const walletPayResp: any = JSON.parse(resp);
    walletPayResp.mobileNo = this.mobileNumber;
    let requiredparams: any = {};
    if (walletPayResp.respcode === '0') {
      this.global.showSuccessToast(walletPayResp.respstatus + '. Mobile: ' + this.mobileNumber);
      if (this.walletType == 'ib') {
        requiredparams = {
          acctno: walletPayResp.acctno,
          cardno: walletPayResp.cardno,
          ccy: walletPayResp.ccy,
          sessionId: this.global.sessionId,
          txnType: 'WLT',
          mobileno: this.mobileNumber,
          mobileNo: this.mobileNumber,
          expdate: "1234",
          cvv: "245",
          walletType: 'IB_WLT',
        };
      } else if (this.walletType == 'lmm') {
        requiredparams = {
          acctno: walletPayResp.acctno,
          cardno: "",
          ccy: walletPayResp.ccy,
          sessionId: this.global.sessionId,
          txnType: 'WLT',
          mobileno: walletPayResp.mobileNo,
          expdate: "1234",
          cvv: "245",
          walletType: 'LMM_WLT',
          serviceTxnId: walletPayResp.serviceTxnId,
        };
      } else if (this.walletType == 'umoney') {
        requiredparams = {
          acctno: walletPayResp.acctno,
          cardno: "",
          ccy: walletPayResp.ccy,
          sessionId: this.global.sessionId,
          txnType: 'WLT',
          mobileno: walletPayResp.mobileNo,
          expdate: "1234",
          cvv: "245",
          walletType: 'UMONEY_WLT'
        };
      }
      requiredparams.mobileNo = walletPayResp.mobileNo;
      console.log('requiredparams: ' + JSON.stringify(requiredparams));
      setTimeout(() => {
        this.showOtpScreen(requiredparams);
      }, 100);
    } else {
      this.global.showFailedAlert(this.translate.instant('ALERT'), this.translate.instant('INVALID_MOBILE_ALERT_MSG'));
    }
  }
  async cancelPayment() {
    const modal = this.global.showConfirmAlert(this.translate.instant('ALERT'), this.translate.instant('CANCEL_PAYMENT_AERT_MSG'));
    modal.afterClosed().subscribe(resp => {
      console.log('Alert Data: ' + resp);
      if (resp && resp === 'Y') {
        this.initCancelPayment();
      }
    });
  }
  redirectUrl() {
    window.location.assign(this.global.redirectUrl);
  }
  async initCancelPayment() {
    let requestdata = {
      sessionId: this.sessionId
    }

    let postData = {
      reqdata: this.global.encryptData(requestdata),
      reqtype: "CANCEL"
    }
    this.rest.postData('pg/api/txn', (postData)).subscribe((res: any) => {
      if (res) {
        let cancelTxnDetail = JSON.parse(this.global.decryptData(res.respdata));
        console.log("cancelTxnDetail: " + JSON.stringify(cancelTxnDetail));
        console.log("value of merchant resp: " + cancelTxnDetail.merchrespdata);
        const postData1 = {
          respdata: cancelTxnDetail.merchrespdata
        }
        console.log('TxnResponse: ' + JSON.stringify(this.txnResponse));
        this.rest.postDataToUrl(this.txnResponse.callbackurl, (postData1)).subscribe(res => {
          // console.log("console in res" + res);
          window.location.assign(this.global.redirectUrl);
        }, err => {
          console.log('Error occured while canceling txn');
          window.location.assign(this.global.redirectUrl);
        });
        // setTimeout(() => this.router.navigate(['/txnresult'], { queryParams: { txn: 'cancel' } }), 1000);
      }

    });
  }
  showWalletSelectionScreen() {
    const requiredparams = [
      { walletType: 'ib', walletName: this.translate.instant('IB_BANK'), walletLogo: this.getWalletLogo('ib') },
      { walletType: 'lmm', walletName: this.translate.instant('LMM'), walletLogo: this.getWalletLogo('lmm') },
      { walletType: 'umoney', walletName: this.translate.instant('U_MONEY'), walletLogo: this.getWalletLogo('umoney') },

      //Surya anna told to add these three items on 27th oct
      // { walletType: 'truemoney', walletName: this.translate.instant('TRUE_MONEY'), walletLogo: this.getWalletLogo('truemoney') },
      // { walletType: 'rabbitlinepay', walletName: this.translate.instant('RABBIT_LINE_PAY'), walletLogo: this.getWalletLogo('rabbitlinepay') },
      // { walletType: 'promptpay', walletName: this.translate.instant('PROMPT_PAY'), walletLogo: this.getWalletLogo('promptpay') },

    ];
    const otpPage = this.global.showWalletScreen(requiredparams);
    otpPage.afterClosed().subscribe(result => {
      if (result && result.length > 0) {
        console.log('Alert Data: ' + JSON.stringify(result[0]));
        this.walletType = result[0].walletType;
      }
      // this.checkOTPResponse(result);
    });
  }

  showOtpScreen(requiredparams) {
    console.log('Opening OTP Page');
    // const otpPage = this.global.showOtpAlert(requiredparams);
    /* const config: MatDialogConfig= {
      disableClose: false,
      autoFocus: true,
      hasBackdrop: false,
      panelClass: 'otp-box',
      width: '450px',
      data: requiredparams,
    }
    const otpPage = this.dialog.open(
      OtpComponent, config);
    otpPage.afterClosed().subscribe(result => {
      console.log('Alert Data: ' + JSON.stringify(result));
      this.checkOTPResponse(result);
    }); */
    this.params = requiredparams;
    this.pageStatus = 3; // OTP Screen
    this.initOtpTimer();
    this.startTimer();
  }
  checkOTPResponse(otpResp) {
    this.txnResp = otpResp;
    console.log(this.txnResp + "response at in the otp session yoga");
    this.timer = 10;
    this.initTimer();
    if (otpResp.statusCode === '0' || otpResp.statusCode == 0) {
      this.txnStatus = 'S';
    } else {
      this.txnStatus = 'F';
    }
    if (otpResp.paymentMode == 'OFF') {
      this.resultScreenType = 'OFFLINE';
      this.download();
    } else {
      this.resultScreenType = 'RESULT';
    }
    if (otpResp.paymentMode == 'ON') {
      setTimeout(() => {
        this.redirectUrl();
      }, 1000 * 10);
    }
    this.pageStatus = 4;
  }
  getFopramettedDate(date: Date) {
    const newDate = date;
    const year = date.getFullYear() + '';
    const mm = date.getMonth();
    const month = (mm + 1 < 10) ? '0' + (mm + 1) : (mm + 1);
    const dd = date.getDate();
    const day = (dd < 10) ? ('0' + dd) : dd;

    console.log('Year:' + year);
    console.log('Month:' + month);
    console.log('Day:' + day);
    console.log('Formatted Date:' + year + month + day);
    return year + month + day;
  }
  /** Start Account Payment */
  validateAccountPayFields() {
    console.log('Validating account fields');
    const accountNo = this.accountDetails.accountNo;
    const dob = this.accountDetails.dob;
    console.log('accountNo: ' + this.accountDetails.accountNo);
    const formattedDate = this.getFopramettedDate(this.accountDetails.dob);
    console.log('DOB: ' + formattedDate);
    if (accountNo === '' || accountNo === undefined || accountNo === null) {
      this.global.showErrorToast(this.translate.instant('ACC_NUM_EMPTY_MSG'));
    } else if (accountNo.length < 8) {
      this.global.showErrorToast(this.translate.instant('ACC_NUM_LENGTH_MSG'));
    } else if (!dob) {
      this.global.showErrorToast(this.translate.instant('DOB_EMPTY_MSG'));
    } else if (formattedDate.length < 8 || formattedDate.length > 10) {
      this.global.showErrorToast(this.translate.instant('INVALID_DOB'));
    } else {
      this.validateAccountPay();
    }
  }
  async validateAccountPay() {
    console.log('Account Payment');
    // this.pageStatus = 2;
    const accNo = this.accountDetails.accountNo; //'0100000596892 ';
    const dob = this.getFopramettedDate(this.accountDetails.dob); // '19730121';
    const requestdata = {
      accountNo: accNo,
      dob: dob,
      sessionId: this.global.sessionId
    };
    const loading = await this.global.showLoading('');
    console.log('Acc Req Data: ' + JSON.stringify(requestdata));
    const postData = {
      reqdata: this.global.encryptData(requestdata),
      reqtype: "ACCT"
    };
    this.rest.postData('pg/api/txn', postData).subscribe(res => {
      this.validateAccountPayResp(res, loading);
    }, err => {
      console.log('Error Occured while validating account details');
      loading.close();
      this.global.showErrorToast(err.msg + ', Error Code: ' + err.code);
    });
  }
  async validateAccountPayResp(resp, loading) {
    loading.close();
    const decryptedAccDetails = JSON.parse(this.global.decryptData(resp.respdata));
    console.log('After decrypt account details: ' + JSON.stringify(decryptedAccDetails));
    this.mobileNumber = decryptedAccDetails.phone;
    if (decryptedAccDetails.respcode === '0' || decryptedAccDetails.respcode == 0) {
      const cnfData = {
        accNo: this.accountDetails.accountNo,
        dob: this.getFopramettedDate(this.accountDetails.dob),
        mobileNo: decryptedAccDetails.phone,
        customerName: decryptedAccDetails.accountName
      };
      this.showAccountConfirmationPage(cnfData);
    } else {
      this.global.showErrorToast(decryptedAccDetails.respstatus);
    }
  }
  async showAccountConfirmationPage(cnfData) {
    const acc = this.global.showCnfAccountPage(cnfData);
    acc.afterClosed().subscribe(result => {
      console.log('Cnf Acc Data: ' + result);
      if (result && result === 'Y') {
        this.generateOtpForAccPay(cnfData);
      }
    });
  }
  async generateOtpForAccPay(data) {
    const loading = await this.global.showLoading('');
    console.log('Account details confirmed, Proceed to Get Account OTP & Show OTP Screen');
    const requestData = {
      mobileNo: data.mobileNo,
      sessionId: this.global.sessionId
    }
    console.log('Get OTP For Account type payment: ' + JSON.stringify(requestData));
    let postData = {
      reqdata: this.global.encryptData(requestData),
      reqtype: 'ACCT_OTP'
    }
    this.rest.postData('pg/api/txn', postData).subscribe((res: any) => {
      // Display OTP Screen
      const resp = JSON.parse(this.global.decryptData(res.respdata))
      this.displayOtpScreenForAccPay(loading, data)
    }, err => {
      loading.close();
      this.global.showErrorToast(err.msg + ', Error Code: ' + err.code);
    });
  }

  async displayOtpScreenForAccPay(loading, data) {
    loading.close()
    const otpParams = data;
    otpParams.txnType = 'ACCT';
    // this.showOtpScreen(otpParams);
    setTimeout(() => {
      this.showOtpScreen(otpParams);
    }, 100);
  }
  /* End of acc payment */



  /** Credit Card Payment Starts here */

  creditCardNumberSpacing() {
    const input = this.ccNumberField.nativeElement;
    const { selectionStart } = input;
    const { cardNumber } = this.cardPaymentForm.controls;

    let trimmedCardNum = cardNumber.value.replace(/\s+/g, '');


    if (trimmedCardNum.length == 6) {
      this.functiontovalidationpin(trimmedCardNum);
    }
    if (trimmedCardNum.length > 16) {
      trimmedCardNum = trimmedCardNum.substr(0, 16);

    }

    /* Handle American Express 4-6-5 spacing */
    /* const partitions = trimmedCardNum.startsWith('34') || trimmedCardNum.startsWith('37') 
                       ? [4,6,5]
                       : [4,4,4,4]; */

    const partitions = [4, 4, 4, 4];
    const numbers = [];
    let position = 0;
    partitions.forEach(partition => {
      const part = trimmedCardNum.substr(position, partition);
      if (part) numbers.push(part);
      position += partition;
    })

    cardNumber.setValue(numbers.join(' '));

    /* Handle caret position if user edits the number later */
    if (selectionStart < cardNumber.value.length - 1) {
      input.setSelectionRange(selectionStart, selectionStart, 'none');
    }
  }
  creditCardExpiryFormator() {
    const input = this.ccExpiryField.nativeElement;
    const { selectionStart } = input;
    const { cardExpiry } = this.cardPaymentForm.controls;

    let trimmedCardExpiry = cardExpiry.value.replace(/\s+/g, '');

    if (trimmedCardExpiry.length > 4) {
      trimmedCardExpiry = trimmedCardExpiry.substr(0, 4);
    }

    const partitions = [2, 2];
    const numbers = [];
    let position = 0;
    partitions.forEach(partition => {
      const part = trimmedCardExpiry.substr(position, partition);
      if (part) numbers.push(part);
      position += partition;
    })

    cardExpiry.setValue(numbers.join('/'));

    /* Handle caret position if user edits the number later */
    if (selectionStart < cardExpiry.value.length - 1) {
      input.setSelectionRange(selectionStart, selectionStart, 'none');
    }
  }
  formatCardExpiry(event) {
    let inputChar = String.fromCharCode(event.keyCode);
    let code = event.keyCode;
    let allowedKeys = [8];
    if (allowedKeys.indexOf(code) !== -1) {
      return;
    }

    event.target.value = event.target.value.replace(
      /^([1-9]\/|[2-9])$/g, '0$1/' // 3 > 03/
    ).replace(
      /^(0[1-9]|1[0-2])$/g, '$1/' // 11 > 11/
    ).replace(
      /^([0-1])([3-9])$/g, '0$1/$2' // 13 > 01/3
    ).replace(
      /^(0?[1-9]|1[0-2])([0-9]{2})$/g, '$1/$2' // 141 > 01/41
    ).replace(
      /^([0]+)\/|[0]+$/g, '0' // 0/ > 0 and 00 > 0
    ).replace(
      /[^\d\/]|^[\/]*$/g, '' // To allow only digits and `/`
    ).replace(
      /\/\//g, '/' // Prevent entering more than 1 `/`
    );
  }

  functiontovalidationpin(trimmedCardNumforbin) {

    if (this.global.sessionResp.onusenabled == '1' && this.global.sessionResp.offusenabled == '1') {
      if (trimmedCardNumforbin == this.global.sessionResp.onusbinlist || this.global.sessionResp.offusbinlist.includes(trimmedCardNumforbin)) {

      } else {
        this.showAlertAndreset(this.translate.instant('ALERT'), this.translate.instant('This Card Bin is not allowed'));
      }
    }
    else if (this.global.sessionResp.onusenabled == '1') {
      if (trimmedCardNumforbin == this.global.sessionResp.onusbinlist) {

      } else {
        this.showAlertAndreset(this.translate.instant('ALERT'), this.translate.instant('Off Us transaction disabled'));
      }

    } else if (this.global.sessionResp.offusenabled == '1') {

      if (this.global.sessionResp.offusbinlist.includes(trimmedCardNumforbin)) {

      } else {
        this.showAlertAndreset(this.translate.instant('ALERT'), this.translate.instant('This bin is disabled'));
      }

    }


  }

  getCardImage() {
    const { cardNumber } = this.cardPaymentForm.controls;
    let trimmedCardNum = cardNumber.value.replace(/\s+/g, '');
    if (trimmedCardNum.startsWith('4')) {
      return this.global.getImagePath('visa-card.png');
    } else if (trimmedCardNum.startsWith('2') || trimmedCardNum.startsWith('5')) {
      return this.global.getImagePath('master-card.png');
    } else if (trimmedCardNum.startsWith('6')) {
      return this.global.getImagePath('union-card.png');
    } else if (trimmedCardNum.startsWith('7')) {
      return this.global.getImagePath('iblogoimage.jpg');
    } else {
      return this.global.getImagePath('icons/card-light.png');
    }
  }


  validateCardForm() {
    this.isSubmitted = true;
    if (!this.cardPaymentForm.valid) {
      console.log('Please provide all the required values!');
      this.global.showErrorToast('PROVIDE_REQUIRED_VALUES');
      return false;
    } else {
      console.log(this.cardPaymentForm.value);
      this.proceedCardPayment(this.cardPaymentForm.value);
    }
  }
  get errorControl() {
    return this.cardPaymentForm.controls;
  }
  getErrorCard() {
    return this.cardPaymentForm.get('cardNumber').hasError('required') ? 'Card number cannot be left blank' :
      this.cardPaymentForm.get('cardNumber').hasError('pattern') ? 'Invalid Card number' :
        this.cardPaymentForm.get('cardNumber').hasError('minLength') ? 'Invalid card number' : '';
  }
  getErrorCardName() {
    return this.cardPaymentForm.get('cardHolderName').hasError('required') ? 'Cardholder name cannot be left blank' :
      this.cardPaymentForm.get('cardHolderName').hasError('pattern') ? 'Invalid Cardholder name' :
        this.cardPaymentForm.get('cardHolderName').hasError('minLength') ? 'Invalid cardholder' : '';
  }
  getErrorCardCvv() {
    return this.cardPaymentForm.get('cardCvv').hasError('required') ? 'Card CVV cannot be left blank' :
      this.cardPaymentForm.get('cardCvv').hasError('pattern') ? 'Invalid CVV' :
        this.cardPaymentForm.get('cardCvv').hasError('minLength') ? 'Invalid CVV' : '';
  }
  getErrorCardExpiry() {
    return this.cardPaymentForm.get('cardExpiry').hasError('required') ? 'Card Expiry cannot be left blank' :
      this.cardPaymentForm.get('cardExpiry').hasError('pattern') ? 'Invalid Expiry Date' :
        this.cardPaymentForm.get('cardExpiry').hasError('minLength') ? 'Invalid Expiry Date' : '';
  }
  setMonthAndYear(event, dp) {

  }
  validCardDetails() {
    const valid = this.cardPaymentForm.controls['cardCvv'].valid &&
      this.cardPaymentForm.controls['cardNumber'].valid &&
      this.cardPaymentForm.controls['cardHolderName'].valid &&
      this.cardPaymentForm.controls['cardExpiry'].valid;
    // console.log('Valid Card Details: ' + valid);
    return valid;
  }
  async proceedCardPayment(cardDetail) {
    console.log('cardDetail: ' + JSON.stringify(cardDetail));
    const cardNumber = cardDetail.cardNumber;
    /* const cardExpiryMonth = cardDetail.cardExpiryMonth;
    const cardExpiryYear = cardDetail.cardExpiryYear; */
    const expiry = cardDetail.cardExpiry.replaceAll('/', '');
    const mm = expiry.substr(0, 2);
    const yy = expiry.substr(2, 2);
    const cardExpiry = yy + '' + mm;
    const cardCvv = cardDetail.cardCvv;
    const cardHolderName = cardDetail.cardHolderName;

    const cardNmbr = cardNumber.replace(/\s+/g, '');
    console.log('Actual Card Number: ' + cardNmbr);
    if (cardNmbr.substr(0, 1) === '4') {
      this.isOffus = '2';
    } else {
      this.isOffus = '1';
    }
    // const cardNmbr = cardNumber; // '4916486411972975'; // '7777770100097249';
    // const cardExpiry = cardExpiryYear + '' + cardExpiryMonth; // '0424';
    const cvv = cardCvv; // '123';
    const serviceName = this.isOffus === '1' ? 'CRD' : '3DS_SECURE';
    const customerNameOnCard = cardHolderName;
    const requestData = {
      cardno: cardNmbr,
      sessionId: this.sessionId,
      cvv: cvv,
      expdate: cardExpiry,
      customerName: customerNameOnCard,
      txnType: "VISA"
    }
    console.log('Card Request Data: ' + JSON.stringify(requestData));
    const postData = {
      reqdata: this.global.encryptData(requestData),
      reqtype: serviceName
    }
    const otpParams: any = requestData;
    otpParams.txnType = serviceName;

    const loading = await this.global.showLoading('');

    this.rest.postData('pg/api/txn', postData).subscribe((res: any) => {
      const cardtransactiondetail = JSON.parse(this.global.decryptData(res.respdata));
      console.log(cardtransactiondetail + "cardtransactiondetail details printed here");
      if (cardtransactiondetail.respcode === '0') {
        if (serviceName === 'CRD') {
          this.global.showSuccessToast(cardtransactiondetail.respstatus + '. Mobile: ' + cardtransactiondetail.mobileNo);
          otpParams.mobileNo = cardtransactiondetail.mobileNo;
          this.mobileNumber = cardtransactiondetail.mobileNo;
          // this.showOtpScreen(otpParams);
          setTimeout(() => {
            this.showOtpScreen(otpParams);
          }, 100);
        } else {
          const otpDataFor3Ds = {
            cardno: cardNmbr,
            sessionId: this.global.sessionId,
            cvv: cvv,
            expdate: cardExpiry,
            customerName: customerNameOnCard,
            txntype: 'CRD',
            mobileno: cardtransactiondetail.mobileNo,
            threeDSServerTransID: cardtransactiondetail.rv3,
            acsUrl: cardtransactiondetail.rv1, // 'https://10.221.1.207:9002/acs/challenge', 
            base64Encoded: cardtransactiondetail.rv2,

          };
          this.global.otpRespParams = otpDataFor3Ds;
          if (cardtransactiondetail.rv5 === '1') {
            this.router.navigate(['/three-ds']);
          } else if (cardtransactiondetail.rv5 === '0') {
            const respFirectionless = cardtransactiondetail;
            this.txnResp = respFirectionless.merchantSessionValidateResp;
            this.pageStatus = 4;
            this.sendCallBackUrl(cardtransactiondetail.merchantSessionValidateResp.merchrespdata);
          }

        }

      } else {
        this.global.showErrorToast(cardtransactiondetail.respstatus);
      }
      loading.close();
      console.log('cardtransactiondetail: ' + JSON.stringify(cardtransactiondetail));
      const respFirectionless = this.global.decryptData(cardtransactiondetail.rv4);
      console.log(respFirectionless + "response of firectionless");
      this.txnResp = respFirectionless;
    }, err => {
      loading.close();
      this.global.showErrorToast(err.msg + ', Error Code: ' + err.code);
    });

  }
  /** Credit Card code Ended */

  initTimer() {
    this.timer -= 1;
    if (this.timer <= 0) {
      this.redirectUrl();
    }
    setTimeout(() => {
      if (this.timer > 0) {
        this.initTimer();
      }
    }, 1000);
  }

  /** OTP Code goes here */
  initOtpTimer() {
    this.otpTimer = 30;
  }
  startTimer() {
    this.otpTimer--;
    setTimeout(() => {
      if (this.otpTimer >= 0) {
        this.otpTimerLabel = '00:' + this.checkForSingleDigits();
        this.startTimer();
      }
    }, 1000);
  }
  checkForSingleDigits() {
    if (this.otpTimer > 9) {
      return this.otpTimer;
    } else {
      return '0' + this.otpTimer;
    }
  }
  async resendOtp() {
    console.log(this.otpTimer);
    this.initOtpTimer();
    this.startTimer();
    const loading = await this.global.showLoading('');
    const requestdata = {
      mobileno: this.mobileNumber,
      sessionId: this.sessionId,
      reSendOtp: 'true'
    }
    let postData = {
      reqdata: this.global.encryptData(requestdata),
      reqtype: 'RESEND_OTP'
    }
    this.rest.postData('pg/api/txn', (postData)).subscribe((res: any) => {
      loading.close();
      this.resendOtpResponse = JSON.parse(this.global.decryptData(res.respdata));
      if (this.resendOtpResponse.statusCode == 0) {
        this.global.showSuccessToast(this.translate.instant('OTP_SENT_CHECK_MOBILE'));
      } else {
        this.global.showErrorToast("Resend otp failed");
      }
    }, err => {
      loading.close();
      this.global.showErrorToast('Failed to resend OTP');
    });
  }
  changeView(showOtp: any) {
    console.log('Before: ' + this.showOtp);
    this.showOtp = !this.showOtp;
    console.log('After: ' + this.showOtp);
  }
  async verifyOtpForm() {
    if (!this.otp || this.otp.length < 6) {
      console.log('Inavlid OTP');
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
      this.global.showAlert(this.translate.instant('ALERT'), this.translate.instant('SELECT_VALID_TXN_TYPE'));
      this.pageStatus = 2;
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
  async sendCallBackUrl(merchantData: any) {
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

  checkOtpResp(otpResp: any, loading: any) {
    loading.close();
    if (otpResp.statusCode === '1' || otpResp.statusCode == 1) {
      this.global.showErrorToast(this.translate.instant('OTP_VERIFY_FAILED_TRY_AGAIN'));
    } else if (otpResp.statusCode === '3' || otpResp.statusCode == 3) {
      this.global.showAlert(this.translate.instant('ALERT'), this.translate.instant('INTERNAL_ISSUE_MSG'));
    } else {
      this.checkOTPResponse(otpResp)
    }
  }
  /** OTP Code ends here */
  /** Download pdf code goes here */
  download() {
    this.global.merchantLogo;
    console.log(this.global.merchantLogo);
    let docDefinition = {
      styles: {
        header: {
          fontSize: 18, bold: true,
          margin: [50, 10, 50, 10], alignment: 'center', color: '#401164'
        },
        subheader: {
          fontSize: 14, bold: true, margin: [0, 10, 0, 5]
        },
        tableBorder: {
          margin: [0, 5, 0, 15]
        },
        tableHeader: {
          bold: true, fontSize: 10, color: '#44736c'
        },
        tableValue: {
          fontSize: 10, color: '#000', bold: true,
          margin: [15, 5, 15, 5]
        },
        tableData: {
          fontSize: 10, color: '#f36d0a',
          margin: [15, 5, 15, 5]
        },
        watermarkStyle: {
          color: 'grey', bold: true, italics: false
        }
      },
      defaultStyle: {
        // alignment: 'justify'
      },
      header: {
        columns: [
          { text: 'Transaction Invoice', style: 'header' }
        ]
      },
      watermark: { text: 'Indochina Bank', style: 'watermarkStyle', opacity: 0.1 },
      content: [
        // {
        //   image: this.global.merchantLogo,
        //   width: 100
        // },
        {
          text: 'Transaction Details:',
          style: 'subheader',
          color: '#401164',
        },
        {
          style: 'tableBorder',
          table: {
            headerRows: 1,
            widths: ['*', '*'],
            body: [
              [
                { text: 'TXN REF NO', style: 'tableData', alignment: 'left' },
                { text: this.txnResp.txnrefno, style: 'tableValue', alignment: 'left' }
              ],
              [
                { text: 'Customer id', style: 'tableData', alignment: 'left' },
                { text: this.txnResp.customerId, style: 'tableValue', alignment: 'left' }
              ],
              [
                { text: 'TXN STATUS', style: 'tableData', alignment: 'left' },
                { text: this.txnResp.statusMsg, style: 'tableValue', alignment: 'left' }
              ],
              [
                { text: 'MERCHANT REF NO', style: 'tableData', alignment: 'left' },
                { text: this.txnResp.merchrefno, style: 'tableValue', alignment: 'left' }
              ],
              [
                { text: 'TXN AMOUNT', style: 'tableData', alignment: 'left' },
                { text: this.txnResp.ccyCode + " " + this.txnResp.amount, style: 'tableValue', alignment: 'left' }
              ],
              [
                { text: 'DATE', style: 'tableData', alignment: 'left' },
                { text: this.txnResp.txndatetime, style: 'tableValue', alignment: 'left' }
              ],
              [
                { text: 'PAYMENT MODE', style: 'tableData', alignment: 'left' },
                { text: this.txnResp.paymentMode, style: 'tableValue', alignment: 'left' }
              ],
            ]
          }
        }
      ],
    }
    pdfMake.createPdf(docDefinition).download('invoice' + new Date().toISOString() + '.pdf');
  }
  /** Download pdf code ends here */
}


export const DOB_FORMAT = {
  parse: {
    dateInput: 'LL'
  },
  display: {
    dateInput: 'MM/DD/YYYY',
    monthYearLabel: 'YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY'
  }
};