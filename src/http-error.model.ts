export class HttpError extends Error {
  constructor(public method: string,
              public url: string,
              public status: number,
              public statusText: string,
              public body: string) {
    super(`Failed to call api ${method} ${url}, status code: ${status}`);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}