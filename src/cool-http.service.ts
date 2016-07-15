import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import { HttpHeader } from './http-header.model';
import { CookieStore } from './cookie-store.service';
import { IRequestInterceptor } from './request-interceptor.interface';
import { IResponseInterceptor } from './response-interceptor.interface';

interface Func<T, TResult> {
    (item: T): TResult;
}

@Injectable()
export class CoolHttp {
    _http: Http

    _cookieStore: CookieStore = new CookieStore()

    _globalHeaders: HttpHeader[] = []
    _requestInterceptors: IRequestInterceptor[] = []
    _responseInterceptors: IResponseInterceptor[] = []

    constructor(http: Http) {
        this._http = http;
    }

    public registerGlobalHeader(header: HttpHeader): void {
        this._globalHeaders.push(header);
    }

    public registerRequestInterceptor(requestInterceptor: IRequestInterceptor): void {
        this._requestInterceptors.push(requestInterceptor);
    }
    
    public deregisterRequestInterceptor(requestInterceptor: IRequestInterceptor): boolean {
        let indexOfItem = this._requestInterceptors.indexOf(requestInterceptor);
        
        if(indexOfItem === -1) {
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
        
        if(indexOfItem === -1) {
            return false;
        }
        
        this._responseInterceptors.splice(indexOfItem, 1);
        
        return true;
    }

    public async getAsync(url: string, options: RequestOptions = new RequestOptions()): Promise<any> {
        let that = this;

        return await that.requestCoreAsync(url, 'GET', null, options, (modOptions) => {
            return that._http.get(url, modOptions);
        });
    }

    public async postAsync(url: string, data?: any, options: RequestOptions = new RequestOptions()): Promise<any> {
        let that = this;

        return await that.requestCoreAsync(url, 'POST', data, options, (modOptions) => {
            return that._http.post(url, data, modOptions);
        });
    }

    public async putAsync(url: string, data?: any, options: RequestOptions = new RequestOptions()): Promise<any> {
        let that = this;

        return await that.requestCoreAsync(url, 'PUT', data, options, (modOptions) => {
            return that._http.put(url, data, modOptions);
        });
    }

    public async deleteAsync(url: string, options: RequestOptions = new RequestOptions()): Promise<any> {
        let that = this;

        return await that.requestCoreAsync(url, 'DELETE', null, options, (modOptions) => {
            return that._http['delete'](url, modOptions);
        });
    }

    public async patchAsync(url: string, data?: any, options: RequestOptions = new RequestOptions()): Promise<any> {
        let that = this;

        return await that.requestCoreAsync(url, 'PATCH', data, options, (modOptions) => {
            return that._http.patch(url, data, modOptions);
        });
    }

    public async headAsync(url: string, options: RequestOptions = new RequestOptions()): Promise<any> {
        let that = this;

        return await that.requestCoreAsync(url, 'HEAD', null, options, (modOptions) => {
            return that._http.head(url, modOptions);
        });
    }

    private async requestCoreAsync(url: string, method: string, data: any, options: RequestOptions, action: Func<RequestOptions, Observable<Response>>): Promise<any> {
        options.headers = options.headers || new Headers();
        
        this.appendGlobalHeaders(options.headers);

        this.tryAppendXSRFHeader(options.headers);

        let clientHeaders = this.convertAngularHeadersToHttpClientHeaders(options.headers);

        let shouldIntercept = await this.invokeRequestInterceptorsAsync(url, method, data, clientHeaders);

        if(shouldIntercept) {
            return;
        }

        let response;
        
        try {
            response = await action(options).toPromise();
        }
        catch(errorResponse) {
            response = errorResponse;
        }
        
        shouldIntercept = await this.invokeResponseInterceptorsAsync(response, url, method, data, clientHeaders);

        if(shouldIntercept) {
            return;
        }
        
        if(!response.ok) {
            throw new Error(`Failed to call api ${method} ${url}`);
        }

        let returnValue;

        try {
            returnValue = response.json();
        }
        catch(e) {
            returnValue = response.text();
        }

        return returnValue;
    }
    
    public getObservable(url: string, options: RequestOptions = new RequestOptions()) : Observable<Response> {
        let that = this;

        return that.requestCoreObserable(url, 'GET', null, options, (modOptions) => {
            return that._http.get(url, modOptions);
        });
    }
    
    public postObservable(url: string, data: any, options: RequestOptions = new RequestOptions()) : Observable<Response> {
        let that = this;

        return that.requestCoreObserable(url, 'POST', data, options, (modOptions) => {
            return that._http.post(url, data, modOptions);
        });
    }
    
    public putObservable(url: string, data: any, options: RequestOptions = new RequestOptions()) : Observable<Response> {
        let that = this;

        return that.requestCoreObserable(url, 'PUT', data, options, (modOptions) => {
            return that._http.put(url, data, modOptions);
        });
    }
    
    public deleteObservable(url: string, options: RequestOptions = new RequestOptions()) : Observable<Response> {
        let that = this;

        return that.requestCoreObserable(url, 'DELETE', null, options, (modOptions) => {
            return that._http['delete'](url, modOptions);
        });
    }
    
    public patchObservable(url: string, data: any, options: RequestOptions = new RequestOptions()) : Observable<Response> {
        let that = this;

        return that.requestCoreObserable(url, 'PATCH', data, options, (modOptions) => {
            return that._http.patch(url, data, modOptions);
        });
    }
    
    public headObservable(url: string, options: RequestOptions = new RequestOptions()) : Observable<Response> {
        let that = this;

        return that.requestCoreObserable(url, 'HEAD', null, options, (modOptions) => {
            return that._http.head(url, modOptions);
        });
    }
    
    private requestCoreObserable(url: string, method: string, data: any, options: RequestOptions, action: Func<RequestOptions, Observable<Response>>): Observable<Response> {
        this.appendGlobalHeaders(options.headers);

        this.tryAppendXSRFHeader(options.headers);

        var clientHeaders = this.convertAngularHeadersToHttpClientHeaders(options.headers);

        var observable = action(options);
        
        for(let responseInterceptor of this._responseInterceptors) {
            observable = observable.lift<Response>(function(responseInterceptor, url, method, data, clientHeaders) {
                return (response) => {
                    return Observable.defer(function() {
                        return responseInterceptor(response, url, method, data, clientHeaders);
                    });
                };
            }(responseInterceptor, url, method, data, clientHeaders));
        }

        return observable;
    } 

    private appendGlobalHeaders(headers: Headers): void {
        for (var registeredHeader of this._globalHeaders) {
            headers.append(registeredHeader.key, registeredHeader.value);
        }
    }

    private tryAppendXSRFHeader(headers: Headers): void {
        var xsrfToken = this._cookieStore.getCookie('XSRF-TOKEN');

        if(xsrfToken) {
            headers.append('X-XSRF-TOKEN', xsrfToken);
        }
    }

    private async invokeRequestInterceptorsAsync(url: string, method: string, data: any, headers: HttpHeader[]): Promise<boolean> {
        for (var requestInterceptor of this._requestInterceptors) {
            var shouldIntercept = await requestInterceptor.beforeRequestAsync(url, method, data, headers);

            if(shouldIntercept) {
                return true;
            }
        }

        return false;
    }

    private async invokeResponseInterceptorsAsync(response: Response, url: string, method: string, data: any, headers: HttpHeader[]): Promise<boolean> {
        for (var responseInterceptor of this._responseInterceptors) {
            var shouldIntercept = await responseInterceptor.afterResponseAsync(response, url, method, data, headers);

            if(shouldIntercept) {
                return true;
            }
        }

        return false;
    }

    private convertAngularHeadersToHttpClientHeaders(headers: Headers): HttpHeader[] {
        return headers.keys().map(headerKey => {
            var httpClientHeader = new HttpHeader();

            httpClientHeader.key = headerKey;
            httpClientHeader.value = headers.get(headerKey);

            return httpClientHeader;
        });
    }
}
