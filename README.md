MediaWiki-Benchmark
===================

This is a simple Script to benchmark MediaWiki Installations. It runs completely in the Browser and can be used locally or uploaded to the server in case of cross-origin-issues.
===Options===
There are several options. Most important are:
 * *pages*: A comma seperated of MediaWiki pages. E.g. Main Site, JavaScript, GIT
 * *iterations*: This is the number each page is benchmarked
 * *Random Intervals*: The Script will wait for another Benchmark Request a random time. You can set the minimum time and maximum time. If you set both to the same value there is no randomness.

===Known Problems==
The Browser has a limitation of max opened connections. So if you set up the options be careful that the script doesn't make new Requests faster than the Server can answer them. If you do, the Requests will stack up and so will the time that is measured.