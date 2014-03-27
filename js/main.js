var langChosen = '';
var feelings = null;
var headerHtml = '';
var footerHtml = '';
var ajax_url = 'http://ergasiaweb.gr.185-4-133-73.linuxzone33.grserver.gr/services/';
var profileDataObj = {type: 'load_profile', user: null, fullname: null, rating: 0, avatar: 'images/no-image-available.jpg'};
var loginObj = null;
var user_lat = 37.983258;
var user_lng = 23.644827;
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
var app = {
    // Application Constructor
    initialize: function() {
        setChosenLang();
        appendLangScript();
        setLoginObj();
        headerHtml = render('header', {data: false});
        footerHtml = render('footer', {data: false});
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
Handlebars.registerHelper('datetime', function(time) {
    return Globalize.format(Globalize.parseDate(time, 'yyyy-MM-dd HH:mm:ss'), 'dd MMM, HH:mmtt');
});
Handlebars.registerHelper('translate', function(text, prefix) {
    return localizeText(prefix + text);
});
Handlebars.registerHelper('month_name', function(month) {
    return Globalize.culture().calendars.standard.months.names[month - 1];
});
Handlebars.registerHelper('rate_icons', function(rating) {
    return new Handlebars.SafeString(renderRatingIcons(rating));
});
Handlebars.registerHelper('each_category', function(items) {
    var out = "";

    for (var i = 0, l = items.length; i < l; i++) {
        var prof_cat = items[i];
        out += '<div class="prof_cat_outer"><div class="round_img prof_category ' + prof_cat.title + '"></div><div class="cat_title">' + localizeText(prof_cat.title) + '</div></div>';
    }

    return out;
});

$("div[data-role=page]").on('pageinit', function() {
    var header = $(this).find(".header");
    var footer = $(this).find(".footer");
    header.html(headerHtml).trigger("create");
    footer.html(footerHtml);
    header.find(".bars_link").on("tap", function(event) {
        slideTopMenu();
    });
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
                loadCategoryPlace($(this).data("catid"), displayCategoryResults, 1);
            })
            .on("scrollstop", function() {
                loadCategoryPlace($(this).data("catid"), displayCategoryResults, 1);
                appendArticles();
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