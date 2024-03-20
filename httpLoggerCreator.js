const fs = require("fs");
const zlib = require("zlib");
const path = require('path');
const os = require('os');
const { logPathGenerator, ensureDirectoryExists } = require("./helpers.js");
const { curlCommandGenerator } = require("./curlGenerator.js");
const { request } = require("http");

const textContentTypesFragments = ["json", "xml", "html", "javascript", "css", "csv", "plain", "text"];

module.exports = (logFolder = "http-logs", logCurlToConsole = false, logResponseToConsole = false) => {
  return (req, res, next) => {
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

      /** Logs out the curl and response */

      const responseHeaders = Object.entries(res.getHeaders())
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");

      const requestHeaders = Object.entries(req.headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");      

      const { httpVersion, method: requestMethod, originalUrl, body: requestBody } = req;
      const responseContentType = res.get("Content-Type");
      const currentFragment = responseContentType ? textContentTypesFragments.find((fragment) => responseContentType.includes(fragment)) || "unknow" : "unknow";
      const isTextResponse = currentFragment !== "unknow";

      const urlFullFileName = path.basename(originalUrl.split('?').at(0)) || 'root';
      const urlFileExtension = path.extname(urlFullFileName).slice(1);
      const logFileExtension = urlFileExtension || currentFragment;

      const contentEncoding = res.get("Content-Encoding");
      const isContentEncodedWithGzip = contentEncoding === "gzip";
      const chunksBuffer = Buffer.concat(chunks);

      const isWindows = os.platform() === 'win32';
      const logPath = logPathGenerator(logFolder);
      const logSubFolder = `${logPath}-${urlFullFileName}${path.sep}`;
      const curlLogPath = `${logSubFolder}curl.${isWindows ? 'bat' : 'sh'}`;
      const requestLogPath = `${logSubFolder}request.txt`;
      const responseLogPath = `${logSubFolder}response.txt`;
      const fileContentPath = `${logSubFolder}file.${logFileExtension}`;
      ensureDirectoryExists(fileContentPath);

      let responseTextBody = "";

      if (isContentEncodedWithGzip && isTextResponse) {
        responseTextBody = zlib.gunzipSync(chunksBuffer).toString("ascii");
      } else if (isTextResponse) {
        responseTextBody = chunksBuffer.toString("ascii");
      } else {
        responseTextBody = `Unknow reponse content type, check the full file contents at: ${fileContentPath}`;
      }


      let requestTextBody = "";

      if (typeof requestBody === "object") {
        requestTextBody = JSON.stringify(requestBody, null, 2);

        if (requestTextBody === '{}') {
            requestTextBody = '';
        }
      } else if (Buffer.isBuffer(requestBody)) {
        requestTextBody = requestBody.toString("hex");
      } else {
        requestTextBody = requestBody || '';
      }
  
      const fullTextRequest = `${requestMethod} ${originalUrl}\n${requestHeaders}\n\n${requestTextBody}`;
      const fullTextResponse = `HTTP/${httpVersion} ${res.statusCode}\n${responseHeaders}\n\n${responseTextBody}`;
      const curlCommand = curlCommandGenerator(req);

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
    };

    next();
  };
};
