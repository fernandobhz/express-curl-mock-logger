const curlBodyGenerator = (req) => {
  if (!req.body) {
    return "";
  }

  if (req.body) {
    if (typeof req.body === "object") {
      const body = `-d '${JSON.stringify(req.body).replace(/'/g, "\\'")}'`;
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
  const method = req.method;
  const { host, port } = req.headers;
  const defaultHost = "localhost";

  const protocol = req.protocol === "https" ? "https" : "http";
  const usedHost = host || defaultHost;
  const url = `${protocol}://${usedHost}${req.originalUrl}`;

  const headersString = Object.entries(req.headers)
    .map(([key, value]) => `-H "${key}: ${value.replace(/"/g, '\\"')}"`)
    .join(" ");

  const body = curlBodyGenerator(req);
  const curlCommand = `curl -X ${method} ${url} ${headersString} ${body}`;
  return curlCommand;
};
