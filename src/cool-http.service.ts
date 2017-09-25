import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import { HttpHeader } from './http-header.model';
import { CookieStore } from './cookie-store.service';
import { IRequestInterceptor } from './request-interceptor.interface';
import { IResponseInterceptor } from './response-interceptor.interface';

export interface Func<T, T1, T2, TResult> {
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
  
  public deRegisterBaseUrl(): void {
    this._baseUrl = '';
  }

  public setWithCredentials(status: boolean): void {
    this._withCredentials = status;
  }

  public registerGlobalHeader(header: HttpHeader): void {
    this.deregisterGlobalHeader(header.key);

    this._globalHeaders.push(header);
  }

  public deregisterGlobalHeader(headerKey: string): boolean {
    const indexOfHeader = this._globalHeaders.findIndex(header => header.key === headerKey);

    if (indexOfHeader === -1) {
      return false;
    }

    this._globalHeaders.splice(indexOfHeader, 1);

    return true;
  }

  public removeAllRegisteredGlobalHeaders(): void {
    this._globalHeaders.length = 0;
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

    return await that._requestCoreAsync(url, 'GET', null, options, (url, data, modOptions) => {
      return that._http.get(url, modOptions);
    });
  }

  public async postAsync(url: string, data?: any, options: RequestOptions = new RequestOptions()): Promise<any> {
    let that = this;

    return await that._requestCoreAsync(url, 'POST', data, options, (url, data, modOptions) => {
      return that._http.post(url, data, modOptions);
    });
  }

  public async putAsync(url: string, data?: any, options: RequestOptions = new RequestOptions()): Promise<any> {
    let that = this;

    return await that._requestCoreAsync(url, 'PUT', data, options, (url, data, modOptions) => {
      return that._http.put(url, data, modOptions);
    });
  }

  public async deleteAsync(url: string, options: RequestOptions = new RequestOptions()): Promise<any> {
    let that = this;

    return await that._requestCoreAsync(url, 'DELETE', null, options, (url, data, modOptions) => {
      return that._http['delete'](url, modOptions);
    });
  }

  public async patchAsync(url: string, data?: any, options: RequestOptions = new RequestOptions()): Promise<any> {
    let that = this;

    return await that._requestCoreAsync(url, 'PATCH', data, options, (url, data, modOptions) => {
      return that._http.patch(url, data, modOptions);
    });
  }

  public async headAsync(url: string, options: RequestOptions = new RequestOptions()): Promise<any> {
    let that = this;

    return await that._requestCoreAsync(url, 'HEAD', null, options, (url, data, modOptions) => {
      return that._http.head(url, modOptions);
    });
  }

  private async _requestCoreAsync(url: string, method: string, data: any, options: RequestOptions, action: Func<string, any, RequestOptions, Observable<Response>>): Promise<any> {
    options.headers = options.headers || new Headers();

    url = this._convertUrl(url);

    this._appendGlobalHeaders(options.headers);

    this._tryAppendRegisteredCookiestoCustomHeaders(options.headers);

    this._modifyOptions(options);

    let clientHeaders = this._convertAngularHeadersToHttpClientHeaders(options.headers);

    let shouldIntercept = await this._invokeRequestInterceptorsAsync(url, method, data, clientHeaders);

    if (shouldIntercept) {
      return;
    }

    this._updateAngularHeadersFromHttpClientHeaders(clientHeaders, options.headers);

    let response;

    try {
      response = await action(url, data, options).toPromise();
    }
    catch (errorResponse) {
      response = errorResponse;
    }

    shouldIntercept = await this._invokeResponseInterceptorsAsync(response, url, method, data, clientHeaders);

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

    return that._requestCoreObservable(url, 'GET', null, options, (url, data, modOptions) => {
      return that._http.get(url, modOptions);
    });
  }

