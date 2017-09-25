import { HttpModule } from '@angular/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule, ModuleWithProviders } from '@angular/core';

import { CoolHttp } from './src/cool-http.service';
import { CoolHttpInterceptor } from './src/cool-http-request.interceptor';

export * from './src/cookie-store.service';
export * from './src/cool-http.service';
export * from './src/http-header.model';
export * from './src/request-interceptor.interface';
export * from './src/response-interceptor.interface';

export const coolHttpInterceptor = new CoolHttpInterceptor();

@NgModule({
  exports: [],
  imports: [HttpModule],
  providers: [
    CoolHttp,
    { provide: CoolHttpInterceptor, useValue: coolHttpInterceptor },
    { provide: HTTP_INTERCEPTORS, useValue: coolHttpInterceptor, multi: true }
  ]
})
export class CoolHttpModule {
  /** @deprecated */
  public static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoolHttpModule,
      providers: []
    };
  }
}
