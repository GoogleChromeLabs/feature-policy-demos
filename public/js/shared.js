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
import {unsafeHTML} from '/lit-html/directives/unsafe-html.js';

export const policyOn = new URL(location).searchParams.has('on');
export const currentPolicyId = new URL(location).pathname.split('/').slice(-1)[0].split('.')[0];
export const featurePolicyAPISupported = 'policy' in document || 'featurePolicy' in document;

const featurePolicy = document.policy || document.featurePolicy;
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

  // Determine if policy is supported in browser.
  policies.forEach(policy => {
    policy.supported = policySupported(policy.id);
  });

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
 * Returns true if the policy is supported by the browser.
 * @param {string} id
 * @return {!Boolean}
 */
function policySupported(id) {
  if (!featurePolicyAPISupported) {
    return false;
  }
  return featurePolicy.allowedFeatures().findIndex(el => el === id) !== -1;
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
 * Render the policy value selection bar html string based on policy object
 * given.
 *
 * @param {Object} policy
 * @return {string}
 */
function policyValueSelector(policy) {
  const desc = policy.usage_desc ? `<span>${policy.usage_desc}:</span>` : '';
  const optionButtons = Object.entries(policy.usage).map(entry => {
    const [policyValue, header] = entry;
    const [policyType, policyString] = header.split(':');
    const href = `${policy.url}?${policyType}=${encodeURIComponent(policyString)}`;

    return `<a href="${href}" class="enable-button try-button"
          onclick="updatePage(this, '${policy.id}')">${policyValue}</a>`;
  });

  return `
    <span class="trylinks">
      ${desc}
      ${optionButtons.join('\n')}
    </span>
  `;
}

/**
 * Updates the UI metadata header when a feature policy is selected.
 * @param {!Object} policy
 */
function updateDetailsHeader(policy) {
  if (!policy) {
    return;
  }

  const examples = [...policy.examples.header, ...policy.examples.iframe || []]
      .map(item => `<pre>${item}</pre>`).join('');

  const tmpl = html`
    <summary>
      <span class="policyname">${policy.name}</span>
      ${unsafeHTML(policyValueSelector(policy))}
      <span class="menu-button" onclick="toggleDrawer()"><img src="/img/menu24px.svg"></span>
    </summary>
    <ul class="details-info">
      <li><label>What</label><span>${unsafeHTML(policy.what)}</span></li>
      <li><label>Why</label><span>${unsafeHTML(policy.why)}</span></li>
      <li><label>Examples</label><div>${unsafeHTML(examples)}</div></li>
    </ul>
    <div class="notsupported ${policy.supported ? '' : 'show'}">
      <span>This policy is not supported in your browser.<br>
      <img src="/img/flag-24px.svg" class="flag-icon">Try running Chrome Canary with the
      <code>--enable-experimental-web-platform-features</code> flag.</span>
    </div>`;

  render(tmpl, document.querySelector('.details'));
}

/**
 * Adds a banner to the page to show if a policy is enable/disabled.
 * @param {string} policyId
 * @return {boolean} True if the current policy is enabled.
 */
function updateAllowBanner(policyId) {
  const allowsFeature = featurePolicy.allowsFeature(policyId);
  const allows = allowsFeature ? 'enables' : 'disables';
  const banner = document.querySelector('#feature-allowed-banner');
  if (!banner) {
    /* eslint-disable-next-line */
    console.warn('No #feature-allowed-banner element found.');
    return;
  }
  banner.classList.toggle('allows', allowsFeature);
  banner.classList.add('show');
  /* override banner description for unoptimized-images */
  if (policyId == 'unoptimized-lossy-images') {
    document.querySelector('#allowfeature').textContent = `Page ${allows} unoptimized-\{lossy,lossless\}-images.`;
  } else {
    document.querySelector('#allowfeature').textContent = `Page ${allows} ${currentPolicyId}.`;
  }

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
