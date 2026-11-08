import { describe, expect, test } from 'vitest';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/object-mock';
import type { ServerRequest } from '@chubbyts/chubbyts-http-types/message';
import type { MessageHelpers } from '@chubbyts/chubbyts-http-types/message-helper';
import type { AllowOrigin } from '../src/negotiation.js';
import {
  createAllowOriginExact,
  createAllowOriginRegex,
  createHeadersNegotiator,
  createMethodNegotiator,
  createOriginNegotiator,
} from '../src/negotiation.js';

// the helpers get mocked: the request is never read directly, any implementation can be used
const serverRequest = { method: 'OPTIONS' } as ServerRequest;

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

  test.each([
    ['global', /^https:\/\/my/g],
    ['sticky', /^https:\/\/my/y],
  ])('match repeatedly with %s flag', (_, regex) => {
    const allowOriginRegex = createAllowOriginRegex(regex);

    expect(allowOriginRegex('https://mydomain.tld')).toBe(true);
    expect(allowOriginRegex('https://mydomain.tld')).toBe(true);
  });

  test('keep the other flags', async () => {
    const allowOriginRegex = createAllowOriginRegex(/^https:\/\/MY/gi);

    expect(allowOriginRegex('https://mydomain.tld')).toBe(true);
  });
});

describe('createOriginNegotiator', () => {
  test('missing origin header', async () => {
    const [messageHelpers, messageHelpersMocks] = useObjectMock<MessageHelpers>([
      { name: 'getHeader', parameters: [serverRequest, 'origin'], return: [] },
    ]);

    const [allowOrigin, allowOriginMocks] = useFunctionMock<AllowOrigin>([]);

    const originNegotiator = createOriginNegotiator(messageHelpers, [allowOrigin]);

    expect(originNegotiator(serverRequest)).toBeUndefined();

    expect(messageHelpersMocks).toHaveLength(0);
    expect(allowOriginMocks).toHaveLength(0);
  });

  test('empty origin header', async () => {
    const [messageHelpers, messageHelpersMocks] = useObjectMock<MessageHelpers>([
      { name: 'getHeader', parameters: [serverRequest, 'origin'], return: [''] },
    ]);

    const [allowOrigin, allowOriginMocks] = useFunctionMock<AllowOrigin>([]);

    const originNegotiator = createOriginNegotiator(messageHelpers, [allowOrigin]);

    expect(originNegotiator(serverRequest)).toBeUndefined();

    expect(messageHelpersMocks).toHaveLength(0);
    expect(allowOriginMocks).toHaveLength(0);
  });

  test('multiple origin headers', async () => {
    const [messageHelpers, messageHelpersMocks] = useObjectMock<MessageHelpers>([
      {
        name: 'getHeader',
        parameters: [serverRequest, 'origin'],
        return: ['https://mydomain.tld', 'https://evil.tld'],
      },
    ]);

    const [allowOrigin, allowOriginMocks] = useFunctionMock<AllowOrigin>([]);

    const originNegotiator = createOriginNegotiator(messageHelpers, [allowOrigin]);

    expect(originNegotiator(serverRequest)).toBeUndefined();

    expect(messageHelpersMocks).toHaveLength(0);
    expect(allowOriginMocks).toHaveLength(0);
  });

  test('match', async () => {
    const origin = 'https://mydomain.tld';

    const [messageHelpers, messageHelpersMocks] = useObjectMock<MessageHelpers>([
      { name: 'getHeader', parameters: [serverRequest, 'origin'], return: [origin] },
    ]);

    const [allowOrigin1, allowOrigin1Mocks] = useFunctionMock<AllowOrigin>([{ parameters: [origin], return: false }]);

    const [allowOrigin2, allowOrigin2Mocks] = useFunctionMock<AllowOrigin>([{ parameters: [origin], return: true }]);

    const originNegotiator = createOriginNegotiator(messageHelpers, [allowOrigin1, allowOrigin2]);

    expect(originNegotiator(serverRequest)).toBe('https://mydomain.tld');

    expect(messageHelpersMocks).toHaveLength(0);
    expect(allowOrigin1Mocks).toHaveLength(0);
    expect(allowOrigin2Mocks).toHaveLength(0);
  });

  test('not match', async () => {
    const origin = 'https://mydomain.tld';

    const [messageHelpers, messageHelpersMocks] = useObjectMock<MessageHelpers>([
      { name: 'getHeader', parameters: [serverRequest, 'origin'], return: [origin] },
    ]);

    const [allowOrigin1, allowOrigin1Mocks] = useFunctionMock<AllowOrigin>([{ parameters: [origin], return: false }]);

    const [allowOrigin2, allowOrigin2Mocks] = useFunctionMock<AllowOrigin>([{ parameters: [origin], return: false }]);

    const originNegotiator = createOriginNegotiator(messageHelpers, [allowOrigin1, allowOrigin2]);

    expect(originNegotiator(serverRequest)).toBeUndefined();

    expect(messageHelpersMocks).toHaveLength(0);
    expect(allowOrigin1Mocks).toHaveLength(0);
    expect(allowOrigin2Mocks).toHaveLength(0);
  });
});

