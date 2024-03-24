const fs = require("fs");
const zlib = require("zlib");
const path = require("path");
const os = require("os");
const url = require("url");
const { timestampFileNameGenerator, forceDirectories, regexFilter } = require("./helpers.js");
const { curlCommandGenerator } = require("./curlGenerator.js");
const { request } = require("http");

const textContentTypesFragments = ["json", "xml", "html", "javascript", "css", "csv", "plain", "text"];

const { log } = console;

const generateLogPaths = (baseLogsFolderPath, elapsedTimeInMilliseconds, resourceName, logFileExtension) => {
  const isWindows = os.platform() === "win32";
  const scriptExtensionName = isWindows ? "bat" : "sh";

  const baseFolderName = timestampFileNameGenerator();
  const fullFolderName = `${baseFolderName}-${resourceName}-${elapsedTimeInMilliseconds}ms`;
  const logFullPath = path.join(baseLogsFolderPath, fullFolderName);
  forceDirectories(logFullPath);

  const curlLogPath = path.join(logFullPath, `curl.${scriptExtensionName}`);
  const requestLogPath = path.join(logFullPath, `request.txt`);
  const responseLogPath = path.join(logFullPath, `response.txt`);
  const fileContentPath = path.join(logFullPath, `file.${logFileExtension}`);

  const result = { curlLogPath, requestLogPath, responseLogPath, fileContentPath };
  return result;
};

module.exports.httpLoggerCreator = (
  chunks = [],
  elapsedTimeInMilliseconds = 0,
  skipUrlPatterns = [],
  logToConsoleWhenSkippingUrls = false,
  httpLogsFolderPath = "http-logs",
  logCurlToConsole = false,
  logResponseToConsole = false
) => {
  return (req, res, next) => {
    /**
     * Checks before proceeding
     */
    const skippedByUrlPattern = regexFilter(req.originalUrl, skipUrlPatterns);

    if (skippedByUrlPattern.length > 0) {
      if (logToConsoleWhenSkippingUrls) {
        log(`Skipping url from express-curl-mock-logger\nURL: ${req.originalUrl}\nPattern: ${skippedByUrlPattern.toString()}\n`);
      }
      return;
    }

    /**
     * Collecting some initial required data
     */
    const {
      httpVersion,
      method: requestMethod,
      originalUrl,
      body: requestBody,
      headers: requestHeaders,
      query: requestQueryString,
      context: requestContext,
    } = req;

    const responseHeaders = res.getHeaders();
    const responseContentType = res.get("Content-Type");
    const contentEncoding = res.get("Content-Encoding");

    /**
     * Building another initial required data
     */
    const currentFragment = responseContentType ? textContentTypesFragments.find(fragment => responseContentType.includes(fragment)) || "unknow" : "unknow";
    const isTextResponse = currentFragment !== "unknow";
    const [requestResourcePath] = originalUrl.split("?");

    const requestHeadersTextList = Object.entries(requestHeaders || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    const requestQueryStringTextlist = Object.entries(requestQueryString || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    const requestContextTextlist = Object.entries(requestContext || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    const responseHeadersTextList = Object.entries(responseHeaders || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    const isContentEncodedWithGzip = contentEncoding === "gzip";
    const urlFullFileName = path.basename(requestResourcePath) || "root";
    const urlFileExtension = path.extname(urlFullFileName).slice(1);
    const logFileExtension = urlFileExtension || currentFragment;
    const logFullFileName = `${urlFullFileName}.${logFileExtension}`;

    /**
     * Starting the processing
     */
    const chunksBuffer = Buffer.concat(chunks);
    const { curlLogPath, requestLogPath, responseLogPath, fileContentPath } = generateLogPaths(
      httpLogsFolderPath,
      elapsedTimeInMilliseconds,
      logFullFileName,
      logFileExtension
    );

    // Response body
    let responseTextBody = "";

    if (isContentEncodedWithGzip && isTextResponse) {
      responseTextBody = zlib.gunzipSync(chunksBuffer).toString("ascii");
    } else if (isTextResponse) {
      responseTextBody = chunksBuffer.toString("ascii");
    } else {
      responseTextBody = `Unknow reponse content type, check the full file contents at: ${fileContentPath}`;
    }

    // Request Body
    let requestTextBody = "";

    if (typeof requestBody === "object") {
      if (Buffer.isBuffer(requestBody)) {
        requestTextBody = requestBody.toString("ascii");
      } else {
        requestTextBody = JSON.stringify(requestBody, null, 2);

        if (requestTextBody === "{}") {
          requestTextBody = "";
        }
      }
    } else if (Buffer.isBuffer(requestBody)) {
      requestTextBody = requestBody.toString("hex");
    } else {
      requestTextBody = requestBody || "";
    }

    /**
     * Writing results
     */
    const curlCommand = curlCommandGenerator(req);
    const fullTextRequest = `${requestMethod} ${requestResourcePath}\nTook: ${elapsedTimeInMilliseconds}ms\n\nHeaders:\n${requestHeadersTextList}\n\nRequest.Context:\n${requestContextTextlist}\n\nQueryString:\n${requestQueryStringTextlist}\n\nRequestBody:\n${requestTextBody}`;
    const fullTextResponse = `HTTP/${httpVersion} ${res.statusCode}\nTook: ${elapsedTimeInMilliseconds}ms\n\nHeaders:${responseHeadersTextList}\n\nResponseBody:\n${responseTextBody}`;

    fs.writeFileSync(curlLogPath, curlCommand);
    fs.writeFileSync(requestLogPath, fullTextRequest);
    fs.writeFileSync(responseLogPath, fullTextResponse);

    if (isTextResponse) {
      fs.writeFileSync(fileContentPath, responseTextBody);
    } else {
      fs.writeFileSync(fileContentPath, chunksBuffer);
    }

    if (logCurlToConsole && isTextResponse && logResponseToConsole) {
      log(curlCommand, `\n`, fullTextResponse);
    } else if (logCurlToConsole) {
      log(curlCommand);
    }

    next();
  };
};
