# chubbyts-http-cors

[![CI](https://github.com/chubbyts/chubbyts-http-cors/workflows/CI/badge.svg?branch=master)](https://github.com/chubbyts/chubbyts-http-cors/actions?query=workflow%3ACI)
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

A CORS middleware for @chubbyts/chubbyts-http-types.

*Apply toLowerCase() to each related request header name before pass the request to this middleware.*

## Requirements

 * node: 18
 * [@chubbyts/chubbyts-http-types][2]: ^1.3.0

## Installation

Through [NPM](https://www.npmjs.com) as [@chubbyts/chubbyts-http-cors][1].

```ts
npm i @chubbyts/chubbyts-http-cors@^1.3.0
```

## Usage

```ts
import { createCorsMiddleware } from '@chubbyts/chubbyts-http-cors/dist/middleware';
import {
  createAllowOriginRegex,
  createHeadersNegotiator,
  createMethodNegotiator,
  createOriginNegotiator,
} from '@chubbyts/chubbyts-http-cors/dist/negotiation';
import { createResponseFactory } from '@chubbyts/chubbyts-http/dist/message-factory';
import { Method } from '@chubbyts/chubbyts-http-types/dist/message';

const corsMiddleware = createCorsMiddleware(
  createResponseFactory(),
  createOriginNegotiator([createAllowOriginRegex(/^https?\:\/\/localhost(\:\d+)?$/)]),
  createMethodNegotiator([Method.GET, Method.POST, Method.PUT, Method.DELETE]),
  createHeadersNegotiator(['Content-Type', 'Accept']),
);

(async () => {
  const response = await corsMiddleware(request, handler);
})();
```

## Copyright

2025 Dominik Zogg

[1]: https://www.npmjs.com/package/@chubbyts/chubbyts-http-cors
[2]: https://www.npmjs.com/package/@chubbyts/chubbyts-http-types
