import fs from 'fs';
import express from 'express';
import httpLoggerCreator from './index.js';

const defaultLogFolder = 'http-logs';

if (fs.existsSync(defaultLogFolder)) {
  fs.rmSync('http-logs', { recursive: true });
}

const app = express();

app.use(httpLoggerCreator());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello, world!' });
});


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
