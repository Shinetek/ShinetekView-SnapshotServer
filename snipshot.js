
var restify = require("restify");
var satConfig = require("./modules/tileconfig.json");
var shkUtil = require("./shkutil.js");
var server = restify.createServer({
    name:"snipshot",
    version:"0.0.1"
});
var serverIP = satConfig.IP;//"123.56.135.196";//shkUtil.getLoacalIP();
var port = (process.argv[2]) ? process.argv[2] : satConfig.Port;
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
    var prodType = req.params.prodtype;  //产品类型
    var topLeftLat = Number(req.params.toplat);     //左上角纬度
    var topLeftLon = Number(req.params.toplon);     //左上角经度
    var bottomRightLat = Number(req.params.bottomlat);   //右下角纬度
    var bottomRightLon = Number(req.params.bottomlon);   //右下角经度
    var dateTime = req.params.date;     //时次
    var fileType = req.params.filetype;     //文件类型，jpg or png
    //判断经纬度范围是否正确
    var tmp = topLeftLat;
    if(topLeftLat < bottomRightLat){
        topLeftLat = bottomRightLat;
        bottomRightLat = tmp;
    }
    tmp = topLeftLon;
    if(topLeftLon > bottomRightLon){
        topLeftLon = bottomRightLon;
        bottomRightLon = tmp;
    }
    console.log("topLeftLat=" + topLeftLat);
    console.log("topLeftLon=" + topLeftLon);
    console.log("bottomRightLat=" + bottomRightLat);
    console.log("bottomRightLon=" + bottomRightLon);

    if(topLeftLat > 90 || topLeftLat < -90 || bottomRightLat > 90 || bottomRightLat < -90 ||
        topLeftLon > 180 || topLeftLon < -180 || bottomRightLon > 180 || bottomRightLon < -180 ){
        res.send("param error");
        return next();
    }

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
        res.send("find config error");
        return next();
    }
    else{
        console.log("find config");
    }
    var module = require('./modules/snip_' + satConfig[tmpConfig]["SatType"] + '.js');
    console.log("find module");
    module.snipImage_GLL(res,config,satConfig["OutPath"],topLeftLat,topLeftLon,bottomRightLat,bottomRightLon,dateTime,fileType, function (err, data) {
        if (err) {
            res.send(err);
            next(err, null);
        }
        else {
            if (fileType.toLowerCase() == ".jpg") {
                res.setHeader("Content-Type", "image/jpeg");
                res.setHeader("Content-Disposition", "filename=" + prodType + "_" + dateTime + "_" + topLeftLat + "_" + topLeftLon + "_" + bottomRightLat + "_" + bottomRightLon + "_" + config.Res + ".jpg");
            }
            else {
                res.setHeader("Content-Type", "image/png");
                res.setHeader("Content-Disposition", "filename=" + prodType + "_" + dateTime + "_" + topLeftLat + "_" + topLeftLon + "_" + bottomRightLat + "_" + bottomRightLon + "_" + config.Res + ".png");
            }

            res.end(data);
            next();
        }
    });
}
