//foursqare constants
var fsq_dateFormat = "YYYYMMDD";
var fsq_clientId = "LWN4S1D0VSOESV5MRH0UNN210LQ33M2B3ZJ2SEVFZ5LF4CWY";
var fsq_clientSecret = "K4BMEZQX05YKBAMGVH04UYXNTRR33MLEFAPPOCLQQE1MCRJS";
var catID_college = "4d4b7105d754a06372d81259";
var catID_governmentBuilding = "4bf58dd8d48988d126941735";
var catID_Library = "4bf58dd8d48988d12f941735";
var catID_Museum = "4bf58dd8d48988d181941735";
var catID_Stadium = "4bf58dd8d48988d184941735";
var catID_Nightlife = "4d4b7105d754a06376d81259";
var catID_Food = "4d4b7105d754a06374d81259";
var catID_Cafe = "4bf58dd8d48988d16d941735";
var catID_Cafeteria = "4bf58dd8d48988d128941735";
var catID_Gaming_Cafe = "4bf58dd8d48988d18d941735";
var catID_Internet_Cafe = "4bf58dd8d48988d1f0941735";
var catID_College_Cafeteria = "4bf58dd8d48988d1a1941735";
var catID_Clothing_Store = "4bf58dd8d48988d103951735";
var catID_Art_Gallery = "4bf58dd8d48988d1e2931735";
var fsq_categoryList;

var places = [];
var hasLoaded = false;
var loadedCounter = 0;

function testFoursquareApi() {
    var coordinates = '37.976648,23.725871';
    getCoffeeShops(coordinates);
}

/**
 * Find all points of the specified category arround the given coordinates
 * Transforms the given data to the form required in places.html template
 * 
 * @param {type} logLat
 * @param {type} categoryList
 * @returns {data}
 */
function getFoursquareResults(categoryList, callback, offset) {
    places = [];
    var url = "https://api.foursquare.com/v2/venues/explore";
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        data: {
            client_id: fsq_clientId,
            client_secret: fsq_clientSecret,
            ll: user_lat + "," + user_lng, //Required. Latitude and longitude to search near.
            radius: 800, //Limit results to venues within this many meters of the specified location. Defaults to a city-wide area.
            llAcc: 10000.0, //Accuracy of latitude and longitude, in meters
            alt: 0, //Altitude of the user's location, in meters.
            altAcc: 10000.0, //Accuracy of the user's altitude, in meters.
            limit: 10, //Number of results to return, up to 50.
            offset: offset, 
            v: getDateInFormat(new Date(), fsq_dateFormat), //Version parameter
            categoryId: categoryList
        },
        success: function(data) {
            transformToDisplayObject(data, callback); // results are displayed through this function
        },
        error: function() {
            console.log("failed");
        }
    });
}

function transformToDisplayObject(foursquareData, callback) {
    if (foursquareData && foursquareData.response && foursquareData.response.groups) {
        var array = foursquareData.response.groups[0].items;
        var len = array.length;
        for (var i = 0; i < len; i++) {
            var newPlace = {};
            var fsq_obj = array[i].venue;

            newPlace.id = fsq_obj.id;
            newPlace.title = fsq_obj.name;
            newPlace.distance = distanceToString(fsq_obj.location.distance);

            places.push(newPlace);
        }
        //create a list of ajax requests
        var deferreds = [];
        for (i = 0; i < places.length; i++) {
            var tmp_fsq_obj = array[i].venue;
            places[i].short_descr = extractShortDescr(tmp_fsq_obj);
            places[i].description = extractInfo(tmp_fsq_obj);
            deferreds.push(getMoreInfoFor(tmp_fsq_obj.id));
        }

        $.when.apply($, deferreds).done(function() {
            callback({"places": places, "with_rating": true});
        });
    }
    return places;
}

/**
 * Fill in the "info" field of the displayed object
 * 
 * @param {type} fsq_obj
 * @returns info
 */
function extractInfo(fsq_obj) {
    var info = fsq_obj.location.address ? "Address:" + fsq_obj.location.address : "";
    info += fsq_obj.location.city ? ",<br/>City: " + fsq_obj.location.city : "";
    info += fsq_obj.location.crossStreet ? ",<br/>Closest Street: " + fsq_obj.location.crossStreet : "";
    info += fsq_obj.location.state ? ",<br/>Area: " + fsq_obj.location.state : "";
    info += fsq_obj.location.postalCode ? ",<br/>Postal Code: " + fsq_obj.location.postalCode : "";
    info += fsq_obj.contact.formattedPhone ? ",<br/>Phone: " + fsq_obj.contact.formattedPhone : "";

    return info;
}

/**
 * Fill in the "short_descr" field of the displayed object
 * 
 * @param {type} fsq_obj
 * @returns short_descr
 */
function extractShortDescr(fsq_obj) {
    var short_descr = fsq_obj.location.address ? "Address:" + fsq_obj.location.address : "";
    short_descr += fsq_obj.location.city ? ", City: " + fsq_obj.location.city : "";

    return short_descr;
}

/**
 * Get More info about a place based on the provided id
 * @param {type} id
 * @returns {Array|getMoreInfoFor.newInfo}
 */
function getMoreInfoFor(id) {
    var url = "https://api.foursquare.com/v2/venues/" + id;
    var moreInfo;
    return $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        //async: false,
        data: {
            client_id: fsq_clientId,
            client_secret: fsq_clientSecret,
            limit: 1, //Number of results to return, up to 200.
            v: getDateInFormat(new Date(), fsq_dateFormat)          //Version parameter
        },
        success: function(data) {
            if (data && data.response && data.response.venue) {
                moreInfo = data.response.venue;
            }
            var newInfo = {avatar: "images/no-image-available.jpg", rating: 0};

            if (moreInfo) {
                var photo;
                if (moreInfo.photos && moreInfo.photos.groups[0] && moreInfo.photos.groups[0].items[0]) {
                    photo = moreInfo.photos.groups[0].items[0];
                    newInfo.avatar = photo.prefix + "300x300" + photo.suffix;
                }
                if (moreInfo.rating) {
                    newInfo.rating = (moreInfo.rating / 2).toFixed(1);
                }
            }
            for (i = 0; i < places.length; i++) {
                if (places[i].id === moreInfo.id) {
                    places[i].rating = newInfo.rating;
                    places[i].avatar = newInfo.avatar;
                    break;
                }
            }
        },
        error: function() {
            console.log("failed");
        }
    });
}

/**
 * Convert an integer value of meters to String representation of the form:
 * 123m or
 * 1.23km
 * @param {type} distance
 * @returns {String}
 */
function distanceToString(distance) {
    if (distance < 1000) {
        return distance + "m";
    } else {
        distance = distance / 1000;
        return distance.toFixed(2) + "km";
    }
}

/**
 * Retrieves all the categories of foursquare and outputs the data
 * The data can later be used for updating local category ids
 * 
 * @returns {undefined}
 */
function getFsqCategoryList() {
    var url = "https://api.foursquare.com/v2/venues/categories";
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        data: {
            client_id: fsq_clientId,
            client_secret: fsq_clientSecret,
            v: getDateInFormat(new Date(), fsq_dateFormat)          //Version parameter
        },
        success: function(data) {
//            console.log("Category List:");
//            console.log(data.response.categories);
        },
        error: function() {
            console.log("failed");
        }
    });
}
