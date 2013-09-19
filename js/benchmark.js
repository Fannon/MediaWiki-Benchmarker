/* jshint jquery: true, devel: true */
/* global google, ss */


//////////////////////////////
// Variables and Options    //
//////////////////////////////

/** (Default) URL to MediaWiki Installation */
var mediaWikiUrl = 'http://localhost/wiki/';
var purgePages = false;
var purgeInterval = 300;

var errorOccured = false;

var currentInterval = 0;
var minRandom = 300;
var maxRandom = 1000;

var currentCounter = 0;
var maxCounter = 5;

var progress = 0;
var progressTotal = 0;

var dataArray = [];
var dataObject = {
    data: {},
    analysis: {}
};


//////////////////////////////
// Startup                  //
//////////////////////////////

google.load("visualization", "1", {packages: ["corechart"]});

/**
 * Resets the state of the tool
 */
var reset = function () {
    "use strict";

    console.log('Resetting');

    // Reset Variables / Data
    dataArray = [
        []
    ]; // 2 Dim Array
    dataObject = {
        data: {},
        analysis: {}
    };
    progress = 0;
    currentCounter = 0;
    currentInterval = 0;
    errorOccured = false;

    // Reset Interface
    $('#progress').attr("aria-valuenow", 0).css('width', 0 + '%');
    $('#chart_div').html('');
    $('#data-tbody').html('');
};

$(function () {
    "use strict";
    console.log('MediaWiki Benchmark Script ready!');
    $('#mediaWikiUrl').val(mediaWikiUrl);
    $('#maxCounter').val(maxCounter);
    $('#minRandom').val(minRandom);
    $('#maxRandom').val(maxRandom);
    $('#purgeInterval').val(purgeInterval);
});


//////////////////////////////
// Benchmarking Functions   //
//////////////////////////////

/**
 * Prepares and launches the Benchmark
 */
var runBenchmark = function () {
    "use strict";

    console.log('STARTING A NEW BENCHMARK');

    // Reset currentCounter
    reset();

    // Get Pages Input
    var pages = $('#pages').val();
    if (!pages || pages === '') {
        return false;
    }
    pages = pages.split(', ');

    // Get current Form Values
    mediaWikiUrl = $('#mediaWikiUrl').val();
    maxCounter = parseInt($('#maxCounter').val(), 10);
    minRandom = parseInt($('#minRandom').val(), 10);
    maxRandom = parseInt($('#maxRandom').val(), 10);
    purgeInterval = parseInt($('#purgeInterval').val(), 10);
    purgePages = $('#purgePages').prop('checked');

    progressTotal = maxCounter * pages.length;

    dataObject.options = {
        mediaWikiUrl: mediaWikiUrl,
        maxCounter: maxCounter,
        minRandom: minRandom,
        maxRandom: maxRandom,
        purgePages: purgePages,
        purgeInterval: purgeInterval,
        progressTotal: progressTotal

    };

    dataArray[0][0] = 'Iteration';

    for (var i = 0; i < pages.length; i++) {
        dataArray[0].push(pages[i]);
        dataObject.data[pages[i]] = [];
        dataObject.analysis[pages[i]] = {};
    }

    // Iterate currentCounter
    for (currentCounter = 1; currentCounter <= maxCounter; currentCounter++) {

        dataArray[currentCounter] = [];
        dataArray[currentCounter].push(currentCounter);

        // Iterate Pages
        for (var j = 0; j < pages.length; j++) {

            currentInterval += Math.floor(Math.random() * (maxRandom-minRandom) + minRandom);
            var page = pages[j];
            console.log('Benchmarking ' + page + ' after interval ' + currentInterval + ' Count: ' + currentCounter);

            if (purgePages) {

                purgePage(page, currentCounter, currentInterval);
                currentInterval += purgeInterval;

            }

            benchmarkPage(page, currentCounter, currentInterval);

        }
    }
};


/**
 * Benchmarks a Page after a given time interval
 *
 * @param  {String} page            [description]
 * @param  {Number} currentCounter  [description]
 * @param  {Number} currentInterval [description]
 */
function benchmarkPage(page, currentCounter, currentInterval) {
    "use strict";

    setTimeout(function () {

        var now = new Date().getTime();

        $.post(mediaWikiUrl + '/api.php?', {
            action: 'parse',
            page: page,
            format: 'json'
        }, function (data) {

            if (data.error) {
                log('API ERROR: "' + data.error.code + '" - ' + data.error.info);
                console.dir(data);
                return false;
            }

            var then = new Date().getTime();
            var time = then - now;

            console.log('[' + currentCounter + '] Page ' + page + ' loaded in ' + time + 'ms.');

            dataArray[currentCounter].push(time);
            dataObject.data[page].push(time);

            // Progress Bar
            progress += 1;
            var percent = progress / progressTotal * 100;
            $('#progress').attr("aria-valuenow", percent).css('width', percent + '%');

            // If completed, draw Chart
            if (percent >= 100) {
                drawChart();
                drawData();
            }

        });

    }, currentInterval);

    return true;

}

