const v_pjson = require('./package.json');
const colors   = require ("./helpers/js_colors.js").Colors;
const express   = require('express');
const v_path    = require('path');
// 'http2-express-bridge' is a work-around until express5 supports http2 correctly.
// see: https://stackoverflow.com/questions/28639995/node-js-server-and-http-2-2-0-with-express-js
const http2Express = require('http2-express-bridge'); 
const http2 = require('http2')


const c_app   = http2Express(express);


c_app.use(function(req, res, next) {
    req.secure ? next() : res.redirect('https://' + req.headers.host + req.url)
});

const c_webport = 8001;
c_app.set('port',c_webport);
c_app.use(express.static(__dirname + '/'));

const v_fs = require('fs');
//const v_keyFile = v_fs.readFileSync(v_path.join(__dirname,  "./ssl/cer/cer2/private_1.key"));
//const v_certFile = v_fs.readFileSync(v_path.join(__dirname,  "./ssl/cer/cer2/certificate.crt"));

const v_keyFile = v_fs.readFileSync(v_path.join(__dirname,  "./ssl/cesca_local/cesca.key"));
const v_certFile = v_fs.readFileSync(v_path.join(__dirname,  "./ssl/cesca_local/cesca.crt"));

const v_options = {
    key: v_keyFile,
    cert: v_certFile,
    allowHTTP1: true
};

const server = http2.createSecureServer(v_options, c_app).listen(c_app.get('port'))


console.log ("==============================================");
console.log (colors.Bright + "DE WebClient version " +  JSON.stringify(v_pjson.version) + colors.Reset);
console.log ("----------------------------------");
console.log ("Listening on Port "  + colors.BSuccess + c_webport + colors.Reset);
console.log ("Datetime: %s", new Date());
console.log ("==============================================");
