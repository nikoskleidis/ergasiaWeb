var langChosen = '';
var feelings = null;
var headerHtml = '';
var ajax_url = 'http://ergasiaweb.gr.185-4-133-73.linuxzone33.grserver.gr/services/';
var loginObj = null;
var user_lat = 37.993442;
var user_lng = 23.730506;
var srv_categories = {
    "categories": [
        {id: 1, third_party: 0, parent: 'public_services', title: 'public_wifi'},
        {id: 2, third_party: 0, parent: 'public_services', title: 'public_buildings'},
        {id: 3, third_party: 0, parent: 'public_services', title: 'monuments'},
        {id: 4, third_party: 0, parent: 'public_services', title: 'beaches'},
        {id: 5, third_party: 1, parent: 'foursquare', title: 'restaurants', category: catID_Food},
        {id: 6, third_party: 1, parent: 'foursquare', title: 'coffee_places', category: catID_Cafe + "," + catID_Cafeteria + "," + catID_Internet_Cafe + "," + catID_College_Cafeteria},
        {id: 7, third_party: 1, parent: 'foursquare', title: 'clothes_shop', category: catID_Clothing_Store},
        {id: 8, third_party: 1, parent: 'foursquare', title: 'public_parks', category: catID_Stadium},
        {id: 9, third_party: 1, parent: 'foursquare', title: 'art_gallery', category: catID_Art_Gallery},
        {id: 10, third_party: 1, parent: 'foursquare', title: 'libraries', category: catID_Library}
    ]
};
var placesPage = 1;
var allowAppend = true;
var scrollInitOpts = null;
var app = {
    // Application Constructor
    initialize: function() {
        setChosenLang();
        appendLangScript();
        setLoginObj();
        setScrollInitOpts();
        headerHtml = render('header', {data: false});
        $("#left-panel").html(render('left_panel', {data: false})).panel({
            create: function() {
                localizeElementTexts($(this));
                $(this).on("tap", ".favourites_link", loadFavouritePlaces)
            }
        });
        if (supports_geolocation()) {
            navigator.geolocation.getCurrentPosition(function(position) {
                user_lat = position.coords.latitude;
                user_lng = position.coords.longitude;
            }, geolocation_error, {maximumAge: 60000, timeout: 10000, enableHighAccuracy: true});
        }
        //getFsqCategoryList();
        //testGooglePlaces();
        //testFoursquareApi();
    }
};
app.initialize();

$("div[data-role=page]").on('pageinit', function() {
    var header = $(this).find(".header");
    header.html(headerHtml).trigger("create");
    localizeElementTexts($(this));
});
$("div[data-role=page]").on('pageshow', function() {
    if ($(this).find('.ajax_content').is(':empty')) {
        $.mobile.loading("show");
    }
});
$("div[data-role=page]").on('pagebeforeshow', function() {
    $(this).find(".ui-focus").removeClass("ui-focus");
});
$("div[data-role=page]").not(".signInPage").on('pagebeforeshow', function() {
    if (loginObj == null) {
        $(":mobile-pagecontainer").pagecontainer("change", '#login');
    }
});
$("#login").on('pagebeforecreate', function() {
    $("#loginDiv").html(render('login', {data: false}))
            .on("tap", "#submitLoginButton", function() {
                submitLoginForm();
            })
            .on('keypress', '#login_mail, #login_pass', function(event) {
                var keyPressed = event.which || event.keyCode;
                if (keyPressed === 13) {
                    submitLoginForm();
                }
            });
});
$("#signup").on('pagebeforecreate', function() {
    var mode = "signup";
    $("#signupDiv").html(render('user_form', {mode: mode, "signup": true}))
            .on("tap", "#submit" + mode + "Button", function() {
                submitSignupForm();
            })
            .on('keypress', 'input', function(event) {
                var keyPressed = event.which || event.keyCode;
                if (keyPressed === 13) {
                    submitSignupForm();
                }
            })
            .on("change", "#" + mode + "_mail", function() {
                checkEmailAvailability($(this), false);
            });
    createUserFormScroller(mode);
});

