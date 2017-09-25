import { CoolHttpHeader } from './http-header.model';

export interface IResponseInterceptor {
  afterResponseAsync(response: any, url: string, method: string, data: any, headers: CoolHttpHeader[]): Promise<boolean>;
}