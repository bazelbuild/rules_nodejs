const {readFileSync, exists} = require('fs');

const helper = require(process.env.BAZEL_NODE_RUNFILES_HELPER);
const location =
    helper.resolve('build_bazel_rules_nodejs/packages/esbuild/test/sourcemap_inline/bundle.js');
const externalSourcemapLocation =
    helper.resolve('build_bazel_rules_nodejs/packages/esbuild/test/sourcemap_inline/bundle.js.map');

describe('esbuild sourcemap_inline', () => {
  it('inlines the sourcemap', () => {
    const bundle = readFileSync(location, {encoding: 'utf8'});
    expect(bundle).toContain('//# sourceMappingURL=data:application/json;base64');
  });

  it('still creates the external sourcemap', () => {
    const externalSourcemap = readFileSync(externalSourcemapLocation, {encoding: 'utf8'});
    expect(externalSourcemap)
        .toContain(
            '"sources": ["../../../../../../../packages/esbuild/test/sourcemap_inline/main.ts"]');
  });
})