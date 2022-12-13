
import { Platform } from '@angular/cdk/platform';
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'pgui';

  constructor(
    private translate: TranslateService,
    private platform: Platform
  ) {
    this.setDefaultLanguage();
  }
  restrictRightClick() {
    // document.addEventListener('contextmenu', event => event.preventDefault()); //(for to restrict right click)
  }
  setDefaultLanguage() {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }
  disableBackButton() {

  }
}

