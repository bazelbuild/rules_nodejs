// Rollup configuration
// GENERATED BY Bazel

// Workaround https://github.com/bazelbuild/rules_nodejs/issues/25
// For Windows, we must deep-import the actual .js file, not rely on reading the "main" from package.json
const rollup = require('rollup/dist/rollup');
const nodeResolve = require('rollup-plugin-node-resolve/dist/rollup-plugin-node-resolve.cjs');
const path = require('path');

const binDirPath = "TMPL_bin_dir_path";
const workspaceName = "TMPL_workspace_name";
const buildFileDirname = "TMPL_build_file_dirname";
const labelName = "TMPL_label_name";
const moduleMappings = TMPL_module_mappings;

class NormalizePaths {
  resolveId(importee, importer) {
    // process.cwd() is the execroot and ends up looking something like /.../2c2a834fcea131eff2d962ffe20e1c87/bazel-sandbox/872535243457386053/execroot/<workspace_name>
    // from that path to the es6 output is <bin_dir_path>/<build_file_dirname>/<label_name>.es6
    // from there, sources from the user's workspace are under <user_workspace_name>/<path_to_source>
    // and sources from external workspaces are under <external_workspace_name>/<path_to_source>
    var resolved;
    if (importee.startsWith(`./`) || importee.startsWith(`../`)) {
      // relative import
      resolved = path.join(importer ? path.dirname(importer) : '', importee);
    } else if (importee.startsWith(`${workspaceName}/`)) {
      // workspace import
      resolved = path.join(process.cwd(), binDirPath, buildFileDirname, `${labelName}.es6`, importee);
    } else {
      // possible workspace import or external import if importee matches a module mapping
      for (const k in moduleMappings) {
        if (importee == k || importee.startsWith(`${k}/`)) {
          // replace the root module name on a mappings match
          var v = moduleMappings[k];
          var userWorkspace = workspaceName;
          if (v.startsWith('external/')) {
            // for external workspaces, drop the 'external/' from the module mapping and clear the user workspace name
            v = v.slice('external/'.length);
            userWorkspace = '';
          }
          importee = path.join(userWorkspace, v, importee.slice(k.length+1))
          resolved = path.join(process.cwd(), binDirPath, buildFileDirname, `${labelName}.es6`, importee);
          break;
        }
      }
    }
    if (resolved) {
      // resolve with node path resolution (it will handle index.js)
      return require.resolve(resolved);
    }
  }
}

export default {
  input: [TMPL_inputs],
  output: {dir: path.join(process.cwd(), binDirPath, buildFileDirname, 'bundles.es6'), format: 'cjs'},
  experimentalCodeSplitting: true,
  experimentalDynamicImport: true,
  plugins: [
      TMPL_additional_plugins
  ].concat([
      new NormalizePaths(),
      nodeResolve({jsnext: true, module: true}),
    ])
}
