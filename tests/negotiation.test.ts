import { Method, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { describe, expect, test } from '@jest/globals';
import {
  AllowOrigin,
  createAllowOriginExact,
  createAllowOriginRegex,
  createHeadersNegotiator,
  createMethodNegotiator,
  createOriginNegotiator,
} from '../src/negotiation';

describe('createAllowOriginExact', () => {
  test('match', async () => {
    const allowOriginExact = createAllowOriginExact('https://mydomain.tld');

    expect(allowOriginExact('https://mydomain.tld')).toBe(true);
  });

  test('not match', async () => {
    const allowOriginExact = createAllowOriginExact('http://mydomain.tld');

    expect(allowOriginExact('https://mydomain.tld')).toBe(false);
  });
});

describe('createAllowOriginRegex', () => {
  test('match', async () => {
    const allowOriginRegex = createAllowOriginRegex(/^https\:\/\/my/);

    expect(allowOriginRegex('https://mydomain.tld')).toBe(true);
  });

  test('not match', async () => {
    const allowOriginRegex = createAllowOriginRegex(/^http\:\/\/my/);

    expect(allowOriginRegex('https://mydomain.tld')).toBe(false);
  });
});

describe('createOriginNegotiator', () => {
  test('missing origin header', async () => {
    const request = { headers: {} } as ServerRequest;

    const allowOrigin: AllowOrigin = jest.fn();

    const originNegotiator = createOriginNegotiator([allowOrigin]);

    expect(originNegotiator(request)).toBe(undefined);

    expect(allowOrigin).toHaveBeenCalledTimes(0);
  });

  test('match', async () => {
    const request = { headers: { Origin: ['https://mydomain.tld'] } } as unknown as ServerRequest;

    const allowOrigin1: AllowOrigin = jest.fn((origin: string) => {
      expect(origin).toBe('https://mydomain.tld');
      return false;
    });

    const allowOrigin2: AllowOrigin = jest.fn((origin: string) => {
      expect(origin).toBe('https://mydomain.tld');
      return true;
    });

    const originNegotiator = createOriginNegotiator([allowOrigin1, allowOrigin2]);

    expect(originNegotiator(request)).toBe('https://mydomain.tld');

    expect(allowOrigin1).toHaveBeenCalledTimes(1);
    expect(allowOrigin2).toHaveBeenCalledTimes(1);
  });

  test('not match', async () => {
    const request = { headers: { Origin: ['https://mydomain.tld'] } } as unknown as ServerRequest;

    const allowOrigin1: AllowOrigin = jest.fn((origin: string) => {
      expect(origin).toBe('https://mydomain.tld');
      return false;
    });

    const allowOrigin2: AllowOrigin = jest.fn((origin: string) => {
      expect(origin).toBe('https://mydomain.tld');
      return false;
    });

    const originNegotiator = createOriginNegotiator([allowOrigin1, allowOrigin2]);

    expect(originNegotiator(request)).toBe(undefined);

    expect(allowOrigin1).toHaveBeenCalledTimes(1);
    expect(allowOrigin2).toHaveBeenCalledTimes(1);
  });
});

describe('createMethodNegotiator', () => {
  test('with empty method', () => {
    const request = { headers: {} } as unknown as ServerRequest;

    const methodNegotiator = createMethodNegotiator([Method.GET, Method.POST]);

    expect(methodNegotiator.negotiate(request)).toBe(false);
  });

  test('with allowed method', () => {
    const request = { headers: { 'Access-Control-Request-Method': ['post'] } } as unknown as ServerRequest;

    const methodNegotiator = createMethodNegotiator([Method.GET, Method.POST]);

    expect(methodNegotiator.negotiate(request)).toBe(true);
  });

  test('with not allowed method', () => {
    const request = { headers: { 'Access-Control-Request-Method': ['put'] } } as unknown as ServerRequest;

    const methodNegotiator = createMethodNegotiator([Method.GET, Method.POST]);

    expect(methodNegotiator.negotiate(request)).toBe(false);
  });

  test('get allowed methods', () => {
    const allowMethods = [Method.GET, Method.POST];

    const methodNegotiator = createMethodNegotiator(allowMethods);

    expect(methodNegotiator.allowMethods).toBe(allowMethods);
  });
});

describe('createHeadersNegotiator', () => {
  test('without headers', () => {
    const request = { headers: {} } as unknown as ServerRequest;

    const headersNegotiator = createHeadersNegotiator(['Authorization', 'Accept', 'Content-Type']);

    expect(headersNegotiator.negotiate(request)).toBe(false);
  });

  test('with same headers', () => {
    const request = {
      headers: { 'Access-Control-Request-Headers': ['Authorization', 'Content-Type', 'Accept'] },
    } as unknown as ServerRequest;

    const headersNegotiator = createHeadersNegotiator(['Authorization', 'Accept', 'Content-Type']);

    expect(headersNegotiator.negotiate(request)).toBe(true);
  });

  test('with same headers lower case', () => {
    const request = {
      headers: { 'Access-Control-Request-Headers': ['authorization', 'content-Type', 'accept'] },
    } as unknown as ServerRequest;

    const headersNegotiator = createHeadersNegotiator(['Authorization', 'Accept', 'Content-Type']);

    expect(headersNegotiator.negotiate(request)).toBe(true);
  });

  test('with less headers', () => {
    const request = { headers: { 'Access-Control-Request-Headers': ['Authorization'] } } as unknown as ServerRequest;

    const headersNegotiator = createHeadersNegotiator(['Authorization', 'Accept', 'Content-Type']);

    expect(headersNegotiator.negotiate(request)).toBe(true);
  });

  test('with to many headers', () => {
    const request = {
      headers: { 'Access-Control-Request-Headers': ['Authorization', 'Accept', 'Content-Type'] },
    } as unknown as ServerRequest;

    const headersNegotiator = createHeadersNegotiator(['Authorization', 'Content-Type']);

    expect(headersNegotiator.negotiate(request)).toBe(false);
  });

  test('get allowed headers', () => {
    const allowHeaders = ['Authorization', 'Accept', 'Content-Type'];

    const headersNegotiator = createHeadersNegotiator(allowHeaders);

    expect(headersNegotiator.allowHeaders).toBe(allowHeaders);
  });
});
