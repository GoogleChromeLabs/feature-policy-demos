/* global gtag */

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
import {fetchPolicies, updateDetailsHeader, getPolicy, featurePolicySupported} from '/js/shared.js';

/**
 * Dynamically loads policy demo page based off current (deep link) url.
 * @return {!Object} Feature policy info.
 */
async function loadPage() {
  let policy = null;
  const url = new URL(location);

  if (url.pathname !== '/') {
    const demoPage = url.pathname.slice(1).split('.')[0];
    const policyOn = url.searchParams.has('on');

    policy = await getPolicy(demoPage);

    // Remove intro banner.
    const intro = document.querySelector('#intro-summary');
    if (intro) {
      intro.remove();
    }

    const contentFrame = document.querySelector('iframe.content-view');
    contentFrame.allow = policyOn ? policy.usage.on : policy.usage.off;
    const pagePath = policyOn ? `${policy.url}?on` : policy.url;
    contentFrame.src = pagePath;
    document.body.classList.toggle('on', policyOn);

    gtag('config', 'UA-120357238-1', {page_path: pagePath});
  }

  return policy;
}

/**
 * Updates the dynamic portions of the page.
 * @param {!HTMLAnchorElement} anchor
 * @param {string} id Feature policy id.
 */
async function updatePage(anchor, id) {
  updateDetailsHeader(await getPolicy(id));
  const href = anchor.getAttribute('href').replace('/demos', '');
  window.history.pushState(null, null, href);

  loadPage();
}

/**
 * Toggles the app drawer.
 */
function toggleDrawer() {
  document.querySelector('.drawer-list').classList.toggle('active');
}


(() => {
if (!featurePolicySupported) {
  document.querySelector('.notsupported').classList.add('show');
  return;
}

const policiesList = fetchPolicies().then(policies => {
  return repeat(policies, (p) => p.id, (p, i) => {
    return html`<a href="${p.url}?on" class="policy-name"
        onclick="updatePage(this, '${p.id}')">${p.name}</a>`;
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
})();

window.updatePage = updatePage;
window.toggleDrawer = toggleDrawer;
