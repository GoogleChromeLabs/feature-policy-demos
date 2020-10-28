'use strict';
/**
 * Copyright 2020 Google Inc. All rights reserved.
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

 export class FeaturePolicyHeader {
  /**
   * @param {Map<string, string[]>} policies
   */
  constructor(policies) {
    this.policies = policies;
  }

  /**
   * Parse Feature-Policy header string
   *
   * @param {string} header_string e.g. unsized-images 'none'; geolocation *; usb foo.com bar.com
   * @returns {FeaturePolicyHeader}
   */
  static parse(header_string) {
    if (!header_string)
      return new FeaturePolicyHeader(new Map());

    return new FeaturePolicyHeader(header_string.split(';')
      .reduce((acc, item) => {
        const [policyName, ...allowlist] = item.trim().split(' ').filter(s => s !== '');
        acc.set(policyName, allowlist);
        return acc;
      }, new Map()));
  }

  serialize() {
    return [...this.policies.entries()]
      .map(([policyName, allowlist]) => `${policyName} ${allowlist.join(' ')}`)
      .join('; ');
  }
};

export class PermissionsPolicyHeader {
  /**
   * @param {Map<string, string[]>} policies
   */
  constructor(policies) {
    this.policies = policies;
  }
  /**
   * Parse Permissions-Policy header string.
   *
   * Note: Permissions-Policy header uses Dictionary in [structured header syntax]
   *(https://httpwg.org/http-extensions/draft-ietf-httpbis-header-structure.html).
   *
   * Note: This function does not provide full structured header syntax parsing.
   * When incomplete syntax is received, it can lead to unexpected behaviour.
   *
   * @param {string} header_string e.g. p1=(), p2=("foo.com" "bar.com"), p3=self
   * @returns {PermissionsPolicyHeader}
   */
  static parse(header_string) {
    if (!header_string)
      return new PermissionsPolicyHeader(new Map());

    return new PermissionsPolicyHeader(header_string.split(',')
      .reduce((acc, item) => {
        const [policyName, allowlist_string] = item.split('=').map(s => s.trim());

        const match_result = allowlist_string.match(/\((.*)\)/);
        // Bracket is optional when there is only single item in SH's dictionary
        // value.
        const allowlist = match_result ? (
          match_result.length > 1 ? match_result[1].split(' ') : ['']
        ) : [allowlist_string];
        acc.set(policyName, allowlist);
        return acc;
      }, new Map()));
  }

  serialize() {
    return [...this.policies.entries()]
      .map(([policyName, allowlist]) => `${policyName}=(${allowlist.join(' ')})`)
      .join(', ');
  }

  /**
   * @returns {FeaturePolicyHeader}
   */
  toFeaturePolicy() {
    /**
     * Convert permissions policy allowlist item to feature policy allowlist
     * item.
     * @param {string} item
     * @returns {string}
     */
    function mapAllowlistItem(item) {
      switch (item) {
        case '*':
          return '*';
        case "self":
          return "'self'";
        case "":
          return "'none'";
        default:
          // Remove leading and trailing '"' in permissions header syntax.
          return item.slice(1, -1);
      }
    }
    return new FeaturePolicyHeader(
      new Map(
        [...this.policies.entries()]
        .map(([feature, allowlist]) => [feature, allowlist.map(mapAllowlistItem)])
      ));
  }
};
