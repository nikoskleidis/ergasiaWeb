var map;
var geocoder = new google.maps.Geocoder();
var infowindow = new google.maps.InfoWindow({
    pixelOffset: new google.maps.Size(0, 30)
});
var markersArray = [];

function initializeMap(zoomLevel, createMarker, lat, lng, markerIcon) {
    if (lat == null) {
        lat = '37.975243';
        lng = '23.735529';
    }
    var latlng = new google.maps.LatLng(lat, lng);
    var myOptions = {
        zoom: zoomLevel,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        panControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        overviewMapControl: false,
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.DEFAULT
        }
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    google.maps.event.addListenerOnce(map, 'idle', function() {
        $("#search_location_loader").hide();
    });
    google.maps.event.addListener(map, 'zoom_changed', function() {
        if (map.getZoom() < 8) {
            map.setZoom(8);
        }
    });
    if (createMarker) {
        if (markerIcon == null) {
            addMarker(map, map.getCenter());
        }
        else {
            addIcon(map, map.getCenter(), markerIcon, '', '');
        }
    }
}

function geocode(address, updateMap, fillFields, markerIcon, drawCircle, radius, editable, isGold, markerDraggable, addressNo) {
    var dash_index = address.indexOf("-");
    geocoder.geocode({
        'address': address,
        'region': mapRegion
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK && (results[0].partial_match != true || dash_index != -1) && results.length == 1) {
            var resultAddress = results[0].formatted_address;
            var resultsArray = resultAddress.split(", ");
            if (resultsArray.length > 2) {
                var lat_lng = results[0].geometry.location;
                $("#lat" + addressNo).val(lat_lng.lat());
                $("#lng" + addressNo).val(lat_lng.lng());
                if (updateMap) {
                    reRenderMap(results[0], markerIcon, drawCircle, radius, editable, markerDraggable, addressNo);
                    if (addressNo.toString().length == 0) {
                        map.setZoom(16);
                    }
                }
                if (fillFields) {
                    var address = resultsArray[0];
                    var city = $.trim(resultsArray[1].replace(/\d/g, ""));
                    var zip = resultsArray[1].replace(/\D*/g, "");
                }
                $("#lng" + addressNo).change();
            } else {
                alertAddressNotFound();
            }
        } else {
            alertAddressNotFound();
        }
    });
}

function reverseGeocode(lat, lng, mapRegion) {
    var latlng = new google.maps.LatLng(lat, lng);
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        'location': latlng,
        'region': mapRegion
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK && results[0]) {
            var resultAddress = results[0].formatted_address;
            var resultsArray = resultAddress.split(", ");
            var address = resultsArray[0];
            var city = $.trim(resultsArray[1].replace(/\d/g, ""));
            var zip = resultsArray[1].replace(/\D*/g, "");
            $("#search_address").html(address + ', ' + zip + ', ' + city);
        } else {
            console.log("Geocoder failed due to: " + status);
        }
    });
}
function geocodeCity(city) {
    geocoder.geocode({
        'address': city,
        'region': mapRegion
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK && results[0].partial_match != true) {
            var lat_lng = results[0].geometry.location;
            $("#lat").val(lat_lng.lat());
            $("#lng").val(lat_lng.lng());
        } else {
            alertAddressNotFound();
        }
    });
}
function addMarker(map, position) {
    var marker = new google.maps.Marker({
        map: map,
        position: position
    });
    markersArray.push(marker);
}
function addIcon(map, position, icon, title, addressNo) {
    var marker = new google.maps.Marker({
        map: map,
        position: position,
        icon: icon,
        title: title
    });
    if (addressNo.toString().length == 0) {
        markersArray.push(marker);
    } else {
        markersArray[addressNo] = marker;
    }
}
// Deletes all overlays in the array by removing references to them
function deleteOverlays() {
    if (markersArray) {
        for (i in markersArray) {
            markersArray[i].setMap(null);
        }
        markersArray.length = 0;
    }
    if (typeof infoBoxesArray != 'undefined') {
        for (l in infoBoxesArray) {
            infoBoxesArray[l].close();
        }
        infoBoxesArray.length = 0;
    }
}
function reRenderMap(result, markerIcon, addressNo) {
    map.setCenter(result.geometry.location);
    if (markerIcon != false) {
        if (markerIcon == null) {
            addMarker(map, result.geometry.location);
        }
        else {
            addIcon(map, result.geometry.location, markerIcon, '', addressNo);
        }
    }
}
function alertAddressNotFound() {
    showAlert(addressNotFoundMsg, addressNotFoundTitle);
}