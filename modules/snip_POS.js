/**
 * Created by lihy on 2017/3/16.
 */

var fs = require("fs");
var Canvas = require("canvas");
var Image = Canvas.Image;
var glob = require("glob");
var perLatLines = 0;  //每个纬度用多少行
var perLonLines = 0;  //每个经度用多少行
var blockLat = 0;
var blockLon = 0;
var latScope = 0;
var lonScope = 0;
/**
 * 截图
 * @param res 
 * @param config 配置信息
 * @param outPutPath 输出的临时目录
 * @param t_l_lat 截图范围左上角纬度
 * @param t_l_lon 截图范围左上角经度
 * @param b_r_lat 截图范围右下角纬度
 * @param b_r_lon 截图范围右下角经度
 * @param dateTime 截取时次
 * @param fileType 截取文件类型，jpg or png
 * @param next
 */
exports.snipImage_GLL = function (res,config,outPutPath,t_l_lat,t_l_lon,b_r_lat,b_r_lon,dateTime,fileType, next) {
    console.log("snipImage_GLL start");
    //查找原图文件列表
    var filterKey = config.Key1 + "*" + config.Res + "*" + config.key2 + "*." + fileType;
    var tmpBasePath = config.BasePath + "/" + dateTime + "/GLL/";
    glob(tmpBasePath + filterKey, function (err, files) {
        if(err){
            next(err,null);
        }
        latScope = config.LatScope;
        lonScope = config.LonScope;
        blockLat = 180 / config.LatScope;
        blockLon = 360 / config.LonScope;
        perLatLines = config.Height / config.LatScope;
        perLonLines = config.Width / config.LonScope;
        var shotLatScope = t_l_lat - b_r_lat;
        var shotLonScope = b_r_lon - t_l_lon;
        var cutWidth = Math.floor(shotLonScope * perLonLines);
        var cutHeight = Math.floor(shotLatScope * perLatLines);
        //获取待截图列表
        var shotFiles = _getFiles(files,t_l_lat,t_l_lon,b_r_lat,b_r_lon);
        if (!isFind) {
            next("find error", null);
        }
    });
}

/**
 * 获取在截图区域内的所有文件
 * @param files 在文件系统中找到的该时次所有文件
 * @param l_t_lat 截图区域左上角纬度
 * @param l_t_lon 截图区域左上角经度
 * @param r_b_lat 截图区域右下角纬度
 * @param r_b_lon 截图区域右下角经度
 * @private
 */
function  _getFiles(files,l_t_lat,l_t_lon,r_b_lat,r_b_lon) {
    var shotFiles = [];  //待截图的所有文件
    var tmpStr = null;
    var imageModel = null;
    files.forEach(function (item) {
        if(item.indexOf("events") == -1){  //将.events后缀名的文件排除
            tmpStr = item.split("/");
            tmpStr = tmpStr[tmpStr.length - 1];  //从全路径中获取文件名
            tmpStr = tmpStr.split("_");
            imageModel = new ItemModel();
            imageModel.fileName = item;
            imageModel.tNo = parseInt(tmpStr[2].replace("T",""));
            if(imageModel.check(l_t_lat,l_t_lon,r_b_lat,r_b_lon)){
                shotFiles.push(imageModel);
            }

        }
    });
    return shotFiles;
}

function ItemModel() {
    var self = this;
    self.iOffset = 0;
    self.jOffset = 0;
    self.width = 0;
    self.height = 0;
    self.fileName = "";
    self.tNo = 0;
    self.check = function (l_t_lat,l_t_lon,r_b_lat,r_b_lon) {
        var block_l_t_lat,block_l_t_lon,block_r_b_lat,block_r_b_lon;
        block_l_t_lat = 90 - (self.tNo / blockLon) * latScope;
        block_l_t_lon = -180 + (self.tNo % blockLon) * lonScope;
        block_r_b_lat = block_l_t_lat + latScope;
        block_r_b_lon = block_l_t_lon + lonScope;

        //首先判断是否不在截取范围内
        if(block_r_b_lat >= l_t_lat && block_r_b_lon <= l_t_lon){
            return false;
        }
        if(block_l_t_lat <= r_b_lat && block_l_t_lon >= r_b_lon){
            return false;
        }
        inShot = true;
        if(block_l_t_lat <= l_t_lat && block_l_t_lon >=l_t_lon && block_r_b_lat >= r_b_lat && block_r_b_lon <= r_b_lon){
            self.iOffset = 0;
            self.jOffset = 0;
            self.width = lonScope * perLonLines;
            self.height = latScope * perLatLines;
        }
        else{

        }
        return true;
    }
}