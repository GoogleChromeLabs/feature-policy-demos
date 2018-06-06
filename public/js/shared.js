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
import {unsafeHTML} from '/lit-html/lib/unsafe-html.js';

export const policyOn = new URL(location).searchParams.has('on');
export const currentPolicyId = new URL(location).pathname.split('/').slice(-1)[0].split('.')[0];

let policies = [];
let fetchingPoliciesPromise = null;

/**
 * @return {boolean} True if page is top-level and not an iframe.
 */
function inFrame() {
  return window.self !== window.top;
}

/**
 * Fetches the list of feature policies and metadata.
 * @return {!Promise<!Array>} List of policies.
 */
async function fetchPolicies() {
  if (policies.length) {
    return policies;
  }

  // Create singleton to fetch json.
  if (fetchingPoliciesPromise) {
    return await fetchingPoliciesPromise;
  }

  fetchingPoliciesPromise = fetch('/js/policies.json').then(resp => resp.json());
  policies = await fetchingPoliciesPromise;

  return policies;
}

/**
 * Lookups up a policy by id
 * @param {string} id
 * @return {!Promise<!Object>} Found policy
 */
async function getPolicy(id) {
  const policies = await fetchPolicies();
  return policies.find(item => item.id === id);
}

/**
 * Shows the policy metadata UI element.
 */
function showDetails() {
  const details = document.querySelector('details');
  if (details) {
    details.style.display = 'block';
  }
}

/**
 * Updates the UI metadata header when a feature policy is selected.
 * @param {!Object} policy
 */
function updateDetailsHeader(policy) {
  if (!policy) {
    return;
  }

  const tmpl = html`
    <summary>
      <span><span class="policyname">${policy.name}</span> feature policy</span>
      <span class="trylinks">
        <a href="${policy.url}?on" class="enable-button try-button"
           onclick="updatePage(this, '${policy.id}')">On</a>
        <a href="${policy.url}" class="disable-button try-button"
           onclick="updatePage(this, '${policy.id}')">Off</a>
      </span>
      <span class="menu-button" onclick="toggleDrawer()"><img src="/img/menu24px.svg"></span>
    </summary>
    <ul class="details-info">
      <li><label>What</label><span>${unsafeHTML(policy.what)}</span></li>
      <li><label>Why</label><span>${unsafeHTML(policy.why)}</span></li>
      <li><label>Examples</label><code>FeaturePolicy: ${policy.usage.on}</code></li>
      <li><label>Demo instructions</label>${policy.instructions}</li>
    </ul>`;

  render(tmpl, document.querySelector('.details'));
}

/**
 * Adds a banner to the page to show if a policy is enable/disabled.
 * @param {string} policyId
 * @return {boolean} True if the current policy is enabled.
 */
function updateAllowBanner(policyId) {
  const allowsFeature = document.policy.allowsFeature(policyId);
  const allows = allowsFeature ? 'allows' : 'disallows';
  const banner = document.querySelector('#feature-allowed-banner');
  if (!banner) {
    console.warn('No #feature-allowed-ganner element found.');
    return;
  }
  banner.classList.toggle('allows', allowsFeature);
  banner.classList.add('show');
  document.querySelector('#allowfeature').textContent = `Page ${allows} ${currentPolicyId}.`;

  return allowsFeature;
}

/**
 * Inits top header/banner for demos pages.
 */
function initPage() {
  if (!inFrame()) {
    showDetails();
    getPolicy(currentPolicyId).then(policy => {
      updateDetailsHeader(policy);
    });
  }
  updateAllowBanner(currentPolicyId);
}

export {
  fetchPolicies,
  getPolicy,
  initPage,
  updateDetailsHeader,
};
