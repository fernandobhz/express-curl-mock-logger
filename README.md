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
const express = require('express');
const expressCurlMockerLogger = require('express-curl-mock-logger');

const app = express();

app.use(expressCurlMockerLogger);


// Your routes and other middleware definitions go here
// Example route for testing that library
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello, world!' });
});


app.listen(3000, () => {
  console.log('Server is running on port 3000');
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
