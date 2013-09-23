/*jshint jquery: true, devel: true */
/*global google, ss */

///////////////////////////////////////////////////
// MediaWiki Benchmark Script                    //
///////////////////////////////////////////////////
// 2013 by Simon Heimler                         //
// https://github.com/Fannon/MediaWiki-Benchmark //
///////////////////////////////////////////////////

var mwb = {}; // Global Namespace


//////////////////////////////
// Options                  //
//////////////////////////////

mwb.options = {
    mediaWikiUrl: 'http://localhost/wiki/',
    maxCounter: 5,
    minRandom: 3000,
    maxRandom: 5000,

    purgePages: false,
    purgeInterval: 300
};


//////////////////////////////
// State                    //
//////////////////////////////

mwb.warningSent = false;
mwb.currentInterval = 0;
mwb.currentCounter = 0;
mwb.progress = 0;
mwb.progressTotal = 0;

mwb.dataArray = [];
mwb.dataObject = {
    data: {},
    analysis: {},
    timer: {}
};


//////////////////////////////
// Startup                  //
//////////////////////////////

google.load("visualization", "1", {packages: ["corechart"]});

/**
 * Resets the state of the tool
 */
mwb.reset = function () {
    "use strict";

    console.log('Resetting');

    // Reset Variables / Data
    mwb.dataArray = [
        []
    ]; // 2 Dim Array
    mwb.dataObject = {
        data: {},
        analysis: {},
        timer: {}
    };
    mwb.progress = 0;
    mwb.currentCounter = 0;
    mwb.currentInterval = 0;
    mwb.warningSent = false;

    // Reset Interface
    $('#progress').attr("aria-valuenow", 0).css('width', 0 + '%');
    $('#chart_div').html('');
    $('#data-tbody').html('');
};

$(function () {
    "use strict";
    console.log('MediaWiki Benchmark Script ready!');
    $('#mediaWikiUrl').val(mwb.options.mediaWikiUrl);
    $('#maxCounter').val(mwb.options.maxCounter);
    $('#minRandom').val(mwb.options.minRandom);
    $('#maxRandom').val(mwb.options.maxRandom);
    $('#purgeInterval').val(mwb.options.purgeInterval);
});


//////////////////////////////
// Benchmarking Functions   //
//////////////////////////////

/**
 * Prepares and launches the Benchmark
 */
mwb.runBenchmark = function () {
    "use strict";

    console.log('STARTING A NEW BENCHMARK');

    // Reset mwb.currentCounter
    mwb.reset();

    mwb.dataObject.timer.benchmarkStart = new Date().getTime() / 1000;

    // Get Pages Input
    var pages = $('#pages').val();
    if (!pages || pages === '') {
        return false;
    }
    pages = pages.split(', ');

    // Get current Form Values
    mwb.options.mediaWikiUrl = $('#mediaWikiUrl').val();
    mwb.options.maxCounter = parseInt($('#maxCounter').val(), 10);
    mwb.options.minRandom = parseInt($('#minRandom').val(), 10);
    mwb.options.maxRandom = parseInt($('#maxRandom').val(), 10);
    mwb.options.purgeInterval = parseInt($('#purgeInterval').val(), 10);
    mwb.options.purgePages = $('#purgePages').prop('checked');

    mwb.progressTotal = mwb.options.maxCounter * pages.length;

    // Dump current Settings to dataObject
    mwb.dataObject.options = mwb.options;

    mwb.dataArray[0][0] = 'Iteration';

    for (var i = 0; i < pages.length; i++) {
        mwb.dataArray[0].push(pages[i]);
        mwb.dataObject.data[pages[i]] = [];
        mwb.dataObject.analysis[pages[i]] = {};
        mwb.dataObject.timer[pages[i]] = {};
    }

    // Iterate mwb.currentCounter
    for (mwb.currentCounter = 1; mwb.currentCounter <= mwb.options.maxCounter; mwb.currentCounter++) {

        mwb.dataArray[mwb.currentCounter] = [];
        mwb.dataArray[mwb.currentCounter].push(mwb.currentCounter);

        // Iterate Pages
        for (var j = 0; j < pages.length; j++) {

            mwb.currentInterval += Math.floor(Math.random() * (mwb.options.maxRandom - mwb.options.minRandom) + mwb.options.minRandom);
            var page = pages[j];
            console.log('Benchmarking ' + page + ' after interval ' + mwb.currentInterval + ' Count: ' + mwb.currentCounter);

            // If Option "Purge Pages" is set: Add another Delay to the interval and purge the page
            if (mwb.options.purgePages) {
                mwb.purgePage(page, mwb.currentCounter, mwb.currentInterval);
                mwb.currentInterval += mwb.options.purgeInterval;
            }

            mwb.benchmarkPage(page, mwb.currentCounter, mwb.currentInterval);

        }
    }
    return true;
};


/**
 * Benchmarks a Page after a given time interval
 *
 * @param  {String} page            Page to benchmark
 * @param  {Number} currentCounter
 * @param  {Number} currentInterval
 */
