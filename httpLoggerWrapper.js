const fs = require("fs");
const zlib = require("zlib");
const path = require("path");
const os = require("os");
const { logPathGenerator, ensureDirectoryExists } = require("./helpers.js");
const { curlCommandGenerator } = require("./curlGenerator.js");
const { httpLoggerCreator } = require("./httpLoggerCreator.js");
const { request } = require("http");

const textContentTypesFragments = ["json", "xml", "html", "javascript", "css", "csv", "plain", "text"];

const { log } = console;

module.exports = (skipUrlPatterns, logToConsoleWhenSkippingUrls, httpLogsFolderPath,logCurlToConsole, logResponseToConsole) => {
  return (req, res, next) => {
    const requestStartTime  = new Date();

    const oldWrite = res.write;
    const oldEnd = res.end;

    const chunks = [];

    res.write = function (...args) {
      const [chunk] = args;
      const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      chunks.push(bufferChunk);
      oldWrite.apply(res, args);
    };

    res.end = function (...args) {      
      const [chunk] = args;

      if (chunk) {
        const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        chunks.push(bufferChunk);
      }

      oldEnd.apply(res, args);
      const requestEndTime  = new Date();
      const elapsedTimeInMilliseconds = requestEndTime  - requestStartTime;

      const httpLogger = httpLoggerCreator(chunks, elapsedTimeInMilliseconds, skipUrlPatterns, logToConsoleWhenSkippingUrls, httpLogsFolderPath, logCurlToConsole, logResponseToConsole);

      httpLogger(req, res, next);
    };

    next();
  };
};
