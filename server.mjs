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

import fs from 'fs';
import express from 'express';

const ORIGIN_TRIAL_TOKEN = 'AkUg6O+tCxU6NpCvh73XYVI6yW684qB7uBrWDw7fLYJqDM2z5yIGQd30w7oZgTFOKlAo7BsUjYRvERRffkRnRQAAAABseyJvcmlnaW4iOiJodHRwczovL2ZlYXR1cmUtcG9saWN5LWRlbW9zLmFwcHNwb3QuY29tOjQ0MyIsImZlYXR1cmUiOiJGZWF0dXJlUG9saWN5SlNBUEkiLCJleHBpcnkiOjE1NDUwNzU4MjN9';
const ORIGIN_TRIAL_TOKEN2 = 'Aujev4assq/ZD/c7GWe+LS3Iq/XN3LMQi4EUTLzoH2K7zI868Z8ezcCemWKYoFa9Koz7t8D7B9amnO3sH0Z3VA4AAABVeyJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJmZWF0dXJlIjoiRmVhdHVyZVBvbGljeUpTQVBJIiwiZXhwaXJ5IjoxNTQ1MDc1ODIzfQ=='; // localhost:8080;

/* eslint-disable */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  console.error('errorHandler', err);
  res.status(500).send({errors: `Error running your code. ${err}`});
}
/* eslint-enable */

const app = express();

app.use(function forceSSL(req, res, next) {
  const fromCron = req.get('X-Appengine-Cron');
  if (!fromCron && req.hostname !== 'localhost' && req.get('X-Forwarded-Proto') === 'http') {
    return res.redirect(`https://${req.hostname}${req.url}`);
  }
  next();
});

app.use(function commonHeaders(req, res, next) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Origin-Trial', ORIGIN_TRIAL_TOKEN);
  // res.sen('Origin-Trial', ORIGIN_TRIAL_TOKEN2);
  next();
});

app.get('/test', (req, res, next) => {
  const on = 'on' in req.query;
  // res.append('Feature-Policy', `geolocation 'self' https://example.com`);
  if (on) {
    res.append('Feature-Policy', `max-downscaling-image 'none'`);
    res.append('Feature-Policy', `image-compression 'none'`);
    res.append('Feature-Policy', `legacy-image-formats 'none'`);
    res.append('Feature-Policy', `geolocation 'none'`);
    res.append('Feature-Policy', `camera 'none'; microphone 'none'`);
    res.append('Feature-Policy', `autoplay 'self'`);
    res.append('Feature-Policy', `fullscreen 'none'`);
    res.append('Feature-Policy', `geolocation 'self'`);
    res.append('Feature-Policy', `midi 'none'`);
    res.append('Feature-Policy', `sync-xhr 'none'`);
    res.append('Feature-Policy', `vr 'none'`);
    res.append('Feature-Policy', `usb 'none'`);
    res.append('Feature-Policy', `payment 'none'`);
  }
  res.send(fs.readFileSync('./public/testpage.html', {encoding: 'utf-8'}));
});

app.get('/:demoPage', (req, res, next) => {
  // const demoPage = req.params.demoPage;
  // console.log(demoPage)
  res.send(fs.readFileSync('./public/index.html', {encoding: 'utf-8'}));
});

// // Enable/disable policies on demo pages.
// app.use('/demos', (req, res, next) => {
//   const unsizedMedia = 'on' in req.query;
//   // res.append('Feature-Policy', "camera 'none'; microphone 'none'");
//   // res.append('Feature-Policy', "autoplay 'self' https://clips.vorwaerts-gmbh.de");
//   // res.append('Feature-Policy', "fullscreen 'none'");
//   // res.append('Feature-Policy', "geolocation 'self' https://example.com");
//   // res.append('Feature-Policy', "midi 'none'");
//   // res.append('Feature-Policy', "sync-xhr 'none'");
//   // res.append('Feature-Policy', "vr 'none'");
//   // res.append('Feature-Policy', "usb 'none'");
//   // res.append('Feature-Policy', "payment 'none'");
//   // res.append('Feature-Policy', "vibrate 'none'");
//   if (unsizedMedia) {
//     // res.set('Feature-Policy', `unsized-media 'none'`);
//   }
//   next();
// });

app.use(express.static('public', {extensions: ['html', 'htm']}));
app.use(express.static('node_modules'));

app.use(errorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`); /* eslint-disable-line */
  console.log('Press Ctrl+C to quit.'); /* eslint-disable-line */
});
