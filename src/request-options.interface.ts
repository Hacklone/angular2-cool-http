import { HttpHeaders, HttpParams } from '@angular/common/http';

export interface RequestOptions {
  headers?: HttpHeaders | {
    [header: string]: string | string[];
  };
  observe: 'response';
  params?: HttpParams | {
    [param: string]: string | string[];
  };
  reportProgress?: boolean;
  responseType: 'text';
  withCredentials?: boolean;
}

export const DEFAULT_REQUEST_OPTIONS: RequestOptions = {
  observe: 'response',
  responseType: 'text'
};