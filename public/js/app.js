/**
 * Copyright 2018 Google Inc. All rights reserved.
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

import {html, render} from '/lit-html/lit-html.js';
import {repeat} from '/lit-html/lib/repeat.js';
import {fetchPolicies, loadPage} from '/js/shared.js';

(async() => {

const policiesList = fetchPolicies().then(policies => {
  return repeat(policies, (p) => p.id, (p, i) => {
    return html`<a href="${p.url}?enable" target="content-view" onclick="updateUrl(this)">${p.name}</a>`;
  });
});

const allPolicies = html`${
  repeat(document.policy.allowedFeatures().sort(), null, (p, i) => {
    return html`<div class="policy-id">${p}</div>`;
  })
}`;

render(html`${policiesList}`, document.querySelector('#policy-list'));
render(allPolicies, document.querySelector('#all-policy-list'));

loadPage();

})();




