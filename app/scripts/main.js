/*jshint jquery: true, devel: true, loopfunc: true */
/*global d3plus */

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
    previewModulo: 3
};


//////////////////////////////
// Startup                  //
//////////////////////////////

$(function() {
    'use strict';

    // Enable Tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // Reset / Init Interface
    mwb.resetAll();

    // Register Button Events
    $('#reset').on('click', function(e) {
        e.preventDefault();
        mwb.resetAll();
        return false;
    });

    $('#startBenchmark').on('click', function(e) {
        e.preventDefault();
        mwb.getOptions();
        mwb.benchmarkPage(mwb.options.pageName);
        return false;
    });

});


//////////////////////////////////////////
// CORE FUNCTIONS                       //
//////////////////////////////////////////

/**
 * Resets the complete state of the application
 */
mwb.resetAll = function() {
    'use strict';

    mwb.resetIteration();

    /** Benchmarks */
    mwb.benchmarks = [];
    mwb.benchmark = 0;

    /** Data */
    mwb.dataArray = []; // 2-dim array
    mwb.dataObject = []; // For d3plus
    mwb.analysisObject = {};

    // Read Options from Form
    mwb.getOptions();

    // Reset Interface
    $('#messages').html('');
    $('#bar-chart').html('');
    $('#boxplot-chart').html('');
    $('#data-tbody').html('');

};

/**
 * Resets the state between benchmarks
 */
mwb.resetIteration = function() {
    'use strict';

    mwb.warningSent = false;

    /** Timer, in ms */
    mwb.timer = 0;

    /** Iterations */
    mwb.currentIteration = 0;
    mwb.totalIterations = 0;

    // Reset Interface
    $('#progress-bar').attr('aria-valuenow', 0).css('width', 0 + '%').text('');

};

/**
 * Read options from the UI / forms
 */
mwb.getOptions = function() {
    'use strict';

    // Get current Form Values
    mwb.options.mediaWikiUrl = $('#mediaWikiUrl').val();
    mwb.options.pageName = $('#pageName').val();

    mwb.options.iterations = parseInt($('#iterations').val(), 10);
    mwb.options.minRandom = parseInt($('#minRandom').val(), 10);
    mwb.options.maxRandom = parseInt($('#maxRandom').val(), 10);
};

/**
 * Repeatedly benchmarks a wiki page, using the given number of iterations
 *
 * @param pageName
 */
mwb.benchmarkPage = function(pageName) {
    'use strict';

    console.log('Benchmarking: ' + pageName);

    mwb.resetIteration();

    mwb.startTime = new Date().getTime();
    mwb.analysisObject.benchmarkStartUnix = Math.floor(new Date().getTime() / 1000);
    mwb.analysisObject.benchmarkStartFormatted = mwb.getFormattedTime();

    mwb.timer = 0;
    mwb.totalIterations = mwb.options.iterations;
    mwb.benchmark += 1;

    // Set Benchmark Run title
    mwb.currentTitle = '#' + mwb.benchmark + ' ' + pageName;
    mwb.benchmarks.push(mwb.currentTitle);
    // Add the title as the first row item
    mwb.dataArray[mwb.benchmark - 1] = [mwb.currentTitle];

    for (var i = 0; i < mwb.totalIterations; i++) {

        setTimeout(function() {

            mwb.fetchPage(pageName, mwb.onPageFetch);

        }, mwb.timer);

        mwb.timer += Math.floor(Math.random() * (mwb.options.maxRandom - mwb.options.minRandom) + mwb.options.minRandom);

    }

};

/**
 * Fetches a page from the wiki through AJAY and measures the time needed
 * Handles errors that may occur
 *
 * @param pageName
 * @param callback
 */
mwb.fetchPage = function(pageName, callback) {
    'use strict';

    var now = (new Date()).getTime();

    var request = $.getJSON(mwb.options.mediaWikiUrl + '?callback=?', {
        action: 'parse',
        page: pageName,
        format: 'json'
    });

    request.done(function(data) {
        var time = (new Date().getTime()) - now;

        // If the request succeeds but the MediaWiki API returns an error:
        if (data.error) {
            mwb.log('<strong>MediaWiki API:</strong> "' + data.error.code + '" - ' + data.error.info + ' (See Console)');
            console.error(data);
            return callback(data.error, false, time);
        }

        return callback(false, data, time);
    });

    // API request failed:
    request.fail(function(e) {
        var time = (new Date().getTime()) - now;
        console.error(e);
        mwb.log('<strong>AJAX Request:</strong> Status "' + e.status + '" - ' + e.statusText + ' (See Console)');
        return callback(e, false, time);
    });

};


/**
 * Callback Function on Page fetched
 * Writes the measured time to the data and triggers the chart / data output if done
 *
 * @param err
 * @param data
 * @param time
 * @returns {*|{accepted, value}}
 */
