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
import { NgModule } from '@angular/core';
import { CoolHttpModule } from 'angular2-cool-http';

@NgModule({
    imports: [CoolHttpModule]
})
export class MyAppModule {}
```

## Features
### Global base url
CoolHttp's api calls will always prefix your url with the baseUrl set (Great for cross origin websites)

```javascript
coolHttp.registerBaseUrl('https://my.api.com/');
```

### Global withCredentials
CoolHttp's api calls will always send cookies to cross domain requests (Great for cross origin websites)

```javascript
coolHttp.setWithCredentials(true);
```

### Async Api calls
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
        // await async api call
        let response = await this.coolHttp.getAsync('/api/request');
        
        console.log(response);
        
        // or simply chain Promise
        this.coolHttp.getAsync('/api/request')
            .then(response => {
                console.log(response);
            });
    }
}
```

### Observable api calls
- getObservable(url, options)
- postObservable(url, data, options)
- putObservable(url, data, options)
- deleteObservable(url, options)
- patchObservable(url, data, options)
- headObservable(url, options)

### Global headers
CoolHttp's api calls will always send these globally registered headers. (Great for authentication)

```javascript
import { CoolHttp, HttpHeader } from 'angular2-cool-http';

coolHttp.registerGlobalHeader(new HttpHeader('MyHttpHeader', 'MyHeadersValue'));
```

### Request Interceptors
CoolHttp's api calls will invoke the registered request interceptors before sending the request

- registerRequestInterceptor(requestInterceptor)
- deregisterRequestInterceptor(requestInterceptor)

```javascript
coolHttp.registerRequestInterceptor({
    beforeRequestAsync: function(url, method, data, headers) {
        return new Promise((resolve, reject) => {
            // do something 
            
            // resolve with true to fully intercept request
            // resolve with false to let the request continue
            resolve(false);
        });
    }
});
```

### Response Interceptors
CoolHttp's api calls will invoke the registered response interceptors after receiving the response

- registerResponseInterceptor(responseInterceptor)
- deregisterResponseInterceptor(responseInterceptor)

```javascript
coolHttp.registerResponseInterceptor({
    afterResponseAsync: function(url, method, data, headers) {
        return new Promise((resolve, reject) => {
            //do something 
            
            // resolve with true to fully intercept the response handling
            // resolve with false to let the response handling continue
            resolve(true);
        });
    }
});
```

## Automatic cookie to custom header sending
You can configure CoolHttp to copy and send a cookie value in a custom http header.

```javascript
coolHttp.sendCookieValueInCustomHeader(cookieName, headerName);
```

## License
> The MIT License (MIT)

> Copyright (c) 2016 Hacklone
> https://github.com/Hacklone

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:

> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.

> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.
