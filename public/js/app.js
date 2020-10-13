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
import {repeat} from '/lit-html/directives/repeat.js';
import {until} from '/lit-html/directives/until.js';
import {fetchPolicies, updateDetailsHeader, getPolicy, permissionsPolicyAPISupported} from '/js/shared.js';

const POLICY_TYPE_TO_LABEL = {
  performance: 'Performance',
  images: 'Images',
  granular: 'Granular control',
  other: 'Coming soon...',
};

/**
 * Dynamically loads policy demo page based off current (deep link) url.
 * @return {!Object} Feature policy info.
 */
async function loadPage() {
  let policy = null;
  const url = new URL(location);

  if (url.pathname !== '/') {
    const demoPage = url.pathname.slice(1).split('.')[0];

    policy = await getPolicy(demoPage);

    // Remove intro banner.
    const intro = document.querySelector('#intro-summary');
    if (intro) {
      intro.remove();
    }

    const contentFrame = document.querySelector('iframe.content-view');
    const pagePath = policy.url + url.search;
    contentFrame.src = pagePath;

    gtag('config', 'UA-120357238-1', {page_path: pagePath});
  }

  return policy;
}

/**
 * Updates the iframe content when policy value selector is clicked.
 *
 * @param {!HTMLAnchorElement} anchor
 */
function updatePolicyValue(anchor) {
  anchor.parentElement.querySelectorAll('a').forEach(a => a.removeAttribute('active'));
  anchor.setAttribute('active', '');
  const href = anchor.getAttribute('href').replace('/demos', '');
  window.history.pushState(null, null, href);
  loadPage();
}

/**
 * Updates the dynamic portions of the page.
 * @param {!HTMLAnchorElement} anchor
 * @param {string} id Feature policy id.
 */
async function updatePage(anchor, id) {
  // Update window URL first, so that |updateDetailsHeader| can observe
  // the latest URL.
  const href = anchor.getAttribute('href').replace('/demos', '');
  window.history.pushState(null, null, href);

  updateDetailsHeader(await getPolicy(id));
  loadPage();
}

/**
 * Toggles the app drawer.
 * @param {boolean=} forClose True to force close the drawer. Default toggles.
 */
function toggleDrawer(forClose = false) {
  const el = document.querySelector('.drawer-list');
  if (forClose) {
    el.classList.remove('active');
  } else {
    el.classList.toggle('active');
  }
}

/**
 * @param {Array<Object>} implementedPolicies
 */
async function leftOverPolicies(implementedPolicies) {
  const permissionsPolicy =
    document.policy || document.permissionsPolicy || document.featurePolicy;
  const allPolicies = permissionsPolicy.allowedFeatures().sort();

  const policies = [];
  allPolicies.forEach((item, i) => {
    const found = implementedPolicies.find(p => p.id === item);
    if (!found) {
      policies.push(item);
    }
  });

  return repeat(policies, null, (p, i) => {
    return html`<div class="policy-id">${p}</div>`;
  });
}


(async () => {
if (!permissionsPolicyAPISupported) {
  document.querySelector('.notsupported').classList.add('show');
  return;
}

const fetchedPolicies = await fetchPolicies();

const buildImplementedPolicies = () => {
  const orderedPolicies = fetchedPolicies.sort((a, b) => {
    return a.name < b.name ? -1 :
      a.name > b.name ? 1 : 0;
  });

  const categoryMapping = new Map();
  fetchedPolicies.forEach(policy => {
    const item = categoryMapping.get(policy.type);
    if (item) {
      item.push(policy);
    } else {
      categoryMapping.set(policy.type, [policy]);
    }
  });

  const categories = Array.from(categoryMapping.entries());
  const markup = repeat(categories, (item) => item[0], ([cat, policies], i) => {
    const items = repeat(policies, (p) => p.id, (p, i) => {
      const firstUsage = Object.keys(p.usage).sort()[0];
      return html`
        <a href="${p.url}?${firstUsage}" class="policy-name" onclick="updatePage(this, '${p.id}')">
          ${p.name}
          <img src="/img/flag-24px.svg" class="flag-icon ${p.supported ? 'supported' : ''}"
               title="Requires a flag">
        </a>`;
    });
    return html`
      <h4 class="policy-type">${POLICY_TYPE_TO_LABEL[cat]}</h4>
      ${items}
    `;
  });
  return {markup, policies: orderedPolicies};
};

loadPage().then(updateDetailsHeader);

const implementedPolicies = buildImplementedPolicies();

render(html`${implementedPolicies.markup}`,
  document.querySelector('#policy-list'));
render(
  html`
    <h4 class="policy-type">${POLICY_TYPE_TO_LABEL['other']}</h4>
    ${until(leftOverPolicies(implementedPolicies.policies))}
  `, document.querySelector('#all-policy-list'));

document.addEventListener('click', e => {
  const button = document.querySelector('.menu-button');
  if (!button.contains(e.target)) {
    e.stopPropagation();
    toggleDrawer(true);
  }
});
})();

window.updatePage = updatePage;
window.updatePolicyValue = updatePolicyValue;
window.toggleDrawer = toggleDrawer;
