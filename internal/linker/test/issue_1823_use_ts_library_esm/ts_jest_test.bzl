"""Simple macro around jest_test"""

load("@npm//jest-cli:index.bzl", _jest_test = "jest_test")
load("@npm_bazel_typescript//:index.bzl", "ts_library")

def ts_jest_test(name, srcs, jest_config, deps = [], data = [], **kwargs):
    """A macro around the autogenerated jest_test rule that takes typescript sources

Uses ts_library prodmode ems output"""

    ts_library(
        name = "%s_ts" % name,
        srcs = srcs,
        data = data,
        deps = deps + ["@npm//@types/jest"],
        # NB: hacky hidden configuration setting so that es6_sources does not include tsickle
        #     .externs.js outputs
        runtime = "nodejs",
    )
    native.filegroup(
        name = "%s_esm" % name,
        srcs = [":%s_ts" % name],
        output_group = "es6_sources",
    )

    args = [
        "--no-cache",
        "--no-watchman",
        "--ci",
    ]
    args.extend(["--config", "$(rootpath %s)" % jest_config])

    _jest_test(
        name = name,
        data = [jest_config, ":%s_esm" % name] + deps + data,
        templated_args = args,
        **kwargs
    )