$("#home").on('pagebeforecreate', function() {
    $("#srv_categories_wrap").html(render('srv_categories', srv_categories))
            .trigger('create')
            .on("tap", ".prof_cat_outer", function() {
                if (user_lat > 0 && user_lng > 0) {
                    $(this).css({"width": ($(this).width() - 6) + "px", "height": ($(this).height() - 6) + "px"})
                            .addClass("ui-focus");
                    var catid = $(this).data("catid");
                    var category = $(this).data("category");
                    var third_party_load = ($(this).data("third_party") == 1) ? true : false;
                    var places_wrapper = $("#places_list");
                    places_wrapper.empty().data("catid", "").data("category", "");
                    if (third_party_load) { //apo trito server, p.x. foursquare
                        places_wrapper.data("category", category);
                        getFoursquareResults(category, displayCategoryResults, 0, 10);
                    } else { //apo to diko mas server
                        places_wrapper.data("catid", catid);
                        loadCategoryPlaces(catid, displayCategoryResults, 1);
                    }
                    $(":mobile-pagecontainer").pagecontainer("change", '#places');
                }
            })
            .on("tabsbeforeactivate", "#categories_tabs", function(event, ui) {
                $("#home").removeClass("google_places public_services").addClass(ui.newPanel.attr("id"));
            });
});

$("#home").on('pagebeforeshow', function() {
    $("#srv_categories").find(".prof_cat_outer.ui-focus").each(function() {
        $(this).css({"width": (6 + $(this).width()) + "px", "height": (6 + $(this).height()) + "px"});
    });
});
$("#places").on('pageinit', function() {
    $("#places_list").on("tap", ".place_selection", function(event) {
        var target = $(event.target);
        if (target.is(".favourite-icon")) {
            var placeId = target.closest(".place_selection").data("placeid");
            var action = '';
            if (target.is(".not_added")) {
                target.removeClass("not_added").addClass("added");
                action = 'add_to_favourites';
            } else {
                target.removeClass("added").addClass("not_added");
                action = 'remove_favourite';
            }
            privateAjaxCall({
                action: action,
                placeid: placeId
            }, checkFavouriteResponse);
        } else {
            var isOpened = $(this).hasClass("tapped");
            var currentSelection = $("#places_list").find(".place_selection.tapped");
            currentSelection.removeClass("tapped")
                    .find(".prof_details").slideUp("fast");
            if (!isOpened) {
                $(this).addClass("tapped").find(".prof_details").slideDown("normal", function() {
                    $('html, body').scrollTop($(this).parent().offset().top - $(".header:visible").height());
                });
            }
        }
    })
            .on("scrollstart", function() {
                appendCategoryPlaces();
            })
            .on("scrollstop", function() {
                appendCategoryPlaces();
            });
});
$("#settings").on('pagebeforecreate', function() {
    $("#settings_wrap").html(render('settings', {data: false}))
            .on("tap", "#editProfileButton", function() {
                var mode = "edit_profile";
                var popupElem = $("#editProfilePopup");
                popupElem.html(render('user_form', {mode: mode, "signup": false}))
                        .on("tap", "#submit" + mode + "Button", function() {
                            submitEditProfileForm();
                        })
                        .on("change", "#" + mode + "_mail", function() {
                            checkEmailAvailability($(this), true);
                        })
                        .trigger("create");
                localizeElementTexts(popupElem);
                createUserFormScroller(mode);
            })
            .on("tap", "#profilePicButton", function() {
                getPicture(0, "avatars");
            });
});
$("#search_location").on('pagebeforecreate', function() {
    $("#search_location_wrap").html(render('search_location', {data: false}));
})
        .on('pagebeforeshow', function() {
            deleteOverlays();
        })
        .on('pageshow', function() {
            $("#search_location_loader").show().removeClass("finished_loader").fadeOut(2000, 'linear', function() {
                $("#search_location_loader").not(".finished_loader").fadeIn(2000, 'linear');
            });
            window.setTimeout(function() {
                $("#search_location_loader").hide().addClass("finished_loader");
                reverseGeocode(user_lat, user_lng, "GR");
                initializeMap(14, true, user_lat, user_lng, 'images/map_icon.png');
                privateAjaxCall({
                    action: 'load_places',
                    catid: null,
                    lat: user_lat,
                    lng: user_lng,
                    page: 1
                }, appendMarkers);
                getFoursquareResults('', appendMarkers, 0, 50);
            }, 3500);
        });