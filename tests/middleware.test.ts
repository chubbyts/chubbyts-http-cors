import { expect, test } from 'vitest';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import type { Handler } from '@chubbyts/chubbyts-http-types/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/message-factory';
import type { ResponseHelpers } from '@chubbyts/chubbyts-http-types/message-helper';
import type { HeadersNegotiator, MethodNegotiator, OriginNegotiator } from '../src/negotiation.js';
import { createCorsMiddleware } from '../src/middleware.js';

// the factory and the helpers get mocked: every response is created and changed through them, the label makes each
// step a distinct response to prove the changes get chained
const createResponse = (label: string): Response => ({
  status: 200,
  reasonPhrase: label,
  protocolVersion: '1.1',
  headers: {},
  body: (async function* () {})(),
});

const createServerRequest = (method: string): ServerRequest => ({ method }) as ServerRequest;

test('preflight with not allowed origin', async () => {
  const serverRequest = createServerRequest('OPTIONS');

  const response = createResponse('created');
  const responseWithVary = createResponse('vary');

  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
    { parameters: [204, 'No Content'], return: response },
  ]);

  const [responseHelpers, responseHelpersMocks] = useObjectMock<ResponseHelpers>([
    { name: 'hasHeader', parameters: [serverRequest, 'origin'], return: true },
    { name: 'hasHeader', parameters: [serverRequest, 'access-control-request-method'], return: true },
    { name: 'getHeader', parameters: [response, 'vary'], return: [] },
    { name: 'withAddedHeader', parameters: [response, 'vary', 'origin'], return: responseWithVary },
  ]);

  const [handler, handlerMocks] = useFunctionMock<Handler>([]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [serverRequest], return: undefined },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([]);

  const middleware = createCorsMiddleware(
    responseFactory,
    responseHelpers,
    originNegotiator,
    methodNegotiator,
    headersNegotiator,
  );

  expect(await middleware(serverRequest, handler)).toBe(responseWithVary);

  expect(responseFactoryMocks).toHaveLength(0);
  expect(responseHelpersMocks).toHaveLength(0);
  expect(handlerMocks).toHaveLength(0);
  expect(originNegotiatorMocks).toHaveLength(0);
  expect(methodNegotiatorMocks).toHaveLength(0);
  expect(headersNegotiatorMocks).toHaveLength(0);
});

test('preflight with origin, without method, without headers', async () => {
  const serverRequest = createServerRequest('OPTIONS');

  const response = createResponse('created');
  const responseWithVary = createResponse('vary');
  const responseWithAllowOrigin = createResponse('allow-origin');
  const responseWithMaxAge = createResponse('max-age');

  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
    { parameters: [204, 'No Content'], return: response },
  ]);

  const [responseHelpers, responseHelpersMocks] = useObjectMock<ResponseHelpers>([
    { name: 'hasHeader', parameters: [serverRequest, 'origin'], return: true },
    { name: 'hasHeader', parameters: [serverRequest, 'access-control-request-method'], return: true },
    { name: 'getHeader', parameters: [response, 'vary'], return: [] },
    { name: 'withAddedHeader', parameters: [response, 'vary', 'origin'], return: responseWithVary },
    {
      name: 'withHeader',
      parameters: [responseWithVary, 'access-control-allow-origin', 'https://mydomain.tld'],
      return: responseWithAllowOrigin,
    },
    {
      name: 'withHeader',
      parameters: [responseWithAllowOrigin, 'access-control-max-age', '600'],
      return: responseWithMaxAge,
    },
  ]);

  const [handler, handlerMocks] = useFunctionMock<Handler>([]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [serverRequest], return: 'https://mydomain.tld' },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([
    { name: 'negotiate', parameters: [serverRequest], return: false },
  ]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([
    { name: 'negotiate', parameters: [serverRequest], return: false },
  ]);

  const middleware = createCorsMiddleware(
    responseFactory,
    responseHelpers,
    originNegotiator,
    methodNegotiator,
    headersNegotiator,
  );

  expect(await middleware(serverRequest, handler)).toBe(responseWithMaxAge);

  expect(responseFactoryMocks).toHaveLength(0);
  expect(responseHelpersMocks).toHaveLength(0);
  expect(handlerMocks).toHaveLength(0);
  expect(originNegotiatorMocks).toHaveLength(0);
  expect(methodNegotiatorMocks).toHaveLength(0);
  expect(headersNegotiatorMocks).toHaveLength(0);
});

