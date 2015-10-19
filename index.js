//------------------------------------------
// 一行掲示板
//------------------------------------------
// 設定
var HTTP_PORT = (process.env.PORT || 5000);
var DATAFILE = "bbs-logs.json";

// 必要なモジュールの読み込み
var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    Twitter = require('twitter-node-client').Twitter,
    ejs = require('ejs');

/* twitter api */
//Get this data from your twitter apps dashboard
var config = {
    "consumerKey": process.env.CONSUMER_KEY,
    "consumerSecret": process.env.CONSUMER_SECRET,
    "accessToken": process.env.ACCESS_TOKEN,
    "accessTokenSecret": process.env.ACCESS_TOKEN_SECRET,
    "callBackUrl": "https://school-search.herokuapp.com"
}

//Callback functions
var error = function (err, response, body) {
    console.log('ERROR [%s]', err);
};
var success = function (data) {
    //console.log('Data [%s]', data);

    var json = JSON.parse(data);
    var result = json['statuses'][0];
    console.log(result['user']['name']);
    console.log(result['text']);
    console.log(result['created_at']);
};

var twitter = new Twitter(config);
twitter.getSearch({'q':'#haiku','count': 1}, error, success);
/* twitter api end */

// データファイルの読み込み
var logs = [];
if (fs.existsSync(DATAFILE)) {
    logs = JSON.parse(fs.readFileSync(DATAFILE));
}

// サーバー処理
http.createServer(function (req, res) {
    // どのファイルにアクセスするのか調べる
    if (req.url == "/") {
        req.url = "/views/pages/index.ejs";
    }

    var x = url.parse(req.url, true);
    if (x.pathname == "/api") {
        procAPI(x, res);
        return;
    } else {
        var fullpath = path.resolve(__dirname, "." + x.pathname);
        if (fs.existsSync(fullpath)) {
            var strm = fs.createReadStream(fullpath);
            strm.pipe(res);
            return;
        }
    }

    // 予想外のリクエストにはエラーを返す
    console.log("Unknown: " + req.url)
        res.writeHead(404, {'Content-Type':'text/plain'});
    res.end("404 not found");
})
.listen(HTTP_PORT);
console.log("start server");
console.log("http://localhost:" + HTTP_PORT);

// API
function procAPI(x, res) {
    res.writeHead(200, {'Content-Type':'text/plain'});
    var q = x.query;
    if (q.mode == "send") {
        logs.unshift([q.name, q.msg]);
        fs.writeFile(DATAFILE, JSON.stringify(logs),
                function(err) {
                    if(err) { console.log(err); }
                });
        res.write("{'result':'ok'}");
    } else if (q.mode == "show") {
        var o = {};
        o.result = "ok";
        o.items = logs;
        res.write(JSON.stringify(o));
    }
    res.end();
}

