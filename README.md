MediaWiki-Benchmark
===================
This is a simple web application that can benchmark MediaWiki installations through the API. 
The tool draws bar and boxplot charts and allows to download / export the benchmarked data as CSV or JSON files.
The charts can be downloaded as SVG vector graphics.

You can try/use it online: http://fannon.de/p/mediawiki-benchmark/

![Screenshot](http://up.fannon.de/img/2015-04-21_21_59_44.png "Screenshot of MediaWiki Benchmark")

### Troubleshooting ###
In case you run into cross origin issues, it may be necessary to upload the benchmarker to the server. In this case, upload all contents in the `/dist/` folder.

There could be MediaWiki API permission problems, too. You might have to enable the API in your MediaWikis `LocalSettings.php` first:
```ini
#### API
$wgEnableAPI = true;
$wgCrossSiteAJAXdomains = array( '*' );
```

###Known Problems###
The Browser has a limitation of max opened connections.
Be careful that the benchmarker doesn't make new requests faster than the browser can actually make them. 

If this is the case, the requests will stack up and so will the time that is measured. This will lead to a stair-like chart:

![stair-like chart](http://up.fannon.de/img/2015-04-21_22_05_03.png "Screenshot of a chart where requests have stacked up")
