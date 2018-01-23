import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';

import { HttpHeader } from './http-header.model';
import { CookieStore } from './cookie-store.service';
import { IRequestInterceptor } from './request-interceptor.interface';
import { IResponseInterceptor } from './response-interceptor.interface';
import { HttpError } from './http-error.model';
import { DEFAULT_REQUEST_OPTIONS, RequestOptions } from './request-options.interface';

export interface Func<T, T1, T2, TResult> {
  (item: T, item1: T1, item2: T2): TResult;
}

@Injectable()
export class CoolHttp {
  private _cookieStore: CookieStore = new CookieStore();

  private _globalHeaders: HttpHeader[] = [];
  private _requestInterceptors: IRequestInterceptor[] = [];
  private _responseInterceptors: IResponseInterceptor[] = [];
  private _customCookieToHeaders = [];
  private _baseUrl;
  private _withCredentials;

  constructor(private _http: HttpClient) {
  }

  public get baseUrl(): string {
    return this._baseUrl;
  }

  public registerBaseUrl(baseUrl: string): void {
    this._baseUrl = baseUrl;

    if (this._baseUrl[this._baseUrl.length - 1] !== '/') {
      this._baseUrl += '/';
    }
  }
  
  public deRegisterBaseUrl(): void {
    this._baseUrl = null;
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

  public async getAsync<T = any>(url: string, options: RequestOptions = DEFAULT_REQUEST_OPTIONS): Promise<T> {
    let that = this;

    return await that._requestCoreAsync<T>(url, 'GET', null, options, (url, data, modOptions) => {
      return that._http.get(url, modOptions);
    });
  }

  public async postAsync<T = any>(url: string, data?: any, options: RequestOptions = DEFAULT_REQUEST_OPTIONS): Promise<T> {
    let that = this;

    return await that._requestCoreAsync<T>(url, 'POST', data, options, (url, data, modOptions) => {
      return that._http.post(url, data, modOptions);
    });
  }

  public async putAsync<T = any>(url: string, data?: any, options: RequestOptions = DEFAULT_REQUEST_OPTIONS): Promise<T> {
    let that = this;

    return await that._requestCoreAsync<T>(url, 'PUT', data, options, (url, data, modOptions) => {
      return that._http.put(url, data, modOptions);
    });
  }

  public async deleteAsync<T = any>(url: string, options: RequestOptions = DEFAULT_REQUEST_OPTIONS): Promise<T> {
    let that = this;

    return await that._requestCoreAsync<T>(url, 'DELETE', null, options, (url, data, modOptions) => {
      return that._http['delete'](url, modOptions);
    });
  }

  public async patchAsync<T = any>(url: string, data?: any, options: RequestOptions = DEFAULT_REQUEST_OPTIONS): Promise<T> {
    let that = this;

    return await that._requestCoreAsync<T>(url, 'PATCH', data, options, (url, data, modOptions) => {
      return that._http.patch(url, data, modOptions);
    });
  }

  public async headAsync<T = any>(url: string, options: RequestOptions = DEFAULT_REQUEST_OPTIONS): Promise<T> {
    let that = this;

    return await that._requestCoreAsync<T>(url, 'HEAD', null, options, (url, data, modOptions) => {
      return that._http.head(url, modOptions);
    });
  }

  private async _requestCoreAsync<T = any>(url: string, method: string, data: any, options: RequestOptions, action: Func<string, any, RequestOptions, Observable<HttpResponse<Object>>>): Promise<T> {
    options.headers = options.headers || new HttpHeaders();
    options.observe = 'response';
    options.responseType = 'json';

    url = this._convertUrl(url);

    this._appendGlobalHeaders(<HttpHeaders> options.headers);

    this._tryAppendRegisteredCookiesToCustomHeaders(<HttpHeaders> options.headers);

    this._modifyOptions(options);

    let clientHeaders = this._convertAngularHeadersToHttpClientHeaders(<HttpHeaders> options.headers);

    let shouldIntercept = await this._invokeRequestInterceptorsAsync(url, method, data, clientHeaders);

    if (shouldIntercept) {
      return;
    }

    this._updateAngularHeadersFromHttpClientHeaders(clientHeaders, <HttpHeaders> options.headers);

    let response: HttpResponse<Object>;

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
      throw new HttpError(method, url, response.status, response.statusText, JSON.stringify(response.body));
    }

    return <T> response.body;
  }

