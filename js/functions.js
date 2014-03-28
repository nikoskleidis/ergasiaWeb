Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj));
}
Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key));
}
Handlebars.registerHelper('dateformat', function(time) {
    return Globalize.format(Globalize.parseDate(time, 'yyyy-MM-dd'), "dddd, d MMMM yyyy");
});
Handlebars.registerHelper('localizedate', function(time) {
    return Globalize.format(Globalize.parseDate(time, 'yyyy-MM-dd'), localizeText("parseDateFormat"));
});
Handlebars.registerHelper('postdateformat', function(time) {
    return Globalize.format(Globalize.parseDate(time, 'yyyy-MM-dd'), 'dd MMM yyyy');
});
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

function ajaxCall(url, data, callback) {
    $.post(url, data, callback, "json");
}
function publicAjaxCall(data, callback) {
    ajaxCall(ajax_url, data, callback);
}
function privateAjaxCall(data, callback) {
    if (!(varExists(loginObj))) {
        console.log("can't do private query: empty private/public tokens!");
        return;
    }
    var timestamp = Math.round(+new Date() / 1000);
    ajaxCall(ajax_url, {
        "timestamp": timestamp,
        "public_token": loginObj.public_token,
        "private_token": loginObj.private_token,
        "data": data
    }, callback);
}
function render(tmpl_name, tmpl_data) {
    if (!render.tmpl_cache) {
        render.tmpl_cache = {};
    }

    if (!render.tmpl_cache[tmpl_name]) {
        var tmpl_dir = 'templates';
        var tmpl_url = tmpl_dir + '/' + tmpl_name + '.html';
        var tmpl_string;
        $.ajax({
            url: tmpl_url,
            dataType: 'html',
            method: 'GET',
            async: false,
            success: function(data) {
                tmpl_string = data;
            }
        });
        render.tmpl_cache[tmpl_name] = Handlebars.compile(tmpl_string);
    }

    return render.tmpl_cache[tmpl_name](tmpl_data);
}

function varExists(vrbl) {
    return (typeof vrbl != "undefined" && vrbl != null);
}

function setChosenLang() {
    if (varExists(window.localStorage.getItem("lang_chosen"))) {
        langChosen = window.localStorage.getItem("lang_chosen")
    } else {
        var chzLang = 'en';
//        navigator.globalization.getLocaleName(
//                function(locale) {
//                    if (locale.value.indexOf('el') > 0) {
//                        chzLang = 'el';
//                    }
//                },
//                function() {
//                }
//        );
        window.localStorage.setItem("lang_chosen", chzLang);
        langChosen = chzLang;
    }
}

function setScrollInitOpts() {
    scrollInitOpts = {preset: 'date', animate: 'pop', mode: 'scroller', display: 'modal', cancelText: localizeText("cancelText"), setText: localizeText("setText"),
        dateFormat: localizeText("dateFormat"), dateOrder: localizeText("dateOrder"), monthNames: Globalize.culture().calendars.standard.months.names,
        monthNamesShort: Globalize.culture().calendars.standard.months.namesAbbr, rows: 5, minWidth: 76, height: 36, showLabel: false, selectedLineHeight: true, selectedLineBorder: 2, useShortLabels: true};
}

function setLoginObj(loginUsrObj) {
    if (varExists(loginUsrObj)) {
        localStorage.setObj("login_obj", loginUsrObj);
    }
    if (varExists(localStorage["login_obj"])) {
        loginObj = localStorage.getObj("login_obj");
        $(":mobile-pagecontainer").pagecontainer("change", '#home');
    }
}

function displayCategoryResults(data) {
    var container = $("#places_list");
    $.mobile.loading("hide");
    $("#top_progress_bar").hide();
    container.html(render('places', data)).listview("refresh");
    localizeElementTexts(container);
}

function appendCategoryResults(data) {
    allowAppend = true;
    var container = $("#places_list");
    $("#bottom_progress_bar").hide();
    container.append(render('places', data)).listview("refresh");
    localizeElementTexts(container);
}

function loadCategoryPlaces(catid, callback, page) {
    if (page == 1 || (allowAppend && placesPage < 20 && $(window).scrollTop() + $(window).height() > $(document).height() - 400)) {
        if (page == 1) {
            $.mobile.loading("show");
            $("#places_list").empty();
            $("#top_progress_bar").show();
        } else {
            allowAppend = false;
            $("#bottom_progress_bar").show();
        }
        placesPage = page || (placesPage + 1);
        privateAjaxCall({
            action: 'load_places',
            catid: catid,
            lat: user_lat,
            lng: user_lng,
            page: placesPage
        }, callback);
    }
}

function appendCategoryPlaces() {
    if ($("#places_list").data("catid").length > 0) {
        loadCategoryPlaces($("#places_list").data("catid"), appendCategoryResults, false);
    } else if (allowAppend) {
        allowAppend = false;
        getFoursquareResults($("#places_list").data("category"), appendCategoryResults, $("#places_list .place_selection").length);
    }
}

