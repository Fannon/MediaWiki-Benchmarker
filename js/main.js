
//////////////////////////////
// Global Options          //
//////////////////////////////

var mediaWikiUrl = 'http://localhost/wiki/';


//////////////////////////////
// Hilfsfunktionen          //
//////////////////////////////

function log(msg) {
    var currentdate = new Date();
    var time = pad(currentdate.getHours())
        + ":" + pad(currentdate.getMinutes())
        + ":" + pad(currentdate.getSeconds());

    $('#msg').append('<pre><div class="label label-info">' + time + '</div> ' + msg + '</pre>');
}

(function($) {
    $.rand = function(arg) {
        if ($.isArray(arg)) {
            return arg[$.rand(arg.length)];
        } else if (typeof arg === "number") {
            return Math.floor(Math.random() * arg);
        } else {
            return 4;  // chosen by fair dice roll
        }
    };
})(jQuery);

function pad(n){
    return n<10 ? '0'+n : n
}

/**
 * Returns a DateString
 * @param  {[type]} timestamp [description]
 * @return {[type]}           [description]
 */
function getTime(timestamp){

    if (timestamp) {
         var a = new Date(timestamp);
     } else {
         var a = new Date();
     }

     var year = a.getFullYear();
     var month = pad(a.getMonth());
     var date = pad(a.getDate());
     var hour = pad(a.getHours());
     var min = pad(a.getMinutes());
     var sec = pad(a.getSeconds());
     var time = year+'-'+month+'-'+date+'_'+hour+':'+min+':'+sec;

     return time;
 }
