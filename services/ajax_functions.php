<?php

// reject incomplete requests
//if (empty($_REQUEST['token_public']) || empty($_REQUEST['hash']) || empty($_REQUEST['timestamp'])) {
//    errorJSON(array('message' => "empty_tokens"));
//}
//
//// try to find a user from the public token we've been sent (die if not found)
//try {
//    $User = User::find('first', array('conditions' => array('token_public = ?', $_REQUEST['token_public'])));
//} catch (Exception $e) {
//    errorJSON(array('message' => "invalid_tokens", "e" => $e->getMessage()));
//}
//// make sure the hash hasn't been tampered
//if ($_REQUEST['hash'] !== sha1($_REQUEST['timestamp'] . $User->token_private)) {
//    errorJSON(array('message' => "invalid_tokens"));
//}

// try and parse any additional data we've been sent
//if (!empty($_REQUEST['data'])) {
//    parse_str($_REQUEST['data'], $_REQUEST['data']);
//}
if (!isset($_POST['action'])) {
    exit();
}
require_once '../include/basicVars.inc.php';
require_once '../include/utility.php';
require_once '../include/db_functions.inc.php';
require '../include/DBconnection.inc.php';
switch ($_POST['action']) {
    case 'login':
        // exit early if obviously invalid fields
        if (empty($_POST['mail']) || empty($_POST['pass'])) {
            errorJSON(array('message' => "invalid_fields"));
        }
        $user = loginUser($_POST['mail'], $_POST['pass']);
        if (empty($user)) {
            errorJSON(array('message' => "invalid_credentials"));
        }

        // send the tokens back to the app & die
        successJSON(array(
            "token_private" => $user->private_token,
            "token_public" => $user->public_token,
            "id" => $user->id
        ));
        // shouldn't reach this
        break;
    case 'check_tokens':
        // if we've arrived this far, it's all good
        successJSON(array('message' => "all_good"));
        // shouldn't happen
        break;
    case 'load_places':
        echo json_encode(array("places" => getProfessionals()));
        break;
    case 'load_profile':
//        $user = $_POST['user_id'];
        $year = $_POST['year'];
        $month = $_POST['month'];
        $day = $_POST['day'];
        $date = (!empty($month) && !empty($day) && !empty($year) && checkdate($month, $day, $year)) ? $year . '-' . $month . '-' . $day : null;
        $daysBefore = (!empty($_POST['days_before'])) ? $_POST['days_before'] : null;
        $user = 1;
        $profile = getUserProfile($user);
        $posts = getPosts(false, $user, $date, $daysBefore);
        $lastPost = end($posts);
        $profile->feeling = isset($lastPost->feeling) ? $lastPost->feeling : NO_FEELING;
        $pastDays = array();
        for ($i = 1; $i <= 7; $i++) {
            $pastDays[] = array("feel" => getMainFeeling($user, $i), "days_before" => $i);
        }
        $profileArray = array("profile" => $profile, "posts" => $posts, "past_days" => $pastDays);
        echo json_encode($profileArray);
        break;
    case 'load_calendar':
        $year = filter_var($_POST['year'], FILTER_SANITIZE_NUMBER_INT);
        $month = filter_var($_POST['month'], FILTER_SANITIZE_NUMBER_INT);
        $dateFrom = $year . '-' . $month . '-01';
        $dateTo = $year . '-' . $month . '-31';
        $user = 1;
        $calendar = array("year" => $year, "month" => $month, "main_feeling" => getMainFeeling($user, null, $dateFrom, $dateTo), "days" => getCalendarDays($user, $dateFrom, $dateTo));
        echo json_encode($calendar);
        break;
    case 'edit_post':
        echo replacePost();
        break;
}

/* close connection */
$con->close();

function successJSON($content, $die = true) {
    wrapJSON('SUCCESS', $content, $die);
}

function errorJSON($content, $die = true) {
    wrapJSON('ERROR', $content, $die);
}

function wrapJSON($code, $content, $die = true) {
    // encode content as {foo:bar,foobar:baz}
    $content = json_encode((object) $content);
    // strip the first character '{' from the json encoded string
    $content = substr($content, 1, strlen($content) - 1);
    // add the "code" part to the string
    $buffer = '{"code":"' . $code . '",' . $content;

    echo $buffer;
    if ($die) {
        die;
    }
}
?>
