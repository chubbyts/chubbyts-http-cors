# chubbyts-http-cors

[![CI](https://github.com/chubbyts/chubbyts-http-cors/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/chubbyts/chubbyts-http-cors/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/chubbyts/chubbyts-http-cors/badge.svg?branch=master)](https://coveralls.io/github/chubbyts/chubbyts-http-cors?branch=master)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fchubbyts%2Fchubbyts-http-cors%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/chubbyts/chubbyts-http-cors/master)
[![npm-version](https://img.shields.io/npm/v/@chubbyts/chubbyts-http-cors.svg)](https://www.npmjs.com/package/@chubbyts/chubbyts-http-cors)

[![bugs](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-http-cors&metric=bugs)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-http-cors)
[![code_smells](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-http-cors&metric=code_smells)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-http-cors)
[![coverage](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-http-cors&metric=coverage)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-http-cors)
[![duplicated_lines_density](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-http-cors&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-http-cors)
[![ncloc](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-http-cors&metric=ncloc)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-http-cors)
[![sqale_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-http-cors&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-http-cors)
[![alert_status](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-http-cors&metric=alert_status)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-http-cors)
[![reliability_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-http-cors&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-http-cors)
[![security_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-http-cors&metric=security_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-http-cors)
[![sqale_index](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-http-cors&metric=sqale_index)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-http-cors)
[![vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-http-cors&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-http-cors)

## Description

A minimal cors middleware for [@chubbyts/chubbyts-http-types][2].

It works with any implementation of the types (e.g. [@chubbyts/chubbyts-http][6]): the request headers get read
through the injected helpers, the responses get created and changed through the injected response factory and helpers
only.

## Requirements

 * node: 22
 * [@chubbyts/chubbyts-dic-config-factory][5]: ^1.1.0
 * [@chubbyts/chubbyts-dic-types][3]: ^2.4.0
 * [@chubbyts/chubbyts-http-types][2]: ^4.0.0

## Installation

Through [NPM](https://www.npmjs.com) as [@chubbyts/chubbyts-http-cors][1].

```ts
npm i @chubbyts/chubbyts-http-cors@^3.1.0
```

## Usage

```ts
import { createResponseFactory, createServerRequestFactory } from '@chubbyts/chubbyts-http/message-factory';
import { createResponseHelpers, createServerRequestHelpers } from '@chubbyts/chubbyts-http/message-helper';
import type { Handler } from '@chubbyts/chubbyts-http-types/handler';
import { createCorsMiddleware } from '@chubbyts/chubbyts-http-cors/middleware';
import {
  createAllowOriginRegex,
  createHeadersNegotiator,
  createMethodNegotiator,
  createOriginNegotiator,
} from '@chubbyts/chubbyts-http-cors/negotiation';

const serverRequestFactory = createServerRequestFactory();
const serverRequestHelpers = createServerRequestHelpers();
const responseFactory = createResponseFactory();
const responseHelpers = createResponseHelpers();

const corsMiddleware = createCorsMiddleware(
  responseFactory,
  responseHelpers,
  createOriginNegotiator(serverRequestHelpers, [createAllowOriginRegex(/^https?\:\/\/localhost(\:\d+)?$/)]),
  createMethodNegotiator(serverRequestHelpers, ['GET', 'POST', 'PUT', 'DELETE']),
  createHeadersNegotiator(serverRequestHelpers, ['Content-Type', 'Accept']),
  // { exposeHeaders: [], allowCredentials: false, maxAge: 600 },
);

const handler: Handler = async () => responseFactory(200);

(async () => {
  const serverRequest = serverRequestFactory('GET', 'https://example.com/');
  const response = await corsMiddleware(serverRequest, handler);
})();
```

Only an `OPTIONS` request with an `origin` and an `access-control-request-method` header gets handled as preflight,
any other request (including other `OPTIONS` requests) gets passed to the handler. Methods are case-sensitive (like
in the browser): use `GET`, not `get`. The `maxAge` has to be a non negative integer.

The `origin` and `access-control-request-method` headers are singleton fields: a request with multiple values of them
gets no cors headers. The `vary: origin` header gets added to every response (unless it already varies by `origin` or
`*`).

**Warning:** When using `createAllowOriginRegex`, always anchor the pattern with `^` and `$` and escape dots. An unanchored pattern like `/example\.com/` also matches unintended origins such as `https://evil-example.com` or `https://example.com.attacker.tld`.

### Service factories (chubbyts-dic-config)

The package ships service factories (abstract factories built on [chubbyts-dic-config-factory][5]) for a [chubbyts-dic-config][4] (or any [chubbyts-dic-types][3] compatible) container within `@chubbyts/chubbyts-http-cors/service-factory`, configured through `config.chubbyts.cors`. The implementation of the types gets read from the services `serverRequestHelpers`, `responseFactory` and `responseHelpers`, which have to be registered:

```ts
import type { ConfigFactory } from '@chubbyts/chubbyts-dic-config/dic-config';
import { createContainerByConfigFactory } from '@chubbyts/chubbyts-dic-config/dic-config';
import { createResponseFactory } from '@chubbyts/chubbyts-http/message-factory';
import { createResponseHelpers, createServerRequestHelpers } from '@chubbyts/chubbyts-http/message-helper';
import type { CorsConfig } from '@chubbyts/chubbyts-http-cors/service-factory';
import { corsMiddlewareServiceFactory } from '@chubbyts/chubbyts-http-cors/service-factory';
import type { Middleware } from '@chubbyts/chubbyts-http-types/middleware';

const container = createContainerByConfigFactory({
  chubbyts: {
    cors: {
      allowOrigins: {
        createAllowOriginExact: ['https://app.example.com'],
        createAllowOriginRegex: [/^https?\:\/\/localhost(\:\d+)?$/],
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowHeaders: ['Content-Type', 'Accept'],
      // exposeHeaders: [],
      // allowCredentials: false,
      // maxAge: 600,
    } satisfies CorsConfig,
  },
  dependencies: {
    factories: new Map<string, ConfigFactory>([
      ['serverRequestHelpers', () => createServerRequestHelpers()],
      ['responseFactory', () => createResponseFactory()],
      ['responseHelpers', () => createResponseHelpers()],
      ['corsMiddleware', corsMiddlewareServiceFactory()],
    ]),
  },
})();

const corsMiddleware = container.get<Middleware>('corsMiddleware');
```

The `corsMiddlewareServiceFactory` uses the services `corsOriginNegotiator`, `corsMethodNegotiator` and `corsHeadersNegotiator` of the container if registered, and creates them through the shipped `originNegotiatorServiceFactory`, `methodNegotiatorServiceFactory` and `headersNegotiatorServiceFactory` otherwise. Register any of them under its name to replace it (e.g. a custom `OriginNegotiator`) or to share it with other services.

#### With names

To serve different parts of an api with different cors rules, the same factories can be registered multiple times with a name: the config is then read from `config.chubbyts.cors.<name>` and the name gets appended to each service id (`corsMiddlewareapi`, `corsOriginNegotiatorapi`, ...).

```ts
const container = createContainerByConfigFactory({
  chubbyts: {
    cors: {
      api: { allowOrigins: { createAllowOriginExact: ['https://app.example.com'] }, allowMethods: ['GET', 'POST'] },
      admin: { allowOrigins: { createAllowOriginExact: ['https://admin.example.com'] }, allowMethods: ['GET', 'DELETE'] },
    } satisfies Record<string, CorsConfig>,
  },
  dependencies: {
    factories: new Map<string, ConfigFactory>([
      // serverRequestHelpers, responseFactory and responseHelpers like above
      ['corsMiddlewareapi', corsMiddlewareServiceFactory('api')],
      ['corsMiddlewareadmin', corsMiddlewareServiceFactory('admin')],
    ]),
  },
})();

const apiCorsMiddleware = container.get<Middleware>('corsMiddlewareapi');
const adminCorsMiddleware = container.get<Middleware>('corsMiddlewareadmin');
```

## Copyright

2026 Dominik Zogg

[1]: https://www.npmjs.com/package/@chubbyts/chubbyts-http-cors
[2]: https://www.npmjs.com/package/@chubbyts/chubbyts-http-types
[3]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic-types
[4]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic-config
[5]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic-config-factory
[6]: https://www.npmjs.com/package/@chubbyts/chubbyts-http
