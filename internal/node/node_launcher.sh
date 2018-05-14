#!/bin/bash
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

set -e

# Launcher for NodeJS applications.
# Find our runfiles. We need this to launch node with the correct
# entry point.
#
# Call this program X. X was generated by a genrule and may be invoked
# in many ways:
#   1a) directly by a user, with $0 in the output tree
#   1b) via 'bazel run' (similar to case 1a)
#   2) directly by a user, with $0 in X's runfiles
#   3) by another program Y which has a data dependency on X, with $0 in Y's
#      runfiles
#   4a) via 'bazel test'
#   4b) case 3 in the context of a test
#   5a) by a genrule cmd, with $0 in the output tree
#   6a) case 3 in the context of a genrule
#
# For case 1, $0 will be a regular file, and the runfiles will be
# at $0.runfiles.
# For case 2 or 3, $0 will be a symlink to the file seen in case 1.
# For case 4, $TEST_SRCDIR should already be set to the runfiles by
# blaze.
# Case 5a is handled like case 1.
# Case 6a is handled like case 3.

case "$0" in
 /*) self="$0" ;;
 *) self="$PWD/$0" ;;
esac

if [[ -n "$RUNFILES_MANIFEST_ONLY" ]]; then
  # Windows only has a manifest file instead of symlinks.
  RUNFILES=${RUNFILES_MANIFEST_FILE%/MANIFEST}
elif [[ -n "$TEST_SRCDIR" ]]; then
  # Case 4, bazel has identified runfiles for us.
  RUNFILES="${TEST_SRCDIR}"
else
  while true; do
    if [[ -e "$self.runfiles" ]]; then
      RUNFILES="$self.runfiles"
      break
    fi

    if [[ $self == *.runfiles/* ]]; then
      RUNFILES="${self%%.runfiles/*}.runfiles"
      # don't break; this is a last resort for case 6b
    fi

    if [[ ! -L "$self" ]]; then
      break;
    fi

    readlink="$(readlink "$self")"
    if [[ "$readlink" = /* ]]; then
      self="$readlink"
    else
      # resolve relative symlink
      self="${self%%/*}/$readlink"
    fi
  done

  if [[ -z "$RUNFILES" ]]; then
    echo " >>>> FAIL: RUNFILES environment variable is not set. <<<<" >&2
    exit 1
  fi
fi
export RUNFILES
TEMPLATED_env_vars

# Note: for debugging it is useful to see what files are actually present
# This redirects to stderr so it doesn't interfere with Bazel's worker protocol
# find . -name thingImLookingFor 1>&2

# On Windows, the runfiles symlink tree does not exist, so we must resolve paths
# using the mapping in the runfiles_manifest file.
# See https://github.com/bazelbuild/bazel/issues/3726
readonly MANIFEST="${RUNFILES}/MANIFEST"
if [ -e "${MANIFEST}" ]; then
  # Lookup the real paths from the runfiles manifest with no dependency on posix
  while read line; do
    declare -a PARTS=($line)
    if [ "${PARTS[0]}" == "TEMPLATED_node" ]; then
      readonly node="${PARTS[1]}"
    elif [ "${PARTS[0]}" == "TEMPLATED_repository_args" ]; then
      readonly repository_args="${PARTS[1]}"
    elif [ "${PARTS[0]}" == "TEMPLATED_script_path" ]; then
      readonly script="${PARTS[1]}"
    fi
  done < ${MANIFEST}
  if [ -z "${node}" ]; then
    echo "Failed to find node binary TEMPLATED_node in manifest ${MANIFEST}"
    exit 1
  fi
  if [ -z "${script}" ]; then
    echo "Failed to find script TEMPLATED_script_path in manifest ${MANIFEST}"
    exit 1
  fi
else
  readonly node="${RUNFILES}/TEMPLATED_node"
  readonly repository_args="${RUNFILES}/TEMPLATED_repository_args"
  readonly script="${RUNFILES}/TEMPLATED_script_path"
fi

source $repository_args

ARGS=()
NODE_OPTIONS=()
ALL_ARGS=(TEMPLATED_args $NODE_REPOSITORY_ARGS "$@")
for ARG in "${ALL_ARGS[@]}"; do
  case "$ARG" in
    --node_options=*) NODE_OPTIONS+=( "${ARG#--node_options=}" ) ;;
    *) ARGS+=( "$ARG" )
  esac
done

set +e
"${node}" "${NODE_OPTIONS[@]}" "${script}" "${ARGS[@]}"
RESULT="$?"
set -e

readonly EXPECTED_EXIT_CODE="TEMPLATED_expected_exit_code"
if [ "${EXPECTED_EXIT_CODE}" -ne "0" ]; then
  if (( ${RESULT} != ${EXPECTED_EXIT_CODE} )); then
    echo "Expected exit code to be ${EXPECTED_EXIT_CODE}, but got ${RESULT}" >&2
    # This exit code is handled specially by Bazel:
    # https://github.com/bazelbuild/bazel/blob/486206012a664ecb20bdb196a681efc9a9825049/src/main/java/com/google/devtools/build/lib/util/ExitCode.java#L44
    BAZEL_EXIT_TESTS_FAILED = 3;
    exit ${BAZEL_EXIT_TESTS_FAILED}
  else
    exit 0
  fi
fi

exit ${RESULT}