describe('createMethodNegotiator', () => {
  test.each([
    ['without method', []],
    ['with empty method', ['']],
    ['with not allowed method', ['PUT']],
    ['with method in other case', ['post']],
    ['with multiple methods', ['post', 'get']],
  ])('%s', (_, values) => {
    const [messageHelpers, messageHelpersMocks] = useObjectMock<MessageHelpers>([
      { name: 'getHeader', parameters: [serverRequest, 'access-control-request-method'], return: values },
    ]);

    const methodNegotiator = createMethodNegotiator(messageHelpers, ['GET', 'POST']);

    expect(methodNegotiator.negotiate(serverRequest)).toBe(false);

    expect(messageHelpersMocks).toHaveLength(0);
  });

  test('with empty method, even if allowed', () => {
    const [messageHelpers, messageHelpersMocks] = useObjectMock<MessageHelpers>([
      { name: 'getHeader', parameters: [serverRequest, 'access-control-request-method'], return: [''] },
    ]);

    const methodNegotiator = createMethodNegotiator(messageHelpers, ['']);

    expect(methodNegotiator.negotiate(serverRequest)).toBe(false);

    expect(messageHelpersMocks).toHaveLength(0);
  });

  test('with allowed method', () => {
    const [messageHelpers, messageHelpersMocks] = useObjectMock<MessageHelpers>([
      { name: 'getHeader', parameters: [serverRequest, 'access-control-request-method'], return: ['POST'] },
    ]);

    const methodNegotiator = createMethodNegotiator(messageHelpers, ['GET', 'POST']);

    expect(methodNegotiator.negotiate(serverRequest)).toBe(true);

    expect(messageHelpersMocks).toHaveLength(0);
  });

  test('get allowed methods', () => {
    const allowMethods = ['GET', 'POST'];

    const [messageHelpers, messageHelpersMocks] = useObjectMock<MessageHelpers>([]);

    const methodNegotiator = createMethodNegotiator(messageHelpers, allowMethods);

    expect(methodNegotiator.allowMethods).toBe(allowMethods);

    expect(messageHelpersMocks).toHaveLength(0);
  });
});

describe('createHeadersNegotiator', () => {
  test('without headers', () => {
    const [messageHelpers, messageHelpersMocks] = useObjectMock<MessageHelpers>([
      { name: 'getHeaderLine', parameters: [serverRequest, 'access-control-request-headers'], return: '' },
    ]);

    // an empty (misconfigured) allow header must not negotiate a missing request header
    const headersNegotiator = createHeadersNegotiator(messageHelpers, ['', 'Authorization']);

    expect(headersNegotiator.negotiate(serverRequest)).toBe(false);

    expect(messageHelpersMocks).toHaveLength(0);
  });

  test.each([
    ['with same headers', 'Authorization, Content-Type, Accept'],
    ['with same headers lower case', 'authorization, content-Type, accept'],
    ['with less headers', 'Authorization'],
  ])('%s', (_, accessControlRequestHeaders) => {
    const [messageHelpers, messageHelpersMocks] = useObjectMock<MessageHelpers>([
      {
        name: 'getHeaderLine',
        parameters: [serverRequest, 'access-control-request-headers'],
        return: accessControlRequestHeaders,
      },
    ]);

    const headersNegotiator = createHeadersNegotiator(messageHelpers, ['Authorization', 'Accept', 'Content-Type']);

    expect(headersNegotiator.negotiate(serverRequest)).toBe(true);

    expect(messageHelpersMocks).toHaveLength(0);
  });

  test('with to many headers', () => {
    const [messageHelpers, messageHelpersMocks] = useObjectMock<MessageHelpers>([
      {
        name: 'getHeaderLine',
        parameters: [serverRequest, 'access-control-request-headers'],
        return: 'Authorization, Accept, Content-Type',
      },
    ]);

    const headersNegotiator = createHeadersNegotiator(messageHelpers, ['Authorization', 'Content-Type']);

    expect(headersNegotiator.negotiate(serverRequest)).toBe(false);

    expect(messageHelpersMocks).toHaveLength(0);
  });

  test('get allowed headers', () => {
    const allowHeaders = ['Authorization', 'Accept', 'Content-Type'];

    const [messageHelpers, messageHelpersMocks] = useObjectMock<MessageHelpers>([]);

    const headersNegotiator = createHeadersNegotiator(messageHelpers, allowHeaders);

    expect(headersNegotiator.allowHeaders).toBe(allowHeaders);

    expect(messageHelpersMocks).toHaveLength(0);
  });
});
