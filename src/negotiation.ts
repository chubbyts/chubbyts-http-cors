import type { ServerRequest } from '@chubbyts/chubbyts-http-types/message';
import type { MessageHelpers } from '@chubbyts/chubbyts-http-types/message-helper';

export type AllowOrigin = (origin: string) => boolean;

export const createAllowOriginExact = (allowOrigin: string): AllowOrigin => {
  return (origin: string): boolean => {
    return origin === allowOrigin;
  };
};

export const createAllowOriginRegex = (allowOrigin: RegExp): AllowOrigin => {
  // without the global and sticky flag: they keep a lastIndex between calls, which makes every other match fail
  const stateless = new RegExp(allowOrigin.source, allowOrigin.flags.replace(/[gy]/g, ''));

  return (origin: string): boolean => {
    return stateless.test(origin);
  };
};

// origin and access-control-request-method are singleton fields: multiple values cannot be sent by a browser and
// joining them would allow a crafted combination to match an allow rule
const getSingletonHeader = (
  messageHelpers: MessageHelpers,
  request: ServerRequest,
  name: string,
): string | undefined => {
  const values = messageHelpers.getHeader(request, name);

  return values.length === 1 ? values[0] : undefined;
};

export type OriginNegotiator = (request: ServerRequest) => string | undefined;

export const createOriginNegotiator = (
  messageHelpers: MessageHelpers,
  allowOrigins: Array<AllowOrigin>,
): OriginNegotiator => {
  return (request: ServerRequest): string | undefined => {
    const origin = getSingletonHeader(messageHelpers, request, 'origin');

    if (!origin) {
      return undefined;
    }

    for (const allowOrigin of allowOrigins) {
      if (allowOrigin(origin)) {
        return origin;
      }
    }

    return undefined;
  };
};

export type MethodNegotiator = {
  negotiate: (request: ServerRequest) => boolean;
  allowMethods: Array<string>;
};

export const createMethodNegotiator = (
  messageHelpers: MessageHelpers,
  allowMethods: Array<string>,
): MethodNegotiator => {
  return {
    negotiate: (request: ServerRequest): boolean => {
      const accessControlRequestMethod = getSingletonHeader(messageHelpers, request, 'access-control-request-method');

      if (!accessControlRequestMethod) {
        return false;
      }

      // methods are case-sensitive (RFC 9110 9.1), browsers compare access-control-allow-methods the same way
      return allowMethods.includes(accessControlRequestMethod);
    },
    allowMethods,
  };
};

export type HeadersNegotiator = {
  negotiate: (request: ServerRequest) => boolean;
  allowHeaders: Array<string>;
};

export const createHeadersNegotiator = (
  messageHelpers: MessageHelpers,
  allowHeaders: Array<string>,
): HeadersNegotiator => {
  return {
    negotiate: (request: ServerRequest): boolean => {
      // a list field: multiple values get joined with ', '
      const accessControlRequestHeaders = messageHelpers.getHeaderLine(request, 'access-control-request-headers');

      if (!accessControlRequestHeaders) {
        return false;
      }

      return accessControlRequestHeaders.split(',').every((accessControlRequestHeader) => {
        return allowHeaders.some(
          (allowHeader: string) => allowHeader.toUpperCase() === accessControlRequestHeader.trim().toUpperCase(),
        );
      });
    },
    allowHeaders,
  };
};