  public getObservable<T = any>(url: string, options: RequestOptions = DEFAULT_REQUEST_OPTIONS): Observable<T> {
    let that = this;

    return that._requestCoreObservable<T>(url, 'GET', null, options, (url, data, modOptions) => {
      return that._http.get(url, modOptions);
    });
  }

  public postObservable<T = any>(url: string, data: any, options: RequestOptions = DEFAULT_REQUEST_OPTIONS): Observable<T> {
    let that = this;

    return that._requestCoreObservable<T>(url, 'POST', data, options, (url, data, modOptions) => {
      return that._http.post(url, data, modOptions);
    });
  }

  public putObservable<T = any>(url: string, data: any, options: RequestOptions = DEFAULT_REQUEST_OPTIONS): Observable<T> {
    let that = this;

    return that._requestCoreObservable<T>(url, 'PUT', data, options, (url, data, modOptions) => {
      return that._http.put(url, data, modOptions);
    });
  }

  public deleteObservable<T = any>(url: string, options: RequestOptions = DEFAULT_REQUEST_OPTIONS): Observable<T> {
    let that = this;

    return that._requestCoreObservable<T>(url, 'DELETE', null, options, (url, data, modOptions) => {
      return that._http['delete'](url, modOptions);
    });
  }

  public patchObservable<T = any>(url: string, data: any, options: RequestOptions = DEFAULT_REQUEST_OPTIONS): Observable<T> {
    let that = this;

    return that._requestCoreObservable<T>(url, 'PATCH', data, options, (url, data, modOptions) => {
      return that._http.patch(url, data, modOptions);
    });
  }

  public headObservable<T = any>(url: string, options: RequestOptions = DEFAULT_REQUEST_OPTIONS): Observable<T> {
    let that = this;

    return that._requestCoreObservable<T>(url, 'HEAD', null, options, (url, data, modOptions) => {
      return that._http.head(url, modOptions);
    });
  }

  private _requestCoreObservable<T = any>(url: string, method: string, data: any, options: RequestOptions, action: Func<string, any, RequestOptions, Observable<HttpResponse<Object>>>): Observable<T> {
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

  private _appendGlobalHeaders(headers: HttpHeaders): void {
    for (const registeredHeader of this._globalHeaders) {
      headers.append(registeredHeader.key, registeredHeader.value);
    }
  }

  private _tryAppendRegisteredCookiesToCustomHeaders(headers: HttpHeaders): void {
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

  private async _invokeResponseInterceptorsAsync(response: HttpResponse<Object>, url: string, method: string, data: any, headers: HttpHeader[]): Promise<boolean> {
    for (const responseInterceptor of this._responseInterceptors) {
      const shouldIntercept = await responseInterceptor.afterResponseAsync(response, url, method, data, headers);

      if (shouldIntercept) {
        return true;
      }
    }

    return false;
  }

  private _convertAngularHeadersToHttpClientHeaders(headers: HttpHeaders): HttpHeader[] {
    return headers.keys().map(headerKey => {
      const httpClientHeader = new HttpHeader();

      httpClientHeader.key = headerKey;
      httpClientHeader.value = headers.get(headerKey);

      return httpClientHeader;
    });
  }

  private _updateAngularHeadersFromHttpClientHeaders(httpClientHeaders: HttpHeader[], headers: HttpHeaders): void {
    for (const clientHeader of httpClientHeaders) {
      const headerValue = headers.get(clientHeader.key);

      if (headerValue !== clientHeader.value) {
        headers.set(clientHeader.key, clientHeader.value);
      }
    }
  }
}
