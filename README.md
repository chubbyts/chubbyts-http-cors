# chubbyts-cors

[![CI](https://github.com/chubbyts/chubbyts-cors/workflows/CI/badge.svg?branch=master)](https://github.com/chubbyts/chubbyts-cors/actions?query=workflow%3ACI)
[![Coverage Status](https://coveralls.io/repos/github/chubbyts/chubbyts-cors/badge.svg?branch=master)](https://coveralls.io/github/chubbyts/chubbyts-cors?branch=master)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fchubbyts%2Fchubbyts-cors%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/chubbyts/chubbyts-cors/master)
[![npm-version](https://img.shields.io/npm/v/@chubbyts/chubbyts-cors.svg)](https://www.npmjs.com/package/@chubbyts/chubbyts-cors)

[![bugs](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-cors&metric=bugs)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-cors)
[![code_smells](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-cors&metric=code_smells)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-cors)
[![coverage](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-cors&metric=coverage)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-cors)
[![duplicated_lines_density](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-cors&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-cors)
[![ncloc](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-cors&metric=ncloc)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-cors)
[![sqale_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-cors&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-cors)
[![alert_status](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-cors&metric=alert_status)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-cors)
[![reliability_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-cors&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-cors)
[![security_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-cors&metric=security_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-cors)
[![sqale_index](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-cors&metric=sqale_index)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-cors)
[![vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-cors&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-cors)

## Description

A CORS middleware for @chubbyts/chubbyts-http-types.

*Apply toLowerCase() to each related request header name before pass the request to this middleware.*

## Requirements

 * node: 16
 * [@chubbyts/chubbyts-http-types][2]: ^1.2.3

## Installation

Through [NPM](https://www.npmjs.com) as [@chubbyts/chubbyts-cors][1].

```ts
npm i @chubbyts/chubbyts-cors@^1.2.1
```

## Usage

```ts
import { createCorsMiddleware } from '@chubbyts/chubbyts-cors/dist/middleware';
import {
  createAllowOriginRegex,
  createHeadersNegotiator,
  createMethodNegotiator,
  createOriginNegotiator,
} from '@chubbyts/chubbyts-cors/dist/negotiation';
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

2024 Dominik Zogg

[1]: https://www.npmjs.com/package/@chubbyts/chubbyts-cors
[2]: https://www.npmjs.com/package/@chubbyts/chubbyts-http-types
