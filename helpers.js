const fs = require("fs");
const path = require("path");

module.exports.timestampFileNameGenerator = (now = new Date()) => {
  const fileName = now.toISOString().replaceAll(`:`, `-`).replaceAll(".", "-");
  return fileName;
}

module.exports.forceDirectories = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

module.exports.forceDirectoriesForFilePath = (filePath) => {
  const folderPath = path.dirname(filePath);
  module.exports.ensureFolderPathExists(folderPath);
};

module.exports.regexFilter = (stringToTest, regularExpressionList) => {
  const invalidRegExpressions = regularExpressionList.filter(regexp => (!(regexp instanceof RegExp)));

  if (invalidRegExpressions.length > 0) {
    throw new Error(`There are invalid RegExp in the list: ${invalidRegExpressions.join(', ')}`);
  }

  const regExpressionsThatMatch = regularExpressionList.filter(regexp => regexp.test(stringToTest));

  return regExpressionsThatMatch;
}