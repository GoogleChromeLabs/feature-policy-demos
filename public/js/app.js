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
import {fetchPolicies, updateDetailsHeader, getPolicy} from '/js/shared.js';

/**
 * Dynamically loads policy demo page based off current (deep link) url.
 * @return {!Object} Feature policy info.
 */
async function loadPage() {
  let policy = null;
  const url = new URL(location);

  if (url.pathname !== '/') {
    const demoPage = url.pathname.slice(1).split('.')[0];
    const enable = url.searchParams.has('enable');

    policy = await getPolicy(demoPage);
    contentFrame.removeAttribute('srcdoc');
    contentFrame.src = `${policy.url}${enable ? '?enable' : ''}`;
  }

  return policy;
}

/**
 * Updates the dyanmic portions of the page.
 * @param {!HTMLAnchorElement} anchor
 * @param {string} id Feature policy id.
 */
async function updatePage(anchor, id) {
  updateDetailsHeader(await getPolicy(id));

  const href = anchor.getAttribute('href').replace('/demos', '');
  window.history.pushState(null, null, href);
}

const contentFrame = document.querySelector('iframe[name="content-view"]');

const policiesList = fetchPolicies().then(policies => {
  return repeat(policies, (p) => p.id, (p, i) => {
    return html`<a href="${p.url}?enable" target="content-view" onclick="updatePage(this, '${p.id}')">${p.name}</a>`;
  });
});

const allPolicies = html`${
  repeat(document.policy.allowedFeatures().sort(), null, (p, i) => {
    return html`<div class="policy-id">${p}</div>`;
  })
}`;

loadPage().then(updateDetailsHeader);
render(html`${policiesList}`, document.querySelector('#policy-list'));
render(allPolicies, document.querySelector('#all-policy-list'));

window.updatePage = updatePage;
