// Rollup configuration
// GENERATED BY Bazel

const rollup = require('rollup');
const nodeResolve = require('rollup-plugin-node-resolve');
const path = require('path');
const fs = require('fs');

const DEBUG = false;

const moduleMappings = TMPL_module_mappings;
const workspaceName = 'TMPL_workspace_name';
const rootDirs = TMPL_rootDirs;
const banner_file = TMPL_banner_file;
const stamp_data = TMPL_stamp_data;

if (rootDirs.length > 1) {
  throw new Error(`rollup config no longer supports multiple rootDirs, see
      https://github.com/bazelbuild/rules_nodejs/issues/171`);
}

if (DEBUG)
  console.error(`
Rollup: running with
  rootDirs: ${rootDirs}
  moduleMappings: ${JSON.stringify(moduleMappings)}
`);

// This resolver mimics the TypeScript Path Mapping feature, which lets us resolve
// modules based on a mapping of short names to paths.
function resolveBazel(importee, importer, baseDir = process.cwd(), resolve = require.resolve) {
  function resolveInRootDir(importee) {
    // rootDirs is checked to be length 1 earlier
    var root = rootDirs[0];
    var candidate = path.join(baseDir, root, importee);
    if (DEBUG) console.error('Rollup: try to resolve at', candidate);
    try {
      var result = resolve(candidate);
      return result;
    } catch (e) {
      return undefined;
    }
  }

  // process.cwd() is the execroot and ends up looking something like
  // /.../2c2a834fcea131eff2d962ffe20e1c87/bazel-sandbox/872535243457386053/execroot/<workspace_name>
  // from that path to the es6 output is
  // <bin_dir_path>/<build_file_dirname>/<label_name>.es6 from there, sources
  // from the user's workspace are under <user_workspace_name>/<path_to_source>
  // and sources from external workspaces are under
  // <external_workspace_name>/<path_to_source>
  var resolved;
  if (importee.startsWith('.' + path.sep) || importee.startsWith('..' + path.sep)) {
    // relative import
    if (importer) {
      let importerRootRelative = path.dirname(importer);
      for (var i = 0; i < rootDirs.length; i++) {
        var root = rootDirs[i];
        const relative = path.relative(path.join(baseDir, root), importerRootRelative);
        if (!relative.startsWith('.')) {
          importerRootRelative = relative;
        }
      }
      resolved = path.join(importerRootRelative, importee);
    } else {
      throw new Error('cannot resolve relative paths without an importer');
    }
    if (resolved) resolved = resolveInRootDir(resolved);
  }

  if (!resolved) {
    // possible workspace import or external import if importee matches a module
    // mapping
    for (const k in moduleMappings) {
      if (importee == k || importee.startsWith(k + path.sep)) {
        // replace the root module name on a mappings match
        // note that the module_root attribute is intended to be used for type-checking
        // so it uses eg. "index.d.ts". At runtime, we have only index.js, so we strip the
        // .d.ts suffix and let node require.resolve do its thing.
        var v = moduleMappings[k].replace(/\.d\.ts$/, '');
        importee = path.join(v, importee.slice(k.length + 1));
        resolved = resolveInRootDir(importee);
        if (resolved) break;
      }
    }
  }

  if (!resolved) {
    // workspace import
    const userWorkspacePath = path.relative(workspaceName, importee);
    resolved = resolveInRootDir(userWorkspacePath.startsWith('..') ? importee : userWorkspacePath);
  }

  return resolved;
}

let banner = '';
if (banner_file) {
  banner = fs.readFileSync(banner_file, {encoding: 'utf-8'});
  if (stamp_data) {
    const versionTag = fs.readFileSync(stamp_data, {encoding: 'utf-8'})
                           .split('\n')
                           .find(s => s.startsWith('BUILD_SCM_VERSION'));
    // Don't assume BUILD_SCM_VERSION exists
    if (versionTag) {
      const version = versionTag.split(' ')[1].trim();
      banner = banner.replace(/0.0.0-PLACEHOLDER/, version);
    }
  }
}

module.exports = {
  resolveBazel,
  banner,
  output: {
    format: 'iife',
    // The IIFE bundle requires a name if top-level symbols are exported.
    // We don't yet know if that name needs to be configurable by the user, so we
    // intentionally limit the API for now by naming this variable after the name
    // of this rule.
    // TODO(alexeagle): when we understand the use cases better, consider how a
    // user might get control over this name.
    name: 'TMPL_label_name',
  },
  plugins: [TMPL_additional_plugins].concat([
    {resolveId: resolveBazel},
    nodeResolve({jsnext: true, module: true}),
  ])
}
