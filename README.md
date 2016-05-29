[npm-url]: https://npmjs.org/package/angular2-cool-http
[npm-image]: https://img.shields.io/npm/v/angular2-cool-http.svg
[downloads-image]: https://img.shields.io/npm/dm/angular2-cool-http.svg
[total-downloads-image]: https://img.shields.io/npm/dt/angular2-cool-http.svg

# angular2-cool-http [![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url]  [![Total Downloads][total-downloads-image]][npm-url]
Cool features over angular2 HttpClient

## Install 
> npm install --save angular2-cool-http

## Setup
```javascript
import { bootstrap } from '@angular/platform-browser/browser';
import { COOL_HTTP_PROVIDERS } from 'angular2-cool-http';

import { MyApp } from './src/my-app'

bootstrap(MyApp, [
    COOL_HTTP_PROVIDERS
]);
```

## Features
### Api calls
- getAsync(url, options)
- postAsync(url, data, options)
- putAsync(url, data, options)
- deleteAsync(url, options)
- patchAsync(url, data, options)
- headAsync(url, options)

```javascript
import { Component, OnInit } from '@angular/core';

import { CoolHttp } from 'angular2-cool-http';

@Component({
  selector: 'my-app'
})
export class AppComponent implements OnInit { 
    coolHttp: CoolHttp;
    
    constructor(coolHttp: CoolHttp) {
        this.coolHttp = coolHttp;   
    }
    
    async ngOnInit() {
        let response = await this.coolHttp.getAsync('/api/request');
        
        console.log(response);
    }
}
```

### Global headers
CoolHttp's api calls will always send these globally registered headers. (Great for authentication)

```javascript
import { CoolHttp, HttpHeader } from 'angular2-cool-http';

coolHttp.registerGlobalHeader(new HttpHeader('MyHttpHeader', 'MyHeadersValue'));
```

### Request Interceptors
CoolHttp's api calls will invoke the registered request interceptors before sending the request

```javascript
coolHttp.registerRequestInterceptor({
    beforeRequestAsync: function(url, method, data, headers) {
        return new Promise((resolve, reject) => {
            //do something 
            
            resolve();
        });
    }
});
```

### Response Interceptors
CoolHttp's api calls will invoke the registered response interceptors after receiving the response

```javascript
coolHttp.registerResponseInterceptor({
    afterResponseAsync: function(url, method, data, headers) {
        return new Promise((resolve, reject) => {
            //do something 
            
            resolve();
        });
    }
});
```
