// Karma configuration
// GENERATED BY Bazel
try {
  const fs = require('fs');
  const path = require('path');
  const tmp = require('tmp');
  const child_process = require('child_process');

  const DEBUG = false;

  // BEGIN ENV VARS
  TMPL_env_vars
  // END ENV VARS

  const configPath = 'TMPL_config_file';

  if (DEBUG)
    console.info(`Karma test starting with:
    cwd: ${process.cwd()}
    configPath: ${configPath}`);

  /**
   * Helper function to find a particular namedFile
   * within the webTestMetadata webTestFiles
   */
  function findNamedFile(webTestMetadata, key) {
    let result;
    webTestMetadata['webTestFiles'].forEach(entry => {
      const webTestNamedFiles = entry['namedFiles'];
      if (webTestNamedFiles && webTestNamedFiles[key]) {
        result = webTestNamedFiles[key];
      }
    });
    return result;
  }

  /**
   * Helper function to extract a browser archive
   * and return the path to extract executable
   */
  function extractWebArchive(extractExe, archiveFile, executablePath) {
    try {
      // Paths are relative to the root runfiles folder
      extractExe = extractExe ? path.join('..', extractExe) : extractExe;
      archiveFile = path.join('..', archiveFile);
      const extractedExecutablePath = path.join(process.cwd(), executablePath);
      if (!extractExe) {
        throw new Error('No EXTRACT_EXE found');
      }
      child_process.execFileSync(
          extractExe, [archiveFile, '.'], {stdio: [process.stdin, process.stdout, process.stderr]});
      if (DEBUG)
        console.info(`Extracting web archive ${archiveFile} with ${extractExe} to ${
            extractedExecutablePath}`);
      return extractedExecutablePath;
    } catch (e) {
      console.error(`Failed to extract ${archiveFile}`);
      throw e;
    }
  }

  /**
   * Chrome on Linux uses sandboxing, which needs user namespaces to be enabled.
   * This is not available on all kernels and it might be turned off even if it is available.
   * Notable examples where user namespaces are not available include:
   * - In Debian it is compiled-in but disabled by default.
   * - The Docker daemon for Windows or OSX does not support user namespaces.
   * We can detect if user namespaces are supported via /proc/sys/kernel/unprivileged_userns_clone.
   * For more information see:
   * https://github.com/Googlechrome/puppeteer/issues/290
   * https://superuser.com/questions/1094597/enable-user-namespaces-in-debian-kernel#1122977
   * https://github.com/karma-runner/karma-chrome-launcher/issues/158
   * https://github.com/angular/angular/pull/24906
   */
  function supportsSandboxing() {
    if (process.platform !== 'linux') {
      return true;
    }
    try {
      const res = child_process.execSync('cat /proc/sys/kernel/unprivileged_userns_clone')
                      .toString()
                      .trim();
      return res === '1';
    } catch (error) {
    }

    return false;
  }

  /**
   * Helper function to override base karma config values.
   */
  function overrideConfigValue(conf, name, value) {
    if (conf.hasOwnProperty(name)) {
      console.warn(
          `Your karma configuration specifies '${name}' which will be overwritten by Bazel`);
    }
    conf[name] = value;
  }

  /**
   * Helper function to merge base karma config values that are arrays.
   */
  function mergeConfigArray(conf, name, values) {
    if (!conf[name]) {
      conf[name] = [];
    }
    values.forEach(v => {
      if (!conf[name].includes(v)) {
        conf[name].push(v);
      }
    })
  }

  /**
   * Configuration settings for karma under Bazel common to karma_web_test
   * and karma_web_test_suite.
   */
  function configureBazelConfig(config, conf) {
    // list of karma plugins
    mergeConfigArray(conf, 'plugins', [
      'karma-*',
      '@bazel/karma',
      'karma-sourcemap-loader',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-sauce-launcher',
    ]);

    // list of karma preprocessors
    if (!conf.preprocessors) {
      conf.preprocessors = {}
    }
    conf.preprocessors['**/*.js'] = ['sourcemap'];

    // list of test frameworks to use
    overrideConfigValue(conf, 'frameworks', ['jasmine', 'concat_js']);

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    mergeConfigArray(conf, 'reporters', ['progress']);

    // enable / disable colors in the output (reporters and logs)
    if (!conf.colors) {
      conf.colors = true;
    }

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR ||
    // config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    if (!conf.logLevel) {
      conf.logLevel = config.LOG_INFO;
    }

    // enable / disable watching file and executing tests whenever
    // any file changes
    overrideConfigValue(conf, 'autoWatch', process.env['IBAZEL_NOTIFY_CHANGES'] === 'y');

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    // note: run_karma.sh may override this as a command-line option.
    overrideConfigValue(conf, 'singleRun', false);

    // Concurrency level
    // how many browser should be started simultaneous
    overrideConfigValue(conf, 'concurrency', Infinity);

    // base path that will be used to resolve all patterns
    // (eg. files, exclude)
    overrideConfigValue(conf, 'basePath', 'TMPL_runfiles_path');

    // Do not show "no timestamp" errors from "karma-requirejs" for proxied file
    // requests. Files which are passed as "static_files" are proxied by default and
    // therefore should not cause such an exception when loaded as expected.
    // See: https://github.com/karma-runner/karma-requirejs/issues/6
    const requireJsShowNoTimestampsError = '^(?!/base/).*$';

    if (conf.client) {
      overrideConfigValue(
          conf.client, 'requireJsShowNoTimestampsError', requireJsShowNoTimestampsError);
    } else {
      conf.client = {requireJsShowNoTimestampsError};
    }
  }

  /**
   * Configure the 'files' and 'proxies' configuration attributes.
   * These are concatenated into a single file by karma-concat-js.
   */
  function configureFiles(conf) {
    overrideConfigValue(conf, 'files', [
      // BEGIN BOOTSTRAP FILES
      TMPL_bootstrap_files
      // END BOOTSTRAP FILES
      // BEGIN USER FILES
      TMPL_user_files
      // END USER FILES
    ].map(f => {
      if (f.startsWith('NODE_MODULES/')) {
        try {
          // attempt to resolve in @bazel/typescript nested node_modules first
          return require.resolve(f.replace(/^NODE_MODULES\//, '@bazel/karma/node_modules/'));
        } catch (e) {
          // if that failed then attempt to resolve in root node_modules
          return require.resolve(f.replace(/^NODE_MODULES\//, ''));
        }
      } else {
        return require.resolve(f);
      }
    }));
      overrideConfigValue(conf, 'exclude', []);
      overrideConfigValue(conf, 'proxies', {});

      // static files are added to the files array but
      // configured to not be included so karma-concat-js does
      // not included them in the bundle
      [
        // BEGIN STATIC FILES
        TMPL_static_files
        // END STATIC FILES
      ].forEach((f) => {
        // In Windows, the runfile will probably not be symlinked. Se we need to
        // serve the real file through karma, and proxy calls to the expected file
        // location in the runfiles to the real file.
        const resolvedFile = require.resolve(f);
        conf.files.push({pattern: resolvedFile, included: false});
        // Prefixing the proxy path with '/absolute' allows karma to load local
        // files. This doesn't see to be an official API.
        // https://github.com/karma-runner/karma/issues/2703
        conf.proxies['/base/' + f] = '/absolute' + resolvedFile;
      });

      var requireConfigContent = `
// A simplified version of Karma's requirejs.config.tpl.js for use with Karma under Bazel.
// This does an explicit \`require\` on each test script in the files, otherwise nothing will be loaded.
(function(){
  var runtimeFiles = [
    // BEGIN RUNTIME FILES
    TMPL_runtime_files
    // END RUNTIME FILES
  ].map(function(file) { return file.replace(/\\.js$/, ''); });
  var allFiles = [
      // BEGIN USER FILES
      TMPL_user_files
      // END USER FILES
  ];
  var allTestFiles = [];
  allFiles.forEach(function (file) {
    if (/[^a-zA-Z0-9](spec|test)\\.js$/i.test(file) && !/\\/node_modules\\//.test(file)) {
      allTestFiles.push(file.replace(/\\.js$/, ''))
    }
  });
  require(runtimeFiles, function() { return require(allTestFiles, window.__karma__.start); });
})();
`;

      const requireConfigFile =
          tmp.fileSync({keep: false, postfix: '.js', dir: process.env['TEST_TMPDIR']});
      fs.writeFileSync(requireConfigFile.name, requireConfigContent);
      conf.files.push(requireConfigFile.name);
  }

  /**
   * Configure karma under karma_web_test_suite.
   * `browsers` and `customLaunchers` are setup by Bazel.
   */
  function configureTsWebTestSuiteConfig(conf) {
    // WEB_TEST_METADATA is configured in rules_webtesting based on value
    // of the browsers attribute passed to karms_web_test_suite
    // We setup the karma configuration based on the values in this object
    if (!process.env['WEB_TEST_METADATA']) {
      // This is a karma_web_test rule since there is no WEB_TEST_METADATA
      return;
    }

    overrideConfigValue(conf, 'browsers', []);
    overrideConfigValue(conf, 'customLaunchers', null);

    const webTestMetadata = require(process.env['WEB_TEST_METADATA']);
    if (DEBUG) console.info(`WEB_TEST_METADATA: ${JSON.stringify(webTestMetadata, null, 2)}`);
    if (webTestMetadata['environment'] === 'sauce') {
      // If a sauce labs browser is chosen for the test such as
      // "@io_bazel_rules_webtesting//browsers/sauce:chrome-win10"
      // than the 'environment' will equal 'sauce'.
      // We expect that a SAUCE_USERNAME and SAUCE_ACCESS_KEY is available
      // from the environment for this test to run
      if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
        console.error(
            'Make sure the SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables are set.');
        process.exit(1);
      }
      // 'capabilities' will specify the sauce labs configuration to use
      const capabilities = webTestMetadata['capabilities'];
      conf.customLaunchers = {
        'sauce': {
          base: 'SauceLabs',
          browserName: capabilities['browserName'],
          platform: capabilities['platform'],
          version: capabilities['version'],
        }
      };
      conf.browsers.push('sauce');
    } else if (webTestMetadata['environment'] === 'local') {
      // When a local chrome or firefox browser is chosen such as
      // "@io_bazel_rules_webtesting//browsers:chromium-local" or
      // "@io_bazel_rules_webtesting//browsers:firefox-local"
      // then the 'environment' will equal 'local' and
      // 'webTestFiles' will contain the path to the binary to use
      const extractExe = findNamedFile(webTestMetadata, 'EXTRACT_EXE');
      webTestMetadata['webTestFiles'].forEach(webTestFiles => {
        const webTestNamedFiles = webTestFiles['namedFiles'];
        const archiveFile = webTestFiles['archiveFile'];
        if (webTestNamedFiles['CHROMIUM']) {
          // When karma is configured to use Chrome it will look for a CHROME_BIN
          // environment variable.
          if (archiveFile) {
            process.env.CHROME_BIN =
                extractWebArchive(extractExe, archiveFile, webTestNamedFiles['CHROMIUM']);
          } else {
            process.env.CHROME_BIN = require.resolve(webTestNamedFiles['CHROMIUM']);
          }
          const browser = process.env['DISPLAY'] ? 'Chrome' : 'ChromeHeadless';
          if (!supportsSandboxing()) {
            const launcher = 'CustomChromeWithoutSandbox';
            conf.customLaunchers = {[launcher]: {base: browser, flags: ['--no-sandbox']}};
            conf.browsers.push(launcher);
          } else {
            conf.browsers.push(browser);
          }
        }
        if (webTestNamedFiles['FIREFOX']) {
          // When karma is configured to use Firefox it will look for a
          // FIREFOX_BIN environment variable.
          if (archiveFile) {
            process.env.FIREFOX_BIN =
                extractWebArchive(extractExe, archiveFile, webTestNamedFiles['FIREFOX']);
          } else {
            process.env.FIREFOX_BIN = require.resolve(webTestNamedFiles['FIREFOX']);
          }
          conf.browsers.push(process.env['DISPLAY'] ? 'Firefox' : 'FirefoxHeadless');
        }
      });
    } else {
      throw new Error(`Unknown WEB_TEST_METADATA environment '${webTestMetadata['environment']}'`);
    }

    if (!conf.browsers.length) {
      throw new Error('No browsers configured in web test suite');
    }

    // Extra configuration is needed for saucelabs
    // See: https://github.com/karma-runner/karma-sauce-launcher
    if (conf.customLaunchers) {
      // set the test name for sauce labs to use
      // TEST_BINARY is set by Bazel and contains the name of the test
      // target postfixed with the browser name such as
      // 'examples/testing/testing_sauce_chrome-win10' for the
      // test target examples/testing:testing
      if (!conf.sauceLabs) {
        conf.sauceLabs = {}
      }
      conf.sauceLabs.testName = process.env['TEST_BINARY'] || 'karma';

      // Try "websocket" for a faster transmission first. Fallback to "polling" if necessary.
      overrideConfigValue(conf, 'transports', ['websocket', 'polling']);

      // add the saucelabs reporter
      mergeConfigArray(conf, 'reporters', ['saucelabs']);
    }
  }

  function configureTsWebTestConfig(conf) {
    if (process.env['WEB_TEST_METADATA']) {
      // This is a karma_web_test_suite rule since there is a WEB_TEST_METADATA
      return;
    }

    // Fallback to using the system local chrome if no valid browsers have been
    // configured above
    if (!conf.browsers || !conf.browsers.length) {
      console.warn('No browsers configured. Configuring Karma to use system Chrome.');
      conf.browsers = [process.env['DISPLAY'] ? 'Chrome' : 'ChromeHeadless'];
    }
  }

  function configureFormatError(conf) {
    conf.formatError = (msg) => {
      // This is a bazel specific formatError that removes the workspace
      // name from stack traces.
      // Look for filenames of the format "(<filename>:<row>:<column>"
      const FILENAME_REGEX = /\(([^:]+)(:\d+:\d+)/gm;
      msg = msg.replace(FILENAME_REGEX, (_, p1, p2) => {
        if (p1.startsWith('../')) {
          // Remove all leading "../"
          while (p1.startsWith('../')) {
            p1 = p1.substr(3);
          }
        } else {
          // Remove workspace name(angular, ngdeps etc.) from the beginning.
          const index = p1.indexOf('/');
          if (index >= 0) {
            p1 = p1.substr(index + 1);
          }
        }
        return '(' + p1 + p2;
      });
      return msg + '\n\n';
    };
  }

  module.exports = function(config) {
    let conf = {};

    // Import the user's base karma configuration if specified
    if (configPath) {
      const baseConf = require(configPath);
      if (typeof baseConf !== 'function') {
        throw new Error(
            'Invalid base karma configuration. Expected config function to be exported.');
      }
      const originalSetConfig = config.set;
      config.set = function(c) {
        conf = c;
      };
      baseConf(config);
      config.set = originalSetConfig;
      if (DEBUG) console.info(`Base karma configuration: ${JSON.stringify(conf, null, 2)}`);
    }

    configureBazelConfig(config, conf);
    configureFiles(conf);
    configureTsWebTestSuiteConfig(conf);
    configureTsWebTestConfig(conf);
    configureFormatError(conf);

    if (DEBUG) console.info(`Karma configuration: ${JSON.stringify(conf, null, 2)}`);

    config.set(conf);
  }
} catch (e) {
  console.error('Error in karma configuration', e.toString());
  throw e;
}
