import type { Container } from '@chubbyts/chubbyts-dic-types/container';
import { createAbstractFactory } from '@chubbyts/chubbyts-dic-config-factory/dic-config-factory';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/message-factory';
import type { ResponseHelpers, ServerRequestHelpers } from '@chubbyts/chubbyts-http-types/message-helper';
import type { Middleware } from '@chubbyts/chubbyts-http-types/middleware';
import { createCorsMiddleware } from './middleware.js';
import type { HeadersNegotiator, MethodNegotiator, OriginNegotiator } from './negotiation.js';
import {
  createAllowOriginExact,
  createAllowOriginRegex,
  createHeadersNegotiator,
  createMethodNegotiator,
  createOriginNegotiator,
} from './negotiation.js';

/**
 * The configuration read by the service factories from `config.chubbyts.cors` (or `config.chubbyts.cors.<name>` for
 * named factories), see the arguments of `createOriginNegotiator`, `createMethodNegotiator`,
 * `createHeadersNegotiator` and `createCorsMiddleware`.
 */
export type CorsConfig = {
  allowOrigins?: {
    createAllowOriginExact?: Array<string>;
    createAllowOriginRegex?: Array<RegExp>;
  };
  allowMethods?: Array<string>;
  allowHeaders?: Array<string>;
  exposeHeaders?: Array<string>;
  allowCredentials?: boolean;
  maxAge?: number;
};

// the http-types implementation (e.g. @chubbyts/chubbyts-http) gets shared by all services of the container
const serverRequestHelpersId = 'serverRequestHelpers';
const responseFactoryId = 'responseFactory';
const responseHelpersId = 'responseHelpers';

type Config = {
  chubbyts: {
    cors: CorsConfig | Record<string, CorsConfig>;
  };
};

export const originNegotiatorServiceFactory = createAbstractFactory(
  (container: Container, { resolveConfig }): OriginNegotiator => {
    const { allowOrigins = {} } = resolveConfig(container.get<Config>('config').chubbyts.cors);

    return createOriginNegotiator(container.get<ServerRequestHelpers>(serverRequestHelpersId), [
      ...(allowOrigins.createAllowOriginExact ?? []).map(createAllowOriginExact),
      ...(allowOrigins.createAllowOriginRegex ?? []).map(createAllowOriginRegex),
    ]);
  },
);

export const methodNegotiatorServiceFactory = createAbstractFactory(
  (container: Container, { resolveConfig }): MethodNegotiator => {
    const { allowMethods = [] } = resolveConfig(container.get<Config>('config').chubbyts.cors);

    return createMethodNegotiator(container.get<ServerRequestHelpers>(serverRequestHelpersId), allowMethods);
  },
);

export const headersNegotiatorServiceFactory = createAbstractFactory(
  (container: Container, { resolveConfig }): HeadersNegotiator => {
    const { allowHeaders = [] } = resolveConfig(container.get<Config>('config').chubbyts.cors);

    return createHeadersNegotiator(container.get<ServerRequestHelpers>(serverRequestHelpersId), allowHeaders);
  },
);

export const corsMiddlewareServiceFactory = createAbstractFactory(
  (container: Container, { resolveConfig, resolveDependency }): Middleware => {
    const { exposeHeaders, allowCredentials, maxAge } = resolveConfig(container.get<Config>('config').chubbyts.cors);

    // a registered service wins over the shipped factory, so that any part can be replaced or shared between services
    return createCorsMiddleware(
      container.get<ResponseFactory>(responseFactoryId),
      container.get<ResponseHelpers>(responseHelpersId),
      resolveDependency(container, 'corsOriginNegotiator', originNegotiatorServiceFactory),
      resolveDependency(container, 'corsMethodNegotiator', methodNegotiatorServiceFactory),
      resolveDependency(container, 'corsHeadersNegotiator', headersNegotiatorServiceFactory),
      { exposeHeaders, allowCredentials, maxAge },
    );
  },
);
