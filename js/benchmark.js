"use strict";


//////////////////////////////
// Variables and Options    //
//////////////////////////////

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

google.load("visualization", "1", {packages:["corechart"]});

/**
 * Resets the state of the tool
 */
var reset = function() {
    dataArray = [[]]; // 2 Dim Array
    dataObject = dataObject = {
        data: {},
        analysis: {}
    };
    progress = 0;
    currentCounter = 0;
    currentInterval = 0;
    $('#progress').attr( "aria-valuenow", 0).css('width', 0 + '%');
    $('#chart_div').html('');
    $('#data-tbody').html('');
}

$(function() {
    reset();
    $('#mediaWikiUrl').val(mediaWikiUrl);
    $('#maxCounter').val(maxCounter);
    $('#minRandom').val(minRandom);
    $('#maxRandom').val(maxRandom);
});


//////////////////////////////
// Benchmarking Functions   //
//////////////////////////////

/**
 * Prepares and launches the Benchmark
 */
var runBenchmark = function() {

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
    maxCounter = parseInt($('#maxCounter').val());
    minRandom = parseInt($('#minRandom').val());
    maxRandom = parseInt($('#maxRandom').val());

    progressTotal = maxCounter * pages.length;

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
        for (var i = 0; i < pages.length; i++) {

            currentInterval += (minRandom + Math.floor(Math.random()*maxRandom));

            var page = pages[i]

            console.log('Benchmarking ' + page + ' after interval ' + currentInterval + ' Count: ' + currentCounter);

            benchmarkPage(page, currentCounter, currentInterval);

        };
    }
}


/**
 * Benchmarks a Page after a given time interval
 *
 * @param  {[type]} page            [description]
 * @param  {[type]} currentCounter  [description]
 * @param  {[type]} currentInterval [description]
 */
function benchmarkPage(page, currentCounter, currentInterval) {

    setTimeout(function(){

        var now = new Date().getTime();

        $.post(mediaWikiUrl + '/api.php?', {
            action: 'parse',
            page: page,
            format: 'json'
        }, function( data ) {

            var then = new Date().getTime();
            var time =  then - now;

            console.log('[' + currentCounter + '] Page ' + page + ' loaded in ' + time + 'ms.');

            dataArray[currentCounter].push(time);
            dataObject.data[page].push(time);

            // Progress Bar
            progress += 1;
            var percent = progress / progressTotal * 100;
            $('#progress').attr( "aria-valuenow", percent).css('width', percent + '%');

            // If completed, draw Chart
            if (percent >= 100) {
                drawChart();
                drawData();
            }

        });

    }, currentInterval);

}

/**
 * Analyzes the Data and generates a summary table
 * Puts the raw Data to download formats
 *
 * Uses http://macwright.org/simple-statistics/ for Statistical Analysis
 */
function drawData() {

    console.log('Analyzing Data');

    // Analyze Data & draw the Table
    var html = '';

    $.each(dataObject.data, function(key, value) {

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
}

/**
 * Draw the Chart from Benchmark Data
 * Uses Google Chart
 */
function drawChart() {

    console.log('Plotting Graph');
    console.dir(dataArray);

    var data = google.visualization.arrayToDataTable(dataArray);

    var options = {
      title: 'Page Performance (ms)',
      theme: 'maximized',
      focusTarget: 'category',
      pointSize: 2,
      lineWidth: 1

    };

    var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
    chart.draw(data, options);
}


//////////////////////////////
// Helper Functions         //
//////////////////////////////

// http://stackoverflow.com/questions/11257062/converting-json-object-to-csv-format-in-javascript
function convertToCSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';

    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
            if (line != '') line += ';'

            line += array[i][index];
        }

        str += line + '\r\n';
    }

    return str;
}

