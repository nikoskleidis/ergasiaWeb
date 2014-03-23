function ajaxCall(data, callback) {
    $.post(ajax_url, data, callback, "json");
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

function appendLangScript() {
    addScriptTag("js/libs/cultures/globalize.culture." + langChosen + ".js");
    Globalize.culture(langChosen);
}

function submitLoginForm() {
    var mail = $("#login_mail").val();
    var pass = $("#login_pass").val();

    if (mail.length === 0 || pass.length === 0) {
        console.log("! empty fields");
        showAlert("empty fields");
        return false;
    }
    ajaxCall({
        "action": "login",
        "mail": mail,
        "pass": pass
    }, function(result) {
        if (result && result.code && result.code === "SUCCESS" && result.token_private && result.token_public) {
            localStorage.setItem("token_private", result.token_private);
            localStorage.setItem("token_public", result.token_public);
            localStorage.setItem("id", result.id); // you can store whatever other data you want
            $.mobile.changePage('#home');
            return;
        } else {
            showAlert("login failed");
        }
    });
}

function slideTopMenu() {
    $('#panel-menu').slideToggle("fast")
            .next("div").toggleClass("transparent");
}

function viewProfile(userId, name, rating, avatar) {
    profileDataObj.user = userId;
    profileDataObj.fullname = name;
    profileDataObj.rating = rating;
    profileDataObj.avatar = avatar;
    $.mobile.changePage('#rate_place');
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
        var appendClass = '';
        if (rating >= 1) {
            appendClass = ' full';
        } else if (rating > 0) {
            appendClass = ' half';
        }
        rating--;
        html += '<span class="star-icon' + appendClass + '">☆</span>';
    }
    return html;
}

function changePicture() {
    if (!navigator.camera) {
        showAlert("Camera API not supported", "Error");
        return;
    }
    var options = {
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: 1, // 0:Photo Library, 1=Camera, 2=Saved Photo Album
        encodingType: 0     // 0=JPG 1=PNG
    };

    navigator.camera.getPicture(
            function(imageData) {
                $('#edit_post_img').empty();
                $('<img />', {'src': imageData, 'class': 'post_img'}).appendTo('#edit_post_img');
                $('#feel_img').val(imageData);
            },
            function() {
                showAlert('Error taking picture', 'Error');
            },
            options);

    return false;
}

function nullifyObjectProperties(obj) {
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            obj[p] = null;
        }
    }
    return obj;
}

function supports_geolocation() {
    return 'geolocation' in navigator;
}
function geolocation_error(err) {
    console.warn('ERROR(' + err.code + '): ' + err.message);
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

function myjsonpfunction(data) {
//    console.log("callback");
//    console.log(data.responseData.results); //showing results data
    $.each(data.responseData.results, function(i, rows) {
//        console.log(rows.url); //showing  results url
    });
}

function testGooglePlaces() {
    console.log("testing google places");
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
