var os = require('os');
var path = require('path');
var fs = require('fs');
var colors = require('colors');
var resultObj = {};
var browsersList = {};
var Table = require('cli-table'),
    browserCount = 0;


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
      browserCount++;
    });
  };

  this.onBrowserError = function(browser, error) {
    console.log(browser.name.cyan + ' ' +error.red);
  };

  this.onRunComplete = function() {
    var avgTime,avgHz,
        suite,
        spec,
        suiteObj,
        specResult,
        specResultMessage,
        suiteHeader,
        table,
        browser,
        browserSpecResult;
    for (suite in resultObj){
      suiteObj = resultObj[suite];
      for (spec in suiteObj) {
        specResult = suiteObj[spec];
        specResultMessage = '';
        suiteHeader = suite + spec;
        avgTime = 0;
        avgHz = 0;
        console.log(suiteHeader.cyan);
        table = new Table({
          head:['Browser name', 'Time taken in sec', 'Operations/sec'],
          colWidths: [50,25,25]
        });
        for(browser in specResult) {
          browserSpecResult = specResult[browser];
          table.push([browsersList[browser].name, browserSpecResult.time, browserSpecResult.hz]);
          avgTime += browserSpecResult.time;
          avgHz += browserSpecResult.hz;
        }
        table.push(['Average Time', avgTime/browserCount, avgHz/browserCount]);
        console.log(table.toString());
        specResult['average_time'] = {
          time: avgTime/browserCount,
          hz: avgHz/browserCount
        };
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
