import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpModule } from '@angular/http';

import { CoolHttp } from './src/cool-http.service';

export * from './src/cookie-store.service';
export * from './src/cool-http.service';
export * from './src/http-header.model';
export * from './src/request-interceptor.interface';
export * from './src/response-interceptor.interface';

@NgModule({
  exports: [],
  imports: [HttpModule],
  providers: [CoolHttp]
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
