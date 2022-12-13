import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalService } from '../services/global.service';
import { RestService } from '../services/rest/rest.service';
declare function createIFrameAndInit3DSChallengeRequest(url: any, base64Encoded: any): any;

@Component({
  selector: 'app-three-ds',
  templateUrl: './three-ds.component.html',
  styleUrls: ['./three-ds.component.scss']
})
export class ThreeDsComponent implements OnInit {
  _3dsPlayLoad: any;
  txndata: any;
  selectedLang: any = 'ENG';
  languageselected: any;
  timer: any = 8;
  transactiondetails: any;
  sessionId: any;
  showPaymnetpage: boolean = false;
  loadingTimer = 5;
  cardDetails: any;
  constructor(
    private global: GlobalService,
    private rest: RestService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this._3dsPlayLoad = this.global.otpRespParams;
    this.showPaymnetpage = true;
    this.openSdk(this._3dsPlayLoad.acsUrl, this._3dsPlayLoad.base64Encoded);
    setTimeout(() => {
      this.checkRespStatus();
    }, 5000);
  }
  test() {
    const data = { "respData": "l7LQiyFOf5ZJMX7cSG9Tz1VxTOQA2WCMqmkCVl4eK+XriKIlrr4zX136wNcs8TsXGF1ZZs1OmO0spTu13lKO7OLHFIRoPEmhYDRQVidiBNfRko1h1zuBMpmQvQwBi0MBpX1ihioESxkBZ9avOorWBZL87XteCWq+cK3OTOlPTTESpmkw2UFd6jX4UDeZHxl0/fbWnabwg0OFwsh+/Ne+r8neSDoO0xYZ9+Gv+D9tuQUYjJ3/Lql6X0eG4stVrHIyyd9n/VpwoDXpwDtvzVbjOS3+0tfaGJmDYnWiIjtf1hImSa11urY4yM0mNgK6wmx8GGvRWzut+13M//EhCeauYEzrsb/D9Zy8gl9oMWY6ts7zk6ru39COP9Ixm/qwKhmlRn6TnLB6/0TvzcvnZ+UsOB01dTNWA11YiTxiAwBkIWUc9yBZH/FzvYmU6NA8CgYht1QXHpWIANhpkLA3wKa3uOK9FHyjKVO08CtjR3EhyyY/JjQETVzRPC2pQOuvaAjha06+nc+IhY785w45h3xEcVvuiTmhuaUyb/uRKqot3GeSzrPY/t//BcpN9Trbe0JRShh4yb86OudxdC36U26SfR3gxkENGSGHonbZI4aGSN3pVRxqWKlAgDZWqymZewPGpYYUWuhY4nvPz93e9maG3Bfs5Ayc3IEpeq0xBPnC1y4MGUgdvCWzpQ9jj0ZUmnW6ld5adeILH0gebCg2zPA5gIHfHJyMluZ7WcS9FjcNOys=" };
    const decryptedData = this.global.decryptData(data.respData);
    console.log('Decrypted Data: ' + decryptedData);
    this.global.threeDsResp = JSON.parse(decryptedData);
    this.router.navigate(['/']);
  }
  openSdk(url, data) {
    createIFrameAndInit3DSChallengeRequest(url, data)
  }
  checkRespStatus() {
    const data = {
      "sessionId": this.global.otpRespParams.sessionId,
      "cardNo": this.global.otpRespParams.cardno,
      "cvv": this.global.otpRespParams.cvv,
      "expdate": this.global.otpRespParams.expdate,
      "threeDSServerTransID": this.global.otpRespParams.threeDSServerTransID,
       "txnType": "VISA"
    };
    console.log('Three DS Data: ' + JSON.stringify(data));
    const postData = {
      reqtype: 'STATUS',
      reqdata: this.global.encryptData(data)
    };
    this.rest.postData('pg/api/txn', postData).subscribe((res: any) => {
      const decryptData = JSON.parse(this.global.decryptData(res.respData));
      console.log('Status Resp: ' + JSON.stringify(decryptData));
      this.global.threeDsResp = (decryptData);
      this.removeIframe();
      this.router.navigate(['/']);
    }, err => {
      this.global.showErrorToast(err.msg + ', Error Code: ' + err.code);
    });
  }
  removeIframe() {
    var iframes = document.querySelectorAll('iframe');
    for (var i = 0; i < iframes.length; i++) {
      iframes[i].parentNode.removeChild(iframes[i]);
    }
  }
}