  public postObservable(url: string, data: any, options: RequestOptions = new RequestOptions()): Observable<Response> {
    let that = this;

    return that._requestCoreObservable(url, 'POST', data, options, (url, data, modOptions) => {
      return that._http.post(url, data, modOptions);
    });
  }

  public putObservable(url: string, data: any, options: RequestOptions = new RequestOptions()): Observable<Response> {
    let that = this;

    return that._requestCoreObservable(url, 'PUT', data, options, (url, data, modOptions) => {
      return that._http.put(url, data, modOptions);
    });
  }

  public deleteObservable(url: string, options: RequestOptions = new RequestOptions()): Observable<Response> {
    let that = this;

    return that._requestCoreObservable(url, 'DELETE', null, options, (url, data, modOptions) => {
      return that._http['delete'](url, modOptions);
    });
  }

  public patchObservable(url: string, data: any, options: RequestOptions = new RequestOptions()): Observable<Response> {
    let that = this;

    return that._requestCoreObservable(url, 'PATCH', data, options, (url, data, modOptions) => {
      return that._http.patch(url, data, modOptions);
    });
  }

  public headObservable(url: string, options: RequestOptions = new RequestOptions()): Observable<Response> {
    let that = this;

    return that._requestCoreObservable(url, 'HEAD', null, options, (url, data, modOptions) => {
      return that._http.head(url, modOptions);
    });
  }

  private _requestCoreObservable(url: string, method: string, data: any, options: RequestOptions, action: Func<string, any, RequestOptions, Observable<Response>>): Observable<Response> {
    return Observable.fromPromise(this._requestCoreAsync(url, method, data, options, action));
  }

  private _convertUrl(url: string) {
    let returnUrl = url;

    if (this._baseUrl) {
      returnUrl = this._baseUrl + returnUrl;
    }

    return returnUrl;
  }

  private _modifyOptions(options: RequestOptions) {
    if (this._withCredentials) {
      options.withCredentials = true;
    }
  }

  private _appendGlobalHeaders(headers: Headers): void {
    for (const registeredHeader of this._globalHeaders) {
      headers.append(registeredHeader.key, registeredHeader.value);
    }
  }

  private _tryAppendRegisteredCookiestoCustomHeaders(headers: Headers): void {
    for (const cookieToHeader of this._customCookieToHeaders) {
      const cookieValue = this._cookieStore.getCookie(cookieToHeader.cookieName);

      if (cookieValue) {
        headers.append(cookieToHeader.customHeaderName, cookieValue);
      }
    }
  }

  private async _invokeRequestInterceptorsAsync(url: string, method: string, data: any, headers: HttpHeader[]): Promise<boolean> {
    for (const requestInterceptor of this._requestInterceptors) {
      const shouldIntercept = await requestInterceptor.beforeRequestAsync(url, method, data, headers);

      if (shouldIntercept) {
        return true;
      }
    }

    return false;
  }

  private async _invokeResponseInterceptorsAsync(response: Response, url: string, method: string, data: any, headers: HttpHeader[]): Promise<boolean> {
    for (const responseInterceptor of this._responseInterceptors) {
      const shouldIntercept = await responseInterceptor.afterResponseAsync(response, url, method, data, headers);

      if (shouldIntercept) {
        return true;
      }
    }

    return false;
  }

  private _convertAngularHeadersToHttpClientHeaders(headers: Headers): HttpHeader[] {
    return headers.keys().map(headerKey => {
      const httpClientHeader = new HttpHeader();

      httpClientHeader.key = headerKey;
      httpClientHeader.value = headers.get(headerKey);

      return httpClientHeader;
    });
  }

  private _updateAngularHeadersFromHttpClientHeaders(httpClientHeaders: HttpHeader[], headers: Headers): void {
    for (const clientHeader of httpClientHeaders) {
      const headerValue = headers.get(clientHeader.key);

      if (headerValue !== clientHeader.value) {
        headers.set(clientHeader.key, clientHeader.value);
      }
    }
  }
}
