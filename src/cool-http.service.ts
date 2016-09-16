import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import { HttpHeader } from './http-header.model';
import { CookieStore } from './cookie-store.service';
import { IRequestInterceptor } from './request-interceptor.interface';
import { IResponseInterceptor } from './response-interceptor.interface';

interface Func<T, T1, T2, TResult> {
  (item: T, item1: T1, item2: T2): TResult;
}

@Injectable()
export class CoolHttp {
  private _http: Http;

  private _cookieStore: CookieStore = new CookieStore();

  private _globalHeaders: HttpHeader[] = [];
  private _requestInterceptors: IRequestInterceptor[] = [];
  private _responseInterceptors: IResponseInterceptor[] = [];
  private _customCookieToHeaders = [];
  private _baseUrl;
  private _withCredentials;

  constructor(http: Http) {
    this._http = http;
  }

  public registerBaseUrl(baseUrl: string): void {
    this._baseUrl = baseUrl;

    if (this._baseUrl[this._baseUrl.length - 1] !== '/') {
      this._baseUrl += '/';
    }
  }

  public setWithCredentials(status: boolean): void {
    this._withCredentials = status;
  }

  public registerGlobalHeader(header: HttpHeader): void {
    this._globalHeaders.push(header);
  }

  public registerRequestInterceptor(requestInterceptor: IRequestInterceptor): void {
    this._requestInterceptors.push(requestInterceptor);
  }

  public deregisterRequestInterceptor(requestInterceptor: IRequestInterceptor): boolean {
    let indexOfItem = this._requestInterceptors.indexOf(requestInterceptor);

    if (indexOfItem === -1) {
      return false;
    }

    this._requestInterceptors.splice(indexOfItem, 1);

    return true;
  }

  public registerResponseInterceptor(responseInterceptor: IResponseInterceptor): void {
    this._responseInterceptors.push(responseInterceptor);
  }

  public deregisterResponseInterceptor(responseInterceptor: IResponseInterceptor): boolean {
    let indexOfItem = this._responseInterceptors.indexOf(responseInterceptor);

    if (indexOfItem === -1) {
      return false;
    }

    this._responseInterceptors.splice(indexOfItem, 1);

    return true;
  }

  public sendCookieValueInCustomHeader(cookieName: string, customHeaderName: string): void {
    this._customCookieToHeaders.push({
      cookieName: cookieName,
      customHeaderName: customHeaderName
    });
  }

  public async getAsync(url: string, options: RequestOptions = new RequestOptions()): Promise<any> {
    let that = this;

    return await that.requestCoreAsync(url, 'GET', null, options, (url, data, modOptions) => {
      return that._http.get(url, modOptions);
    });
  }

  public async postAsync(url: string, data?: any, options: RequestOptions = new RequestOptions()): Promise<any> {
    let that = this;

    return await that.requestCoreAsync(url, 'POST', data, options, (url, data, modOptions) => {
      return that._http.post(url, data, modOptions);
    });
  }

  public async putAsync(url: string, data?: any, options: RequestOptions = new RequestOptions()): Promise<any> {
    let that = this;

    return await that.requestCoreAsync(url, 'PUT', data, options, (url, data, modOptions) => {
      return that._http.put(url, data, modOptions);
    });
  }

  public async deleteAsync(url: string, options: RequestOptions = new RequestOptions()): Promise<any> {
    let that = this;

    return await that.requestCoreAsync(url, 'DELETE', null, options, (url, data, modOptions) => {
      return that._http['delete'](url, modOptions);
    });
  }

  public async patchAsync(url: string, data?: any, options: RequestOptions = new RequestOptions()): Promise<any> {
    let that = this;

    return await that.requestCoreAsync(url, 'PATCH', data, options, (url, data, modOptions) => {
      return that._http.patch(url, data, modOptions);
    });
  }

  public async headAsync(url: string, options: RequestOptions = new RequestOptions()): Promise<any> {
    let that = this;

    return await that.requestCoreAsync(url, 'HEAD', null, options, (url, data, modOptions) => {
      return that._http.head(url, modOptions);
    });
  }

  private async requestCoreAsync(url: string, method: string, data: any, options: RequestOptions, action: Func<string, any, RequestOptions, Observable<Response>>): Promise<any> {
    options.headers = options.headers || new Headers();

    url = this.convertUrl(url);

    this.appendGlobalHeaders(options.headers);

    this.tryAppendRegisteredCookiestoCustomHeaders(options.headers);

    this.modifyOptions(options);

    let clientHeaders = this.convertAngularHeadersToHttpClientHeaders(options.headers);

    let shouldIntercept = await this.invokeRequestInterceptorsAsync(url, method, data, clientHeaders);

    if (shouldIntercept) {
      return;
    }

    let response;

    try {
      response = await action(url, data, options).toPromise();
    }
    catch (errorResponse) {
      response = errorResponse;
    }

    shouldIntercept = await this.invokeResponseInterceptorsAsync(response, url, method, data, clientHeaders);

    if (shouldIntercept) {
      return;
    }

    if (!response.ok) {
      throw new Error(`Failed to call api ${method} ${url}`);
    }

    let returnValue;

    try {
      returnValue = response.json();
    }
    catch (e) {
      returnValue = response.text();
    }

    return returnValue;
  }