function appendLangScript() {
    addScriptTag("js/libs/cultures/globalize.culture." + langChosen + ".js");
    Globalize.culture(langChosen);
}

function submitLoginForm() {
    var mail = $("#login_mail").val();
    var pass = $("#login_pass").val();

    if (validateForm($("#loginDiv"), $("#loginErrorMsg"))) {
        publicAjaxCall({
            "action": "login",
            "mail": mail,
            "pass": pass
        }, function(result) {
            loginUser(result, "login_failed_msg");
        });
    }
}

function submitSignupForm() {
    var formObj = $("#signupForm");
    if (validateForm(formObj, formObj.find(".errorMsg"))) {
        publicAjaxCall(formObj.serialize(), function(result) {
            loginUser(result, "signup_failed_msg");
        });
    }
}

function submitEditProfileForm() {
    var formObj = $("#edit_profileForm");
    if (validateForm(formObj, formObj.find(".errorMsg"))) {
        $("#editProfilePopup").popup("close");
        privateAjaxCall(formObj.serialize(), function(result) {
            setProfileInfoObj({"profile": result});
        });
    }
}

function checkFavouriteResponse(result){
    if(result.code != "SUCCESS") {
        alert('Παρουσιάστηκε κάποιο απρόσμενο σφάλμα!');
    }
}

function loginUser(result, alertMsg) {
    if (result && result.public_token && result.private_token && result.first_name) {
        setLoginObj(result);
    } else {
        var printMsg = varExists(result.message) ? result.message : alertMsg;
        showAlert(localizeText(printMsg));
    }
}

function addProfileInfo(nameElem, imgElem, ratingElem) {
    if (varExists(nameElem)) {
        $(nameElem).html(profileDataObj.fullname);
    }
    if (varExists(imgElem)) {
        $(imgElem).attr("src", profileDataObj.avatar);
    }
    if (varExists(ratingElem)) {
        $(ratingElem).html(renderRatingIcons(profileDataObj.rating));
    }
}

function localizeElementTexts(elem) {
    elem.find("span[data-langmsg]").each(function() {
        $(this).html(Globalize.localize($(this).attr("data-langmsg"), Globalize.culture().name));
    });
}

function localizeText(text) {
    return Globalize.localize(text, Globalize.culture().name);
}

function renderRatingIcons(rating) {
    var html = '';
    for (var i = 1; i <= 5; i++)
    {
        if(isNaN(rating)) {
            break;
        }
        var appendClass = 'empty';
        if (rating >= 1) {
            appendClass = 'full';
        } else if (rating > 0) {
            if (rating < 0.5) {
                appendClass = 'one_third';
            } else if (rating == 0.5) {
                appendClass = 'half';
            } else {
                appendClass = 'two_third';
            }
        }
        rating--;
        html += '<span class="star-icon ' + appendClass + '">☆</span>';
    }
    return html;
}

function clearPrivateData() {
    loginObj = null;
    localStorage.removeItem("login_obj");
}

function signoutUser() {
    clearPrivateData();
    $(":mobile-pagecontainer").pagecontainer("change", '#login');
}

function nullifyObjectProperties(obj) {
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            obj[p] = null;
        }
    }
    return obj;
}

function createUserFormScroller(mode) {
    var maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - 365 * 5);
    $('#' + mode + '_birth_date_scroll').scroller($.extend(scrollInitOpts, {
        maxDate: maxDate,
        theme: 'android-ics light joy',
        onClose: function(valueText, btn, inst) {
            $("#" + mode + "_birth_date").val(Globalize.format(Globalize.parseDate(valueText, localizeText("parseDateFormat")), 'yyyy-MM-dd'));
        }
    }));
}
function checkEmailAvailability(mailObj, excludeCurrent) {
    if (excludeCurrent && mailObj.val() == profileInfoObj.profile.email) {
        return;
    }
    if (validateMail(mailObj.val())) {
        mailObj.addClass("ui-autocomplete-loading");
        publicAjaxCall({action: 'check_mail', email: mailObj.val()},
        function(result) {
            mailObj.removeClass("ui-autocomplete-loading");
            if (varExists(result.message)) {
                showAlert(localizeText(result.message));
            }
        });
    }
}
function addScriptTag(src) {
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.src = src;
    $("head").append(s);
}

function showAlert(message, title) {
    if (navigator.notification) {
        navigator.notification.alert(message, null, title, 'OK');
    } else {
        alert(title ? (title + ": " + message) : message);
    }
}


function validateURL(url) {
    var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
    var regex = new RegExp(expression);
    if (url.match(regex)) {
        return true;
    }
    return false;
}

