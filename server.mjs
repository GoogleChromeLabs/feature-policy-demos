/**
 * Copyright 2018 Google Inc., PhantomJS Authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// const fs = require('fs');
// const express = require('express');
import fs from 'fs';
import express from 'express';

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  console.error('errorHandler', err);
  res.status(500).send({errors: `Error running your code. ${err}`});
}

const app = express();

app.use((req, res, next) => {
  const unsizedMedia = 'enable' in req.query;
  res.set('Access-Control-Allow-Origin', '*');
  // res.append('Feature-Policy', "camera 'none', microphone 'none'");
  // res.append('Feature-Policy', "autoplay 'self' https://clips.vorwaerts-gmbh.de");
  // res.append('Feature-Policy', "fullscreen 'none'");
  // res.append('Feature-Policy', "geolocation 'self' https://example.com");
  // res.append('Feature-Policy', "midi 'none'");
  // res.append('Feature-Policy', "sync-xhr 'none'");
  // res.append('Feature-Policy', "vr 'none'");
  // res.append('Feature-Policy', "usb 'none'");
  // res.append('Feature-Policy', "payment 'none'");
  // res.append('Feature-Policy', "vibrate 'none'");
  if (unsizedMedia) {
    res.set('Feature-Policy', "unsized-media 'none'");
  }
  next();
});

// app.get('/demos/:demoPage', (req, res, next) => {
//   const demoPage = req.params.demoPage;
//   // res.set('Content-Type', 'image/svg+xml');
//   res.status(200).send(fs.readFileSync(demoPage));
// });

app.get('/:demoPage', (req, res, next) => {
  // const demoPage = req.params.demoPage;
  // console.log(demoPage)
  res.send(fs.readFileSync('./public/index.html', {encoding: 'utf-8'}));
  // next();
});

app.use(express.static('public', {extensions: ['html', 'htm']}));
app.use(express.static('node_modules'));

app.use(errorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
