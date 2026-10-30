import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/message-factory';
import type { ResponseHelpers } from '@chubbyts/chubbyts-http-types/message-helper';
import type { Handler } from '@chubbyts/chubbyts-http-types/handler';
import type { Middleware } from '@chubbyts/chubbyts-http-types/middleware';
import type { HeadersNegotiator, MethodNegotiator, OriginNegotiator } from './negotiation.js';

// a preflight is an OPTIONS request (case-sensitive, RFC 9110 9.1) with origin and access-control-request-method, any
// other OPTIONS request gets handled like an actual one
const isPreflight = (responseHelpers: ResponseHelpers, request: ServerRequest) =>
  request.method === 'OPTIONS' &&
  responseHelpers.hasHeader(request, 'origin') &&
  responseHelpers.hasHeader(request, 'access-control-request-method');

type ResponseMiddleware = (response: Response) => Response;

const responseMiddlewarePipeline = (middlewares: Array<ResponseMiddleware>): ResponseMiddleware => {
  return (response: Response) => middlewares.reduce((result, middleware) => middleware(result), response);
};

const withVaryOrigin = (responseHelpers: ResponseHelpers, response: Response): Response => {
  // vary is a list field: each value can contain multiple comma separated field names
  const varyValues = responseHelpers
    .getHeader(response, 'vary')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim());

  if (varyValues.some((value) => value.toLowerCase() === 'origin' || value === '*')) {
    return response;
  }

  return responseHelpers.withAddedHeader(response, 'vary', 'origin');
};

const addAllowOrigin = (responseHelpers: ResponseHelpers, allowOrigin: string): ResponseMiddleware => {
  return (response: Response): Response => {
    return responseHelpers.withHeader(response, 'access-control-allow-origin', allowOrigin);
  };
};

const addAllowMethod = (responseHelpers: ResponseHelpers, allowedMethods: Array<string>): ResponseMiddleware => {
  return (response: Response): Response => {
    return responseHelpers.withHeader(response, 'access-control-allow-methods', allowedMethods.join(','));
  };
};

const addExposeHeaders = (responseHelpers: ResponseHelpers, exposeHeaders: Array<string>): ResponseMiddleware => {
  return (response: Response): Response => {
    if (exposeHeaders.length === 0) {
      return response;
    }

    return responseHelpers.withHeader(response, 'access-control-expose-headers', exposeHeaders.join(','));
  };
};

const addAllowCredentials = (responseHelpers: ResponseHelpers, allowCredentials: boolean): ResponseMiddleware => {
  return (response: Response): Response => {
    if (!allowCredentials) {
      return response;
    }

    return responseHelpers.withHeader(response, 'access-control-allow-credentials', 'true');
  };
};

const addAllowHeaders = (responseHelpers: ResponseHelpers, allowHeaders: Array<string>): ResponseMiddleware => {
  return (response: Response): Response => {
    return responseHelpers.withHeader(response, 'access-control-allow-headers', allowHeaders.join(','));
  };
};

const addMaxAge = (responseHelpers: ResponseHelpers, maxAge: number): ResponseMiddleware => {
  return (response: Response): Response => {
    return responseHelpers.withHeader(response, 'access-control-max-age', maxAge.toString());
  };
};

export type CorsMiddlewareOptions = {
  exposeHeaders?: Array<string>;
  allowCredentials?: boolean;
  maxAge?: number;
};

export const createCorsMiddleware = (
  responseFactory: ResponseFactory,
  responseHelpers: ResponseHelpers,
  originNegotiator: OriginNegotiator,
  methodNegotiator: MethodNegotiator,
  headersNegotiator: HeadersNegotiator,
  { exposeHeaders = [], allowCredentials = false, maxAge = 600 }: CorsMiddlewareOptions = {},
): Middleware => {
  if (!Number.isSafeInteger(maxAge) || maxAge < 0) {
    throw new Error(`Invalid maxAge ${maxAge}, expected a non negative integer`);
  }

  const handlePreflight = (request: ServerRequest): Response => {
    const response = withVaryOrigin(responseHelpers, responseFactory(204, 'No Content'));

    const allowOrigin = originNegotiator(request);

    if (!allowOrigin) {
      return response;
    }

    return responseMiddlewarePipeline([
      addAllowOrigin(responseHelpers, allowOrigin),
      ...(methodNegotiator.negotiate(request) ? [addAllowMethod(responseHelpers, methodNegotiator.allowMethods)] : []),
      ...(headersNegotiator.negotiate(request)
        ? [addAllowHeaders(responseHelpers, headersNegotiator.allowHeaders)]
        : []),
      addAllowCredentials(responseHelpers, allowCredentials),
      addExposeHeaders(responseHelpers, exposeHeaders),
      addMaxAge(responseHelpers, maxAge),
    ])(response);
  };

  const handle = async (request: ServerRequest, handler: Handler): Promise<Response> => {
    const response = withVaryOrigin(responseHelpers, await handler(request));

    const allowOrigin = originNegotiator(request);

    if (!allowOrigin) {
      return response;
    }

    return responseMiddlewarePipeline([
      addAllowOrigin(responseHelpers, allowOrigin),
      addAllowCredentials(responseHelpers, allowCredentials),
      addExposeHeaders(responseHelpers, exposeHeaders),
    ])(response);
  };

  return async (request: ServerRequest, handler: Handler): Promise<Response> => {
    // created and changed through the injected implementation only: the middleware works with any of them
    if (isPreflight(responseHelpers, request)) {
      return handlePreflight(request);
    }

    return handle(request, handler);
  };
};
