import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { map, catchError, retry } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class RestService {
  baseUrl = 'https://ibcooluat.iblaos.com/pglandingserver/'; 
  
  // baseUrl = 'https://ibpg.iblaos.com/pglandingserver/'; 

  // baseUrl='http://172.16.10.173:5555/' vinoth local service url

  
  // baseUrl='http://172.16.10.253:5555/' mine local service url

  constructor(
    private httpClient: HttpClient
  ) { }
  postData(suburl:string, postData:any): Observable<{}> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    const finalUrl = this.baseUrl + suburl;
    console.log('Final URL: ' + finalUrl);
    console.log('Post Data: ' + JSON.stringify(postData));
    return this.httpClient
      .post<{}>(finalUrl, JSON.stringify(postData), { headers: headers })
      .pipe(
        map(this.extractData),
        catchError(this.handleError)
      );
  }
  postDataToUrl(subUrl: any, postData: any): Observable<{}> {
    const finalUrl = subUrl;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    console.log('Url : ' + finalUrl);
    console.log('postData : ' + JSON.stringify(postData));
    return this.httpClient.post(finalUrl, JSON.stringify(postData), {headers: headers}).pipe(
        map(this.extractData),
        catchError(this.handleError)
    );
  }
  private extractData(res: any) {
    console.log('Result : ' + JSON.stringify(res));
    let body = res;
    return body || {};
  }
  // Handle API errors
  handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error.error}`);
      const msg = (error.error.error);
      console.error('Error Msg: ' + msg);
    }
    // return an observable with a user-facing error message
    const msg = {
      msg: error.error.error,
      code: error.status
    }
    return throwError(msg);
  };
}
