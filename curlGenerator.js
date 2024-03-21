const os = require("os");
const isWindows = os.platform() === "win32";

const curlBodyGenerator = (req) => {
  if (!req.body) {
    return "";
  }

  if (req.body) {
    if (typeof req.body === "object") {
      let stringifiedJson = JSON.stringify(req.body).replace(/'/g, "\\'");

      if (stringifiedJson == '{}') {
        return '';
      }

      const body = `-d '${stringifiedJson}'`;
      
      return body;
    }

    if (Buffer.isBuffer(req.body)) {
      const body = `--data-binary '${req.body.toString("base64")}'`;
      return body;
    }

    const body = `-d '${req.body.replace(/'/g, "\\'")}'`;
    return body;
  }
};

module.exports.curlCommandGenerator = (req) => {
  const { method, headers, originalUrl, protocol }  = req;
  const { host } = headers;

  const defaultHost = "localhost";
  const usedHost = host || defaultHost;
  const url = `"${protocol}://${usedHost}${originalUrl}"`;

  const headersString = Object.entries(headers)
    .map(([key, value]) => `-H "${key}: ${value.replace(/"/g, '\\"')}"`)
    .join(" ");

  const body = curlBodyGenerator(req);
  const curlCommand = `curl --include --location-trusted -X ${method} ${url} ${headersString} ${body}`;
  return curlCommand;
};
