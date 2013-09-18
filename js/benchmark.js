"use strict";


//////////////////////////////
// Variables and Options    //
//////////////////////////////

var currentInterval = 0;
var minInterval = 300;
var maxInterval = 1000;

var currentCounter = 0;
var maxCounter = 5;

var dataArray = [];


google.load("visualization", "1", {packages:["corechart"]});

$(function() {
    $('#maxCounter').val(maxCounter);
});

/** Resets the Data and the Graph */
var reset = function() {
    dataArray = [[]]; // 2 Dim Array
    currentCounter = 0;
    currentInterval = 0;
    $('#chart_div').html('');

}

var runBenchmark = function() {

    // Reset currentCounter
    reset();

    // Get Pages Input
    var pages = $('#pages').val();
    if (!pages || pages === '') {
        return false;
    }
    pages = pages.split(', ');

    // Get currentCounter Input
    var maxCounter = parseInt($('#maxCounter').val());

    dataArray[0][0] = 'Interval';

    for (var i = 0; i < pages.length; i++) {
        dataArray[0].push(pages[i]);
    }


    // Iterate currentCounter
    for (currentCounter = 1; currentCounter <= maxCounter; currentCounter++) {

        dataArray[currentCounter] = [];
        dataArray[currentCounter].push(currentInterval);

        // Iterate Pages
        for (var i = 0; i < pages.length; i++) {

            currentInterval += (minInterval + Math.floor(Math.random()*maxInterval));

            var page = pages[i]

            console.log('Benchmarking ' + page + ' after interval ' + currentInterval + ' Count: ' + currentCounter);

            benchmarkPage(page, currentCounter, currentInterval);

        };

    }




    // TODO: WARTEN ANZEIGE


}



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


            console.dir(dataArray[currentCounter]);

            dataArray[currentCounter].push(time);

            drawChart(dataArray);

            // if (currentCounter % 3 === 0) {
            //     drawChart(dataArray);
            // }

        });

    }, currentInterval);



}


function drawChart(array) {

    console.log('Plotting Graph');
    console.dir(dataArray);

    var jsonExport = $('#jsonExport');
    jsonExport.href='data:text/json;base64,' + btoa(JSON.stringify(array));
    jsonExport.removeAttr("disabled");

    var data = google.visualization.arrayToDataTable(array);

    var options = {
      title: 'Page Performance',
      focusTarget: 'category',
      theme: 'maximized',
      pointSize: 2,
      lineWidth: 1

    };

    var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    chart.draw(data, options);
}
