var parse = require('wellknown');
var fs = require('fs')
var csvtojson = require('csvtojson');
var loggerFactory = require('./logConfig')
var geoTools = require('./geometry-tools')
const logger = loggerFactory.logger;
const dataLogger = loggerFactory.dataLogger;

var argv = require('yargs')
    .usage('Usage: $0 <file>  -d [string] -c [num]')
    .alias('d', 'delimiter').describe('d', 'csv文件的分隔符')
    .alias('c', 'datacol').describe('c', 'csv文件第几列为wkt列，from 1 start not 0.')
    .alias('n', 'noheader').boolean('n').describe('n', '是否去掉csv文件的第一行')
    .alias('o', 'outfile').string('o').describe('o', '文件的输出dir')
    .alias('t', 'epsg').string('o').describe('o', '文件的输出dir')
    .default({"noHeader":false,"outfile":"./geo.geojson","epsg":"4326"})
    .demandOption(['c','d'])
    .parse(process.argv)

/*************** 解析csv文件，pick wkt 字段 ****************/
//todo 这里需要从命令行取得
var file  = argv._.slice(2);
var delimiter = argv.d;   // 定义csv 分隔符
var dataCol = argv.c;     // 定义 wkt数据所在列
var noHeader = argv.n;   // 是否要去掉第一行数据
var outfile = argv.o;   // 是否要去掉第一行数据
var epsg = argv.t  // 默认转换为 lon lat

// 检测文件是否存在
if(file.length === 0){
    logger.error("没有检测的csv文件输入！")
    process.exit(1)
}else{
    fs.access(file[0], fs.constants.R_OK, (err) => {
        if(err){
            logger.error("文件无法访问或不存在！",err)
            process.exit(1)
        }
    });
}
file = file[0]

// 临时数据集
var wktDataArray = [];
var geojsonArray = [];

const promise = new Promise(function(resolve,reject){
    logger.debug('wkt文件的解析路径：'+ file);
    logger.info('csv文件解析阶段......');
    csvtojson({noheader:true,delimiter:delimiter})
        .fromFile(file)
        .on("json",(jsonObj, rowIndex)=>{
            if(noHeader && rowIndex === 0) return;
            // 指定 wkt 列存到 wktDataArray
            dataLogger.debug("第"+rowIndex+"行第"+dataCol+"列的数据为："+JSON.stringify(jsonObj['field'+dataCol]));
            wktDataArray.push(jsonObj['field'+dataCol])

        })
        .on('done',(error,data)=>{
            if(error) reject(error)
            logger.debug('csv文件解析完成！');
            dataLogger.debug("生成的wkt数组数据：")
            dataLogger.debug(wktDataArray)
            resolve(wktDataArray)
        })
})

promise.then(function(wktDataArray){
    return new Promise(function (resolve,reject) {
        /*************** 通过 wkt字段 循环生成 geosjon 字段 ****************/
        logger.info('wkt数据转换为geojson阶段......');
        wktDataArray.forEach(function(val){
            var tempGeojson = parse(val)
            geojsonArray.push(parse(val));
        })
        dataLogger.debug("生成的geojson数组数据：")
        dataLogger.debug(JSON.stringify(geojsonArray))
        resolve(geojsonArray)
    })
}).then(function(geojsonArray) {
    return new Promise(function (resolve,reject) {
        /*************** 将所有的geojson字段合并为标准的geojson文件 ****************/
        logger.info('多个geojson合并为一个标准geojson阶段......');
        let features = []
        geojsonArray.forEach(function (val) {
            features.push({
                "type": "Feature",
                "properties": {},
                "geometry": val
            })
        })
        let featureCollection = {
            "type": "FeatureCollection",
            "features": features
        }
        dataLogger.debug("生成的FeatureCollection数据：")
        dataLogger.debug(JSON.stringify(featureCollection))
        resolve(featureCollection)
    })
    // 最后生成的数据集合形如下面的例子：
    // {
    //     "type": "FeatureCollection",
    //     "features": [
    //     {
    //         "type": "Feature",
    //         "properties": {},
    //         "geometry": {
    //             "type": "Polygon",
    //             "coordinates": [
    //                 [
    //                     [
    //                         84.5129986875,
    //                         28.7479413433301
    //                     ],
    //                     [
    //                         84.5129986875,
    //                         28.7662352125
    //                     ],
    //                     [
    //                         84.5129986875,
    //                         28.7479413433301
    //                     ]
    //                 ]
    //             ]
    //         }
    //     },
    //     {
    //         "type": "Feature",
    //         "properties": {},
    //         "geometry": {
    //             "type": "Point",
    //             "coordinates": [
    //                 84.51842308044432,
    //                 28.75765206063498
    //             ]
    //         }
    //     }
    // ]
    // }
}).then(function(featureCollection){
    fs.writeFile(outfile,JSON.stringify(featureCollection), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
}).catch(function(reason){
    logger.error(reason)
})





/*************** geojson文件输出 ****************/
//logger.info('最后阶段，生成geojson文件......');