declare module 'express-curl-mock-logger' {
    import { RequestHandler } from 'express';
  
    interface Options {
      logFolder?: string;
      logCurlToConsole?: boolean;
      logResponseToConsole?: boolean;
    }
  
    // Define the exported function and its type
    function httpLoggerCreator(options?: Options): RequestHandler;
  
    // Export the function and any other types
    export = httpLoggerCreator;
  }
  