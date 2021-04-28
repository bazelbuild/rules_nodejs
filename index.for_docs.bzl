# Copyright 2017 The Bazel Authors. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Symbols that should have their API docs generated by stardoc
# This differs from :index.bzl because we don't have wrapping macros that hide the real doc"""
"""
# Built-in rules

These rules are available without any npm installation,
via the `WORKSPACE` install of the `build_bazel_rules_nodejs` workspace.

This is necessary to bootstrap Bazel to run the package manager to download other rules from NPM.
"""

load("//internal/common:check_bazel_version.bzl", _check_bazel_version = "check_bazel_version")
load("//internal/common:copy_to_bin.bzl", _copy_to_bin = "copy_to_bin")
load("//internal/common:params_file.bzl", _params_file = "params_file")
load("//internal/generated_file_test:generated_file_test.bzl", _generated_file_test = "generated_file_test")
load("//internal/js_library:js_library.bzl", _js_library = "js_library")
load("//internal/node:node.bzl", _nodejs_binary = "nodejs_binary", _nodejs_test = "nodejs_test")
load("//internal/node:node_repositories.bzl", _node_repositories = "node_repositories_rule")
load("//internal/node:npm_package_bin.bzl", _npm_bin = "npm_package_bin")
load("//internal/npm_install:npm_install.bzl", _npm_install = "npm_install", _yarn_install = "yarn_install")
load("//internal/pkg_npm:pkg_npm.bzl", _pkg_npm = "pkg_npm")
load("//internal/pkg_web:pkg_web.bzl", _pkg_web = "pkg_web")

check_bazel_version = _check_bazel_version
copy_to_bin = _copy_to_bin
params_file = _params_file
nodejs_binary = _nodejs_binary
nodejs_test = _nodejs_test
node_repositories = _node_repositories
pkg_npm = _pkg_npm
npm_install = _npm_install
yarn_install = _yarn_install
npm_package_bin = _npm_bin
pkg_web = _pkg_web
generated_file_test = _generated_file_test
js_library = _js_library
# ANY RULES ADDED HERE SHOULD BE DOCUMENTED, run yarn stardoc to verify
