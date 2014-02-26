var os = require('os');
var path = require('path');
var fs = require('fs');
var colors = require('colors');
var resultObj = {};
var browsersList = {};


var BenchmarkJasmineReporter = function(baseReporterDecorator, config, logger, helper, formatError) {
  var reporterConfig = config.jasminebenchmarkReporter || {};
  var outputFile = helper.normalizeWinPath(path.resolve(config.basePath, reporterConfig.outputFile
      || 'test-results.json'));

  
  baseReporterDecorator(this);

  
  this.onRunStart = function(browsers) {
    browsers.forEach(function(browser) {
      browsersList[browser.id] = browser;
    });
  };

  this.onBrowserError = function(browser, error) {
    console.log(error.red);
  };

  this.onRunComplete = function() {
    for (var suite in resultObj){
      var suiteObj = resultObj[suite];
      for (var spec in suiteObj) {
        var specResult = suiteObj[spec];
        var specResultMessage = '',
            suiteHeader = suite + spec;

        console.log(suiteHeader.cyan);
        console.log('-------------------------------------------------------------------------------------\n'+
          'Test case                               Time taken(s)                       op/sec         \n'.yellow+
          '-------------------------------------------------------------------------------------');
        for(var browser in specResult) {
          var browserSpecResult = specResult[browser];
          specResultMessage = browsersList[browser].name + '              ' + browserSpecResult.time+ '          ' + browserSpecResult.hz;
          if (browserSpecResult.success){
            console.log(specResultMessage.green);
          }
          else {
            console.log(specResultMessage.red);
          }
        }
        console.log('-------------------------------------------------------------------------------------\n')
      }
    }
    fs.writeFileSync(outputFile, JSON.stringify(resultObj, null, 4))
  };

  this.specSuccess = this.specSkipped = this.specFailure = function(browser, result) {
    if (!resultObj[result.suite]) {
      resultObj[result.suite] = {};
    }
    if(!resultObj[result.suite][result.description]) {
      resultObj[result.suite][result.description] = {};
    }
    resultObj[result.suite][result.description][browser.id] = {
      success:result.success,
      time:result.time,
      hz:result.hz,
      skipped: result.skipped
    };

  };
};

BenchmarkJasmineReporter.$inject = ['baseReporterDecorator', 'config', 'logger', 'helper', 'formatError'];

// PUBLISH DI MODULE
module.exports = {
  'reporter:benchmarkjasmine': ['type', BenchmarkJasmineReporter]
};
