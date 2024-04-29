declare module 'express-curl-mock-logger' {
  import { RequestHandler } from 'express';

  function httpLoggerCreator(
    skipUrlPatterns?: Array<RegExp>,
    logToConsoleWhenSkippingUrls?: boolean,
    httpLogsFolderPath?: string,
    logCurlToConsole?: boolean,
    logResponseToConsole?: boolean): RequestHandler;

  export = httpLoggerCreator;
}
