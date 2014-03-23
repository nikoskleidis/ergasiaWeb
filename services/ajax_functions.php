<?php
if (!isset($_POST['action'])) {
    exit();
}
require_once '../include/basicVars.inc.php';
require_once '../include/functions.inc.php';
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
        echo json_encode(array("places" => getPlaces($_POST['lat'], $_POST['lng'], $_POST['catid'])));
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
    case 'edit_post':
        echo replacePost();
        break;
}

/* close connection */
$con->close();
?>