  public getObservable(url: string, options: RequestOptions = new RequestOptions()): Observable<Response> {
    let that = this;

    return that.requestCoreObserable(url, 'GET', null, options, (url, data, modOptions) => {
      return that._http.get(url, modOptions);
    });
  }

  public postObservable(url: string, data: any, options: RequestOptions = new RequestOptions()): Observable<Response> {
    let that = this;

    return that.requestCoreObserable(url, 'POST', data, options, (url, data, modOptions) => {
      return that._http.post(url, data, modOptions);
    });
  }

  public putObservable(url: string, data: any, options: RequestOptions = new RequestOptions()): Observable<Response> {
    let that = this;

    return that.requestCoreObserable(url, 'PUT', data, options, (url, data, modOptions) => {
      return that._http.put(url, data, modOptions);
    });
  }

  public deleteObservable(url: string, options: RequestOptions = new RequestOptions()): Observable<Response> {
    let that = this;

    return that.requestCoreObserable(url, 'DELETE', null, options, (url, data, modOptions) => {
      return that._http['delete'](url, modOptions);
    });
  }

  public patchObservable(url: string, data: any, options: RequestOptions = new RequestOptions()): Observable<Response> {
    let that = this;

    return that.requestCoreObserable(url, 'PATCH', data, options, (url, data, modOptions) => {
      return that._http.patch(url, data, modOptions);
    });
  }

  public headObservable(url: string, options: RequestOptions = new RequestOptions()): Observable<Response> {
    let that = this;

    return that.requestCoreObserable(url, 'HEAD', null, options, (url, data, modOptions) => {
      return that._http.head(url, modOptions);
    });
  }

  private requestCoreObserable(url: string, method: string, data: any, options: RequestOptions, action: Func<string, any, RequestOptions, Observable<Response>>): Observable<Response> {
    options.headers = options.headers || new Headers();
    url = this.convertUrl(url);

    this.appendGlobalHeaders(options.headers);

    this.tryAppendRegisteredCookiestoCustomHeaders(options.headers);

    this.modifyOptions(options);

    const clientHeaders = this.convertAngularHeadersToHttpClientHeaders(options.headers);

    let observable = action(url, data, options);

    for (const responseInterceptor of this._responseInterceptors) {
      observable = observable.lift<Response>(function (responseInterceptor, url, method, data, clientHeaders) {
        return (response) => {
          return Observable.defer(function () {
            return responseInterceptor(response, url, method, data, clientHeaders);
          });
        };
      }(responseInterceptor, url, method, data, clientHeaders));
    }

    return observable;
  }

  private convertUrl(url: string) {
    let returnUrl = url;

    if (this._baseUrl) {
      returnUrl = this._baseUrl + returnUrl;
    }

    return returnUrl;
  }

  private modifyOptions(options: RequestOptions) {
    if (this._withCredentials) {
      options.withCredentials = true;
    }
  }

  private appendGlobalHeaders(headers: Headers): void {
    for (const registeredHeader of this._globalHeaders) {
      headers.append(registeredHeader.key, registeredHeader.value);
    }
  }

  private tryAppendRegisteredCookiestoCustomHeaders(headers: Headers): void {
    for (const cookieToHeader of this._customCookieToHeaders) {
      const cookieValue = this._cookieStore.getCookie(cookieToHeader.cookieName);

      if (cookieValue) {
        headers.append(cookieToHeader.customHeaderName, cookieValue);
      }
    }
  }

  private async invokeRequestInterceptorsAsync(url: string, method: string, data: any, headers: HttpHeader[]): Promise<boolean> {
    for (const requestInterceptor of this._requestInterceptors) {
      const shouldIntercept = await requestInterceptor.beforeRequestAsync(url, method, data, headers);

      if (shouldIntercept) {
        return true;
      }
    }

    return false;
  }

  private async invokeResponseInterceptorsAsync(response: Response, url: string, method: string, data: any, headers: HttpHeader[]): Promise<boolean> {
    for (const responseInterceptor of this._responseInterceptors) {
      const shouldIntercept = await responseInterceptor.afterResponseAsync(response, url, method, data, headers);

      if (shouldIntercept) {
        return true;
      }
    }

    return false;
  }

  private convertAngularHeadersToHttpClientHeaders(headers: Headers): HttpHeader[] {
    return headers.keys().map(headerKey => {
      const httpClientHeader = new HttpHeader();

      httpClientHeader.key = headerKey;
      httpClientHeader.value = headers.get(headerKey);

      return httpClientHeader;
    });
  }
}