test('preflight with origin, with method, with headers, minimal', async () => {
  const serverRequest = createServerRequest('OPTIONS');

  const response = createResponse('created');
  const responseWithVary = createResponse('vary');
  const responseWithAllowOrigin = createResponse('allow-origin');
  const responseWithAllowMethods = createResponse('allow-methods');
  const responseWithAllowHeaders = createResponse('allow-headers');
  const responseWithMaxAge = createResponse('max-age');

  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
    { parameters: [204, 'No Content'], return: response },
  ]);

  const [responseHelpers, responseHelpersMocks] = useObjectMock<ResponseHelpers>([
    { name: 'hasHeader', parameters: [serverRequest, 'origin'], return: true },
    { name: 'hasHeader', parameters: [serverRequest, 'access-control-request-method'], return: true },
    { name: 'getHeader', parameters: [response, 'vary'], return: [] },
    { name: 'withAddedHeader', parameters: [response, 'vary', 'origin'], return: responseWithVary },
    {
      name: 'withHeader',
      parameters: [responseWithVary, 'access-control-allow-origin', 'https://mydomain.tld'],
      return: responseWithAllowOrigin,
    },
    {
      name: 'withHeader',
      parameters: [responseWithAllowOrigin, 'access-control-allow-methods', 'GET,POST'],
      return: responseWithAllowMethods,
    },
    {
      name: 'withHeader',
      parameters: [responseWithAllowMethods, 'access-control-allow-headers', 'Accept,Content-Type'],
      return: responseWithAllowHeaders,
    },
    {
      name: 'withHeader',
      parameters: [responseWithAllowHeaders, 'access-control-max-age', '600'],
      return: responseWithMaxAge,
    },
  ]);

  const [handler, handlerMocks] = useFunctionMock<Handler>([]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [serverRequest], return: 'https://mydomain.tld' },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([
    { name: 'negotiate', parameters: [serverRequest], return: true },
    { name: 'allowMethods', value: ['GET', 'POST'] },
  ]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([
    { name: 'negotiate', parameters: [serverRequest], return: true },
    { name: 'allowHeaders', value: ['Accept', 'Content-Type'] },
  ]);

  const middleware = createCorsMiddleware(
    responseFactory,
    responseHelpers,
    originNegotiator,
    methodNegotiator,
    headersNegotiator,
  );

  expect(await middleware(serverRequest, handler)).toBe(responseWithMaxAge);

  expect(responseFactoryMocks).toHaveLength(0);
  expect(responseHelpersMocks).toHaveLength(0);
  expect(handlerMocks).toHaveLength(0);
  expect(originNegotiatorMocks).toHaveLength(0);
  expect(methodNegotiatorMocks).toHaveLength(0);
  expect(headersNegotiatorMocks).toHaveLength(0);
});

