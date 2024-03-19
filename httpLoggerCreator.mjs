import fs from "fs";
import { logPathGenerator, ensureDirectoryExists } from "./helpers.mjs";
import { curlCommandGenerator } from "./curlGenerator.mjs";

const textContentTypesFragments = ["json", "text", "xml", "html", "javascript", "css", "csv", "plain"];
const unknowFilePrefixDescriptor = `just.response.body`;

export const httpLoggerCreator = (logFolder = "http-logs", logCurlToConsole = false, logResponseToConsole = false) => {
  return (req, res, next) => {
    const logPath = logPathGenerator(logFolder);
    const logReqResPath = `${logPath}.req.res.txt`;
    ensureDirectoryExists(logPath);

    const curlCommand = curlCommandGenerator(req);
    const writeStream = fs.createWriteStream(logReqResPath);

    writeStream.write(`${curlCommand}\n\n`);

    if (logCurlToConsole) {
      log(curlCommand);
    }

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
      const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      chunks.push(bufferChunk);

      const chunksBuffer = Buffer.concat(chunks);
      const body = chunksBuffer.toString("ascii");

      const headers = Object.entries(res.getHeaders())
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");

      const responseContentType = res.get("Content-Type");
      const fileExtension = responseContentType ? textContentTypesFragments.find((fragment) => responseContentType.includes(fragment)) || "unknow" : "unknow";
      const isTextResponse = fileExtension !== "unknow";
      
      const logBodyPath = `${logPath}.${unknowFilePrefixDescriptor}.${fileExtension}`;
      const logBody = isTextResponse ? body : `Unknow reponse content type, check the '${logBodyPath}' file for its contents`;

      const { httpVersion } = req;
      const response = `HTTP/${httpVersion} ${res.statusCode}\n${headers}\n\n${logBody}`;

      writeStream.write(response);
      writeStream.end();

      if (!isTextResponse) {
        fs.writeFileSync(logBodyPath, chunksBuffer);
      }

      if (logResponseToConsole) {
        log(response);
      }

      oldEnd.apply(res, args);
    };

    next();
  };
};
