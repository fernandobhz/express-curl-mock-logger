const fs = require("fs");
const path = require("path");

module.exports.logPathGenerator = (logFolder) => {
  const now = new Date();
  const fileName = now.toISOString().replaceAll(`:`, `-`).replaceAll(".", "-");
  const fullFilePath = path.join(logFolder, fileName);
  return fullFilePath;
};

module.exports.ensureDirectoryExists = (filePath) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
};
