var os = require('os');
var path = require('path');
var fs = require('fs');
var colors = require('colors');
var resultObj = {};
var browsersList = {};
var Table = require('cli-table');


var BenchmarkJasmineReporter = function(baseReporterDecorator, config, logger, helper, formatError) {
  var reporterConfig = config.benchmarkjasmineReporter || {};
  var outputFile,
  browserListFile;

  var outputFolder  = helper.normalizeWinPath(path.resolve(config.basePath, reporterConfig.outputFolder));

  outputFile = outputFolder ? outputFolder + '/test-results.json' : 'test-results.json';
  browserListFile = outputFolder ? outputFolder + '/browser-list.json' : 'browser-list.json';

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
        var table = new Table({
          head:['Browser name', 'Time taken in sec', 'Operations/sec'],
          colWidths: [50,25,25]
        });
        for(var browser in specResult) {
          var browserSpecResult = specResult[browser];
          table.push([browsersList[browser].name, browserSpecResult.time, browserSpecResult.hz]);
        }
        console.log(table.toString());
      }
    }
    helper.mkdirIfNotExists(path.dirname(outputFile), function() {
      fs.writeFileSync(outputFile, JSON.stringify(resultObj, null, 4));
      fs.writeFileSync(browserListFile, JSON.stringify(browsersList, null, 4));
    });
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
