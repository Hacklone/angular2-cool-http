export class CookieStore {
  lastReadRawCookieCollection: string;

  lastReadCookieCollection: any;

  public getCookie(key: string): string {
    let cookieCollection = this.getCookieCollection();

    return cookieCollection[key];
  }

  public getCookieCollection(): any {
    let currentRawCookie = document.cookie;

    if (currentRawCookie === this.lastReadRawCookieCollection) {
      return this.lastReadCookieCollection;
    }

    this.lastReadRawCookieCollection = currentRawCookie;
    this.lastReadCookieCollection = {};

    if (this.lastReadRawCookieCollection.indexOf('; ') !== -1) {
      let cookies = this.lastReadRawCookieCollection.split('; ');

      for (let cookie of cookies) {
        let indexOfEqualSign = cookie.indexOf('=');

        if (indexOfEqualSign > 0) {
          let cookieName = CookieStore.tryDecodeUriComponent(cookie.substring(0, indexOfEqualSign));

          this.lastReadCookieCollection[cookieName] = CookieStore.tryDecodeUriComponent(cookie.substring(indexOfEqualSign + 1));
        }
      }
    }

    return this.lastReadCookieCollection;
  }

  private static tryDecodeUriComponent(uriComponent: string): string {
    try {
      return decodeURIComponent(uriComponent);
    }
    catch (e) {
      return uriComponent;
    }
  }
}