/*

    Client side component to send coverage data after each page's test run.  Served up by the "coverage" engine
    wired into fluid.testem, by default this is available at:

    <script src="/coverage/client/coverageSender.js"></script>

    NOTE: By default, this script requires Testem, and must be loaded after Testem loads, but before your tests start.

    Adapted from https://github.com/testem/testem/blob/master/examples/coverage_istanbul/tests.html#L11

    The harness included with this package will concatenate this with a bit of javascript that instantiates the
    sender with the right port information.  If you are using this script in another context, you will need to take
    care of that yourself.

 */
(function (Testem, QUnit) {
    "use strict";
    // Pure JS equivalent of a fluid.registerNamespace call.
    window.fluid.testem = window.fluid.testem || {};
    window.fluid.testem.coverage = window.fluid.testem.coverage || {};

    // A work-alike pure JS implementation of the previous fluid.testem.coverage.sender grade.
    // NOTE: Only options.coveragePort is meaningful.
    window.fluid.testem.coverage.sender = function (options) {
        var afterTestsCallback = function (config, data, testemCallback) {
            if (window.__coverage__) {
                var xhr = new XMLHttpRequest();

                xhr.addEventListener("abort", function () {
                    //eslint-disable-next-line no-console
                    console.error("The coverage send request was aborted.");
                });

                xhr.addEventListener("error", function (event) {
                    var errorDetails = xhr.responseText || JSON.stringify(event);
                    //eslint-disable-next-line no-console
                    console.error("The coverage send request encountered an error:\n" + errorDetails);
                });

                xhr.addEventListener("timeout", function () {
                    //eslint-disable-next-line no-console
                    console.error("The coverage send request timed out.");
                });

                xhr.addEventListener("load", function () {
                    if (this.status === 200) {
                        //eslint-disable-next-line no-console
                        console.log("Saved coverage data.");

                        if (testemCallback) {
                            testemCallback();
                        }
                    }
                    else {
                        //eslint-disable-next-line no-console
                        console.error("Error saving coverage data:", this.responseText);
                    }
                });

                xhr.open("POST", "http://localhost:" + options.coveragePort + "/coverage");
                xhr.setRequestHeader("Content-type", "application/json");
                var wrappedPayload = {
                    payload: {
                        document: {
                            title: document.title,
                            URL: document.URL
                        },
                        navigator: {
                            appCodeName: navigator.appCodeName,
                            appName: navigator.appName,
                            product: navigator.product,
                            productSub: navigator.productSub,
                            userAgent: navigator.userAgent,
                            vendor: navigator.vendor,
                            vendorSub: navigator.vendorSub
                        },
                        coverage: window.__coverage__
                    }
                };
                xhr.send(JSON.stringify(wrappedPayload, null, 2));
            }
            else if (testemCallback) {
                //eslint-disable-next-line no-console
                console.log("No coverage data, firing Testem callback immediately...");
                testemCallback();
            }
        };


        if (options && options.exposeCallback) {
            window.fluid.testem.coverage.afterTestsCallback = afterTestsCallback;
        }

        if (options && options.hookTestem && Testem) {
            Testem.afterTests(afterTestsCallback);
        }

        if (options && options.hookQUnit && QUnit) {
            QUnit.done(afterTestsCallback);
        }
    };
})(window.Testem, window.QUnit);
