// Very rough performance testing tool. Needs more work and a methodology review
// before its results should be trusted against anything other than themselves.
YUI.add('performance', function (Y) {

var Node       = Y.Node,
    Obj        = Y.Object,
    Perf,

    isFunction = Y.Lang.isFunction,
    poll,

    CHART_URL  = 'http://chart.apis.google.com/chart?';

// -- Private Methods ----------------------------------------------------------

// Returns an object hash containing the mean, median, sample variance,
// sample standard deviation, and median absolute deviation of the values in the
// specified array.
function analyze(set) {
    var i,
        len = set.length,
        max = null,
        mean,
        min = null,
        sum = 0,
        value,
        variance;

    // Find the sum, max, and min.
    i = len;

    while (i--) {
        value = set[i];
        sum += value;

        if (max === null || value > max) {
            max = value;
        }

        if (min === null || value < min) {
            min = value;
        }
    }

    // And the mean.
    mean = sum / len;

    // And the sum of the squared differences of each value from the mean.
    for (i = len, sum = 0; i--; sum += Math.pow(set[i] - mean, 2)); // no block

    // And finally the sample variance and standard deviation.
    variance = sum / (len - 1);

    return {
        max      : max,
        mean     : mean,
        median   : median(set),
        mediandev: medianDeviation(set),
        min      : min,
        variance : variance,
        stdev    : Math.sqrt(variance)
    };
}

// Creates a query string based on the specified object of name/value params.
function createQueryString(params) {
    var _params = [];

    Y.Object.each(params, function (value, key) {
        if (Y.Lang.isValue(value)) {
            _params.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
        }
    });

    return _params.join('&amp;');
}

// Returns the median of the values in the specified array. This implementation
// is naïve and does a full sort before finding the median; if we ever start
// working with very large arrays, this should be rewritten to use a linear
// selection algorithm.
function median(set) {
    var len    = set.length,
        sorted = [].concat(set), // copy
        middle;

    if (!len) {
        return null;
    }

    sorted.sort(function (a, b) {
      return a > b;
    });

    if (len % 2) { // odd number of items
        return sorted[Math.floor(len / 2)];
    } else { // even number of items
        middle = sorted.splice(len / 2 - 1, 2);
        return (middle[0] + middle[1]) / 2;
    }
}

// Returns the median absolute deviation of the values in the specified array.
function medianDeviation(set) {
    var deviations = [],
        i          = set.length,
        setMedian  = median(set);

    // Find the absolute deviations from the median of the set.
    while (i--) {
        deviations.push(Math.abs(set[i] - setMedian));
    }

    // The median of the deviations is the median absolute deviation.
    return median(deviations);
}

function xhrGet(url) {
    if (typeof XMLHttpRequest === 'undefined') {
        window.XMLHttpRequest = function () {
            try {
                return new ActiveXObject('Msxml2.XMLHTTP.6.0');
            } catch (ex) {}

            try {
                return new ActiveXObject('Msxml2.XMLHTTP.3.0');
            } catch (ex) {}

            try {
                return new ActiveXObject('Msxml2.XMLHTTP');
            } catch (ex) {}

            Y.error('This browser does not support XMLHttpRequest.');
        };
    }

    var xhr = new XMLHttpRequest();

    xhr.open('GET', url, false);
    xhr.send(null);

    return xhr.status === 200 ? xhr.responseText : null;
}

Perf = Y.Performance = {
    // -- Protected Properties -------------------------------------------------
    _tests: {},
    _results: {},

    // -- Public Methods -------------------------------------------------------
    addTests: function (tests) {
        // Give each test a unique id and add it to _tests.
        Obj.each(tests, function (test, name) {
            Perf._tests[name] = test;
            Perf._tests[name]._id = Y.guid('perf-');
        });
    },

    render: function (parent) {
        var table,
            tbody;

        parent = Y.one(parent);
        table  = Y.Node.create(
            '<table class="yui3-perf-results">' +
                '<thead>' +
                    '<tr>' +
                        '<th class="test">Test</th>' +
                        '<th class="calls">Calls</th>' +
                        '<th class="mean">Mean</th>' +
                        '<th class="median">Median</th>' +
                        '<th class="mediandev"><abbr title="Median Absolute Deviation">Med. Dev.</abbr></th>' +
                        '<th class="stdev"><abbr title="Sample Standard Deviation">Std. Dev.</abbr></th>' +
                        '<th class="max">Max</th>' +
                        '<th class="min">Min</th>' +
                    '</tr>' +
                '</thead>' +
                '<tfoot></tfoot>' +
                '<tbody></tbody>' +
            '</table>'
        );

        tbody = table.one('tbody');

        Y.Object.each(Perf._results, function (results, name) {
            var chartParams = {
                    cht: 'ls',
                    chd: 't:' + results.points.join(','),
                    chf: 'bg,s,00000000', // transparent background
                    chs: '100x20'
                };

            results = Y.merge(results, analyze(results.points), {name: name});

            Y.Array.each(['max', 'mean', 'median', 'mediandev', 'min', 'stdev', 'variance'], function (key) {
                results[key] = results[key].toFixed(2);
            });

            tbody.append(Y.substitute(
                '<tr>' +
                    '<td class="test">{name} <img src="{chartUrl}" alt="Sparkline chart illustrating execution times."></td>' +
                    '<td class="calls">{calls}</td>' +
                    '<td class="mean">{mean}</td>' +
                    '<td class="median">{median}</td>' +
                    '<td class="mediandev">±{mediandev}</td>' +
                    '<td class="stdev">±{stdev}</td>' +
                    '<td class="max">{max}</td>' +
                    '<td class="min">{min}</td>' +
                '</tr>',
                Y.merge(results, {chartUrl: CHART_URL + createQueryString(chartParams)})
            ));
        });

        parent.removeClass('loading').setContent('').append(table);
    },

    start: function () {
        var active,
            queue     = [],
            runTest,
            sandboxes = [];

        Perf._results = {};

        // Queue up as many iterations of each test as are desired.
        Obj.each(Perf._tests, function (test, name) {
            var i = test.iterations || 1,
                prevTest,
                sandbox;

            if (test.warmup) {
                i += 1;
            }

            while (i--) {
                // Use one sandbox per test, regardless of iterations, unless
                // the useStrictSandbox option is true.
                if (!test.useStrictSandbox && prevTest && prevTest.name === name) {
                    sandbox = prevTest.sandbox;
                } else {
                    sandboxes.push(sandbox = new Y.Sandbox({bootstrapYUI: !test.noBootstrap}));
                    sandbox.setEnvValue('xhrGet', xhrGet);
                }

                queue.push(prevTest = {
                    name   : name,
                    sandbox: sandbox,
                    test   : test,
                    warmup : test.warmup && !(test.warmup = false) // intentional assignment, sets warmup to false for future iterations
                });
            }
        });

        // Processes a single test that has been shifted off the queue.
        runTest = function () {
            var activeTest = active.test;

            if (isFunction(activeTest.setup)) {
                active.sandbox.run(activeTest.setup);
            }

            active.sandbox.profile(activeTest.test);
        };

        // This poll function monitors test status and takes care of shifting
        // the next test off the queue when the active test finishes. 
        //
        // Since test timing is actually done inside the test sandbox, this poll
        // doesn't influence the test results.
        poll = Y.later(15, null, function () {
            var results = Perf._results;

            if (active) {
                if (active.sandbox.getEnvValue('endTime')) {
                    if (isFunction(active.test.teardown)) {
                        active.sandbox.run(active.test.teardown);
                    }

                    if (!active.warmup) {
                        results[active.name] = results[active.name] || {
                            calls : 0,
                            points: []
                        };

                        results[active.name].calls += 1;
                        results[active.name].points.push(
                                active.sandbox.getEnvValue('endTime') - active.sandbox.getEnvValue('startTime'));
                    }

                    if (active.test.useStrictSandbox) {
                        active.sandbox.destroy();
                    }

                    active = null;
                }
            }

            if (!active) {
                active = queue.shift();

                if (active) {
                    runTest();
                } else {
                    // Queue is empty.
                    poll.cancel();

                    Y.Array.each(sandboxes, function (sandbox) {
                        sandbox.destroy();
                    });

                    sandboxes = [];
                    Perf.render('#results');
                }
            }
        }, null, true);
    }
};

}, '1.0.0', {
    requires: ['later', 'node', 'sandbox', 'substitute']
});
