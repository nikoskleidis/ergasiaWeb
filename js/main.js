var langChosen = '';
var feelings = null;
var headerHtml = '';
var ajax_url = 'http://ergasiaweb.gr.185-4-133-73.linuxzone33.grserver.gr/services/';
var profileDataObj = {type: 'load_profile', user: null, fullname: null, rating: 0, avatar: 'images/no-image-available.jpg'};
var loginObj = null;
var user_lat = 37.993442;
var user_lng = 23.730506;
var srv_categories = {
    "categories": [
        {id: 1, parent: 'public_services', title: 'public_wifi'},
        {id: 2, parent: 'public_services', title: 'public_buildings'},
        {id: 3, parent: 'public_services', title: 'monuments'},
        {id: 4, parent: 'public_services', title: 'beaches'},
        {id: 5, parent: 'foursquare', title: 'restaurants'},
        {id: 6, parent: 'foursquare', title: 'coffee_places'},
        {id: 7, parent: 'foursquare', title: 'clothes_shop'},
        {id: 8, parent: 'foursquare', title: 'public_parks'},
        {id: 9, parent: 'foursquare', title: 'painting_events'},
        {id: 10, parent: 'foursquare', title: 'book_events'}
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
            }
        });
        if (supports_geolocation()) {
            navigator.geolocation.getCurrentPosition(function(position) {
                user_lat = position.coords.latitude;
                user_lng = position.coords.longitude;
            }, geolocation_error, {maximumAge: 60000, timeout: 5000, enableHighAccuracy: true});
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
                    var category = $(this).data("catid");
                    if (category === 5) { //restaurants

                    } else if (category === 6) { // coffee_places
                        getCoffeeShops(user_lat + "," + user_lng);
                    } else if (category === 7) { // clothes_shop

                    } else if (category === 8) { //public_parks

                    } else if (category === 9) { //painting_events

                    } else if (category === 10) { //book_events

                    } else {
                        loadCategoryPlaces($(this).data("catid"), displayCategoryResults, 1);
                    }
                    $.mobile.changePage('#places');
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
        if (target.is(".pickButton")) {
            target.closest(".place_selection").addClass("ui-focus");
            viewProfile(target.attr("data-id"), target.attr("data-name"), target.attr("data-rating"), target.attr("data-img"));
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
                loadCategoryPlaces($("#places_list .places_cat_list").data("catid"), appendCategoryResults, false);
            })
            .on("scrollstop", function() {
                loadCategoryPlaces($("#places_list .places_cat_list").data("catid"), appendCategoryResults, false);
            });
});
$("#rate_place").on('pagebeforecreate', function() {
    $("#rating_wrap").html(render('rate_place', {data: false}));
});
$("#rate_place").on('pagebeforeshow', function() {
    addProfileInfo("#rating_prof_name", "#rating_img", "#current_rating");
});
$("#settings").on('pagebeforecreate', function() {
    $("#settings_wrap").html(render('settings', {data: false}))
            .on("tap", "#editProfileButton", function() {
                var mode = "edit_profile";
                var popupElem = $("#editProfilePopup");
                popupElem.html(render('user_form', $.extend(profileInfoObj, {mode: mode, "signup": false})))
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
$("#rate_place").on('pageshow', function() {
    var container = $("#rating_bars");
    container.find(".price_bar").animate({width: "80%"}, 1500).next(".rating_score").html("80%");
    container.find(".quality_bar").animate({width: "60%"}, 1500).next(".rating_score").html("60%");
    container.find(".availability_bar").animate({width: "30%"}, 1500).next(".rating_score").html("30%");
});
$("#search_location").on('pagebeforecreate', function() {
    $("#search_location_wrap").html(render('search_location', {data: false}));
});
$("#search_location").on('pageshow', function() {
    $("#search_location_loader").fadeOut(2000, 'linear', function() {
//        $("#search_location_loader").fadeIn(2000, 'linear');
    });
    if (navigator.geolocation) {
        var options = {timeout: 31000, enableHighAccuracy: true, maximumAge: 90000};
        navigator.geolocation.getCurrentPosition(
                function(position) {
                    var lat = position.coords.latitude;
                    var lng = position.coords.longitude;
                    reverseGeocode(lat, lng, "GR");
                    initializeMap(14, true, lat, lng, 'images/map_icon.png');
                },
                function() {
                    showAlert('Error getting location');
                }, options);
    } else {
        showAlert("no geolocation!!!", "no");
    }
});