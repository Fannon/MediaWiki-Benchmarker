/*jshint jquery: true, devel: true */
/*global dc, d3, crossfilter, colorbrewer, ss */

///////////////////////////////////////////////////
// MediaWiki Benchmark Script                    //
///////////////////////////////////////////////////
// 2015 by Simon Heimler                         //
// https://github.com/Fannon/MediaWiki-Benchmark //
///////////////////////////////////////////////////

var mwb = {}; // Global Namespace


//////////////////////////////
// Options                  //
//////////////////////////////

/**
 * Default Options
 * @type {Object}
 */
mwb.options = {
    mediaWikiUrl: 'http://semwiki-exp01.multimedia.hs-augsburg.de/ba-wiki',
    iterations: 5,
    minRandom: 100,
    maxRandom: 200
};


//////////////////////////////
// Startup                  //
//////////////////////////////

$(function() {
    'use strict';

    mwb.resetAll();

    mwb.benchmarkPage('Hauptseite', function() {

    })

});


//////////////////////////////////////////
// CORE FUNCTIONS                       //
//////////////////////////////////////////

/**
 * Resets the state of the tool
 */
mwb.resetAll = function() {
    "use strict";

    mwb.resetIteration();

    /** Benchmarks */
    mwb.benchmarks = [];
    mwb.benchmark = 0;

    /** Data */
    mwb.dataArray = []; // 2-dim array
    mwb.dataObject = []; // For d3plus
    mwb.dataTable = [];  // For dynatable
    mwb.analysisObject = {};

    // Reset Interface
    $('#chart').html('');

};

mwb.resetIteration = function() {

    mwb.warningSent = false;

    /** Timer, in ms */
    mwb.timer = 0;

    /** Iterations */
    mwb.currentIteration = 0;
    mwb.totalIterations = 0;

    // Reset Interface
    $('#progress-bar').attr("aria-valuenow", 0).css('width', 0 + '%').text(0 + '%');
    $('#progress').show();

};


mwb.benchmarkPage = function(pageName, callback) {

    console.log('Benchmarking: ' + pageName);

    mwb.resetIteration();

    mwb.analysisObject.benchmarkStartUnix = Math.floor(new Date().getTime() / 1000);
    mwb.analysisObject.benchmarkStartFormatted = mwb.getFormattedTime();

    mwb.timer = 0;
    mwb.totalIterations = mwb.options.iterations;
    mwb.benchmark += 1;

    // Set Benchmark Run title
    mwb.currentTitle = pageName + '-' + mwb.benchmark;
    mwb.benchmarks.push(mwb.currentTitle);
    // Add the title as the first row item
    mwb.dataArray[mwb.benchmark - 1] = [mwb.currentTitle];

    for (var i = 0; i < mwb.totalIterations; i++) {

        setTimeout(function() {

            mwb.fetchPage(pageName, function(err, data, time) {

                if (!err) {

                    console.log('Iteration ' + mwb.currentIteration + ' in ' + time + 'ms');

                    mwb.dataArray[mwb.benchmark - 1].push(time);

                    mwb.dataObject.push({
                        benchmark: mwb.currentTitle,
                        run: mwb.currentIteration + 1,
                        time: time
                    });

                    if (!mwb.dataTable[mwb.currentIteration]) {
                        mwb.dataTable[mwb.currentIteration] = {};
                    }

                    mwb.dataTable[mwb.currentIteration][mwb.currentTitle] = time;


                    // mwb.progress Bar
                    mwb.currentIteration += 1;
                    var percent = mwb.currentIteration / mwb.totalIterations * 100;
                    $('#progress-bar')
                        .attr("aria-valuenow", percent)
                        .css('width', percent + '%')
                        .text(percent + '%');

                    if (mwb.currentIteration === mwb.totalIterations) {
                        console.log('Completed Benchmark on ' + mwb.currentTitle);

                        $('#progress').hide();
                        mwb.drawChart();
                        mwb.drawData();

                        if (callback) {
                            return callback(false); // No Error
                        }

                    }
                }
            });

        }, mwb.timer);

        mwb.timer += Math.floor(Math.random() * (mwb.options.maxRandom - mwb.options.minRandom) + mwb.options.minRandom);

    }

    return true;

};


