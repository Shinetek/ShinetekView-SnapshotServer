/**
 * Create by fantasylin on 05/17/2016
 */

var assert = require("assert");
var tileConfig = require("./tileconfig.json");
var shkutil = require("../shkutil.js");
var fs = require("fs");
var Canvas = require("canvas");
var Image = Canvas.Image;

function ImageItem() {
    var self = this;
    self.t_num = null;
    self.l_t_lat = null;
    self.l_t_lon = null;
    self.r_b_lat = null;
    self.r_b_lon = null;
    self.filename = null;
    self.leftI = 0;
    self.width = 0;
    self.topJ = 0;
    self.height = 0;
    self.resolution = 0;

    self.init = function (maxLat, minLat, maxLon, minLon) {
        self.topJ = parseInt((maxLat - self.l_t_lat) * 100000 / self.resolution);
        self.leftI = parseInt((self.l_t_lon - minLon) * 100000 / self.resolution);
        self.width = parseInt((self.r_b_lon - self.l_t_lon) * 100000 / self.resolution);
        self.height = parseInt((self.l_t_lat - self.r_b_lat) * 100000 / self.resolution);
    };
}

/**
 * @method 截图
 * @param {String} satid
 * @param {String} instid
 * @param {String} imageType - mersi:3_2_1 or 7_4_3, virr: 1_9_7 or 1_2_1
 * @param {String} datetime - (yyyyMMdd)
 * @param {Number} l_t_lat - 左上角点纬度
 * @param {Number} l_t_lon - 左上角点经度
 * @param {Number} r_b_lat - 右下角点纬度
 * @param {Number} r_b_lon - 右下角点经度
 * @param {Number} resolution -网格分辨率(m)
 * @param {Function} callback
 * @param {Error} callback.err
 * @param {Buffer} callback.data
 */
exports.snip_GLL = function (satid, instid, imageType, datetime, l_t_lat, l_t_lon, r_b_lat, r_b_lon, resolution, callback) {

    /*
    console.log("satid: " + satid.toUpperCase());
    console.log("instid: " + instid.toUpperCase());
    console.log("datetime: " + datetime);
    console.log("l_t_lat: " + l_t_lat);
    console.log("l_t_lon: " + l_t_lon);
    console.log("r_b_lat: " + r_b_lat);
    console.log("r_b_lon: " + r_b_lon);
    console.log("resolution: " + resolution);
    console.log("imageType: " + imageType);
    */

    if ((l_t_lat - r_b_lat) < 0) {
        var tmp1 = r_b_lat;
        r_b_lat = l_t_lat;
        l_t_lat = tmp1;
    }

    if ((r_b_lon - l_t_lon) < 0) {
        var tmp2 = r_b_lon;
        r_b_lon = l_t_lon;
        l_t_lon = tmp2;
    }
    var BASEPATH = (tileConfig.BasePath === undefined) ? "/MIPS/MIPSOUT/" : tileConfig.BasePath;
    var OUTPATH = (tileConfig.OutPath === undefined) ? "/MIPS/SNIPPINGOUT/" : tileConfig.OutPath;
    var minResolution = 1000;
    var satconfig = null;
    for (var p in tileConfig) {
        if (p === satid.toLowerCase()) {
            satconfig = tileConfig[p];
        }
    }
    var instconfig = null;
    for (var x in satconfig) {
        if (x === instid.toLowerCase()) {
            instconfig = satconfig[x];
        }
    }
    minResolution = (instconfig.orgResolution === undefined) ? 1000 : instconfig.orgResolution;

    resolution = (resolution < minResolution) ? minResolution : resolution;
    //1. get image list
    var num00 = satid.toUpperCase();
    var num01 = (instid.toUpperCase().length < 5) ? instid.toUpperCase() + "x" : instid.toUpperCase();
    var num03 = datetime;
    var num04 = null;
    if (instid.toUpperCase() == "MERSI") {
        num04 = "0250";
    } else if (instid.toUpperCase() == "VIRRX") {
        num04 = "1000";
    } else {
        num04 = "1000";
    }

    var num05 = imageType;
    console.log("r_b_lat: " + r_b_lat);
    console.log("l_t_lat: " + l_t_lat);
    console.log("l_t_lon: " + l_t_lon);
    console.log("r_b_lon: " + r_b_lon);
    var itemList = _getImageList(r_b_lat, l_t_lat, l_t_lon, r_b_lon);

    itemList.forEach(function (item) {
        var num02 = item.t_num;
        var filename = "{0}_{1}_T{2}_L2_PAD_MLT_GLL_{3}_POAD_{4}M_MS_{5}.JPG".format(num00, num01, num02, num03, num04, num05);
        item.filename = BASEPATH + "{0}/{1}/{2}/GLL/".format(satid.toUpperCase(), instid.toUpperCase(), datetime) + filename;
        item.resolution = resolution;
        item.init(l_t_lat, r_b_lat, r_b_lon, l_t_lon);
        console.log(JSON.stringify(item));
    });

    console.log(itemList.length);

    //2. snip & draw
    var width = parseInt((r_b_lon - l_t_lon) * 100000 / resolution);
    var height = parseInt((l_t_lat - r_b_lat) * 100000 / resolution);
    _snip(itemList, width, height, resolution, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
            callback(err, null);
            //throw err;
        } else {
            try {
                var computertime = new Date().format("yyyyMMddhhmmssS");
                var outFile = "{0}_{1}_{2}_{3}_{4}_{5}_{6}_{7}_{8}_{9}.jpeg".format(satid.toUpperCase(), instid.toUpperCase(), datetime, imageType, l_t_lat, l_t_lon, r_b_lat, r_b_lon, resolution, computertime);
                var outFullFile = OUTPATH + outFile;
                var out = fs.createWriteStream(outFullFile);
                out.write(data);
                console.log(outFullFile + "    data's length: " + data.length);
                out.close();
                var result = {};
                result.path = outFullFile;
                result.stream = data;
                callback(null, result);
            } catch (error) {
                callback(error, null);
            }
        }
    });

};

