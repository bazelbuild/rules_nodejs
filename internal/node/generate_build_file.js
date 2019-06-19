/**
 * @license
 * Copyright 2017 The Bazel Authors. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @fileoverview This script generates the BUILD.bazel file for NodeJS, npm & yarn.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const IS_WINDOWS = TEMPLATED_is_windows;
const IS_VENDORED_NODE = 'TEMPLATED_vendored_node';
const NODE_ACTUAL = 'TEMPLATED_node_actual';
const NODE_BIN_ACTUAL = 'TEMPLATED_node_bin_actual';
const NPM_ACTUAL = 'TEMPLATED_npm_actual';
const YARN_ACTUAL = 'TEMPLATED_yarn_actual';

if (require.main === module) {
  main();
}

/**
 * Create a new directory and any necessary subdirectories
 * if they do not exist.
 */
function mkdirp(p) {
  if (!fs.existsSync(p)) {
    mkdirp(path.dirname(p));
    fs.mkdirSync(p);
  }
}

/**
 * Writes a file, first ensuring that the directory to
 * write to exists.
 */
function writeFileSync(p, content) {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, content);
}

/**
 * Main entrypoint.
 * Write BUILD file.
 */
function main() {
  generateBuildFile()
}

module.exports = { main };

function generateBuildFile() {
  const binaryExt = IS_WINDOWS ? '.cmd' : '';
  const exportedNodeBin = IS_VENDORED_NODE ? '' : '\n  "${NODE_BIN_ACTUAL}",';
  const buildFile = `# Generated by node_repositories.bzl
package(default_visibility = ["//visibility:public"])
exports_files([
  "run_npm.sh.template",
  "bin/node_repo_args.sh",${exportedNodeBin}
  "bin/node${binaryExt}",
  "bin/npm${binaryExt}",
  "bin/npm_node_repositories${binaryExt}",
  "bin/yarn${binaryExt}",
  "bin/yarn_node_repositories${binaryExt}",
  ])
alias(name = "node_bin", actual = "${NODE_BIN_ACTUAL}")
alias(name = "node", actual = "${NODE_ACTUAL}")
alias(name = "npm", actual = "${NPM_ACTUAL}")
alias(name = "yarn", actual = "${YARN_ACTUAL}")
`
  writeFileSync('BUILD.bazel', buildFile);
}
