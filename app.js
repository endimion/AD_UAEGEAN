/*
 * Copyright (c) Microsoft All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */




const cookieParser = require('cookie-parser')
const morgan  = require('morgan');
const express = require('express');
const app = express();
const port = 8000;
const path = require('path');
const bodyParser = require('body-parser');

let apiRputes = require('./routes/apiRoutes');
let apiRoutesV2 = require('./routes/apiRoutesV2')

//middleware
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cookieParser());
app.use(morgan('tiny')); //http request logger
app.use('/',apiRputes);
app.use('/v2',apiRoutesV2);


//start the server
const server = app.listen(port,"127.0.0.1", (err,res) => {
  if(err){
    console.log("error!!", err);
  }else{
     console.log("server started");

    // basic.init();
  }
});

// Get an access token for the app.
