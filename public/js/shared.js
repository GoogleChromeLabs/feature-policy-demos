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

export const enablePolicy = new URL(location).searchParams.has('enable');
export const currentPolicyId = new URL(location).pathname.split('/').slice(-1)[0].split('.')[0];

let policies = [];

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
  const resp = await fetch('/js/policies.json');
  const json = await resp.json();
  policies = json;
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
        <a href="${policy.url}?enable" class="enable-button try-button"
           onclick="updatePage(this, '${policy.id}')">Enable</a>
        <a href="${policy.url}" class="disable-button try-button"
           onclick="updatePage(this, '${policy.id}')">Disable</a>
      </span>
      <span class="menu-button" onclick="toggleDrawer()"><img src="/img/menu24px.svg"></span>
    </summary>
    <ul class="details-info">
      <li><label>What</label>${policy.info.what}</li>
      <li><label>Why</label>${policy.info.why}</li>
      <li><label>Examples</label><code>${policy.info.examples.header}</code></li>
      <li><label>Instructions</label>${policy.info.instructions}</li>
    </ul>`;

  render(tmpl, document.querySelector('.details'));
}

export {
  fetchPolicies,
  showDetails,
  getPolicy,
  updateDetailsHeader,
  inFrame,
};
