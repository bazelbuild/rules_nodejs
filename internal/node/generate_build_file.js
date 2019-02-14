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
const NODE_DIR = 'TEMPLATED_node_dir';
const YARN_DIR = 'TEMPLATED_yarn_dir';
const NODE_ACTUAL = 'TEMPLATED_node_actual';
const NPM_ACTUAL = 'TEMPLATED_npm_actual';
const YARN_ACTUAL = 'TEMPLATED_yarn_actual';

if (require.main === module) {
  main();
}

function mkdirp(dirname) {
  if (!fs.existsSync(dirname)) {
    mkdirp(path.dirname(dirname));
    fs.mkdirSync(dirname);
  }
}

function writeFileSync(filePath, contents) {
  mkdirp(path.dirname(filePath));
  fs.writeFileSync(filePath, contents);
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
  const nodeRunfiles = fs.existsSync(`${NODE_DIR}/bin/node`) ? `"${NODE_DIR}/bin/node"` : '';

  const binaryExt = IS_WINDOWS ? '.cmd' : '';
  const buildFile = `# Generated by node_repositories.bzl
package(default_visibility = ["//visibility:public"])
exports_files([
  "run_npm.sh.template",
  "bin/node_args.sh",
  "${NODE_DIR}/bin/node",
  "bin/node${binaryExt}",
  "bin/npm${binaryExt}",
  "bin/npm_node_repositories${binaryExt}",
  "bin/yarn${binaryExt}",
  "bin/yarn_node_repositories${binaryExt}",
  ])
alias(name = "node", actual = "${NODE_ACTUAL}")
alias(name = "npm", actual = "${NPM_ACTUAL}")
alias(name = "yarn", actual = "${YARN_ACTUAL}")
filegroup(
  name = "node_runfiles",
  srcs = [
    ${nodeRunfiles}
  ],
)
`
  writeFileSync('BUILD.bazel', buildFile);
}
