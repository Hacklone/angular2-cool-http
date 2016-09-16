import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';

import { CoolHttp } from './src/cool-http.service';
export { CoolHttp } from './src/cool-http.service';

export { HttpHeader } from './src/http-header.model';
export { IRequestInterceptor } from './src/request-interceptor.interface';
export { IResponseInterceptor } from './src/response-interceptor.interface';

@NgModule({
    exports: [CoolHttp],
    imports: [HttpModule],
    providers: [CoolHttp]
})
export class CoolHttpModule {}