test('preflight with origin, with method, with headers, maximal', async () => {
  const serverRequest = createServerRequest('OPTIONS');

  const response = createResponse('created');
  const responseWithVary = createResponse('vary');
  const responseWithAllowOrigin = createResponse('allow-origin');
  const responseWithAllowMethods = createResponse('allow-methods');
  const responseWithAllowHeaders = createResponse('allow-headers');
  const responseWithAllowCredentials = createResponse('allow-credentials');
  const responseWithExposeHeaders = createResponse('expose-headers');
  const responseWithMaxAge = createResponse('max-age');

  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
    { parameters: [204, 'No Content'], return: response },
  ]);

  const [responseHelpers, responseHelpersMocks] = useObjectMock<ResponseHelpers>([
    { name: 'hasHeader', parameters: [serverRequest, 'origin'], return: true },
    { name: 'hasHeader', parameters: [serverRequest, 'access-control-request-method'], return: true },
    { name: 'getHeader', parameters: [response, 'vary'], return: [] },
    { name: 'withAddedHeader', parameters: [response, 'vary', 'origin'], return: responseWithVary },
    {
      name: 'withHeader',
      parameters: [responseWithVary, 'access-control-allow-origin', 'https://mydomain.tld'],
      return: responseWithAllowOrigin,
    },
    {
      name: 'withHeader',
      parameters: [responseWithAllowOrigin, 'access-control-allow-methods', 'GET,POST'],
      return: responseWithAllowMethods,
    },
    {
      name: 'withHeader',
      parameters: [responseWithAllowMethods, 'access-control-allow-headers', 'Accept,Content-Type'],
      return: responseWithAllowHeaders,
    },
    {
      name: 'withHeader',
      parameters: [responseWithAllowHeaders, 'access-control-allow-credentials', 'true'],
      return: responseWithAllowCredentials,
    },
    {
      name: 'withHeader',
      parameters: [responseWithAllowCredentials, 'access-control-expose-headers', 'X-Unknown,X-Trace'],
      return: responseWithExposeHeaders,
    },
    {
      name: 'withHeader',
      parameters: [responseWithExposeHeaders, 'access-control-max-age', '7200'],
      return: responseWithMaxAge,
    },
  ]);

  const [handler, handlerMocks] = useFunctionMock<Handler>([]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [serverRequest], return: 'https://mydomain.tld' },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([
    { name: 'negotiate', parameters: [serverRequest], return: true },
    { name: 'allowMethods', value: ['GET', 'POST'] },
  ]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([
    { name: 'negotiate', parameters: [serverRequest], return: true },
    { name: 'allowHeaders', value: ['Accept', 'Content-Type'] },
  ]);

  const middleware = createCorsMiddleware(
    responseFactory,
    responseHelpers,
    originNegotiator,
    methodNegotiator,
    headersNegotiator,
    { exposeHeaders: ['X-Unknown', 'X-Trace'], allowCredentials: true, maxAge: 7200 },
  );

  expect(await middleware(serverRequest, handler)).toBe(responseWithMaxAge);

  expect(responseFactoryMocks).toHaveLength(0);
  expect(responseHelpersMocks).toHaveLength(0);
  expect(handlerMocks).toHaveLength(0);
  expect(originNegotiatorMocks).toHaveLength(0);
  expect(methodNegotiatorMocks).toHaveLength(0);
  expect(headersNegotiatorMocks).toHaveLength(0);
});

test('handle without origin', async () => {
  const serverRequest = createServerRequest('POST');

  const response = createResponse('handled');
  const responseWithVary = createResponse('vary');

  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

  const [responseHelpers, responseHelpersMocks] = useObjectMock<ResponseHelpers>([
    { name: 'getHeader', parameters: [response, 'vary'], return: [] },
    { name: 'withAddedHeader', parameters: [response, 'vary', 'origin'], return: responseWithVary },
  ]);

  const [handler, handlerMocks] = useFunctionMock<Handler>([
    { parameters: [serverRequest], return: Promise.resolve(response) },
  ]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [serverRequest], return: undefined },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([]);

  const middleware = createCorsMiddleware(
    responseFactory,
    responseHelpers,
    originNegotiator,
    methodNegotiator,
    headersNegotiator,
    { exposeHeaders: ['X-Unknown'], allowCredentials: true, maxAge: 7200 },
  );

  expect(await middleware(serverRequest, handler)).toBe(responseWithVary);

  expect(responseFactoryMocks).toHaveLength(0);
  expect(responseHelpersMocks).toHaveLength(0);
  expect(handlerMocks).toHaveLength(0);
  expect(originNegotiatorMocks).toHaveLength(0);
  expect(methodNegotiatorMocks).toHaveLength(0);
  expect(headersNegotiatorMocks).toHaveLength(0);
});

test('handle with origin', async () => {
  const serverRequest = createServerRequest('POST');

  const response = createResponse('handled');
  const responseWithVary = createResponse('vary');
  const responseWithAllowOrigin = createResponse('allow-origin');
  const responseWithAllowCredentials = createResponse('allow-credentials');
  const responseWithExposeHeaders = createResponse('expose-headers');

  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

  const [responseHelpers, responseHelpersMocks] = useObjectMock<ResponseHelpers>([
    { name: 'getHeader', parameters: [response, 'vary'], return: [] },
    { name: 'withAddedHeader', parameters: [response, 'vary', 'origin'], return: responseWithVary },
    {
      name: 'withHeader',
      parameters: [responseWithVary, 'access-control-allow-origin', 'https://mydomain.tld'],
      return: responseWithAllowOrigin,
    },
    {
      name: 'withHeader',
      parameters: [responseWithAllowOrigin, 'access-control-allow-credentials', 'true'],
      return: responseWithAllowCredentials,
    },
    {
      name: 'withHeader',
      parameters: [responseWithAllowCredentials, 'access-control-expose-headers', 'X-Unknown'],
      return: responseWithExposeHeaders,
    },
  ]);

  const [handler, handlerMocks] = useFunctionMock<Handler>([
    { parameters: [serverRequest], return: Promise.resolve(response) },
  ]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [serverRequest], return: 'https://mydomain.tld' },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([]);

  const middleware = createCorsMiddleware(
    responseFactory,
    responseHelpers,
    originNegotiator,
    methodNegotiator,
    headersNegotiator,
    { exposeHeaders: ['X-Unknown'], allowCredentials: true, maxAge: 7200 },
  );

  expect(await middleware(serverRequest, handler)).toBe(responseWithExposeHeaders);

  expect(responseFactoryMocks).toHaveLength(0);
  expect(responseHelpersMocks).toHaveLength(0);
  expect(handlerMocks).toHaveLength(0);
  expect(originNegotiatorMocks).toHaveLength(0);
  expect(methodNegotiatorMocks).toHaveLength(0);
  expect(headersNegotiatorMocks).toHaveLength(0);
});

