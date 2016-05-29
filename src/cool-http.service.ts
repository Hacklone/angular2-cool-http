import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import { HttpHeader } from './http-header.model'
import { IRequestInterceptor } from './request-interceptor.interface'
import { IResponseInterceptor } from './response-interceptor.interface'

interface Func<T, TResult> {
    (item: T): TResult;
}

@Injectable()
export class CoolHttp {
    _http: Http;
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

    public registerResponseInterceptor(responseInterceptor: IResponseInterceptor): void {
        this._responseInterceptors.push(responseInterceptor);
    }

    public async getAsync(url: string, options: RequestOptions = new RequestOptions()): Promise<Response> {
        let that = this;

        return await that.requestCoreAsync(url, 'GET', null, options, (modOptions) => {
            return that._http.get(url, modOptions);
        });
    }

    public async postAsync(url: string, data?: any, options: RequestOptions = new RequestOptions()): Promise<Response> {
        let that = this;

        return await that.requestCoreAsync(url, 'POST', data, options, (modOptions) => {
            return that._http.post(url, data, modOptions);
        });
    }

    public async putAsync(url: string, data?: any, options: RequestOptions = new RequestOptions()): Promise<Response> {
        let that = this;

        return await that.requestCoreAsync(url, 'PUT', data, options, (modOptions) => {
            return that._http.put(url, data, modOptions);
        });
    }

    public async deleteAsync(url: string, options: RequestOptions = new RequestOptions()): Promise<Response> {
        let that = this;

        return await that.requestCoreAsync(url, 'DELETE', null, options, (modOptions) => {
            options.headers
            return that._http['delete'](url, modOptions);
        });
    }

    public async patchAsync(url: string, data?: any, options: RequestOptions = new RequestOptions()): Promise<Response> {
        let that = this;

        return await that.requestCoreAsync(url, 'PATCH', data, options, (modOptions) => {
            return that._http.patch(url, data, modOptions);
        });
    }

    public async headAsync(url: string, options: RequestOptions = new RequestOptions()): Promise<Response> {
        let that = this;

        return await that.requestCoreAsync(url, 'HEAD', null, options, (modOptions) => {
            options.headers
            return that._http.head(url, modOptions);
        });
    }

    private async requestCoreAsync(url: string, method: string, data: any, options: RequestOptions, action: Func<RequestOptions, Observable<Response>>): Promise<Response> {
        this.appendGlobalHeaders(options.headers);

        var clientHeaders = this.convertAngularHeadersToHttpClientHeaders(options.headers);

        await this.invokeRequestInterceptorsAsync(url, method, data, clientHeaders);

        var response = await action(options).toPromise();

        await this.invokeResponseInterceptorsAsync(response, url, method, data, clientHeaders);

        return response;
    }

    private appendGlobalHeaders(headers: Headers): void {
        for (var registeredHeader of this._globalHeaders) {
            headers.append(registeredHeader.key, registeredHeader.value);
        }
    }

    private async invokeRequestInterceptorsAsync(url: string, method: string, data: any, headers: HttpHeader[]): Promise<void> {
        for (var requestInterceptor of this._requestInterceptors) {
            await requestInterceptor.beforeRequestAsync(url, method, data, headers);
        }
    }

    private async invokeResponseInterceptorsAsync(response: Response, url: string, method: string, data: any, headers: HttpHeader[]): Promise<void> {
        for (var responseInterceptor of this._responseInterceptors) {
            await responseInterceptor.afterResponseAsync(response, url, method, data, headers);
        }
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
