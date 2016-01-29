//eg.
//phantomjs w500.js 0 gbk
//phantomjs w500.js -1 gbk
//第一个参数是抓取的日期距离今天的天数，0表示抓取今天，-1表示昨天，以此类推

var fs = require('fs');
var args = require('system').args;
var page = require('webpage').create();
page.settings.resourceTimeout = 5000; // 5 seconds
page.onResourceTimeout = function(e) {
    console.log(e.errorCode);   // it'll probably be 408 
    console.log(e.errorString); // it'll probably be 'Network timeout on resource'
    console.log(e.url);         // the url whose request timed out
};

var CATCH_PERIOD_MILLS = 30000;

var tracker = (function () {
    var openRequests = [],
        counter = 0;

    return {
        start: function (id) {
            openRequests[id] = true;
            counter++;
        },
        end: function (id) {
            openRequests[id] = null;
            delete openRequests[id];
            counter--;
        },
        count: function () {
            return counter;
        }
    };
})();

Date.prototype.format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1,                 //月份
        "d+": this.getDate(),                    //日
        "h+": this.getHours(),                   //小时
        "m+": this.getMinutes(),                 //分
        "s+": this.getSeconds(),                 //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds()             //毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

t = Date.now();

page.onResourceRequested = function (req, controller) {
    tracker.start(req.id);
};

page.onResourceReceived = function (res) {
    if (res.stage === 'end') {
        tracker.end(res.id);
    }
};

page.onResourceTimeout = function (request) {
    console.log(new Date() + 'Response timeout (#' + request.id + '): ' + JSON.stringify(request));
};

page.onError = function (msg, trace) {

    var msgStack = ['ERROR: ' + msg];

    if (trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function (t) {
            msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
        });
    }
    console.error(msgStack.join('\n'));
};

page.onResourceError = function (resourceError) {
    console.log(new Date() + 'Unable to load resource (#' + resourceError.id + 'URL:' + resourceError.url + ')');
    console.log(new Date() + 'Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString);
};

var url = "http://live.500.com";
var days = 0;
var charset = 'utf8';
if (args.length == 3) {
    days = args[1]
    charset = args[2]
} else if (args.length == 2) {
    days = args[1]
} else if (args.length == 1) {
} else {
    phantom.exit(1);
}

setInterval(function () {
    var catchUrl = url + '/?e=' + getDateFromNow(days);
    page.open(catchUrl, function (status) {
        console.log(new Date() + 'open url[' + catchUrl + '] status is ' + status);
        if (status !== 'success') {
            console.log(new Date() + 'Unable to access network');
        } else {
            console.log(new Date() + '[page load status] ' + JSON.stringify(status));

            var intervalId, timeoutId;

            intervalId = window.setInterval(function () {
                if (tracker.count() === 0) {
                    window.clearInterval(intervalId);
                    window.clearTimeout(timeoutId);
                    console.log('All clear!');
                }
            }, 750);

            window.setTimeout(function () {
                window.clearInterval(intervalId);
                window.clearTimeout(timeoutId);

                var openReqCount = tracker.count();
                if (openReqCount > 0) {
                    console.log('Still waiting on ' + openReqCount + ' open requests to end.');
                } else {
                    console.log('All clear after 5 seconds....');
                }
                console.log('arg is ' + args[1])
                page.render(getTimestamp(t) + '.jpg', {
                    format: 'jpg',
                    quality: '100'
                })
                var p = page.evaluate(function () {
                    return '<html>' + document.getElementsByTagName('html')[0].innerHTML + '</html>'
                });
                try {
                    fs.write(getTimestamp(t) + '.html', p, {
                        mode: 'w',
                        charset: charset
                    });
                } catch (e) {
                    console.log(e);
                }
                t = Date.now() - t;
                console.log('Loading time ' + t + ' millsec');
                console.log(catchUrl);
                //phantom.exit(status !== 'success' ? 1 : 0);
            }, 10000);
        }
    });
}, CATCH_PERIOD_MILLS);

function getTimestamp(t) {
    d = new Date(t);
    return d.format('yyyyMMdd_hhmmss');
}

function getDateFromNow(days){
    var t = Date.now() + 1000*days*24*60*60;
    var d = new Date(t);
    return d.format('yyyy-MM-dd');
}
