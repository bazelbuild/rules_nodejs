"Provide convenience repository for the host platform"

load("//nodejs/private:os_name.bzl", "is_windows_os", "os_name")

def _nodejs_host_os_alias_impl(repository_ctx):
    ext = ".exe" if is_windows_os(repository_ctx) else ""

    # Base BUILD file for this repository
    repository_ctx.file("BUILD.bazel", """# Generated by nodejs_repo_host_os_alias.bzl
package(default_visibility = ["//visibility:public"])
# aliases for exports_files
alias(name = "run_npm.sh.template",     actual = "@{node_repository}_{os_name}//:run_npm.sh.template")
alias(name = "run_npm.bat.template",    actual = "@{node_repository}_{os_name}//:run_npm.bat.template")

# aliases for other aliases
alias(name = "node_bin",                actual = "@{node_repository}_{os_name}//:node_bin")
alias(name = "npm_bin",                 actual = "@{node_repository}_{os_name}//:npm_bin")
alias(name = "npx_bin",                 actual = "@{node_repository}_{os_name}//:npx_bin")
alias(name = "node",                    actual = "@{node_repository}_{os_name}//:node")
alias(name = "npm",                     actual = "@{node_repository}_{os_name}//:npm")
alias(name = "node_files",              actual = "@{node_repository}_{os_name}//:node_files")
alias(name = "npm_files",               actual = "@{node_repository}_{os_name}//:npm_files")
alias(name = "all_node_files",               actual = "@{node_repository}_{os_name}//:all_node_files")
exports_files([
    "index.bzl",
    "bin/node{ext}",
])
""".format(
        node_repository = repository_ctx.attr.user_node_repository_name,
        os_name = os_name(repository_ctx),
        ext = ext,
    ))

    repository_ctx.symlink("../{node_repository}_{os_name}/bin/node{ext}".format(
        node_repository = repository_ctx.attr.user_node_repository_name,
        os_name = os_name(repository_ctx),
        ext = ext,
    ), "bin/node" + ext)

    # index.bzl file for this repository
    repository_ctx.file("index.bzl", content = """# Generated by nodejs_repo_host_os_alias.bzl
host_platform="{host_platform}"
""".format(host_platform = os_name(repository_ctx)))

nodejs_repo_host_os_alias = repository_rule(
    _nodejs_host_os_alias_impl,
    doc = """Creates a repository with a shorter name meant for the host platform, which contains

    - A BUILD.bazel file declaring aliases to the host platform's node binaries
    - index.bzl containing some constants
    """,
    attrs = {
        "user_node_repository_name": attr.string(
            default = "nodejs",
            doc = "User-provided name from the workspace file, eg. node16",
        ),
        # FIXME: this seems unused, but not the time to make that edit right now
        "node_version": attr.string(),
    },
)
