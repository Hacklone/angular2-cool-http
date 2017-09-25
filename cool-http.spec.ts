import { TestBed } from '@angular/core/testing';
import { MockBackend } from '@angular/http/testing';
import { BaseRequestOptions, ConnectionBackend, RequestOptions } from '@angular/http';

import { CoolHttpModule, CoolHttp } from './dist/index';

describe('CoolHttp', () => {
  let backend: MockBackend;
  let coolHttpService: CoolHttp;

  let lastBackendConnection;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CoolHttpModule
      ],
      providers: [
        { provide: ConnectionBackend, useClass: MockBackend },
        { provide: RequestOptions, useClass: BaseRequestOptions }
      ]
    });

    coolHttpService = TestBed.get(CoolHttp);
    backend = TestBed.get(ConnectionBackend) as MockBackend;

    this.backend.connections.subscribe((connection: any) => {
      lastBackendConnection = connection
    });
  });

  describe('Async API', () => {
    describe('GET async', () => {
      expect(true).toEqual(true);
    });
  });
});