mwb.fetchPage = function(pageName, callback) {

    var now = (new Date()).getTime();

    $.getJSON(mwb.options.mediaWikiUrl + '/api.php?callback=?', {
        action: 'parse',
        page: pageName,
        format: 'json'
    }, function(data) {

        var time = (new Date().getTime()) - now;

        if (data.error) {
            mwb.log('API ERROR: "' + data.error.code + '" - ' + data.error.info);
            console.error(data.error);
            console.dir(data);
            return callback(data.error, false, time);
        }

        if (time > mwb.options.minRandom && !mwb.warningSent) {
            var msg = 'Warning: The MediaWiki Installation could be responding slower than the Browser is requesting the pages!<br>';
            msg += 'This can lead to added up benchmark results which are caused by the connection Limit of the Browser. <a href="img/ConnectionQueueWarning.png" target="_blank">Example</a>)<br>';
            msg += 'To avoid this increase the Minimum Random Intervall so that it is higher than the expected Response time.';
            mwb.log(msg);
            mwb.warningSent = true;
        }

        return callback(false, data, time);

    });

};


mwb.drawChart = function() {

    console.log('Drawing Charts');

    data = mwb.dataObject;

    // Bar Chart
    mwb.barChart = d3plus.viz()
        .container("#bar-chart")
        .data(data)
        .type('bar')
        .id('run')
        .x({
            value: 'benchmark',
            label: false
        })
        .y('time')
        .color('benchmark')
        .timing({
            transitions: 0
        })
        .draw();

    // Box Plot Chart
    mwb.boxPlotChart = d3plus.viz()
        .container("#boxplot-chart")
        .data(data)
        .type('box')
        .id('run')
        .x({
            value: 'benchmark',
            label: false
        })
        .y({
            value: 'time',
            label: 'TEST'
        })
        .timing({
            transitions: 0
        })
        .draw();

};



/**
 * Analyzes the Data and generates a summary table
 * Puts the raw Data to download formats
 *
 * Uses http://macwright.org/simple-statistics/ for Statistical Analysis
 */
mwb.drawData = function() {
    "use strict";

    console.log('Analyzing Data');

    $('#progress-row').hide();

    // Analyze Data & draw the Table
    var html = '';


    for (var i = 0; i < mwb.dataArray.length; i++) {
        // Deep Copy of array
        var column = JSON.parse(JSON.stringify(mwb.dataArray[i]));
        var title = column.shift(); // Remove Column title

        var analysis = {
            avg: ss.average(column),
            min: ss.min(column),
            max: ss.max(column),
            standard_deviation: Math.round(ss.standard_deviation(column) * 100) / 100
        };

        mwb.analysisObject[title] = analysis;

        html += '<tr><td>' + title + '</td><td>' + analysis.avg + '</td><td>' + analysis.min + '</td><td>';
        html += analysis.max + '</td><td>' + analysis.standard_deviation + '</td></tr>';

    }

    console.log(mwb.analysisObject);

    //$.each(mwb.dataObject.data, function (key, value) {
    //
    //    console.log(key + ' : ' + value);
    //
    //    var row = mwb.dataObject.data[key];
    //
    //    var analysis = {};
    //
    //    analysis.avg = ss.average(row);
    //    analysis.min = ss.min(row);
    //    analysis.max = ss.max(row);
    //    analysis.standard_deviation = Math.round(ss.standard_deviation(row) * 100) / 100;
    //
    //    console.log(ss.average(row));
    //
    //    console.dir(analysis);
    //
    //    html += '<tr><td>' + key + '</td><td>' + analysis.avg + '</td><td>' + analysis.min + '</td><td>';
    //    html += analysis.max + '</td><td>' + analysis.standard_deviation + '</td></tr>';
    //
    //    mwb.dataObject.analysis[key] = analysis;
    //
    //});

    $('#data-tbody').html(html);
    console.dir(mwb.dataObject);

    // JSON Export: mwb.dataArray
    var jsonExport = $('#jsonExport');
    jsonExport.removeAttr("disabled");
    var json = {
        array: mwb.dataArray,
        object: mwb.dataTable,
        analysis: mwb.analysisObject,
        options: mwb.options
    };
    jsonExport.attr('href', ('data:text/json;base64,' + btoa(JSON.stringify(json, false, 4))));
    jsonExport.attr("download", mwb.getFormattedTime() + ".json");

    // CSV Export
    var csvExport = $('#csvExport');
    csvExport.attr("href", 'data:text/csv;base64,' + btoa(mwb.convertToCSV(mwb.dataArray)));
    csvExport.attr("download", mwb.getFormattedTime() + ".csv");
    csvExport.removeAttr("disabled");

    // SVG Export
    var svgExportBarChart = $('#svgExportBarChart');
    setTimeout(function() {
        svgExportBarChart.attr("href", 'data:text/svg;base64,' + btoa($('#bar-chart svg').prop('outerHTML')));
        svgExportBarChart.attr("download", mwb.getFormattedTime() + "_BarChart.svg");
        svgExportBarChart.removeAttr("disabled");
    }, 200);


    // SVG Export
    var svgExportBoxPlot = $('#svgExportBoxPlotChart');
    setTimeout(function() {
        svgExportBoxPlot.attr("href", 'data:text/svg;base64,' + btoa($('#boxplot-chart svg').prop('outerHTML')));
        svgExportBoxPlot.attr("download", mwb.getFormattedTime() + "_BoxPlot.svg");
        svgExportBoxPlot.removeAttr("disabled");
    }, 200);

};


