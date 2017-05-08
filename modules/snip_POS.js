/**
 * Created by lihy on 2017/3/16.
 */

var fs = require("fs");
var Canvas = require("canvas");
var Image = Canvas.Image;
var glob = require("glob");
var perLatLines = 0;  //每个纬度用多少行
var perLonLines = 0;  //每个经度用多少行
var blockLat = 0; //在纬度上分几块
var blockLon = 0; //在经度上分几块
var latScope = 0; //每个块的纬度跨度
var lonScope = 0; //每个块的经度跨度
var perBlockWidth = 0;//每个分块的宽度，在配置文件中已经定义好
var perBlockHeight = 0;//每个分块的高度，在配置文件中已经定义好
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
    var filterKey = config.key1 + "*" + config.Res + "*" + config.key2 + "*" + fileType;
    console.log(filterKey);
    var tmpBasePath = config.BasePath + "/" + dateTime + "/GLL/";
    glob(tmpBasePath + filterKey, function (err, files) {
        if(err){
            next(err,null);
        }
        latScope = Number(config.LatScope);
        lonScope = Number(config.LonScope);
        blockLat = 180 / latScope; //在纬度上有多少块
        blockLon = 360 / lonScope; //在经度上有多少块
        perBlockHeight = Number(config.Height);
        perBlockWidth = Number(config.Width);
        perLatLines = perBlockHeight / latScope;
        perLonLines = perBlockWidth / lonScope;
        var shotLatScope = t_l_lat - b_r_lat;
        var shotLonScope = b_r_lon - t_l_lon;
        var cutWidth = Math.floor(shotLonScope * perLonLines);
        var cutHeight = Math.floor(shotLatScope * perLatLines);
        //获取待截图列表
        var shotFiles = _getShotList(files,t_l_lat,t_l_lon,b_r_lat,b_r_lon);

        if (shotFiles.length == 0) {
            next("find error", null);
        }
        else{
            var canvas = new Canvas(cutWidth,cutHeight);
            var ctx = canvas.getContext('2d');
            var iOffset = 0;
            var jOffset = 0;
            var tmp = 0;
            shotFiles.forEach(function (item) {
                    console.log("*******************");
                    console.log("item=" + item.fileName);
                    tmp = item.width + iOffset;
                    //如果文件没找到，则忽略
                    if(item.fileName != ""){
                        iOffset = (item.block_l_t_lon - t_l_lon) * perLonLines;
                        jOffset = (t_l_lat - item.block_l_t_lat) * perLatLines;
                        console.log("*******************");
                        console.log("item.block_l_t_lon = " + item.block_l_t_lon + ",item.block_l_t_lat = " + item.block_l_t_lat);
                        console.log("iOffset = " + iOffset + ",jOffset = " + jOffset);
                        var buf = fs.readFileSync(item.fileName);
                        var srcImg = new Image;
                        srcImg.src = buf;
                        ctx.drawImage(srcImg, iOffset, jOffset, item.width, item.height);
                    }
                    //未找到文件
                    // if(item.fileName == ""){
                    //     if (tmp <= cutWidth) {
                    //         iOffset = tmp;
                    //         console.log("iOffset = " + iOffset);
                    //         console.log("jOffset = " + jOffset);
                    //     }
                    //     if(iOffset >= cutWidth){
                    //         jOffset = item.height + jOffset;
                    //         iOffset = 0;
                    //     }
                    // }
                    // else {
                    //     var buf = fs.readFileSync(item.fileName);
                    //     var srcImg = new Image;
                    //     srcImg.src = buf;
                    //     if (tmp <= cutWidth) {
                    //         console.log("*******************");
                    //         console.log("iOffset = " + iOffset);
                    //         console.log("jOffset = " + jOffset);
                    //         console.log("*******************");
                    //         ctx.drawImage(srcImg, iOffset, jOffset, item.width, item.height);
                    //         iOffset = tmp;
                    //     }
                    //     if(iOffset >= cutWidth){
                    //         jOffset = item.height + jOffset;
                    //         iOffset = 0;
                    //     }
                    // }
                }
            );
            console.log("draw ok");
            next(null, canvas.toBuffer());
        }
    });
};

/**
 * 获取在截图区域内的所有文件
 * @param files 在文件系统中找到的该时次所有文件
 * @param l_t_lat 截图区域左上角纬度
 * @param l_t_lon 截图区域左上角经度
 * @param r_b_lat 截图区域右下角纬度
 * @param r_b_lon 截图区域右下角经度
 * @private
 */
function  _getShotList(files,l_t_lat,l_t_lon,r_b_lat,r_b_lon) {
    var shotFiles = [];  //待截图的所有文件
    var tmpStr = null;
    var imageModel = null;
    //计算第一个在截图区域的文件编号，编号从0开始
    var tmpStartIndex = parseInt((90 - l_t_lat) / latScope);
    tmpStartIndex = parseInt((Number(l_t_lon) + 180) / lonScope) + Number(tmpStartIndex * blockLon);
    //计算最后一个在截图区域的文件编号
    var tmpEndIndex = parseInt((90 - r_b_lat) / latScope);
    tmpEndIndex = parseInt((Number(r_b_lon) + 180) / lonScope) + tmpEndIndex * blockLon;

    for(var tmpIndex = tmpStartIndex;tmpIndex <= tmpEndIndex;tmpIndex++){
        imageModel = new ItemModel();
        imageModel.tNo = tmpIndex;
        if(imageModel.check(l_t_lat,l_t_lon,r_b_lat,r_b_lon)){
            //获取文件名
            files.forEach(function (item) {
                if(item.indexOf("events") == -1) {  //将.events后缀名的文件排除
                    tmpStr = item.split("/");
                    tmpStr = tmpStr[tmpStr.length - 1];  //从全路径中获取文件名
                    tmpStr = tmpStr.split("_");
                    if(parseInt(tmpStr[2].replace("T","")) == tmpIndex){
                        imageModel.fileName = item;
                    }
                }
            });
            shotFiles.push(imageModel);
        }

    }
    return shotFiles;
}

