import type { ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { Method } from '@chubbyts/chubbyts-http-types/dist/message';
import { describe, expect, test } from '@jest/globals';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import type { AllowOrigin } from '../src/negotiation';
import {
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
    const allowOriginRegex = createAllowOriginRegex(/^https:\/\/my/);

    expect(allowOriginRegex('https://mydomain.tld')).toBe(true);
  });

  test('not match', async () => {
    const allowOriginRegex = createAllowOriginRegex(/^http:\/\/my/);

    expect(allowOriginRegex('https://mydomain.tld')).toBe(false);
  });
});

describe('createOriginNegotiator', () => {
  test('missing origin header', async () => {
    const request = { headers: {} } as ServerRequest;

    const [allowOrigin, allowOriginMocks] = useFunctionMock<AllowOrigin>([]);

    const originNegotiator = createOriginNegotiator([allowOrigin]);

    expect(originNegotiator(request)).toBe(undefined);

    expect(allowOriginMocks.length).toBe(0);
  });

  test('match', async () => {
    const origin = 'https://mydomain.tld';

    const request = { headers: { origin: [origin] } } as unknown as ServerRequest;

    const [allowOrigin1, allowOrigin1Mocks] = useFunctionMock<AllowOrigin>([{ parameters: [origin], return: false }]);

    const [allowOrigin2, allowOrigin2Mocks] = useFunctionMock<AllowOrigin>([{ parameters: [origin], return: true }]);

    const originNegotiator = createOriginNegotiator([allowOrigin1, allowOrigin2]);

    expect(originNegotiator(request)).toBe('https://mydomain.tld');

    expect(allowOrigin1Mocks.length).toBe(0);
    expect(allowOrigin2Mocks.length).toBe(0);
  });

  test('not match', async () => {
    const origin = 'https://mydomain.tld';

    const request = { headers: { origin: [origin] } } as unknown as ServerRequest;

    const [allowOrigin1, allowOrigin1Mocks] = useFunctionMock<AllowOrigin>([{ parameters: [origin], return: false }]);

    const [allowOrigin2, allowOrigin2Mocks] = useFunctionMock<AllowOrigin>([{ parameters: [origin], return: false }]);

    const originNegotiator = createOriginNegotiator([allowOrigin1, allowOrigin2]);

    expect(originNegotiator(request)).toBe(undefined);

    expect(allowOrigin1Mocks.length).toBe(0);
    expect(allowOrigin2Mocks.length).toBe(0);
  });
});

describe('createMethodNegotiator', () => {
  test('with empty method', () => {
    const request = { headers: {} } as unknown as ServerRequest;

    const methodNegotiator = createMethodNegotiator([Method.GET, Method.POST]);

    expect(methodNegotiator.negotiate(request)).toBe(false);
  });

  test('with allowed method', () => {
    const request = { headers: { 'access-control-request-method': ['post'] } } as unknown as ServerRequest;

    const methodNegotiator = createMethodNegotiator([Method.GET, Method.POST]);

    expect(methodNegotiator.negotiate(request)).toBe(true);
  });

  test('with not allowed method', () => {
    const request = { headers: { 'access-control-request-method': ['put'] } } as unknown as ServerRequest;

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
      headers: { 'access-control-request-headers': ['Authorization', 'Content-Type', 'Accept'] },
    } as unknown as ServerRequest;

    const headersNegotiator = createHeadersNegotiator(['Authorization', 'Accept', 'Content-Type']);

    expect(headersNegotiator.negotiate(request)).toBe(true);
  });

  test('with same headers lower case', () => {
    const request = {
      headers: { 'access-control-request-headers': ['authorization', 'content-Type', 'accept'] },
    } as unknown as ServerRequest;

    const headersNegotiator = createHeadersNegotiator(['Authorization', 'Accept', 'Content-Type']);

    expect(headersNegotiator.negotiate(request)).toBe(true);
  });

  test('with less headers', () => {
    const request = { headers: { 'access-control-request-headers': ['Authorization'] } } as unknown as ServerRequest;

    const headersNegotiator = createHeadersNegotiator(['Authorization', 'Accept', 'Content-Type']);

    expect(headersNegotiator.negotiate(request)).toBe(true);
  });

  test('with to many headers', () => {
    const request = {
      headers: { 'access-control-request-headers': ['Authorization', 'Accept', 'Content-Type'] },
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
