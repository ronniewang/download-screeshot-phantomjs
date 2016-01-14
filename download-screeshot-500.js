//eg.
//phantomjs w500.js "http://live.500.com/?e=2016-01-12" gbk

var fs = require('fs');
var args = require('system').args;
var page = require('webpage').create();
var CATCH_PERIOD_MILLS = 60000;
var tracker = (function () {
    var openRequests = [],
        counter = 0;

    return {
        start : function (id) {
            openRequests[id] = true;
            counter++;
        },
        end : function (id) {
            openRequests[id] = null;
            delete openRequests[id];
            counter--;
        },
        count : function () {
            return counter;
        }
    };
})();

Date.prototype.format = function(fmt)
{ //author: meizz   
    var o = {
        "M+" : this.getMonth()+1,                 //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                   //小时
        "m+" : this.getMinutes(),                 //分
        "s+" : this.getSeconds(),                 //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S"  : this.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt))
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
}

t = Date.now();
if (args.length < 3) {
    console.log("Usage: test.js <url to grap...> <charset>");
    phantom.exit(1);
}

page.onResourceRequested = function (req, controller) {
    tracker.start(req.id);
    console.log('[Request ' + req.id + '] ' + req.url);
};

page.onResourceReceived = function (res) {
    if (res.stage === 'end') {
        tracker.end(res.id);
        console.log('[Response ' + res.id + '] ' + res.url);
    }
};
setInterval(function(){
    page.open(args[1], function (status) {
        if (status !== 'success') {
            console.log('Unable to access network');
        } else {
            console.log('[page load status] ' + JSON.stringify(status));

            var intervalId,
                timeoutId;

            intervalId = window.setInterval(function () {
                if (tracker.count() === 0) {
                    window.clearInterval(intervalId);
                    window.clearTimeout(timeoutId);

                    console.log('All clear!');
                    phantom.exit(status !== 'success' ? 1 : 0);
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
                    format : 'jpg',
                    quality : '100'
                })
                var p = page.evaluate(function () {
                    return '<html>' + document.getElementsByTagName('html')[0].innerHTML + '</html>'
                });
                try {
                    fs.write(getTimestamp(t) + '.html', p, {
                        mode : 'w',
                        charset : args[2]
                    });
                } catch (e) {
                    console.log(e);
                }
                t = Date.now() - t;
                console.log('Loading time ' + t + ' millsec');
                //phantom.exit(status !== 'success' ? 1 : 0);
            }, CATCH_PERIOD_MILLS);
        }
    });
}, 10000);
function getTimestamp(t) {
    d = new Date(t);
    return d.format('yyyyMMdd_hhmmss');
    //return t.getFullYear() + "" + (t.getMonth() + 1) + "" + t.getDate() + "_" + t.getHours() + "" + t.getMinutes() + "" + t.getSeconds();
}
