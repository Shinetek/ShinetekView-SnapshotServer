
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
// server.use(function (req,res,next) {
//    setTimeout(function () {
//        return next();
//    },5 * 60 * 1000);
// });
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

    var isFind = false;
    for(var tmpConfig in satConfig) {
        var config = satConfig[tmpConfig][prodType];
        //根据参数找到配置信息
        if (config !== undefined) {
            isFind = true;
            break;
        }
    }
    if(!isFind){
        next("find config error",null);
    }
    else{
        console.log("find config");
    }
    var module = require('./modules/snip_' + satConfig[tmpConfig]["SatType"] + '.js');
    console.log("find module");
    module.snipImage_GLL(res,config,satConfig["OutPath"],topLeftLat,topLeftLon,bottomRightLat,bottomRightLon,dateTime,fileType, function (err, data) {
        if (err) {
            next(err, null);
        }
        if (fileType.toLowerCase() == ".jpg") {
            res.setHeader("Content-Type", "image/jpeg");
            res.setHeader("Content-Disposition", "filename="+prodType+"_"+dateTime+"_"+topLeftLat+"_"+topLeftLon+"_"+bottomRightLat+"_"+bottomRightLon+"_"+config.Res+".jpg");
        }
        else{
            res.setHeader("Content-Type", "image/png");
            res.setHeader("Content-Disposition", "filename="+prodType+"_"+dateTime+"_"+topLeftLat+"_"+topLeftLon+"_"+bottomRightLat+"_"+bottomRightLon+"_"+config.Res+".png");
        }

        res.end(data);
        next();
    });
}
