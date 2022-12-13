import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as CryptoJS from 'crypto-js';
import { environment } from 'src/environments/environment';
import { OtpComponent } from '../alerts/otp/otp.component';
import { AlertComponent } from '../alerts/alert/alert.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WalletSelectionComponent } from '../alerts/wallet-selection/wallet-selection.component';
import { CnfAccountComponent } from '../alerts/cnf-account/cnf-account.component';
@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  redirectUrl = 'https://ibcooluat.iblaos.com/ecom/';
  imagePath = 'https://ibcooluat.iblaos.com/ibpgimages/';
  txnCurrency = '418';
  merchantLogo: string = '';
  sessionResp: any = {};
  sessionId: any;
  alertType: any;
  alertCss: string = '';
  otpRespParams: any = {};
  txnResp: any = {};
  selectedLanguage: any = 'ພາສາ';
  threeDsResp: any;

  constructor(
    private _snackBar: MatSnackBar,
    public dialog: MatDialog) {
    this.disableConsoleInProduction();
  }

  disableConsoleInProduction(): void {
    if (environment.production) {
      console.warn(`🚨 Console output is disabled on production!`);
      console.log = function (): void { };
      console.error = function (): void { };
      console.debug = function (): void { };
      console.warn = function (): void { };
      console.info = function (): void { };
    } else {
      console.log('UAT mode found');
    }
  }

  showAlert(head: string, body: string) {
    const dialogRef = this.dialog.open(
      AlertComponent, {
      hasBackdrop: true,
      disableClose: true,
      panelClass: 'alert-box',
      width: '400px',
      data: { title: head, message: body, type: 'ALERT' },
    });

    return dialogRef;
  }
  showFailedAlert(head: string, body: string) {
    const dialogRef = this.dialog.open(
      AlertComponent, {
      hasBackdrop: true,
      disableClose: true,
      panelClass: 'alert-box',
      width: '400px',
      data: { title: head, message: body, type: 'ALERT' },
    });

    return dialogRef;
  }
  showSuccessToast(msg: string) {
    this._snackBar.open(msg, 'OK', {
      duration: 5000,
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }
  showErrorToast(msg: string) {
    this._snackBar.open(msg, 'OK', {
      duration: 5000,
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
  showLoading(text: any) {
    const dialogRef = this.dialog.open(
      AlertComponent, {
      hasBackdrop: true,
      disableClose: true,
      panelClass: 'loading-box',
      width: '120px',
      data: { text: text, type: 'LOADING' },
    });

    return dialogRef;
  }
  showConfirmAlert(head: string, body: string) {
    const dialogRef = this.dialog.open(
      AlertComponent, {
      hasBackdrop: true,
      disableClose: true,
      panelClass: 'alert-box',
      width: '450px',
      data: { title: head, message: body, type: 'CNF_ALERT' },
    });
    return dialogRef;
    /* dialogRef.afterClosed().subscribe(result => {
      console.log('Alert Data: ' + result);
      return result;
    });
    return ''; */
  }
  showWalletScreen(params: any) {
    const dialogRef = this.dialog.open(
      WalletSelectionComponent, {
      hasBackdrop: true,
      disableClose: true,
      panelClass: 'wallet-box',
      width: '450px',
      data: params,
    });
    return dialogRef;
  }
  showOtpAlert(params: any) {
    const dialogRef = this.dialog.open(
      OtpComponent, {
      hasBackdrop: true,
      disableClose: true,
      panelClass: 'otp-box',
      width: '450px',
      data: params,
    });
    return dialogRef;
  }
  showCnfAccountPage(params: any) {
    const dialogRef = this.dialog.open(
      CnfAccountComponent, {
      hasBackdrop: true,
      disableClose: true,
      panelClass: 'otp-box',
      width: '450px',
      data: params,
    });
    return dialogRef;
  }

  public getImagePath(img: string) {
    return this.imagePath + img;
  }

  encryptData(data: any) {
    var encryptedBase64Key = "aWJwZ3JlcXJlc3AxMjM0NQ==";
    var parsedBase64Key = CryptoJS.enc.Base64.parse(encryptedBase64Key);
    var encryptedData = null;
    {

      encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), parsedBase64Key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      });

      return encryptedData.toString();

    }
  }
  decryptData(data: any) {
    // Decryption process
    const encryptedBase64Key = "aWJwZ3JlcXJlc3AxMjM0NQ==";
    const parsedBase64Key = CryptoJS.enc.Base64.parse(encryptedBase64Key);
    const encryptedCipherText = data;
    const decryptedData = CryptoJS.AES.decrypt(encryptedCipherText, parsedBase64Key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });

    const decryptedText = decryptedData.toString(CryptoJS.enc.Utf8);

    return decryptedText.toString();

  }

  public getCurrencyText(currency: string) {
    let cur = 'LAK';
    if (currency === 'LAK' || currency === '418') {
      cur = 'LAK';
      return cur;
    } else if (currency === 'THB' || currency === '764') {
      cur = 'THB';
      return cur;
    } else if (currency === 'USD' || currency === '840') {
      cur = 'USD';
      return cur;
    } else {
      return currency;
    }
  }
  getCurrencyCode(currency: string) {
    let cur = '418';
    if (currency === 'LAK' || currency === '418') {
      cur = '418';
      return cur;
    } else if (currency === 'THB' || currency === '764') {
      cur = '764';
      return cur;
    } else if (currency === 'USD' || currency === '840') {
      cur = '840';
      return cur;
    } else {
      return currency;
    }
  }
  public formatAmount(num: any) {
    if (!num) {
      return;
    }
    let numParts;
    const num1 = num + '';
    numParts = num1.toString().split('.');
    numParts[0] = numParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return numParts.join('.');
  }


  maskAccount(data: string) {
    const firstFour = data.substr(0, 4);
    const lastTwo = data.substr(data.length - 2);
    return firstFour + '-XXXX-XXX-' + lastTwo;
  }

  maskMobile(data: string) {
    const firstThree = data.substr(0, 3);
    const lastTwo = data.substr(data.length - 2);
    return firstThree + 'XXXXX' + lastTwo;
  }


}
