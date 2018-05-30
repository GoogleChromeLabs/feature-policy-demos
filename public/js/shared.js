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

export const inFrame = window.self !== window.top;
export const enablePolicy = new URL(location).searchParams.has('enable');

let policies = [];

async function fetchPolicies() {
  if (policies.length) {
    return policies;
  }
  const resp = await fetch('/js/policies.json');
  const json = await resp.json();
  policies = json;
  return policies;
}

async function getPolicy(id) {
  const policies = await fetchPolicies();
  return policies.find(item => item.id === id);
}

function hideDetails() {
  if (inFrame) {
    const details = document.querySelector('.details');
    if (details) {
      details.style.display = 'none';
    }
  }
}

async function loadPage() {
  const url = new URL(location);
  if (url.pathname !== '/') {
    const contentFrame = document.querySelector('iframe[name="content-view"]');
    const demoPage = url.pathname.slice(1).split('.')[0];
    const enable = url.searchParams.has('enable');
    contentFrame.src = `${(await getPolicy(demoPage)).url}${enable ? '?enable' : ''}`;
  }
}

function updateUrl(anchor) {
  const href = anchor.getAttribute('href').replace('/demos', '');
  window.history.pushState(null, null, href);
}

window.updateUrl = updateUrl;

export {fetchPolicies, hideDetails, loadPage};