test('handle with origin and existing vary header', async () => {
  const serverRequest = createServerRequest('POST');

  const response = createResponse('handled');
  const responseWithVary = createResponse('vary');
  const responseWithAllowOrigin = createResponse('allow-origin');

  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

  const [responseHelpers, responseHelpersMocks] = useObjectMock<ResponseHelpers>([
    { name: 'getHeader', parameters: [response, 'vary'], return: ['Accept-Encoding, Accept-Language', 'Cookie'] },
    { name: 'withAddedHeader', parameters: [response, 'vary', 'origin'], return: responseWithVary },
    {
      name: 'withHeader',
      parameters: [responseWithVary, 'access-control-allow-origin', 'https://mydomain.tld'],
      return: responseWithAllowOrigin,
    },
  ]);

  const [handler, handlerMocks] = useFunctionMock<Handler>([
    { parameters: [serverRequest], return: Promise.resolve(response) },
  ]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [serverRequest], return: 'https://mydomain.tld' },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([]);

  const middleware = createCorsMiddleware(
    responseFactory,
    responseHelpers,
    originNegotiator,
    methodNegotiator,
    headersNegotiator,
  );

  expect(await middleware(serverRequest, handler)).toBe(responseWithAllowOrigin);

  expect(responseFactoryMocks).toHaveLength(0);
  expect(responseHelpersMocks).toHaveLength(0);
  expect(handlerMocks).toHaveLength(0);
  expect(originNegotiatorMocks).toHaveLength(0);
  expect(methodNegotiatorMocks).toHaveLength(0);
  expect(headersNegotiatorMocks).toHaveLength(0);
});

test.each([
  ['vary header already containing origin', ['Accept-Encoding', 'Accept-Language, Origin']],
  ['wildcard vary header', ['*']],
])('handle with origin and %s', async (_, vary) => {
  const serverRequest = createServerRequest('POST');

  const response = createResponse('handled');
  const responseWithAllowOrigin = createResponse('allow-origin');

  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

  const [responseHelpers, responseHelpersMocks] = useObjectMock<ResponseHelpers>([
    { name: 'getHeader', parameters: [response, 'vary'], return: vary },
    {
      name: 'withHeader',
      parameters: [response, 'access-control-allow-origin', 'https://mydomain.tld'],
      return: responseWithAllowOrigin,
    },
  ]);

  const [handler, handlerMocks] = useFunctionMock<Handler>([
    { parameters: [serverRequest], return: Promise.resolve(response) },
  ]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [serverRequest], return: 'https://mydomain.tld' },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([]);

  const middleware = createCorsMiddleware(
    responseFactory,
    responseHelpers,
    originNegotiator,
    methodNegotiator,
    headersNegotiator,
  );

  expect(await middleware(serverRequest, handler)).toBe(responseWithAllowOrigin);

  expect(responseFactoryMocks).toHaveLength(0);
  expect(responseHelpersMocks).toHaveLength(0);
  expect(handlerMocks).toHaveLength(0);
  expect(originNegotiatorMocks).toHaveLength(0);
  expect(methodNegotiatorMocks).toHaveLength(0);
  expect(headersNegotiatorMocks).toHaveLength(0);
});

