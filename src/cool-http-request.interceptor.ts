import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { IRequestInterceptor } from './request-interceptor.interface';
import { IResponseInterceptor } from './response-interceptor.interface';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { CoolHttpHeader } from './http-header.model';

@Injectable()
export class CoolHttpInterceptor implements HttpInterceptor {
  private _requestInterceptors: IRequestInterceptor[] = [];
  private _responseInterceptors: IResponseInterceptor[] = [];

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const responseSubject = new Subject<HttpEvent<any>>();

    let response = null;
    const clientHeaders = this._convertAngularHeadersToHttpClientHeaders(request.headers);

    this._invokeRequestInterceptorsAsync(request, clientHeaders)
      .then(shouldInterceptRequest => {
        if (shouldInterceptRequest) {
          responseSubject.complete();

          return;
        }

        this._updateAngularHeadersFromHttpClientHeaders(clientHeaders, request.headers);

        return next.handle(request).toPromise();
      })
      .then((res: HttpEvent<any>) => {
        response = res;

        return this._invokeResponseInterceptorsAsync(response, request.url, request.method, <any>request.body, clientHeaders);
      })
      .then(shouldInterceptResponse => {
        if (!shouldInterceptResponse && response) {
          responseSubject.next(response);
        }

        responseSubject.complete();
      })
      .catch(err => {
        responseSubject.thrownError(err);
      });

    return responseSubject.asObservable();
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

  private async _invokeRequestInterceptorsAsync(req: HttpRequest<any>, clientHeaders: CoolHttpHeader[]): Promise<boolean> {
    for (const requestInterceptor of this._requestInterceptors) {
      const shouldIntercept = await requestInterceptor.beforeRequestAsync(req.url, req.method, <any>req.body, clientHeaders);

      if (shouldIntercept) {
        return true;
      }
    }

    return false;
  }

  private async _invokeResponseInterceptorsAsync(response: HttpEvent<any>, url: string, method: string, data: any, headers: CoolHttpHeader[]): Promise<boolean> {
    for (const responseInterceptor of this._responseInterceptors) {
      const shouldIntercept = await responseInterceptor.afterResponseAsync(response, url, method, data, headers);

      if (shouldIntercept) {
        return true;
      }
    }

    return false;
  }

  private _convertAngularHeadersToHttpClientHeaders(headers: HttpHeaders): CoolHttpHeader[] {
    return headers.keys().map(headerKey => {
      const httpClientHeader = new CoolHttpHeader();

      httpClientHeader.key = headerKey;
      httpClientHeader.value = headers.get(headerKey);

      return httpClientHeader;
    });
  }

  private _updateAngularHeadersFromHttpClientHeaders(httpClientHeaders: CoolHttpHeader[], headers: HttpHeaders): void {
    for (const clientHeader of httpClientHeaders) {
      const headerValue = headers.get(clientHeader.key);

      if (headerValue !== clientHeader.value) {
        headers.set(clientHeader.key, clientHeader.value);
      }
    }
  }
}