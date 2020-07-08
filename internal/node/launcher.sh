#!/usr/bin/env bash
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

# --- begin runfiles.bash initialization v2 ---
# Copy-pasted from the Bazel Bash runfiles library v2.
set -uo pipefail; f=build_bazel_rules_nodejs/third_party/github.com/bazelbuild/bazel/tools/bash/runfiles/runfiles.bash
source "${RUNFILES_DIR:-/dev/null}/$f" 2>/dev/null || \
  source "$(grep -sm1 "^$f " "${RUNFILES_MANIFEST_FILE:-/dev/null}" | cut -f2- -d' ')" 2>/dev/null || \
  source "$0.runfiles/$f" 2>/dev/null || \
  source "$(grep -sm1 "^$f " "$0.runfiles_manifest" | cut -f2- -d' ')" 2>/dev/null || \
  source "$(grep -sm1 "^$f " "$0.exe.runfiles_manifest" | cut -f2- -d' ')" 2>/dev/null || \
  { echo>&2 "ERROR: cannot find $f"; exit 1; }; f=; set -e
# --- end runfiles.bash initialization v2 ---

# Export runfiles env vars for nested tools
runfiles_export_envvars
# Export absolute path to runfiles directory
export RUNFILES=$(readlink -f ${RUNFILES_DIR})

TEMPLATED_env_vars

# Note: for debugging it is useful to see what files are actually present
# This redirects to stderr so it doesn't interfere with Bazel's worker protocol
# find . -name thingImLookingFor 1>&2

readonly vendored_node="TEMPLATED_vendored_node"

if [ -n "${vendored_node}" ]; then
  # Use the vendored node path
  readonly node=$(rlocation "${vendored_node}")

  if [ ! -f "${node}" ]; then
      printf "\n>>>> FAIL: The vendored node binary '${vendored_node}' not found in runfiles. <<<<\n\n" >&2
      exit 1
  fi
else
  # Check environment for which node path to use
  unameOut="$(uname -s)"
  case "${unameOut}" in
      Linux*)     machine=linux ;;
      Darwin*)    machine=darwin ;;
      CYGWIN*)    machine=windows ;;
      MINGW*)     machine=windows ;;
      MSYS_NT*)   machine=windows ;;
      *)          machine=linux
                  printf "\nUnrecongized uname '${unameOut}'; defaulting to use node for linux.\n" >&2
                  printf "Please file an issue to https://github.com/bazelbuild/rules_nodejs/issues if \n" >&2
                  printf "you would like to add your platform to the supported rules_nodejs node platforms.\n\n" >&2
                  ;;
  esac

  case "${machine}" in
    # The following paths must match up with _download_node in node_repositories
    darwin) readonly node_toolchain="nodejs_darwin_amd64/bin/nodejs/bin/node" ;;
    windows) readonly node_toolchain="nodejs_windows_amd64/bin/nodejs/node.exe" ;;
    *) readonly node_toolchain="nodejs_linux_amd64/bin/nodejs/bin/node" ;;
  esac

  readonly node=$(rlocation "${node_toolchain}")

  if [ ! -f "${node}" ]; then
      printf "\n>>>> FAIL: The node binary '${node_toolchain}' not found in runfiles.\n" >&2
      printf "This node toolchain was chosen based on your uname '${unameOut}'.\n" >&2
      printf "Please file an issue to https://github.com/bazelbuild/rules_nodejs/issues if \n" >&2
      printf "you would like to add your platform to the supported rules_nodejs node platforms. <<<<\n\n" >&2
      exit 1
  fi
fi

