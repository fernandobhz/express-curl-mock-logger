# Express `curl` Mock Logger

This is an npm package designed to mock curl requests in an Express.js application and write the corresponding response to a file.  
This package can be useful for debugging or logging HTTP requests and responses in an Express.js application, and also helping you to mock received calls whenever you want.

## Installation

You can install the package via npm:

```bash
npm install express-curl-mock-logger
```

# Usage

## 1. Import the express-curl-mock-logger middleware into your Express.js application:

```js
const fs = require("fs");
const express = require("express");
const bodyParser = require ('body-parser'); 
const httpLoggerCreator = require("./index.js");

const app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use (bodyParser.raw());

const skippUrlPattens = [/^\/a/, /^\/b/];
app.use(httpLoggerCreator(skippUrlPattens));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello, world!" });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

```

## 2. With the middleware in place, all incoming requests and corresponding responses will be logged to a file in the specified format.

The output logger file will be created in the following format:

```txt
Curl command: [Linux curl command]

[HTTP Response Headers]
[HTTP Response Body]
```

The file will be located in the ./http-logs directory with a timestamp in the filename.

## 3. Curl test commands

### First start the test app by running

```sh
npm run test
```

### Then start calling the app with some data.

An application/x-www-form-urlencoded post form.

```sh
curl -X POST localhost:3000/d?x=1 -d "a=xyz" 
```

An json post;

```sh
curl -X POST localhost:3000/d?x=1 --json "{\"a\":1}" 
```

An raw data post

```sh
curl -X POST localhost:3000/d?x=1 -H "Content-Type: application/octet-stream" --data-ascii xyz 
```
