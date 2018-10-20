#!/usr/bin/env node

// This file is a shim to execute the bazel binary from the right platform-specific package.
const os = require('os');
const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;

/**
 * @returns the native `bazel` binary for the current platform
 * @throws when the `bazel` executable can not be found
 */
function getNativeBinary() {
  const nativePackage = require.resolve(`@bazel/bazel-${os.platform()}_${os.arch()}/package.json`);
  if (!fs.existsSync(nativePackage)) {
    const message = 'Bazel has not published an executable for your platform. ' +
    `(${os.platform()}_${os.arch()})\n` +
    'Consider installing it following instructions at https://bazel.build instead.\n';
    throw new Error(message);
  }
  const binary = JSON.parse(fs.readFileSync(nativePackage))['bin']['bazel'];
  return path.resolve(path.dirname(nativePackage), binary);
}

spawn(getNativeBinary(), process.argv.slice(2), {stdio: 'inherit'});
