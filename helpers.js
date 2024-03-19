import fs from "fs";
import path from "path";

export const logPathGenerator = (logFolder) => {
  const now = new Date();
  const fileName = now.toISOString().replaceAll(`:`, `-`).replaceAll(".", "-");
  const fullFilePath = path.join(logFolder, fileName);
  return fullFilePath;
};

export const ensureDirectoryExists = (filePath) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
};
