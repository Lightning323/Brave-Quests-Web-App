// const http = require('http');
// const server = http.createServer((req, res) => {
//     //Set response headers
//     res.writeHead(200, { 'Content-Type': 'text/html' });

//     res.write('Hello World');
//     res.end();
// });
// const port = 3000;
// server.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}/`);
// });

/**
 * Creating a server using Node.js and Express.js
 * npm init -y
 * npm install express
 */

const express = require("express");

const app = express();

app.get('/', (req, res) => {
    res.send('<h1>Hello World</h1>'); // res.send('Hello World');
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});