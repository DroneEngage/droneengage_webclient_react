const https = require('https');
const fs = require('fs');
const express = require('express');
const path = require('path');

const app = express();

const sslOptions = {
  //cert: fs.readFileSync(process.env.WEB_SSL_CRT),
  //key: fs.readFileSync(process.env.WEB_SSL_KEY),
  cert: fs.readFileSync("./ssl/localssl.crt"),
  key: fs.readFileSync("./ssl/localssl.key"),
};

https.createServer(sslOptions, app).listen(3000, () => {
  console.log('HTTPS server running on port 3000');
});

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});