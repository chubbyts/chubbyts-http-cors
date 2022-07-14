import { Method, Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { expect, test } from '@jest/globals';
import { createCorsMiddleware } from '../src/middleware';

test('preflight without origin', async () => {
  const request = { method: Method.OPTIONS } as ServerRequest;

  const end = jest.fn();

  const response = { body: { end } } as unknown as Response;

  const handler = jest.fn();

  const responseFactory = jest.fn((status: number, reasonPhrase?: string) => {
    expect(status).toBe(204);
    expect(reasonPhrase).toBe(undefined);

    return response;
  });

  const originNegotiator = jest.fn((request: ServerRequest) => undefined);

  const negotiateMethod = jest.fn();

  const methodNegotiator = {
    negotiate: negotiateMethod,
    allowMethods: [],
  };

  const negotiateHeaders = jest.fn();

  const headersNegotiator = {
    negotiate: negotiateHeaders,
    allowHeaders: [],
  };

  const middleware = createCorsMiddleware(responseFactory, originNegotiator, methodNegotiator, headersNegotiator);

  expect(await middleware(request, handler)).toBe(response);

  expect(end).toHaveBeenCalledTimes(1);
  expect(handler).toHaveBeenCalledTimes(0);
  expect(responseFactory).toHaveBeenCalledTimes(1);
  expect(originNegotiator).toHaveBeenCalledTimes(1);
  expect(negotiateMethod).toHaveBeenCalledTimes(0);
  expect(negotiateHeaders).toHaveBeenCalledTimes(0);
});

test('preflight with origin, without method, without headers', async () => {
  const request = { method: Method.OPTIONS } as ServerRequest;

  const end = jest.fn();

  const response = { body: { end } } as unknown as Response;

  const handler = jest.fn();

  const responseFactory = jest.fn((status: number, reasonPhrase?: string) => {
    expect(status).toBe(204);
    expect(reasonPhrase).toBe(undefined);

    return response;
  });

  const originNegotiator = jest.fn((request: ServerRequest) => 'https://mydomain.tld');

  const negotiateMethod = jest.fn((request: ServerRequest) => false);

  const methodNegotiator = {
    negotiate: negotiateMethod,
    allowMethods: [Method.GET, Method.POST],
  };

  const negotiateHeaders = jest.fn((request: ServerRequest) => false);

  const headersNegotiator = {
    negotiate: negotiateHeaders,
    allowHeaders: ['Accept', 'Content-Type'],
  };

  const middleware = createCorsMiddleware(responseFactory, originNegotiator, methodNegotiator, headersNegotiator);

  expect(await middleware(request, handler)).toEqual({
    ...response,
    headers: {
      ...response.headers,
      'access-control-allow-origin': ['https://mydomain.tld'],
      'access-control-allow-credentials': ['false'],
      'access-control-max-age': ['600'],
    },
  });

  expect(end).toHaveBeenCalledTimes(1);
  expect(handler).toHaveBeenCalledTimes(0);
  expect(responseFactory).toHaveBeenCalledTimes(1);
  expect(originNegotiator).toHaveBeenCalledTimes(1);
  expect(negotiateMethod).toHaveBeenCalledTimes(1);
  expect(negotiateHeaders).toHaveBeenCalledTimes(1);
});

test('preflight with origin, with method, with headers, minimal', async () => {
  const request = { method: Method.OPTIONS } as ServerRequest;

  const end = jest.fn();

  const response = { body: { end } } as unknown as Response;

  const handler = jest.fn();

  const responseFactory = jest.fn((status: number, reasonPhrase?: string) => {
    expect(status).toBe(204);
    expect(reasonPhrase).toBe(undefined);

    return response;
  });

  const originNegotiator = jest.fn((request: ServerRequest) => 'https://mydomain.tld');

  const negotiateMethod = jest.fn((request: ServerRequest) => true);

  const methodNegotiator = {
    negotiate: negotiateMethod,
    allowMethods: [Method.GET, Method.POST],
  };

  const negotiateHeaders = jest.fn((request: ServerRequest) => true);

  const headersNegotiator = {
    negotiate: negotiateHeaders,
    allowHeaders: ['Accept', 'Content-Type'],
  };

  const middleware = createCorsMiddleware(responseFactory, originNegotiator, methodNegotiator, headersNegotiator);

  expect(await middleware(request, handler)).toEqual({
    ...response,
    headers: {
      ...response.headers,
      'access-control-allow-origin': ['https://mydomain.tld'],
      'access-control-allow-methods': ['GET', 'POST'],
      'access-control-allow-headers': ['Accept', 'Content-Type'],
      'access-control-allow-credentials': ['false'],
      'access-control-max-age': ['600'],
    },
  });

  expect(end).toHaveBeenCalledTimes(1);
  expect(handler).toHaveBeenCalledTimes(0);
  expect(responseFactory).toHaveBeenCalledTimes(1);
  expect(originNegotiator).toHaveBeenCalledTimes(1);
  expect(negotiateMethod).toHaveBeenCalledTimes(1);
  expect(negotiateHeaders).toHaveBeenCalledTimes(1);
});

test('preflight with origin, with method, with headers, maximal', async () => {
  const request = { method: Method.OPTIONS } as ServerRequest;

  const end = jest.fn();

  const response = { body: { end } } as unknown as Response;

  const handler = jest.fn();

  const responseFactory = jest.fn((status: number, reasonPhrase?: string) => {
    expect(status).toBe(204);
    expect(reasonPhrase).toBe(undefined);

    return response;
  });

  const originNegotiator = jest.fn((request: ServerRequest) => 'https://mydomain.tld');

  const negotiateMethod = jest.fn((request: ServerRequest) => true);

  const methodNegotiator = {
    negotiate: negotiateMethod,
    allowMethods: [Method.GET, Method.POST],
  };

  const negotiateHeaders = jest.fn((request: ServerRequest) => true);

  const headersNegotiator = {
    negotiate: negotiateHeaders,
    allowHeaders: ['Accept', 'Content-Type'],
  };

  const middleware = createCorsMiddleware(
    responseFactory,
    originNegotiator,
    methodNegotiator,
    headersNegotiator,
    ['X-Unknown'],
    true,
    7200,
  );

  expect(await middleware(request, handler)).toEqual({
    ...response,
    headers: {
      ...response.headers,
      'access-control-allow-origin': ['https://mydomain.tld'],
      'access-control-allow-methods': ['GET', 'POST'],
      'access-control-allow-headers': ['Accept', 'Content-Type'],
      'access-control-allow-credentials': ['true'],
      'access-control-expose-headers': ['X-Unknown'],
      'access-control-max-age': ['7200'],
    },
  });

  expect(end).toHaveBeenCalledTimes(1);
  expect(handler).toHaveBeenCalledTimes(0);
  expect(responseFactory).toHaveBeenCalledTimes(1);
  expect(originNegotiator).toHaveBeenCalledTimes(1);
  expect(negotiateMethod).toHaveBeenCalledTimes(1);
  expect(negotiateHeaders).toHaveBeenCalledTimes(1);
});

test('handle without origin', async () => {
  const request = { method: Method.POST } as ServerRequest;

  const response = {} as Response;

  const handler = jest.fn(async (request: ServerRequest) => response);

  const responseFactory = jest.fn();

  const originNegotiator = jest.fn((request: ServerRequest) => undefined);

  const negotiateMethod = jest.fn();

  const methodNegotiator = {
    negotiate: negotiateMethod,
    allowMethods: [],
  };

  const negotiateHeaders = jest.fn();

  const headersNegotiator = {
    negotiate: negotiateHeaders,
    allowHeaders: [],
  };

  const middleware = createCorsMiddleware(
    responseFactory,
    originNegotiator,
    methodNegotiator,
    headersNegotiator,
    ['X-Unknown'],
    true,
    7200,
  );

  expect(await middleware(request, handler)).toBe(response);

  expect(handler).toHaveBeenCalledTimes(1);
  expect(responseFactory).toHaveBeenCalledTimes(0);
  expect(originNegotiator).toHaveBeenCalledTimes(1);
  expect(negotiateMethod).toHaveBeenCalledTimes(0);
  expect(negotiateHeaders).toHaveBeenCalledTimes(0);
});

test('handle with origin', async () => {
  const request = { method: Method.POST } as ServerRequest;

  const response = {} as Response;

  const handler = jest.fn(async (request: ServerRequest) => response);

  const responseFactory = jest.fn();

  const originNegotiator = jest.fn((request: ServerRequest) => 'https://mydomain.tld');

  const negotiateMethod = jest.fn();

  const methodNegotiator = {
    negotiate: negotiateMethod,
    allowMethods: [],
  };

  const negotiateHeaders = jest.fn();

  const headersNegotiator = {
    negotiate: negotiateHeaders,
    allowHeaders: [],
  };

  const middleware = createCorsMiddleware(
    responseFactory,
    originNegotiator,
    methodNegotiator,
    headersNegotiator,
    ['X-Unknown'],
    true,
    7200,
  );

  expect(await middleware(request, handler)).toEqual({
    ...response,
    headers: {
      ...response.headers,
      'access-control-allow-origin': ['https://mydomain.tld'],
      'access-control-allow-credentials': ['true'],
      'access-control-expose-headers': ['X-Unknown'],
    },
  });

  expect(handler).toHaveBeenCalledTimes(1);
  expect(responseFactory).toHaveBeenCalledTimes(0);
  expect(originNegotiator).toHaveBeenCalledTimes(1);
  expect(negotiateMethod).toHaveBeenCalledTimes(0);
  expect(negotiateHeaders).toHaveBeenCalledTimes(0);
});