mwb.getOptions = function() {
    // Get current Form Values
    mwb.options.mediaWikiUrl = $('#mediaWikiUrl').val();
    mwb.options.maxCounter = parseInt($('#maxCounter').val(), 10);
    mwb.options.minRandom = parseInt($('#minRandom').val(), 10);
    mwb.options.maxRandom = parseInt($('#maxRandom').val(), 10);
    mwb.options.purgeInterval = parseInt($('#purgeInterval').val(), 10);
    mwb.options.notes = $('#notes').val();

    if (!mwb.options.purgeInterval || mwb.options.purgeInterval === 0) {
        mwb.options.purgePages = false;
    }
};


/**
 * Purges a Page (Removes Caching) after a given time interval
 *
 * @param  {String} page            Page to benchmark
 * @param  {Number} currentCounter
 * @param  {Number} currentInterval
 */
mwb.purgePage = function(page, currentCounter, currentInterval) {
    "use strict";

    setTimeout(function() {

        var now = new Date().getTime();

        $.post(mwb.options.mediaWikiUrl + '/api.php?callback=?', {
            action: 'purge',
            page: page,
            format: 'json'
        }, function(data) {

            if (data.error) {
                mwb.log('API ERROR: "' + data.error.code + '" - ' + data.error.info);
                console.dir(data);
                return false;
            }

            var then = new Date().getTime();
            var time = then - now;

            console.info('[' + currentCounter + '] Page ' + page + ' purged in ' + time + 'ms.');

            return true;

        });

    }, currentInterval);

    return true;

};


//////////////////////////////////////////
// DRAWING FUNCTIONS                    //
//////////////////////////////////////////


//////////////////////////////
// Helper Functions         //
//////////////////////////////

/**
 *  Converts an Array to a (Excel compatible) CSV String
 *
 * Adapted from:
 * http://stackoverflow.com/questions/11257062/converting-json-object-to-csv-format-in-javascript
 * @param  {Array}  dataArray Input Array
 * @return {String}          CSV String
 */
mwb.convertToCSV = function(dataArray) {
    "use strict";

    var array = typeof dataArray !== 'object' ? JSON.parse(dataArray) : dataArray;
    var str = '';

    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {

            if (array[i].hasOwnProperty(index)) {
                if (line !== '') {
                    line += ';';
                }

                line += array[i][index];
            }
        }

        str += line + '\r\n';
    }

    return str;
};

/**
 * Pads a Number
 * @param n             Number to Pad
 * @returns {string}    Padded Number
 */
mwb.pad = function(n) {
    "use strict";
    return n < 10 ? '0' + n : n;
};

/**
 * Write a Message to the Message Div
 * @param msg
 */
mwb.log = function(msg) {
    "use strict";

    var currentdate = new Date();
    var time = mwb.pad(currentdate.getHours()) + ":" + mwb.pad(currentdate.getMinutes()) + ":" + mwb.pad(currentdate.getSeconds());
    $('#msg').append('<div class="alert alert-warning"><a class="close" data-dismiss="alert" href="#" aria-hidden="true">&times;</a>[' + time + '] ' + msg + '</div>');
    //$(".alert").alert();
};

/**
 * Returns a DateString
 * @return {String}           [description]
 */
mwb.getFormattedTime = function() {
    "use strict";

    var a = new Date();

    var year = a.getFullYear();
    var month = mwb.pad(a.getMonth() + 1);
    var date = mwb.pad(a.getDate());
    var hour = mwb.pad(a.getHours());
    var min = mwb.pad(a.getMinutes());
    var sec = mwb.pad(a.getSeconds());

    return year + '-' + month + '-' + date + '_-_' + hour + ':' + min + ':' + sec;
};