function validateForm(form_object, errorMsgWrapper) {
    var form_validated = true;
    errorMsgWrapper.hide();
    form_object.find("input.required:not(:disabled)").each(function() {
        if ($(this).val() == "") {
            errorMsgWrapper.html(getErrorLabel(form_object, $(this)));
            form_validated = false;
            return false;
        }
    });
    if (form_validated) {
        form_object.find("input.email:not(:disabled)").each(function() {
            if (!validateMail($(this).val())) {
                form_object.find(".errorMsg").html("Παρακαλώ εισάγετε μία έγκυρη διεύθυνση email.");
                $(this).focus();
                form_validated = false;
                return false;
            }
        });
    }
    if (form_validated) {
        form_object.find("input:radio.required").each(function() {
            if (form_object.find('input:radio[name="' + $(this).attr("name") + '"]:checked').length === 0) {
                errorMsgWrapper.html(getErrorLabel(form_object, $(this)));
                form_validated = false;
                return false;
            }
        });
    }
    if (form_validated) {
        form_object.find("input.password_repeat:not(:disabled)").each(function() {
            if ($(this).val() !== form_object.find("input.password").val()) {
                form_object.find(".errorMsg").html(localizeText('passwords_no_match'));
                $(this).focus();
                form_validated = false;
                return false;
            }
        });
    }
    if (form_validated) {
        form_object.find("textarea.required:not(:disabled)").each(function() {
            if ($(this).val() == "") {
                errorMsgWrapper.html(getErrorLabel(form_object, $(this)));
                form_validated = false;
                return false;
            }
        });
    }
    if (!form_validated) {
        errorMsgWrapper.show();
    }
    return form_validated;
}
function getErrorLabel(form_object, elem) {
    elem.focus();
    return localizeText(form_object.find(".validation-msg[data-target=" + elem.attr("id") + "]").attr("data-langmsg"));
}
function validateMail(email_address) {
    var pattern = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i;
    return pattern.test(email_address);
}
function myjsonpfunction(data) {
//    console.log("callback");
//    console.log(data.responseData.results); //showing results data
    $.each(data.responseData.results, function(i, rows) {
//        console.log(rows.url); //showing  results url
    });
}

function testGooglePlaces() {
//    console.log("testing google places");
    var googleMapsKey = 'AIzaSyA6XElr0BQ6cmlay66GDG7smz14DlgJPeY';
    var url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?&callback=?';
    //var url = 'https://maps.googleapis.com/maps/api/place/radarsearch/json?location=51.503186,-0.126446&radius=5000&types=museum&sensor=false&key=AIzaSyA6XElr0BQ6cmlay66GDG7smz14DlgJPeY';

    $.ajax({
        url: url,
        method: 'GET',
        async: false,
        dataType: 'jsonp',
        jsonpCallback: 'myjsonpfunction',
        contentType: "application/json",
        data: {
            key: googleMapsKey,
            query: 'restaurants in Sydney',
            sensor: true
        },
        success: function(data) {
//            console.log(data);
        },
        error: function(data) {
            console.log("failed");
        }
    });
}

/**
 * Returns the given date in the specified date format
 * 
 * @param {type} date
 * @param {type} format
 * @returns {String}
 */
function getDateInFormat(date, format) {
    var dd = date.getDate();
    var mm = date.getMonth() + 1; //January is 0!

    var yyyy = date.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }

    if (format === "YYYYMMDD") {
        return yyyy + '' + mm + '' + dd;
    }
}

(function($)
{
    $.fn.autogrow = function(options)
    {
        return this.filter('textarea').each(function()
        {
            var self = this;
            var $self = $(self);
            var minHeight = $self.height();
            var noFlickerPad = $self.hasClass('autogrow-short') ? 0 : parseInt($self.css('lineHeight')) || 0;

            var shadow = $('<div></div>').css({
                position: 'absolute',
                top: -10000,
                left: -10000,
                width: $self.width(),
                fontSize: $self.css('fontSize'),
                fontFamily: $self.css('fontFamily'),
                fontWeight: $self.css('fontWeight'),
                lineHeight: $self.css('lineHeight'),
                resize: 'none',
                'word-wrap': 'break-word'
            }).appendTo(document.body);

            var update = function(event)
            {
                var times = function(string, number)
                {
                    for (var i = 0, r = ''; i < number; i++)
                        r += string;
                    return r;
                };

                var val = self.value.replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/&/g, '&amp;')
                        .replace(/\n$/, '<br/>&nbsp;')
                        .replace(/\n/g, '<br/>')
                        .replace(/ {2,}/g, function(space) {
                            return times('&nbsp;', space.length - 1) + ' '
                        });

                // Did enter get pressed? Resize in this keydown event so that the flicker doesn't occur.
                if (event && event.data && event.data.event === 'keydown' && event.keyCode === 13) {
                    val += '<br />';
                }

                shadow.css('width', $self.width());
                shadow.html(val + (noFlickerPad === 0 ? '...' : '')); // Append '...' to resize pre-emptively.
                $self.height(Math.max(shadow.height() + noFlickerPad, minHeight));
            }

            $self.change(update).keyup(update).keydown({event: 'keydown'}, update);
            $(window).resize(update);

            update();
        });
    };
})(jQuery);
