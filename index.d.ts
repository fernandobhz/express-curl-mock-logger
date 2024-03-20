declare module 'express-curl-mock-logger' {
    import { RequestHandler } from 'express';
  
    interface Options {
      skipUrlPatterns: Array<RegExp>;
      httpLogsFolderPath?: string;
      logToConsoleWhenSkippingUrls: boolean;
      logCurlToConsole?: boolean;
      logResponseToConsole?: boolean;
    }
    
    function httpLoggerCreator(options?: Options): RequestHandler;
  
    export = httpLoggerCreator;
  }
  