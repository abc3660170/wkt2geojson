/**
 * 4326坐标系经纬度转换为3857
 * @param lon 经度
 * @param lat 纬度
 * @returns {*[]}
 */
var degrees2meters = function(lon,lat) {
    var x = lon * 20037508.34 / 180;
    var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    y = y * 20037508.34 / 180;
    return [x, y]
}

/**
 * 3857坐标系经纬度转换为4326
 * @param x 米
 * @param y 米
 * @returns {*[]}
 */
var meters2degress = function(x,y) {
    var lon = x *  180 / 20037508.34 ;
    //thanks magichim @ github for the correction
    var lat = Math.atan(Math.exp(y * Math.PI / 20037508.34)) * 360 / Math.PI - 90;
    return [lon, lat]
}

/**
 * 遍历所有的geojson中的下标位置
 * @param geojson
 * @param callback
 */
var findXYPos = function(coordinates,callback){
    _findXYPos.call(null,[],coordinates,callback)
}

function _findXYPos(parentArr,arr,callback){
    if(arr.length === 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number'){
        callback([])
        return;
    }
    arr.forEach(function(subArr,index){
        let _parentArr = [].concat(parentArr);
        _parentArr.push(index)
        if(subArr.length === 2 && typeof subArr[0] === 'number' && typeof subArr[1] === 'number'){
            callback(_parentArr)
        }else{
            _findXYPos.call(null,_parentArr,subArr,callback)
        }
    })
}

module.exports = {
    degrees2meters:degrees2meters,
    meters2degress:meters2degress,
    findXYPos:findXYPos
}