function ItemModel() {
    var self = this;
    self.iOffset = 0;
    self.jOffset = 0;
    self.width = 0;
    self.height = 0;
    self.fileName = "";
    self.block_l_t_lat = 0;
    self.block_l_t_lon = 0;
    self.block_r_b_lat = 0;
    self.block_r_b_lon = 0;
    self.tNo = 0;

    self.check = function (l_t_lat,l_t_lon,r_b_lat,r_b_lon) {
        self.block_l_t_lat = 90 - parseInt(self.tNo / blockLon) * latScope;
        self.block_l_t_lon = -180 + parseInt(self.tNo % blockLon) * lonScope;
        self.block_r_b_lat = Number(self.block_l_t_lat) - Number(latScope);
        self.block_r_b_lon = Number(self.block_l_t_lon) + Number(lonScope);
        //首先判断是否不在截取范围内
        //对超出截图区域的忽略
        if((self.block_l_t_lat <= r_b_lat) ||
            (self.block_r_b_lat >= l_t_lat) ||
            (self.block_r_b_lon <= l_t_lon) ||
            (self.block_l_t_lon >= r_b_lon)){
            return false;
        }

        //该10°块文件完全包含在截图范围内
        if(self.block_l_t_lat <= l_t_lat && self.block_l_t_lon >=l_t_lon && self.block_r_b_lat >= r_b_lat && self.block_r_b_lon <= r_b_lon) {
            self.iOffset = 0;
            self.jOffset = 0;
            self.width = perBlockWidth;
            self.height = perBlockHeight;
        }
        else{
            //10°块经度范围包含了左上角经度,说明该10°块文件在截图区域的左边线上
            if(self.block_l_t_lon <= l_t_lon && self.block_r_b_lon >= l_t_lon){
                self.iOffset = (l_t_lon - self.block_l_t_lon) * perLonLines;
                self.width = perBlockWidth - self.iOffset;
                //如果10°块文件在截图左侧线上，不包含左上角和左下角
                if(self.block_l_t_lat <= l_t_lat && self.block_r_b_lat >= r_b_lat){
                    self.jOffset = 0;
                    self.height = perBlockHeight;
                }
                //如果10°块文件在截图左侧线上，包含截图区域左上角
                else if(self.block_l_t_lat > l_t_lat && self.block_r_b_lat < l_t_lat){
                    self.jOffset = (self.block_l_t_lat - l_t_lat) * perLatLines;
                    self.height = perBlockHeight - self.jOffset;
                }
                //如果10°块文件在截图左侧线上，包含截图区域左下角
                else{
                    self.jOffset = 0;
                    self.height = (self.block_l_t_lat - r_b_lat) * perLatLines;
                }
            }
            //10°块经度范围包含了右下角经度,说明该10°块文件在截图区域的右边线上
            else if(self.block_l_t_lon <= r_b_lon && self.block_r_b_lon >= r_b_lon){
                self.iOffset = 0;
                self.width = (r_b_lon - self.block_l_t_lon) * perLonLines;
                //如果10°块文件在截图右侧线上，不包含右上角和右下角
                if(self.block_l_t_lat <= l_t_lat && self.block_r_b_lat >= r_b_lat){
                    self.jOffset = 0;
                    self.height = perBlockHeight;
                }
                //如果10°块文件在截图右侧线上，包含截图区域右上角
                else if(self.block_l_t_lat > l_t_lat && self.block_r_b_lat < l_t_lat){
                    self.jOffset = (self.block_l_t_lat - l_t_lat) * perLatLines;
                    self.height = perBlockHeight - self.jOffset;
                }
                //如果10°块文件在截图右侧线上，包含截图区域右下角
                else{
                    self.jOffset = 0;
                    self.height = (self.block_l_t_lat - r_b_lat) * perLatLines;
                }
            }
            //10°块经度范围包含了左上角纬度,说明该10°块文件在截图区域的上边线上
            else if(self.block_l_t_lat >= l_t_lat && self.block_r_b_lat <= l_t_lat){
                self.iOffset = 0;
                self.jOffset = (self.block_l_t_lat - l_t_lat) * perLatLines;
                self.width = perBlockWidth;
                self.height = perBlockHeight - self.jOffset;
            }
            //10°块经度范围包含了右下角纬度,说明该10°块文件在截图区域的下边线上
            else if(self.block_l_t_lat >= r_b_lat && self.block_r_b_lat <= r_b_lat){
                self.iOffset = 0;
                self.jOffset = 0;
                self.width = perBlockWidth;
                self.height = (self.block_l_t_lat - r_b_lat) * perLatLines;
            }
        }
        return true;
    }
}