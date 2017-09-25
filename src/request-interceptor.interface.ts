import { CoolHttpHeader } from './http-header.model';

export interface IRequestInterceptor {
  beforeRequestAsync(url: string, method: string, data: any, headers: CoolHttpHeader[]): Promise<boolean>;
}