test.each<[string, string, Array<[string, boolean]>]>([
  ['lowercase options', 'options', []],
  ['options without origin', 'OPTIONS', [['origin', false]]],
  [
    'options without access-control-request-method',
    'OPTIONS',
    [
      ['origin', true],
      ['access-control-request-method', false],
    ],
  ],
])('handle %s like an actual request', async (_, method, hasHeaders) => {
  const serverRequest = createServerRequest(method);

  const response = createResponse('handled');
  const responseWithVary = createResponse('vary');

  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

  const [responseHelpers, responseHelpersMocks] = useObjectMock<ResponseHelpers>([
    ...hasHeaders.map(([name, value]) => ({
      name: 'hasHeader' as const,
      parameters: [serverRequest, name] as [ServerRequest, string],
      return: value,
    })),
    { name: 'getHeader', parameters: [response, 'vary'], return: [] },
    { name: 'withAddedHeader', parameters: [response, 'vary', 'origin'], return: responseWithVary },
  ]);

  const [handler, handlerMocks] = useFunctionMock<Handler>([
    { parameters: [serverRequest], return: Promise.resolve(response) },
  ]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [serverRequest], return: undefined },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([]);

  const middleware = createCorsMiddleware(
    responseFactory,
    responseHelpers,
    originNegotiator,
    methodNegotiator,
    headersNegotiator,
  );

  expect(await middleware(serverRequest, handler)).toBe(responseWithVary);

  expect(responseFactoryMocks).toHaveLength(0);
  expect(responseHelpersMocks).toHaveLength(0);
  expect(handlerMocks).toHaveLength(0);
  expect(originNegotiatorMocks).toHaveLength(0);
  expect(methodNegotiatorMocks).toHaveLength(0);
  expect(headersNegotiatorMocks).toHaveLength(0);
});

test.each([[-1], [1.5], [Number.NaN], [Number.POSITIVE_INFINITY]])('invalid maxAge %s', (maxAge) => {
  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);
  const [responseHelpers, responseHelpersMocks] = useObjectMock<ResponseHelpers>([]);
  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([]);
  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([]);
  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([]);

  expect(() =>
    createCorsMiddleware(responseFactory, responseHelpers, originNegotiator, methodNegotiator, headersNegotiator, {
      exposeHeaders: [],
      allowCredentials: false,
      maxAge,
    }),
  ).toThrow(`Invalid maxAge ${maxAge}, expected a non negative integer`);

  expect(responseFactoryMocks).toHaveLength(0);
  expect(responseHelpersMocks).toHaveLength(0);
  expect(originNegotiatorMocks).toHaveLength(0);
  expect(methodNegotiatorMocks).toHaveLength(0);
  expect(headersNegotiatorMocks).toHaveLength(0);
});

test('maxAge 0', async () => {
  const serverRequest = createServerRequest('OPTIONS');

  const response = createResponse('created');
  const responseWithVary = createResponse('vary');
  const responseWithAllowOrigin = createResponse('allow-origin');
  const responseWithMaxAge = createResponse('max-age');

  const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
    { parameters: [204, 'No Content'], return: response },
  ]);

  const [responseHelpers, responseHelpersMocks] = useObjectMock<ResponseHelpers>([
    { name: 'hasHeader', parameters: [serverRequest, 'origin'], return: true },
    { name: 'hasHeader', parameters: [serverRequest, 'access-control-request-method'], return: true },
    { name: 'getHeader', parameters: [response, 'vary'], return: [] },
    { name: 'withAddedHeader', parameters: [response, 'vary', 'origin'], return: responseWithVary },
    {
      name: 'withHeader',
      parameters: [responseWithVary, 'access-control-allow-origin', 'https://mydomain.tld'],
      return: responseWithAllowOrigin,
    },
    {
      name: 'withHeader',
      parameters: [responseWithAllowOrigin, 'access-control-max-age', '0'],
      return: responseWithMaxAge,
    },
  ]);

  const [handler, handlerMocks] = useFunctionMock<Handler>([]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [serverRequest], return: 'https://mydomain.tld' },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([
    { name: 'negotiate', parameters: [serverRequest], return: false },
  ]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([
    { name: 'negotiate', parameters: [serverRequest], return: false },
  ]);

  const middleware = createCorsMiddleware(
    responseFactory,
    responseHelpers,
    originNegotiator,
    methodNegotiator,
    headersNegotiator,
    { exposeHeaders: [], allowCredentials: false, maxAge: 0 },
  );

  expect(await middleware(serverRequest, handler)).toBe(responseWithMaxAge);

  expect(responseFactoryMocks).toHaveLength(0);
  expect(responseHelpersMocks).toHaveLength(0);
  expect(handlerMocks).toHaveLength(0);
  expect(originNegotiatorMocks).toHaveLength(0);
  expect(methodNegotiatorMocks).toHaveLength(0);
  expect(headersNegotiatorMocks).toHaveLength(0);
});