function _getImageList(minLat, maxLat, minLon, maxLon, resolution) {

    //console.log("minLat: " + minLat);
    //console.log("maxLat: " + maxLat);
    //console.log("minLon: " + minLon);
    //console.log("maxLon: " + maxLon);

    var itemList = [];
    var item = {};
    var top_lat = 0;
    var bottom_lat = 0;
    var left_lon = 0;
    var right_lon = 0;
    for (var j = 17; j >= 0; j--) {
        for (var i = 0; i < 36; i++) {
            top_lat = -90 + (j + 1) * 10;
            bottom_lat = -90 + j * 10;
            left_lon = i * 10 - 180;
            right_lon = (i + 1) * 10 - 180;

            if (minLon < right_lon && maxLat > bottom_lat && maxLon > right_lon && minLat < bottom_lat) { //type 1
                item = new ImageItem();
                item.t_num = j * 36 + i;
                item.l_t_lat = (maxLat < top_lat) ? maxLat : top_lat;
                item.l_t_lon = (minLon > left_lon) ? minLat : left_lon;
                item.r_b_lat = bottom_lat;
                item.r_b_lon = right_lon;
                itemList.push(item);
            } else if (maxLon > left_lon && maxLat > bottom_lat && minLon < left_lon && minLat < bottom_lat) { //type 2
                item = new ImageItem();
                item.t_num = j * 36 + i;
                item.l_t_lat = (top_lat > maxLat) ? maxLat : top_lat;
                item.l_t_lon = left_lon;
                item.r_b_lat = bottom_lat;
                item.r_b_lon = (right_lon > maxLon) ? maxLon : right_lon;
                itemList.push(item);
            } else if (minLon < right_lon && minLat < top_lat && maxLat > top_lat && maxLon > right_lon) { //type 3
                item = new ImageItem();
                item.t_num = j * 36 + i;
                item.l_t_lat = top_lat;
                item.l_t_lon = (minLon > left_lon) ? minLon : left_lon;
                item.r_b_lat = (minLat > bottom_lat) ? minLat : bottom_lat;
                item.r_b_lon = right_lon;
                itemList.push(item);
            } else if (maxLon > left_lon && minLat < top_lat && minLon < left_lon && maxLat > top_lat) { //type 4
                item = new ImageItem();
                item.t_num = j * 36 + i;
                item.l_t_lat = top_lat;
                item.l_t_lon = left_lon;
                item.r_b_lat = (minLat > bottom_lat) ? minLat : bottom_lat;
                item.r_b_lon = (maxLon < right_lon) ? maxLon : right_lon;
                itemList.push(item);
            }
        }
    }
    return itemList;
}

function _snip(imageItemList, width, height, resolution, callback) {
    assert.ok(callback !== null);
    assert.ok(typeof callback == "function");

    var objCanvas = new Canvas(width, height);
    var ctx = objCanvas.getContext("2d");
    _draw(imageItemList, objCanvas, ctx, callback);

}

function _draw(imageItemList, canvas, ctx, callback) {
    assert.ok(callback !== null);
    assert.ok(typeof callback == "function");
    assert.ok(ctx !== null);

    if (imageItemList.length < 1) {
        ctx.save();
        var chunks = [];
        var size = 0;
        var stream = canvas.jpegStream();
        var data;
        stream.on("data", function (chunk) {
            //console.log("chunk's length: " + chunk.length);
            chunks.push(chunk);
            size += chunk.length;
        });
        stream.on("end", function () {
            data = Buffer.concat(chunks, size);
            callback(null, data);
        });
        return;
    }

    var item = imageItemList.shift();

    fs.readFile(item.filename, function (err, data) {
        if (err) {
            if (err.code == "ENOENT") {
                _draw(imageItemList, canvas, ctx, callback);
            } else {
                throw err;
            }

        } else {
            var image = new Image();
            image.src = data;
            ctx.drawImage(image, item.leftI, item.topJ, item.width, item.height);
            _draw(imageItemList, canvas, ctx, callback);
        }
    });
}