# Export the location of the runfiles helpers script
export BAZEL_NODE_RUNFILES_HELPER=$(rlocation "TEMPLATED_runfiles_helper_script")
if [[ "${BAZEL_NODE_RUNFILES_HELPER}" != /* ]] && [[ ! "${BAZEL_NODE_RUNFILES_HELPER}" =~ ^[A-Z]:[\\/] ]]; then
  export BAZEL_NODE_RUNFILES_HELPER=$(pwd)/${BAZEL_NODE_RUNFILES_HELPER}
fi

# Export the location of the require patch script as it can be used to boostrap
# node require patch if needed
export BAZEL_NODE_PATCH_REQUIRE=$(rlocation "TEMPLATED_require_patch_script")
if [[ "${BAZEL_NODE_PATCH_REQUIRE}" != /* ]] && [[ ! "${BAZEL_NODE_PATCH_REQUIRE}" =~ ^[A-Z]:[\\/] ]]; then
  export BAZEL_NODE_PATCH_REQUIRE=$(pwd)/${BAZEL_NODE_PATCH_REQUIRE}
fi

# The main entry point
MAIN=$(rlocation "TEMPLATED_loader_script")

readonly repository_args=$(rlocation "TEMPLATED_repository_args")
readonly link_modules_script=$(rlocation "TEMPLATED_link_modules_script")
node_patches_script=$(rlocation "TEMPLATED_node_patches_script")
require_patch_script=${BAZEL_NODE_PATCH_REQUIRE}

# Node's --require option assumes that a non-absolute path not starting with `.` is
# a module, so that you can do --require=source-map-support/register
# So if the require script is not absolute, we must make it so
case "${node_patches_script}" in
  # Absolute path on unix
  /*          ) ;;
  # Absolute path on Windows, e.g. C:/path/to/thing
  [a-zA-Z]:/* ) ;;
  # Otherwise it needs to be made relative
  *           ) node_patches_script="./${node_patches_script}" ;;
esac
case "${require_patch_script}" in
  # Absolute path on unix
  /*          ) ;;
  # Absolute path on Windows, e.g. C:/path/to/thing
  [a-zA-Z]:/* ) ;;
  # Otherwise it needs to be made relative
  *           ) require_patch_script="./${require_patch_script}" ;;
esac

source $repository_args

ARGS=()
LAUNCHER_NODE_OPTIONS=( "--require" "$require_patch_script" )
USER_NODE_OPTIONS=()
ALL_ARGS=(TEMPLATED_args $NODE_REPOSITORY_ARGS "$@")
for ARG in "${ALL_ARGS[@]:-}"; do
  case "$ARG" in
    --bazel_node_modules_manifest=*) MODULES_MANIFEST="${ARG#--bazel_node_modules_manifest=}" ;;
    --nobazel_patch_module_resolver)
      MAIN=TEMPLATED_entry_point_execroot_path
      LAUNCHER_NODE_OPTIONS=( "--require" "$node_patches_script" )

      # In this case we should always run the linker
      # For programs which are called with bazel run or bazel test, there will be no additional runtime
      # dependencies to link, so we use the default modules_manifest which has only the static dependencies
      # of the binary itself
      MODULES_MANIFEST=${MODULES_MANIFEST:-$(rlocation "TEMPLATED_modules_manifest")}
      ;;
    --node_options=*) USER_NODE_OPTIONS+=( "${ARG#--node_options=}" ) ;;
    *) ARGS+=( "$ARG" )
  esac
done

# Link the first-party modules into node_modules directory before running the actual program
if [[ -n "${MODULES_MANIFEST:-}" ]]; then
  "${node}" "${link_modules_script}" "${MODULES_MANIFEST:-}"
fi

# TODO: after we link-all-bins we should not need this extra lookup
if [[ ! -f "$MAIN" ]]; then
  MAIN=TEMPLATED_entry_point_manifest_path
fi

# Tell the node_patches_script that programs should not escape the execroot
# Bazel always sets the PWD to execroot/my_wksp so we go up one directory.
export BAZEL_PATCH_ROOT=$(dirname $PWD)

# Set all bazel managed node_modules directories as guarded so no symlinks may
# escape and no symlinks may enter
if [[ "$PWD" == *"/bazel-out/"* ]]; then
  # We in runfiles, find the execroot.
  # Look for `bazel-out` which is used to determine the the path to `execroot/my_wksp`. This works in
  # all cases including on rbe where the execroot is a path such as `/b/f/w`. For example, when in
  # runfiles on rbe, bazel runs the process in a directory such as
  # `/b/f/w/bazel-out/k8-fastbuild/bin/path/to/pkg/some_test.sh.runfiles/my_wksp`. From here we can
  # determine the execroot `b/f/w` by finding the first instance of bazel-out.
  readonly bazel_out="/bazel-out/"
  readonly rest=${PWD#*$bazel_out}
  readonly index=$(( ${#PWD} - ${#rest} - ${#bazel_out} ))
  if [[ ${index} < 0 ]]; then
    echo "No 'bazel-out' folder found in path '${PWD}'!"
    exit 1
  fi
  readonly execroot=${PWD:0:${index}}
  export BAZEL_PATCH_GUARDS="${execroot}/node_modules"
else
  # We are in execroot, linker node_modules is in the PWD
  export BAZEL_PATCH_GUARDS="${PWD}/node_modules"
fi
if [[ -n "${BAZEL_NODE_MODULES_ROOT:-}" ]]; then
  if [[ "${BAZEL_NODE_MODULES_ROOT}" != "${BAZEL_WORKSPACE}/node_modules" ]]; then
    # If BAZEL_NODE_MODULES_ROOT is set and it is not , add it to the list of bazel patch guards
    # Also, add the external/${BAZEL_NODE_MODULES_ROOT} which is the correct path under execroot
    # and under runfiles it is the legacy external runfiles path
    export BAZEL_PATCH_GUARDS="${BAZEL_PATCH_GUARDS},${BAZEL_PATCH_ROOT}/${BAZEL_NODE_MODULES_ROOT},${PWD}/external/${BAZEL_NODE_MODULES_ROOT}"
  fi
fi

# The EXPECTED_EXIT_CODE lets us write bazel tests which assert that
# a binary fails to run. Otherwise any failure would make such a test
# fail before we could assert that we expected that failure.
readonly EXPECTED_EXIT_CODE="TEMPLATED_expected_exit_code"
if [ "${EXPECTED_EXIT_CODE}" -eq "0" ]; then
  # Replace the current process (bash) with a node process.
  # This means that stdin, stdout, signals, etc will be transparently
  # handled by the node process.
  # If we had merely forked a child process here, we'd be responsible
  # for forwarding those OS interactions.
  exec "${node}" "${LAUNCHER_NODE_OPTIONS[@]:-}" "${USER_NODE_OPTIONS[@]:-}" "${MAIN}" ${ARGS[@]+"${ARGS[@]}"}
  # exec terminates execution of this shell script, nothing later will run.
fi

set +e
"${node}" "${LAUNCHER_NODE_OPTIONS[@]:-}" "${USER_NODE_OPTIONS[@]:-}" "${MAIN}" ${ARGS[@]+"${ARGS[@]}"}
RESULT="$?"
set -e

if [ ${RESULT} != ${EXPECTED_EXIT_CODE} ]; then
  echo "Expected exit code to be ${EXPECTED_EXIT_CODE}, but got ${RESULT}" >&2
  if [ "${RESULT}" -eq "0" ]; then
    # This exit code is handled specially by Bazel:
    # https://github.com/bazelbuild/bazel/blob/486206012a664ecb20bdb196a681efc9a9825049/src/main/java/com/google/devtools/build/lib/util/ExitCode.java#L44
    readonly BAZEL_EXIT_TESTS_FAILED=3;
    exit ${BAZEL_EXIT_TESTS_FAILED}
  fi
else
  exit 0
fi

exit ${RESULT}

