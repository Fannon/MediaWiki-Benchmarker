"use strict";


//////////////////////////////
// Variables and Options    //
//////////////////////////////

var mediaWikiUrl = 'http://localhost/wiki';

var token = false;



//////////////////////////////
// Data for Randomizer      //
//////////////////////////////

var data = {};

data.vornamenArray = [
    "Isaac", "Clives Staples", "William", "Orson Scott", "Arthur", "Robert", "Frank", "Jules",
    "H. G.", "Douglas", "Ursula", "Philip", "Ray", "George", "Dan", "Thomas", "G. K."
];

data.nachnamenArray = [
    "Dick", "Lewis", "Clarke", "Asimov", "Heinlein", "Herbert", "Card", "Gibson", "Bradbury",
    "Verne", "Wells", "Orwell", "Simmons", "Adams", "Morus", "Chesterton"
];

data.ortArray = [
    "München", "Augsburg", "Friedberg", "Pasing", "Kissing"
];

data.abteilungenArray = [
    "Software", "Hardware", "BWL", "Geschäftsleitung", "Putzdienst", "Personalverwaltung",
    "Support", "Praktikant"
]

data.hardwareArray = [
    "10.1.1.75", "Cisco A1", "Cisco A2", "10.1.1.72", "10.1.1.25", "10.1.1.16", "10.1.1.12"
]

data.softwareArray = [
    "MS Office 2013", "MS Office 2010", "Adobe Photoshop", "MS Excel 2013", "MS Access 2013"
]


//////////////////////////////
// Functions                //
//////////////////////////////

/**
 * On Document Load
 */
$(function() {
    log('SCRIPT LOADED');
    getToken();
});


/**
 * Gets Token which is required to use the MediaWiki API for editing/creating Content
 */
var getToken = function() {

    $.getJSON(
        mediaWikiUrl + '/api.php?',
        {
            action: 'query',
            titles: 'Hauptseite',
            prop: 'info',
            intoken: 'edit',
            format: 'json'
        },
        function( data ) {
            token = data.query.pages[1].edittoken;
            log('GET EditToken: ' + token);
        }
    );
}


/**
 * Neuer Kunde
 */
var generateMitarbeiter = function() {

    var text = '';
    var titel = '';

    if (!token) {
        log('ERROR: No valid editToken found!');
        return false;
    }

    // KONTAKTDATEN

    var kontaktdaten = generateKontaktdaten();

    text += kontaktdaten.text;
    titel = kontaktdaten.titel;


    // SONSTIGE DATEN

    var abteilung = $.rand(data.abteilungenArray);
    var hardware = $.rand(data.hardwareArray) + ', ' + $.rand(data.hardwareArray) + ', ' + $.rand(data.hardwareArray);
    var software = $.rand(data.softwareArray) + ', ' + $.rand(data.softwareArray);

    text +=
        '{{Mitarbeiter Fakten' + '\n' +
        '|Leiter=' + '' + '\n' +
        '|Abteilung=' + abteilung + '\n' +
        '|Hardware=' + hardware + '\n' +
        '|Software=' + software + '\n' +
        '}}' + '\n\n';


    // API REQUEST:

    $.post(
        mediaWikiUrl + '/api.php?',
        {
            action: 'edit',
            title: titel,
            text: text,
            token: token,
            format: 'json'
        },
        function( data ) {
            console.log('Neuer Mitarbeiter - Request erfolgreich:')
            console.log(text);
            console.dir(data);
            log('PAGE <a href="' + mediaWikiUrl + '/index.php?curid=' + data.edit.pageid + '" target="_blank">' + titel + '</a> CREATED / EDITED with ' + data.edit.result);
        }
    );

}



//////////////////////////////
// Hilfsfunktionen          //
//////////////////////////////


function generateKontaktdaten() {

    var vorname = $.rand(data.vornamenArray);
    var nachname = $.rand(data.nachnamenArray);
    var mail = vorname + '.' + nachname + '@gmail.com';
    mail = mail.split(' ').join('_');
    var festnetz = Math.floor(Math.random() * 892124257716) + 082124257716
    var handy = Math.floor(Math.random() * 892124257716) + 082124257716
    var strasse = $.rand(data.vornamenArray) + ' Platz ' + Math.floor(Math.random() * 200) + 1;
    var ort = $.rand(data.ortArray);
    var plz = Math.floor(Math.random() * 90000) + 10000;

    var titel = vorname + ' ' + nachname;

    var text =
        '{{Kontaktdaten|Vorname=' + vorname + '\n' +
        '|Nachname=' + nachname + '\n' +
        '|Mail=' + mail + '\n' +
        '|Festnetz=' + festnetz + '\n' +
        '|Handy=' + handy + '\n' +
        '|Straße=' + strasse + '\n' +
        '|Ort=' + ort + '\n' +
        '|Postleitzahl=' + plz + '\n' +
        '}}' + '\n\n';

    return {
        titel: titel,
        text: text
    };
}

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