mwb.onPageFetch = function(err, data, time) {
    'use strict';

    if (!err) {

        console.log('Iteration ' + mwb.currentIteration + ' in ' + time + 'ms');

        mwb.dataArray[mwb.benchmark - 1].push(time);

        mwb.dataObject.push({
            benchmark: mwb.currentTitle,
            run: mwb.currentIteration + 1,
            time: time
        });

        // mwb.progress Bar
        mwb.currentIteration += 1;
        var percent = Math.round(mwb.currentIteration / mwb.totalIterations * 100);
        $('#progress-bar')
            .attr('aria-valuenow', percent)
            .css('width', percent + '%')
            .text(percent + '% (' + time + 'ms)');


        // If all iterations have run, complete the benchmark run
        if (mwb.currentIteration === mwb.totalIterations) {
            var totalTime = (new Date().getTime()) - mwb.startTime;

            mwb.drawChart();
            mwb.drawData();

            console.log('Completed Benchmark in ' + totalTime + 'ms on ' + mwb.currentTitle);

        // Preview every n-th iteration
        } else if (mwb.currentIteration % mwb.options.previewModulo === 0) {


            mwb.drawChart();
        }
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
    'use strict';

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

mwb.drawChart = function() {
    'use strict';

    console.log('Drawing Charts');

    $('#bar-chart').html('');
    $('#boxplot-chart').html('');

    var data = mwb.dataObject;

    // Bar Chart
    mwb.barChart = d3plus.viz()
        .container('#bar-chart')
        .data(data)
        .type('bar')
        .id('run')
        .x({
            value: 'benchmark',
            label: false
        })
        .y('time')
        .height(236)
        .color('benchmark')
        .timing({
            transitions: 0
        })
        .draw();

    // Box Plot Chart
    mwb.boxPlotChart = d3plus.viz()
        .container('#boxplot-chart')
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
 */
mwb.drawData = function() {
    'use strict';

    console.log('Analyzing Data');

    // Analyze Data & draw the Table
    var html = '';


    for (var i = 0; i < mwb.dataArray.length; i++) {
        // Deep Copy of array
        var column = JSON.parse(JSON.stringify(mwb.dataArray[i]));
        var title = column.shift(); // Remove Column title

        var sum = column.reduce(function(a, b) { return a + b; });

        var analysis = {
            avg: Math.round(sum / column.length * 100) / 100,
            min: Math.min.apply(Math, column),
            max:  Math.max.apply(Math, column)
        };

        mwb.analysisObject[title] = analysis;

        html += '<tr><td>' + title + '</td>';
        html += '<td>' + analysis.avg + '</td>';
        html += '<td>' + analysis.min + '</td>';
        html += '<td>' + analysis.max + '</td></tr>';

    }

    $('#data-tbody').html(html);

    // JSON Export: mwb.dataArray
    var jsonExport = $('#jsonExport');
    jsonExport.removeAttr('disabled');
    var json = {
        array: mwb.dataArray,
        object: mwb.dataObject,
        analysis: mwb.analysisObject,
        options: mwb.options
    };
    jsonExport.attr('href', ('data:text/json;base64,' + btoa(JSON.stringify(json, false, 4))));
    jsonExport.attr('download', mwb.getFormattedTime() + '.json');

    // CSV Export
    var csvExport = $('#csvExport');
    csvExport.attr('href', 'data:text/csv;base64,' + btoa(mwb.convertToCSV(mwb.dataArray)));
    csvExport.attr('download', mwb.getFormattedTime() + '.csv');
    csvExport.removeAttr('disabled');

    // Bar Chart SVG Export
    var svgExportBarChart = $('#svgExportBarChart');
    setTimeout(function() {
        svgExportBarChart.attr('href', 'data:text/svg;base64,' + btoa($('#bar-chart svg').prop('outerHTML')));
        svgExportBarChart.attr('download', mwb.getFormattedTime() + '_BarChart.svg');
        svgExportBarChart.removeAttr('disabled');
    }, 200);

    // Box Plot SVG Export
    var svgExportBoxPlot = $('#svgExportBoxPlotChart');
    setTimeout(function() {
        svgExportBoxPlot.attr('href', 'data:text/svg;base64,' + btoa($('#boxplot-chart svg').prop('outerHTML')));
        svgExportBoxPlot.attr('download', mwb.getFormattedTime() + '_BoxPlot.svg');
        svgExportBoxPlot.removeAttr('disabled');
    }, 200);

};

//////////////////////////////
// Helper Functions         //
//////////////////////////////


/**
 * Outputs a (warning) message to the UI
 *
 * @param msg
 */
mwb.log = function(msg) {
    'use strict';

    var currentdate = new Date();
    var time = mwb.pad(currentdate.getHours()) + ':' + mwb.pad(currentdate.getMinutes()) + ':' + mwb.pad(currentdate.getSeconds());

    var html = '<div class="alert alert-warning alert-dismissible" role="alert">';
    html += '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
    html += '[' + time + '] ' + msg + '</div>';

    $('#messages').append(html);
    $('.alert').alert();
};


/**
 * Converts an Array to a (Excel compatible) CSV String
 *
 * @see http://stackoverflow.com/questions/11257062/converting-json-object-to-csv-format-in-javascript
 *
 * @param  {Array}  dataArray Input Array
 * @return {String}          CSV String
 */
mwb.convertToCSV = function(dataArray) {
    'use strict';

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
 *
 * @param n             Number to Pad
 * @returns {string}    Padded Number
 */
mwb.pad = function(n) {
    'use strict';
    return n < 10 ? '0' + n : n;
};


/**
 * Returns a formatted DateString: YYYY-MM-DD_-_HH:MM_SS
 *
 * @return {String}           [description]
 */
mwb.getFormattedTime = function() {
    'use strict';

    var a = new Date();

    var year = a.getFullYear();
    var month = mwb.pad(a.getMonth() + 1);
    var date = mwb.pad(a.getDate());
    var hour = mwb.pad(a.getHours());
    var min = mwb.pad(a.getMinutes());
    var sec = mwb.pad(a.getSeconds());

    return year + '-' + month + '-' + date + '_-_' + hour + ':' + min + ':' + sec;
};
