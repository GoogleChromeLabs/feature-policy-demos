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
import bodyParser from 'body-parser';

const OT_TOKEN_UNOPT_IMAGES = 'AiGYzl8A17mcET9ObZ6QbC5vmOlCWk+4jZwZptDwKw8Iguu3jX2e6WVzUbHZpW0zPgqZdq/WSSUysH2chjMtCA4AAAByeyJvcmlnaW4iOiJodHRwczovL2ZlYXR1cmUtcG9saWN5LWRlbW9zLmFwcHNwb3QuY29tOjQ0MyIsImZlYXR1cmUiOiJVbm9wdGltaXplZEltYWdlUG9saWNpZXMiLCJleHBpcnkiOjE1NjQ2Nzg1NjF9';
const OT_TOKEN_UNOPT_IMAGES_LOCALHOST = 'AuqelXxw7r91rz8mkV5fJnMkjNXY6vtmpd8lzATN2KGpwd0D6akFg7GBtigifHHuqk7zAnOvo2NlUnmAQTmSTQkAAABbeyJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJmZWF0dXJlIjoiVW5vcHRpbWl6ZWRJbWFnZVBvbGljaWVzIiwiZXhwaXJ5IjoxNTY0Njc4MzU1fQ==';

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
app.use(bodyParser.urlencoded({
  extended: false,
}));

app.use(function forceSSL(req, res, next) {
  const fromCron = req.get('X-Appengine-Cron');
  if (!fromCron && req.hostname !== 'localhost' && req.get('X-Forwarded-Proto') === 'http') {
    return res.redirect(`https://${req.hostname}${req.url}`);
  }
  next();
});

app.use(function commonHeaders(req, res, next) {
  res.set('Access-Control-Allow-Origin', '*');
  // TODO: Re-enable when OT working correctly
  // res.set('Origin-Trial', OT_TOKEN_UNOPT_IMAGES);
  // res.set('Origin-Trial', OT_TOKEN_UNOPT_IMAGES_LOCALHOST);
  next();
});

app.use('/demos/:demoPage', function attachHeader(req, res, next) {
  const demoPage = req.params.demoPage;
  const policies = app.get('policies');

  const targetPolicies = policies.filter(p =>
    `/demos/${demoPage}`.localeCompare(p.url) === 0);
  if (targetPolicies.length == 1) {
    const targetPolicy = targetPolicies[0];
    const requestParamNames = Object.keys(req.query);

    if (requestParamNames.empty) next();
    const usageKey = requestParamNames[0];

    if (usageKey in targetPolicy.usage) {
      res.append(targetPolicy.policyType, targetPolicy.usage[usageKey]);
    }
  }

  next();
});

app.get('/test', (req, res, next) => {
  const on = 'on' in req.query;
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
  res.send(fs.readFileSync('./public/index.html', {encoding: 'utf-8'}));
});

app.use(express.static('public', {extensions: ['html', 'htm']}));
app.use(express.static('node_modules'));

app.use(errorHandler);

const PORT = process.env.PORT || 8080;
fs.promises.readFile('./public/js/policies.json')
    .then(f => JSON.parse(f))
    .then(policies => {
      app.set('policies', policies);
      app.listen(PORT, () => {
        console.log(`App listening on port ${PORT}`); /* eslint-disable-line */
        console.log('Press Ctrl+C to quit.'); /* eslint-disable-line */
      });
    });
