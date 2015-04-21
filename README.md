MediaWiki-Benchmark
===================
This is a simple web application that can benchmark MediaWiki installations through the API. 
The tool draws bar and boxplot charts and allows to download / export the benchmarked data as CSV or JSON files.
The charts can be downloaded as SVG vector graphics.

You can try/use it online: http://fannon.de/p/mediawiki-benchmark/

![Screenshot](http://up.fannon.de/img/2015-04-21_21_59_44.png "Screenshot of MediaWiki Benchmark")

###Options###
There are several options. Most important are:
 * *pages*: A comma seperated of MediaWiki pages. E.g. Main Site, JavaScript, GIT
 * *iterations*: This is the number each page is benchmarked
 * *Random Intervals*: The Script will wait for another Benchmark Request a random time. You can set the minimum time and maximum time. If you set both to the same value there is no randomness.

### Troubleshooting ###
In case you run into cross origin issues, it may be necessary to upload the benchmarker to the server. In this case, upload all contents in the `/dist/` folder.

Eventually you'll have to enable the API in your MediaWikis `LocalSettings.php` first:
```ini
#### API
$wgEnableAPI = true;
```

###Known Problems###
The Browser has a limitation of max opened connections.
So if you set up the options be careful that the script doesn't make new Requests faster than the Server can answer them. 
If you do, the Requests will stack up and so will the time that is measured. This will lead to a stair-like chart:

![stair-like chart](http://up.fannon.de/img/2015-04-21_22_05_03.png "Screenshot of a chart where requests have stacked up")


