
var restify = require("restify");
var satConfig = require("./modules/tileconfig.json");
var shkUtil = require("./shkutil.js");
var server = restify.createServer({
    name:"snipshot",
    version:"0.0.1"
});
var serverIP = shkUtil.getLoacalIP();
var port = (process.argv[2]) ? process.argv[2] : 4205;
var PATH = "/snipshot";
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());
/**
 * prodtype
 * toplat
 * toplon
 * bottomlat
 * bottomlon
 * date
 * filetype
 */
server.get(
    { path : PATH },
    _snip_GLL
);
server.listen(port,serverIP,function () {
    console.log("%s listening at %s",server.name,server.url);
});

function _snip_GLL(req,res,next) {
    console.log(req.params.prodtype);
    var prodType = req.params.prodtype;  //产品类型
    var topLeftLat = req.params.toplat;     //左上角纬度
    var topLeftLon = req.params.toplon;     //左上角经度
    var bottomRightLat = req.params.bottomlat;   //右下角纬度
    var bottomRightLon = req.params.bottomlon;   //右下角经度
    var dateTime = req.params.date;     //时次
    var fileType = req.params.filetype;     //文件类型，jpg or png


    for(var tmpConfig in satConfig) {
        var config = satConfig[tmpConfig][prodType];
        //根据参数找到配置信息
        if (config !== undefined) {
            break;
        }
    }
    var module = require('./modules/snip_' + satConfig[tmpConfig]["SatType"] + '.js');

    module.snipImage_GLL(config,satConfig["OutPath"],topLeftLat,topLeftLon,bottomRightLat,bottomRightLon,dateTime,fileType, function (err, data) {
        if (err) {
            next(err, null);
        }
        res.end(data);
        next();
    });
}