function purgePage(page, currentCounter, currentInterval) {
    "use strict";

    setTimeout(function () {

        var now = new Date().getTime();

        $.post(mediaWikiUrl + '/api.php?', {
            action: 'purge',
            page: page,
            format: 'json'
        }, function (data) {

            if (data.error) {
                log('API ERROR: "' + data.error.code + '" - ' + data.error.info);
                console.dir(data);
                return false;
            }

            var then = new Date().getTime();
            var time = then - now;

            console.info('[' + currentCounter + '] Page ' + page + ' purged in ' + time + 'ms.');

        });

    }, currentInterval);

    return true;

}

/**
 * Analyzes the Data and generates a summary table
 * Puts the raw Data to download formats
 *
 * Uses http://macwright.org/simple-statistics/ for Statistical Analysis
 */
function drawData() {
    "use strict";


    console.log('Analyzing Data');

    // Analyze Data & draw the Table
    var html = '';

    $.each(dataObject.data, function (key, value) {

        console.log(key + ' : ' + value);

        var row = dataObject.data[key];

        var analysis = {};

        analysis.avg = ss.average(row);
        analysis.min = ss.min(row);
        analysis.max = ss.max(row);
        analysis.standard_deviation = Math.round(ss.standard_deviation(row) * 100) / 100;

        console.log(ss.average(row));

        console.dir(analysis);


        html += '<tr><td>' + key + '</td><td>' + analysis.avg + '</td><td>' + analysis.min + '</td><td>';
        html += analysis.max + '</td><td>' + analysis.standard_deviation + '</td></tr>';

        dataObject.analysis[key] = analysis;

    });

    $('#data-tbody').html(html);
    console.dir(dataObject);

    // JSON Export: dataArray
    var jsonExport = $('#jsonExport');
    jsonExport.removeAttr("disabled");
    jsonExport.attr('href', ('data:text/json;base64,' + btoa(JSON.stringify(dataArray))));
    jsonExport.attr("download", getTime() + "_ArrayData.json");


    // JSON Export: dataObject
    var jsonExportAlt = $('#jsonExportAlt');
    jsonExportAlt.removeAttr("disabled");
    jsonExportAlt.attr('href', ('data:text/json;base64,' + btoa(JSON.stringify(dataObject))));
    jsonExportAlt.attr("download", getTime() + "_ObjectData.json");


    // CSV Export
    var csvExport = $('#csvExport');
    csvExport.removeAttr("disabled");
    csvExport.attr("href", 'data:text/csv;base64,' + btoa(convertToCSV(dataArray)));
    csvExport.attr("download", getTime() + "_TableData.csv");

    // SVG Export
    var svgExport = $('#svgExport');
    svgExport.removeAttr("disabled");
    svgExport.attr("href", 'data:text/svg;base64,' + btoa($('#chart_div div div').html()));
    svgExport.attr("download", getTime() + "_Graph.svg");


}

/**
 * Draw the Chart from Benchmark Data
 * Uses Google Chart
 */
function drawChart() {
    "use strict";

    console.log('Plotting Graph');
    console.dir(dataArray);

    var data = google.visualization.arrayToDataTable(dataArray);

    var options = {
        title: 'Page Performance (ms)',
        theme: 'maximized',
        focusTarget: 'category',
        vAxis: {
            minValue: 0
        },
        pointSize: 2,
        lineWidth: 1

    };

    // var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
    var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    chart.draw(data, options);
}


//////////////////////////////
// Helper Functions         //
//////////////////////////////

// http://stackoverflow.com/questions/11257062/converting-json-object-to-csv-format-in-javascript
function convertToCSV(objArray) {
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
}

/**
 * Pads a Number
 * @param n
 * @returns {string}
 */
function pad(n) {
    "use strict";

    return n < 10 ? '0' + n : n;
}

/**
 * Write a Message to the Message Div
 * @param msg
 */
function log(msg) {
    "use strict";

    var currentdate = new Date();
    var time = pad(currentdate.getHours()) + ":" + pad(currentdate.getMinutes()) + ":" + pad(currentdate.getSeconds());
    $('#msg').append('<div class="alert alert-warning">[' + time + '] ' + msg + '<a class="close" data-dismiss="alert" href="#" aria-hidden="true">&times;</a></div>');
    $(".alert").alert();
}

/**
 * Get Random Element from Array -> jQuery Function
 */
(function ($) {
    "use strict";

    $.rand = function (arg) {
        if ($.isArray(arg)) {
            return arg[$.rand(arg.length)];
        } else if (typeof arg === "number") {
            return Math.floor(Math.random() * arg);
        } else {
            return 4;  // chosen by fair dice roll
        }
    };
})(jQuery);

/**
 * Returns a DateString
 * @return {String}           [description]
 */
function getTime() {
    "use strict";

    var a = new Date();

    var year = a.getFullYear();
    var month = pad(a.getMonth());
    var date = pad(a.getDate());
    var hour = pad(a.getHours());
    var min = pad(a.getMinutes());
    var sec = pad(a.getSeconds());

    return year + '-' + month + '-' + date + '_' + hour + ':' + min + ':' + sec;
}
