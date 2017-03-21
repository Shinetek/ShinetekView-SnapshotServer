/**
 * Created by lihy on 2017/3/16.
 */

var fs = require("fs");
var Canvas = require("canvas");
var Image = Canvas.Image;
var walk = require("walk");
/**
 * 截图
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
exports.snipImage_GLL = function (config,outPutPath,t_l_lat,t_l_lon,b_r_lat,b_r_lon,dateTime,fileType, next) {

    //查找原图文件
    var options = {
        followLinks:true,
        filters:[dateTime,config.Res,config.Key,fileType]
    };
    var walker = walk.walk(config.BasePath,options);
    walker.on("names",function (root,nodeNameArray) {
        var isFind = false;
        for(var tmpName in nodeNameArray){
            if(nodeNameArray[tmpName].indexOf(dateTime)!=-1 && nodeNameArray[tmpName].indexOf(config.Res)!=-1 && nodeNameArray[tmpName].indexOf(config.Key)!=-1 && nodeNameArray[tmpName].indexOf(fileType)!=-1){
                isFind = true;
                var srcImagePath = config.BasePath + "\\" + nodeNameArray[tmpName];
                //获取原图的大小
                var srcWidth = config.Width;
                var srcHeight = config.Height;
                //计算原图经纬度范围
                var srcLatDiff = Math.abs(config.TopLeftLat - config.BottomRightLat);
                var srcLonDiff = Math.abs(config.BottomRightLon - config.TopLeftLon);
                var perLatLine = Math.floor(srcHeight / srcLatDiff);
                var perLonLine = Math.floor(srcWidth / srcLonDiff);
                //计算截图大小
                var cutWidth = Math.abs(b_r_lon - t_l_lon) * perLonLine;
                var cutHeight = Math.abs(t_l_lat - b_r_lat) * perLatLine;
                //计算截图区域在原图中的行列
                var iOffset = (t_l_lon - config.TopLeftLon) * perLonLine;
                var jOffset = (config.TopLeftLat - t_l_lat) * perLatLine;
                fs.readFile(srcImagePath,function (err,data) {
                    if(err){
                        next(err,null);
                    }
                    var canvas = new Canvas(cutWidth,cutHeight);
                    var ctx = canvas.getContext('2d');
                    var srcImg = new Image;
                    srcImg.src = data;
                    srcImg.onload = function () {
                       // ctx.drawImage(srcImg,iOffset,jOffset,cutWidth,cutHeight);
                        ctx.drawImage(srcImg,0,0,cutWidth,cutHeight);
                        //ctx.save();
                        var stream = canvas.jpegStream();
                        next(null,stream);
                    };
                });
            }
        }
        if(!isFind){
            next("find error",null);
        }

    });


}