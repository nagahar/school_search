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
    ejs = require('ejs');

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

