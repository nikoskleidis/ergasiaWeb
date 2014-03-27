<?php

require_once '../include/basicVars.inc.php';
require_once '../include/functions.inc.php';
require '../include/DBconnection.inc.php';
if (isset($_POST['action'])) {
    //public calls
    switch ($_POST['action']) {
        case 'login':
            // exit early if obviously invalid fields
            if (empty($_POST['mail']) || empty($_POST['pass']) || !filter_var($_POST['mail'], FILTER_VALIDATE_EMAIL)) {
                errorJSON(array('message' => "invalid_fields"));
            }
            $user = loginUser($_POST['mail'], $_POST['pass']);
            if (empty($user)) {
                errorJSON(array('message' => "invalid_credentials"));
            }
            echo json_encode($user);
            break;
        case 'signup':
            $user = replaceUser($_POST);
            if (empty($user)) {
                errorJSON(array('message' => "unexptected_error"));
            }
            echo json_encode($user);
            break;
        case 'check_mail':
            if (!emailAvailable($_POST['email'])) {
                errorJSON(array('message' => "existing_email"));
            }
            break;
    }
}
//private calls
else if (!empty($_REQUEST['public_token']) && !empty($_REQUEST['private_token']) && !empty($_REQUEST['timestamp'])) {
    $userId = getUserIdByTokens($_REQUEST['public_token'], $_REQUEST['private_token']);
    if (!($userId > 0)) {
        exitApp();
    }
    if (is_array($_REQUEST['data'])) {
        $data = $_REQUEST['data'];
    } else {
        parse_str($_REQUEST['data'], $data);
    }
    switch ($data['action']) {
        case 'load_places':
            echo json_encode(array("places" => getPlaces($_POST['lat'], $_POST['lng'], $_POST['catid'], $_POST['page'])));
            break;
    }
}

/* close connection */
$con->close();
?>
