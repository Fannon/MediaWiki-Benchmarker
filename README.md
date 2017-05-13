MediaWiki-Benchmark
===================
This is a simple web application that can benchmark MediaWiki installations through the API. 
The tool draws bar and boxplot charts and allows to download / export the benchmarked data as CSV or JSON files.
The charts can be downloaded as SVG vector graphics.

You can try/use it online: http://fannon.github.io/MediaWiki-Benchmarker/


### Troubleshooting ###
In case you run into cross origin issues, it may be necessary to upload the benchmarker to the server. 
In this case, upload all contents in the `/dist/` folder or download a [https://github.com/Fannon/MediaWiki-Benchmarker/releases](release).

In case of MediaWiki permission problems, you might have to enable the API in your MediaWikis `LocalSettings.php` first:

```ini
#### API
$wgEnableAPI = true;
$wgCrossSiteAJAXdomains = array( '*' );
```

###Known Problems###
The Browser has a limitation of max opened connections.
Be careful that the benchmarker doesn't make new requests faster than the browser can actually make them. 

If this is the case, the requests will stack up and so will the time that is measured. This will lead to a stair-like chart.
This problem is most likely not on the server, but the client (Browser) side. Seen from the client side the benchmark is correct however.
To benchmark a server under high(er) stress it would be needed to simultaneously benchmark from different computers and different locations
