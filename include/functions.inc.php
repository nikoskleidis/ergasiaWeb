<?php

function userFieldAvailable($column, $value_to_check) {
    global $con;
    $result = false;
    $query = "SELECT 1 " .
            "FROM users " .
            "WHERE " . $column . "=?";
    $stmt = $con->stmt_init();
    if ($stmt->prepare($query)) {
        $stmt->bind_param("s", $value_to_check);
        if (!$stmt->execute()) {
            logErrors('userFieldAvailable(): ' . $con->error);
        } else {
            $stmt->store_result();
            if ($stmt->num_rows == 0) {
                $result = true;
            }
            $stmt->free_result();
        }
        $stmt->close();
    }
    return $result;
}

function emailAvailable($email_to_check) {
    return userFieldAvailable("email", $email_to_check);
}

function loginUser($membermail, $password) {
//    $query = "SELECT id " .
    $query = "SELECT id, last_name, first_name, public_token, private_token " .
            "FROM users " .
            "WHERE email='$membermail' AND password='" . md5($password) . "' AND enabled = 1";
    return fetchQueryObject($query);
//        $tmpuser = $result->fetch_object();
//        if (updatePrivateToken($tmpuser->id)) {
//            $user = getUserProfile($tmpuser->id, false);
//        }
}

function getUserIdByTokens($public_token, $private_token) {
    global $con;
    $query = "SELECT id " .
            "FROM users " .
            "WHERE public_token=? AND private_token = ? AND enabled = 1";
    $stmt = $con->stmt_init();
    if ($stmt->prepare($query)) {
        $stmt->bind_param("ss", $public_token, $private_token);
        $stmt->execute();
        $stmt->bind_result($uId);
        $stmt->fetch();
        $stmt->close();
    }
    return $uId;
}

function updateUserTokens($userMail) {
    global $con;
    $result = false;
    $public_token = generatePublicToken($userMail);
    $private_token = generatePrivateToken();
    $query = "UPDATE users " .
            "SET public_token=?, private_token=?, last_visit=now() " .
            "WHERE email=? ";
    $stmt = $con->stmt_init();
    if ($stmt->prepare($query)) {
        $stmt->bind_param("sss", $public_token, $private_token, $userMail);
        if (!$stmt->execute()) {
            logErrors('updateUserTokens(): ' . $con->error);
        } else {
            $result = true;
        }
        $stmt->close();
    }
    return $result;
}

function updatePrivateToken($userId) {
    global $con;
    $result = false;
    $private_token = generatePrivateToken();
    $query = "UPDATE users " .
            "SET private_token=?, last_visit=now() " .
            "WHERE id=? ";
    $stmt = $con->stmt_init();
    if ($stmt->prepare($query)) {
        $stmt->bind_param("si", $private_token, $userId);
        if (!$stmt->execute()) {
            logErrors('updatePrivateToken(): ' . $con->error);
        } else {
            $result = true;
        }
        $stmt->close();
    }
    return $result;
}

function getPlaces($lat, $lng, $catid = null, $page = 1, $sort = "distance", $maxDistanceMeters = 5) {
    global $con;
    $resultArray = array();
    $categoryFilter = ($catid != null) ? " AND category_id = " . filter_var($catid, FILTER_SANITIZE_NUMBER_INT) : "";
    $distanceCalc = "(6371 * acos(cos(radians(" . $lat . ")) * cos(radians(lat)) * cos(radians(lng) - radians(" . $lng . ")) + sin(radians(" . $lat . ")) * sin(radians(lat)))) ";

    $query = "SELECT id, title, description, lat, lng, " .
            "$distanceCalc as distance, 'images/no-image-available.jpg' as avatar " .
            "FROM places " .
            "WHERE $distanceCalc < $maxDistanceMeters" . $categoryFilter .
            " ORDER BY " . $sort . " LIMIT " . (($page - 1) * 10) . ", 10";
    $resultArray = fetchQueryArray($query);
    foreach ($resultArray as $key => $obj) {
        $resultArray[$key]->distance = formatDistance($obj->distance);
    }
    return $resultArray;
}

function getUserProfile($userId, $fetchAllFields = true) {
    $userId = filter_var($userId, FILTER_SANITIZE_NUMBER_INT);
    $extraFields = ($fetchAllFields) ? "email, avatar, gender, birth_date, " .
            "CONCAT('" . SERVER_PATH . "images/avatars/', u.avatar) as avatar, " .
            "(SELECT COUNT(id) FROM posts WHERE user_id = u.id) as feels, " .
            "(SELECT COUNT(id) FROM friends WHERE active = 1 AND (ask_user_id = u.id OR respond_user_id = u.id)) as friends" : "public_token, private_token";
    $query = "SELECT id, last_name, first_name," . $extraFields .
            " FROM users u " .
            "WHERE id = " . $userId;
    return fetchQueryObject($query);
}

function replaceUser($data, $editMode = false) {
    global $con;
    validateProfileFields($data, $editMode);
    $user = false;
    $password = md5($data['pass']);
    if ($editMode) {
        $query = "UPDATE users SET email = ?,password = ?,last_name = ?,first_name = ?," .
                "gender = ?,birth_date = ? WHERE public_token=? AND private_token = ? AND enabled = 1";
    } else {
        $public_token = generatePublicToken($data['mail']);
        $private_token = generatePrivateToken();
        $query = "INSERT INTO users (email,password,public_token,private_token," .
                "last_name,first_name,gender,birth_date,creation_date) " .
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, now())";
    }
    $stmt = $con->stmt_init();
    if ($stmt->prepare($query)) {
        if ($editMode) {
            $stmt->bind_param("ssssisss", $data['mail'], $password, $data['last_name'], $data['first_name'], $data['gender'], $data['birth_date'], $data['public_token'], $data['private_token']);
        } else {
            $stmt->bind_param("ssssssis", $data['mail'], $password, $public_token, $private_token, $data['last_name'], $data['first_name'], $data['gender'], $data['birth_date']);
        }
        if (!$stmt->execute()) {
            logErrors('replaceUser(): ' . $stmt->error);
        } else {
            if ($editMode) {
                $user = true;
            } else {
                $user = array("private_token" => $private_token,
                    "public_token" => $public_token,
                    "first_name" => $data['first_name'],
                    "last_name" => $data['last_name'],
                    "id" => $stmt->insert_id);
            }
        }
        $stmt->close();
    }
    return $user;
}

function fetchQueryObject($query) {
    global $con;
    $obj = null;
    if ($result = $con->query($query)) {
        $obj = $result->fetch_object();
        $result->close();
    }
    return $obj;
}

function fetchQueryArray($query) {
    global $con;
    $resultArray = array();
    if ($result = $con->query($query)) {
        while ($obj = $result->fetch_object()) {
            $resultArray[] = $obj;
        }
        $result->close();
    }
    return $resultArray;
}

?>
