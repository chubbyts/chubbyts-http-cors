import { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { Method, Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { Middleware } from '@chubbyts/chubbyts-http-types/dist/middleware';
import { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { HeadersNegotiator, MethodNegotiator, OriginNegotiator } from './negotiation';

const isPreflight = (request: ServerRequest) => request.method.toUpperCase() === Method.OPTIONS;

type ResponseMiddleware = (response: Response) => Response;

const responseMiddlewarePipeline = (middlewares: Array<ResponseMiddleware>): ResponseMiddleware => {
  return (response: Response) => middlewares.reduce((result, middleware) => middleware(result), response);
};

const addAllowOrigin = (allowOrigin: string): ResponseMiddleware => {
  return (response: Response): Response => ({
    ...response,
    headers: { ...response.headers, 'access-control-allow-origin': [allowOrigin] },
  });
};

const addAllowMethod = (allowedMethods: Array<string>): ResponseMiddleware => {
  return (response: Response): Response => ({
    ...response,
    headers: { ...response.headers, 'access-control-allow-methods': allowedMethods },
  });
};

const addExposeHeaders = (exposeHeaders: Array<string>): ResponseMiddleware => {
  return (response: Response): Response => {
    if (exposeHeaders.length === 0) {
      return response;
    }

    return { ...response, headers: { ...response.headers, 'access-control-expose-headers': exposeHeaders } };
  };
};

const addAllowCredentials = (allowCredentials: boolean): ResponseMiddleware => {
  return (response: Response): Response => ({
    ...response,
    headers: { ...response.headers, 'access-control-allow-credentials': [allowCredentials ? 'true' : 'false'] },
  });
};

const addAllowHeaders = (allowHeaders: Array<string>): ResponseMiddleware => {
  return (response: Response): Response => ({
    ...response,
    headers: { ...response.headers, 'access-control-allow-headers': allowHeaders },
  });
};

const addMaxAge = (maxAge: number): ResponseMiddleware => {
  return (response: Response): Response => ({
    ...response,
    headers: { ...response.headers, 'access-control-max-age': [maxAge.toString()] },
  });
};

const handlePreflight = (
  request: ServerRequest,
  responseFactory: ResponseFactory,
  originNegotiator: OriginNegotiator,
  methodNegotiator: MethodNegotiator,
  headersNegotiator: HeadersNegotiator,
  exposeHeaders: Array<string>,
  allowCredentials: boolean,
  maxAge: number,
) => {
  const response = responseFactory(204);
  response.body.end();

  const allowOrigin = originNegotiator(request);

  if (!allowOrigin) {
    return response;
  }

  return responseMiddlewarePipeline([
    addAllowOrigin(allowOrigin),
    ...(methodNegotiator.negotiate(request) ? [addAllowMethod(methodNegotiator.allowMethods)] : []),
    ...(headersNegotiator.negotiate(request) ? [addAllowHeaders(headersNegotiator.allowHeaders)] : []),
    addAllowCredentials(allowCredentials),
    addExposeHeaders(exposeHeaders),
    addMaxAge(maxAge),
  ])(response);
};

const handle = async (
  request: ServerRequest,
  handler: Handler,
  originNegotiator: OriginNegotiator,
  exposeHeaders: Array<string>,
  allowCredentials: boolean,
): Promise<Response> => {
  const response = await handler(request);

  const allowOrigin = originNegotiator(request);

  if (!allowOrigin) {
    return response;
  }

  return responseMiddlewarePipeline([
    addAllowOrigin(allowOrigin),
    addAllowCredentials(allowCredentials),
    addExposeHeaders(exposeHeaders),
  ])(response);
};

export const createCorsMiddleware = (
  responseFactory: ResponseFactory,
  originNegotiator: OriginNegotiator,
  methodNegotiator: MethodNegotiator,
  headersNegotiator: HeadersNegotiator,
  exposeHeaders: Array<string> = [],
  allowCredentials: boolean = false,
  maxAge: number = 600,
): Middleware => {
  return async (request: ServerRequest, handler: Handler): Promise<Response> => {
    if (isPreflight(request)) {
      return handlePreflight(
        request,
        responseFactory,
        originNegotiator,
        methodNegotiator,
        headersNegotiator,
        exposeHeaders,
        allowCredentials,
        maxAge,
      );
    }

    return handle(request, handler, originNegotiator, exposeHeaders, allowCredentials);
  };
};
