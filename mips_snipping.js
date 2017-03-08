/**
 * Create by fantasylin on 05/17/2016
 */

var restify = require("restify");
var server = restify.createServer({
    name: "Mips_Snipping_Server"
});
 S
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());

var shkUtil = require("./shkutil.js");
var PATH = "/mips/global/";
var port = (process.argv[2]) ? process.argv[2] : 4202;
var localIP = shkUtil.getLoacalIP();

server.get({
    path: PATH + "/:satid/:instid/:datetime",
    version: "0.0.1"
}, _screenShot_GLL);

server.listen(port, localIP, function () {
    console.log('%s listening at %s ', server.name, server.url);
});


function _screenShot_GLL(req, res, next) {

    console.log(JSON.stringify(req.headers));

    var satid = req.params.satid;
    var instid = req.params.instid;
    var datetime = req.params.datetime;
    var l_t_lat = req.params.toplat;
    var l_t_lon = req.params.leftlon;
    var r_b_lat = req.params.bottomlat;
    var r_b_lon = req.params.rightlon;
    var resolution = req.params.resolution;
    var imageType = req.params.imagetype;
    var tranType = req.params.trantype;

    var module = require("./modules/" + satid.toLowerCase() + "_snipping.js");
    module.snip_GLL(satid, instid, imageType, datetime, l_t_lat, l_t_lon, r_b_lat, r_b_lon, resolution, function (err, data) {
        var result = {};
        if (err) {

            //TODO: err process
            result = {
                path : null,
                err : err
            };
            res.write(JSON.stringify(result));
            res.end();

        } else {

            //TODO: return image
            try {
                result = {
                    path : data.path,
                    err : null
                };
                if (tranType === "path") {
                    res.write(JSON.stringify(result));
                    res.end();
                } else {
                    res.writeHead(200, {'Content-Type': 'image/jpeg'});
                    res.write(data.stream);
                    res.end();
                }
                console.log("end");
            } catch (error) {
                result = {
                    path : null,
                    err : error
                };
                res.write(JSON.stringify(result));
                res.end();
            }
            return next();
        }
    });
}
