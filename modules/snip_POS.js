/**
 * Created by lihy on 2017/3/16.
 */

var fs = require("fs");
var Canvas = require("canvas");
var Image = Canvas.Image;
var glob = require("glob");

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
    //查找原图文件
    var filterKey = "*" + dateTime + "*." + fileType;
    glob(config.BasePath + filterKey,function(err,files){
        for(var tmpName in files){         
            if(files[tmpName].indexOf(config.Res)!=-1 && files[tmpName].indexOf(config.Key)!=-1){
                isFind = true;
                console.log("find");
                var srcImagePath = files[tmpName];
                console.log(srcImagePath);
                //获取10
                var srcWidth = config.Width;
                var srcHeight = config.Height;
                //计算原图经纬度范围
                var srcLatDiff = Math.abs(config.TopLeftLat - config.BottomRightLat);
                var srcLonDiff = config.BottomRightLon - config.TopLeftLon;
                if(srcLonDiff < 0){
                    srcLonDiff += 360;
                }
                var perLatLine = Math.floor(srcHeight / srcLatDiff);
                var perLonLine = Math.floor(srcWidth / srcLonDiff);
                //计算截图大小
                var cutWidth = Math.abs(b_r_lon - t_l_lon) * perLonLine;
                var cutHeight = Math.abs(t_l_lat - b_r_lat) * perLatLine;
                //计算截图区域在原图中的行列
                var iOffset = (t_l_lon - config.TopLeftLon) * perLonLine * -1;
                var jOffset = (config.TopLeftLat - t_l_lat) * perLatLine * -1;
                console.log("srcWidth="+srcWidth);
                console.log("srcHeight="+srcHeight);
                console.log("cutWidth="+cutWidth);
                console.log("cutHeight="+cutHeight);
                console.log("iOffset="+iOffset);
                console.log("jOffset="+jOffset);                                   

                fs.readFile(srcImagePath,function (err,buf) {
                    if(err){
                        next(err,null);
                    }
                                
                    var canvas = new Canvas(cutWidth,cutHeight);
                    var ctx = canvas.getContext('2d');
                    var srcImg = new Image;
                    srcImg.src = buf;                  
                    ctx.drawImage(srcImg,iOffset,jOffset,srcWidth,srcHeight);  
                    console.log("draw ok");                                                               
                    next(null,canvas.toBuffer());                    
                });
            }
        }
        if(!isFind){
            next("find error",null);
        }
    });
   
}