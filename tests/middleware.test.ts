import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { expect, test, vi } from 'vitest';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { HeadersNegotiator, MethodNegotiator, OriginNegotiator } from '../src/negotiation';
import { createCorsMiddleware } from '../src/middleware';

test('preflight without origin', async () => {
  const request = { method: 'OPTIONS' } as ServerRequest;

  const end = vi.fn();

  const response = { body: { end } } as unknown as Response;

  const [handler, handlerMocks] = useFunctionMock<Handler>([]);

  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
    { parameters: [204], return: response },
  ]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [request], return: undefined },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([]);

  const middleware = createCorsMiddleware(responseFactory, originNegotiator, methodNegotiator, headersNegotiator);

  expect(await middleware(request, handler)).toBe(response);

  expect(end).toHaveBeenCalledTimes(1);

  expect(handlerMocks.length).toBe(0);
  expect(responseFactoryMocks.length).toBe(0);
  expect(originNegotiatorMocks.length).toBe(0);
  expect(methodNegotiatorMocks.length).toBe(0);
  expect(headersNegotiatorMocks.length).toBe(0);
});

test('preflight with origin, without method, without headers', async () => {
  const request = { method: 'OPTIONS' } as ServerRequest;

  const end = vi.fn();

  const response = { body: { end } } as unknown as Response;

  const [handler, handlerMocks] = useFunctionMock<Handler>([]);

  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
    { parameters: [204], return: response },
  ]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [request], return: 'https://mydomain.tld' },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([
    { name: 'negotiate', parameters: [request], return: false },
  ]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([
    { name: 'negotiate', parameters: [request], return: false },
  ]);

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

  expect(handlerMocks.length).toBe(0);
  expect(responseFactoryMocks.length).toBe(0);
  expect(originNegotiatorMocks.length).toBe(0);
  expect(methodNegotiatorMocks.length).toBe(0);
  expect(headersNegotiatorMocks.length).toBe(0);
});

test('preflight with origin, with method, with headers, minimal', async () => {
  const request = { method: 'OPTIONS' } as ServerRequest;

  const end = vi.fn();

  const response = { body: { end } } as unknown as Response;

  const [handler, handlerMocks] = useFunctionMock<Handler>([]);

  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
    { parameters: [204], return: response },
  ]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [request], return: 'https://mydomain.tld' },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([
    { name: 'negotiate', parameters: [request], return: true },
    { name: 'allowMethods', value: ['GET', 'POST'] },
  ]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([
    { name: 'negotiate', parameters: [request], return: true },
    { name: 'allowHeaders', value: ['Accept', 'Content-Type'] },
  ]);

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

  expect(handlerMocks.length).toBe(0);
  expect(responseFactoryMocks.length).toBe(0);
  expect(originNegotiatorMocks.length).toBe(0);
  expect(methodNegotiatorMocks.length).toBe(0);
  expect(headersNegotiatorMocks.length).toBe(0);
});

test('preflight with origin, with method, with headers, maximal', async () => {
  const request = { method: 'OPTIONS' } as ServerRequest;

  const end = vi.fn();

  const response = { body: { end } } as unknown as Response;

  const [handler, handlerMocks] = useFunctionMock<Handler>([]);

  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
    { parameters: [204], return: response },
  ]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [request], return: 'https://mydomain.tld' },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([
    { name: 'negotiate', parameters: [request], return: true },
    { name: 'allowMethods', value: ['GET', 'POST'] },
  ]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([
    { name: 'negotiate', parameters: [request], return: true },
    { name: 'allowHeaders', value: ['Accept', 'Content-Type'] },
  ]);

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

  expect(handlerMocks.length).toBe(0);
  expect(responseFactoryMocks.length).toBe(0);
  expect(originNegotiatorMocks.length).toBe(0);
  expect(methodNegotiatorMocks.length).toBe(0);
  expect(headersNegotiatorMocks.length).toBe(0);
});

test('handle without origin', async () => {
  const request = { method: 'POST' } as ServerRequest;

  const response = {} as Response;

  const [handler, handlerMocks] = useFunctionMock<Handler>([
    { parameters: [request], return: Promise.resolve(response) },
  ]);

  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [request], return: undefined },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([]);

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

  expect(handlerMocks.length).toBe(0);
  expect(responseFactoryMocks.length).toBe(0);
  expect(originNegotiatorMocks.length).toBe(0);
  expect(methodNegotiatorMocks.length).toBe(0);
  expect(headersNegotiatorMocks.length).toBe(0);
});

test('handle with origin', async () => {
  const request = { method: 'POST' } as ServerRequest;

  const response = {} as Response;

  const [handler, handlerMocks] = useFunctionMock<Handler>([
    { parameters: [request], return: Promise.resolve(response) },
  ]);

  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [request], return: 'https://mydomain.tld' },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([]);

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

  expect(handlerMocks.length).toBe(0);
  expect(responseFactoryMocks.length).toBe(0);
  expect(originNegotiatorMocks.length).toBe(0);
  expect(methodNegotiatorMocks.length).toBe(0);
  expect(headersNegotiatorMocks.length).toBe(0);
});