mwb.benchmarkPage = function(page, currentCounter, currentInterval) {
    "use strict";

    setTimeout(function () {

        var now = new Date().getTime();

        $.getJSON(mwb.options.mediaWikiUrl + '/api.php?callback=?', {
            action: 'parse',
            page: page,
            format: 'json'
        }, function (data) {

            if (data.error) {
                mwb.log('API ERROR: "' + data.error.code + '" - ' + data.error.info);
                console.dir(data);
                return false;
            }

            // TODO: Warnung wenn Intervall deutlich unter Response Time liegt -> Browser delayt Requests!

            var then = new Date().getTime();
            var time = then - now;

            console.log('[' + currentCounter + '] Page ' + page + ' loaded in ' + time + 'ms.');

            mwb.dataArray[currentCounter].push(time);
            mwb.dataObject.data[page].push(time);

            // mwb.progress Bar
            mwb.progress += 1;
            var percent = mwb.progress / mwb.progressTotal * 100;
            $('#progress').attr("aria-valuenow", percent).css('width', percent + '%');

            // If completed, draw Chart
            if (percent >= 100) {
                mwb.dataObject.timer.benchmarkEnd = new Date().getTime() / 1000;
                mwb.drawChart();
                mwb.drawData();
            }

            if (time > mwb.options.minRandom && !mwb.warningSent) {
                var msg = 'Warning: Server could be responding slower than the Browser is requesting the pages!<br>';
                msg += 'This can lead to added up benchmark results which are caused by the connection Limit of the Browser. <a href="img/ConnectionQueueWarning.png" target="_blank">Example</a>)<br>';
                msg += 'To avoid this increase the Minimum Random Intervall higher than the expected Response time.';
                mwb.log(msg);
                mwb.warningSent = true;
            }

            return true;

        });

    }, currentInterval);

    return true;

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

    setTimeout(function () {

        var now = new Date().getTime();

        $.post(mwb.options.mediaWikiUrl + '/api.php?callback=?', {
            action: 'purge',
            page: page,
            format: 'json'
        }, function (data) {

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

/**
 * Analyzes the Data and generates a summary table
 * Puts the raw Data to download formats
 *
 * Uses http://macwright.org/simple-statistics/ for Statistical Analysis
 */
mwb.drawData = function() {
    "use strict";


    console.log('Analyzing Data');

    // Analyze Data & draw the Table
    var html = '';

    $.each(mwb.dataObject.data, function (key, value) {

        console.log(key + ' : ' + value);

        var row = mwb.dataObject.data[key];

        var analysis = {};

        analysis.avg = ss.average(row);
        analysis.min = ss.min(row);
        analysis.max = ss.max(row);
        analysis.standard_deviation = Math.round(ss.standard_deviation(row) * 100) / 100;

        console.log(ss.average(row));

        console.dir(analysis);

        html += '<tr><td>' + key + '</td><td>' + analysis.avg + '</td><td>' + analysis.min + '</td><td>';
        html += analysis.max + '</td><td>' + analysis.standard_deviation + '</td></tr>';

        mwb.dataObject.analysis[key] = analysis;

    });

    $('#data-tbody').html(html);
    console.dir(mwb.dataObject);

    // JSON Export: mwb.dataArray
    var jsonExport = $('#jsonExport');
    jsonExport.removeAttr("disabled");
    jsonExport.attr('href', ('data:text/json;base64,' + btoa(JSON.stringify(mwb.dataArray))));
    jsonExport.attr("download", mwb.getFormattedTime() + "_ArrayData.json");


    // JSON Export: mwb.dataObject
    var jsonExportAlt = $('#jsonExportAlt');
    jsonExportAlt.removeAttr("disabled");
    jsonExportAlt.attr('href', ('data:text/json;base64,' + btoa(JSON.stringify(mwb.dataObject))));
    jsonExportAlt.attr("download", mwb.getFormattedTime() + "_ObjectData.json");


    // CSV Export
    var csvExport = $('#csvExport');
    csvExport.removeAttr("disabled");
    csvExport.attr("href", 'data:text/csv;base64,' + btoa(mwb.convertToCSV(mwb.dataArray)));
    csvExport.attr("download", mwb.getFormattedTime() + "_TableData.csv");

    // SVG Export
    var svgExport = $('#svgExport');
    svgExport.removeAttr("disabled");
    svgExport.attr("href", 'data:text/svg;base64,' + btoa($('#chart_div div div').html()));
    svgExport.attr("download", mwb.getFormattedTime() + "_Graph.svg");


};

/**
 * Draws the Chart from benchmarked Data
 * Uses Google Chart Library: https://developers.google.com/chart/
 */
mwb.drawChart = function () {
    "use strict";

    console.log('Plotting Graph');
    console.dir(mwb.dataArray);

    var data = google.visualization.arrayToDataTable(mwb.dataArray);

    var options = {

        theme: 'maximized',
        vAxis: {

            minValue: 0
        },
        hAxis: {

        },
        pointSize: 2,
        lineWidth: 1

    };

    // var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
    var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    chart.draw(data, options);
};


//////////////////////////////
// Helper Functions         //
//////////////////////////////

/**
 *  Converts an Array to a (Excel compatible) CSV String
 *
 * Adapted from:
 * http://stackoverflow.com/questions/11257062/converting-json-object-to-csv-format-in-javascript
 * @param  {Array}  objArray Input Array
 * @return {String}          CSV String
 */
mwb.convertToCSV = function(objArray) {
    "use strict";

    var array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
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
    $('#msg').append('<div class="alert alert-warning">[' + time + '] ' + msg + '<a class="close" data-dismiss="alert" href="#" aria-hidden="true">&times;</a></div>');
    $(".alert").alert();
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
