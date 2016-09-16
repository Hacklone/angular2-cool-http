import { HttpHeader } from './http-header.model';

export interface IRequestInterceptor {
  beforeRequestAsync(url: string, method: string, data: any, headers: HttpHeader[]): Promise<boolean>
}