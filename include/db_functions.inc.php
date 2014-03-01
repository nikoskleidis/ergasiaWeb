<?php
//7667688887 jimmy is stupid
function checkExistingUserField($column, $value_to_check) {
    global $con;
    $query = "SELECT 1 " .
            "FROM users " .
            "WHERE " . $column . "=?";
    $stmt = $con->stmt_init();
    if ($stmt->prepare($query)) {
        $stmt->bind_param("s", $value_to_check);
        if (!$stmt->execute()) {
            logDbErrors('checkExistingUserField(): ' . $con->error);
        } else {
            $stmt->store_result();
            if ($stmt->num_rows > 0) {
                echo "false";
            } else {
                echo "true";
            }
            $stmt->free_result();
        }
        $stmt->close();
    }
}

function checkExistingEmail($email_to_check) {
    checkExistingUserField("email", $email_to_check);
}

function loginUser($membermail, $password) {
    global $con;
    if (!filter_var($membermail, FILTER_VALIDATE_EMAIL)) {
        return;
    }
    if ($password != null) {
        $password = md5($password);
    }
    $user = null;

    $query = "SELECT id, role_id, first_name, last_name, public_token, private_token " .
            "FROM users " .
            "WHERE email=? AND password=? AND enabled = 1";
    $stmt = $con->stmt_init();
    if ($stmt->prepare($query)) {
        $stmt->bind_param("ss", $membermail, $password);

        if (!$stmt->execute()) {
            logDbErrors('loginUser(): ' . $con->error);
        } else {
            $result = $stmt->get_result();
            $user = $result->fetch_object();
            updateUserTokens($user->id);
        }
        $stmt->close();
    }
    return $user;
}

function updateUserTokens($userId) {
    global $con;
    $p_token = sha1('23131221' . 'fdfds78fds87');
    $query = "UPDATE users " .
            "SET public_token=email, private_token=? " .
            "WHERE id=? ";
    $stmt = $con->stmt_init();
    if ($stmt->prepare($query)) {
        $stmt->bind_param("si", $p_token, $userId);

        if (!$stmt->execute()) {
            logDbErrors('updateUserTokens(): ' . $con->error);
        } else if ($stmt->affected_rows > 0) {
//            echo "success";
        }
        $stmt->close();
    }
}

function getFeelings() {
    global $con;
    $resultArray = array();
    $query = "SELECT id, title " .
            "FROM feelings " .
            "ORDER BY id";
    if ($result = $con->query($query)) {
        while ($obj = $result->fetch_object()) {
            array_push($resultArray, $obj);
        }
        $result->close();
    }
    return $resultArray;
}

function getProfessionals($role = 2, $enabled = 1, $sort = "id") {
    global $con;
    $roleFilter = ($role != null) ? " AND role_id = " . filter_var($role, FILTER_SANITIZE_NUMBER_INT) : '';
    $enabledFilter = ($enabled != null) ? " AND enabled = " . $enabled : '';
    $resultArray = array();
    $query = "SELECT id, email, CONCAT(first_name, ' ', last_name) as full_name, " .
            "mobile, CONCAT('" . SERVER_PATH . "images/avatars/', avatar) as avatar, " .
            "gender, birth_date, info, year_since, rating, FLOOR(0 + (RAND() * 10000)) as distance " .
            "FROM users " .
            "WHERE 1 = 1 " .
            $roleFilter . $enabledFilter .
            " ORDER BY " . $sort;
    if ($result = $con->query($query)) {
        while ($obj = $result->fetch_object()) {
            $obj->distance = formatDistance($obj->distance);
            array_push($resultArray, $obj);
        }
        $result->close();
    }
    return $resultArray;
}

function getCalendarDays($user, $dateFrom, $dateTo, $timePeriod = "DATE") {
    global $con;

    $userFilter = ($user != null) ? " AND p.user_id = " . filter_var($user, FILTER_SANITIZE_NUMBER_INT) : '';
    $dateRange = " BETWEEN '" . $dateFrom . "' AND '" . $dateTo . "' ";
    $dateFilter = ($dateFrom != null && $dateTo != null) ? " AND DATE(p.post_date)" . $dateRange : "";
    $resultArray = array();
    $query = "SELECT DAY(datefield) as cal_day, IFNULL(feeling, '" . NO_FEELING . "') as feeling, " .
            "IFNULL(post_cnt, 0) as feel_cnt, max_post_time " .
            "FROM calendar c LEFT OUTER JOIN " .
            "(SELECT DATE(p.post_date) as dpost_date, f.title as feeling, count(p.id) as post_cnt, " .
            "max(post_date) as max_post_time " .
            "FROM posts p, feelings f WHERE p.feeling_id = f.id " . $userFilter . $dateFilter .
            "GROUP BY DATE(post_date), f.title) p ON (p.dpost_date = c.datefield) " .
            "WHERE c.datefield" . $dateRange .
            "ORDER BY $timePeriod(datefield), post_cnt DESC, max_post_time DESC";
    if ($result = $con->query($query)) {
        while ($obj = $result->fetch_object()) {
            array_push($resultArray, $obj);
        }
        $result->close();
    }
    return processCalendarFeeling($resultArray);
}

function getMainFeeling($user, $daysBefore = null, $dateFrom = null, $dateTo = null) {
    global $con;

    $userFilter = ($user != null) ? " AND p.user_id = " . filter_var($user, FILTER_SANITIZE_NUMBER_INT) : '';
    $daysBeforeFilter = ($daysBefore != null) ? " AND DATE(p.post_date) = DATE(DATE_SUB(now(), INTERVAL " . filter_var($daysBefore, FILTER_SANITIZE_NUMBER_INT) . " DAY))" : '';
    $dateRange = " BETWEEN '" . $dateFrom . "' AND '" . $dateTo . "' ";
    $dateFilter = ($dateFrom != null && $dateTo != null) ? " AND DATE(p.post_date)" . $dateRange : "";
    $query = "SELECT f.title as feeling, count(p.id) as post_cnt, " .
            "max(post_date) as max_post_time " .
            "FROM posts p, feelings f WHERE p.feeling_id = f.id " .
            $daysBeforeFilter . $userFilter . $dateFilter .
            " GROUP BY f.title " .
            "ORDER BY post_cnt DESC, max_post_time DESC LIMIT 1";
    if ($result = $con->query($query)) {
        $obj = $result->fetch_object();
        $result->close();
    }
    return ((!empty($obj)) ? $obj->feeling : NO_FEELING);
}

function getUserProfile($user) {
    global $con;
    $user = filter_var($user, FILTER_SANITIZE_NUMBER_INT);
    $query = "SELECT id, email, username, last_name, first_name, avatar, gender, birth_date, " .
            "CONCAT('" . SERVER_PATH . "images/avatars/', u.avatar) as avatar, " .
            "(SELECT COUNT(id) FROM posts WHERE user_id = u.id) as feels, " .
            "(SELECT COUNT(id) FROM friends WHERE active = 1 AND (ask_user_id = u.id OR respond_user_id = u.id)) as friends " .
            "FROM users u " .
            "WHERE id = " . $user;
    if ($result = $con->query($query)) {
        $obj = $result->fetch_object();
        $result->close();
    }
    return $obj;
}

function replacePost() {
    global $con;
    echo $_POST['title'] . ' | ';
    $editMode = ($_POST['id'] > 0);
    $id = ($editMode) ? $_POST['id'] : null;
    $user_id = 1;
    $feeling_id = ($_POST['feeling'] > 0) ? $_POST['feeling'] : null;
    $title = ($_POST['title'] != "") ? $_POST['title'] : null;
    $content = null;
    $video = ($_POST['video'] != "") ? getVideoEmbedCode($_POST['video']) : null;
    $lat = ($_POST['lat'] != "") ? $_POST['lat'] : null;
    $lng = ($_POST['lng'] != "") ? $_POST['lng'] : null;
    if ($editMode) {
        $query = "UPDATE posts SET user_id = ?,feeling_id = ?,title = ?,content = ?," .
                "lat = ?,lng = ?,publicity = 1,published = 1 WHERE id = ?";
    } else {
        $query = "INSERT INTO posts (user_id,feeling_id,title,content,lat,lng," .
                "publicity,published,post_date) " .
                "VALUES (?, ?, ?, ?, ?, ?, 1, 1, now())";
    }
    $stmt = $con->stmt_init();
    if ($stmt->prepare($query)) {
        if ($editMode) {
            $stmt->bind_param("iissddi", $user_id, $feeling_id, $title, $content, $lat, $lng, $id);
        } else {
            $stmt->bind_param("iissdd", $user_id, $feeling_id, $title, $content, $lat, $lng);
        }
        if (!$stmt->execute()) {
            logDbErrors('replacePost(): ' . $stmt->error);
        } else {
            echo "success";
        }
        $stmt->close();
    }
}

function replaceUser() {
    global $con;
    $editMode = ($_POST['product_id'] > 0);
    $productId = ($editMode) ? $_POST['product_id'] : null;
    $typeId = ($_POST['type_id'] == '0') ? 0 : 1;
    $product_code = ($_POST['product_code'] != '') ? $_POST['product_code'] : null;
    $title = ($_POST['title'] != '') ? $_POST['title'] : null;
    $description = ($_POST['description'] != '') ? $_POST['description'] : null;
    $supplier_id = ($_POST['supplier_id'] != '-1') ? $_POST['supplier_id'] : null;
    $purchase_price = ($_POST['purchase_price'] != '') ? $_POST['purchase_price'] : null;
    $sales_price = ($_POST['sales_price'] != '') ? $_POST['sales_price'] : null;
    $max_discount = ($_POST['max_discount'] != '') ? $_POST['max_discount'] : null;
    $active = ($_POST['active'] == '0') ? 0 : 1;
    $vat_type_id = ($_POST['vat_type_id'] != '-1') ? $_POST['vat_type_id'] : 1;
    $commission_type_id = ($_POST['commission_type_id'] != '-1') ? $_POST['commission_type_id'] : 1;
    $extra_info = ($_POST['extra_info'] != '') ? $_POST['extra_info'] : null;
    $creation_date = $_POST['creation_date'];
    if ($editMode) {
        $query = "UPDATE products SET type = ?,product_code = ?,title = ?,description = ?,supplier_id = ?," .
                "purchase_price = ?,sales_price = ?,max_discount = ?,extra_info = ?,vat_type_id = ?,commission_type_id = ?," .
                "active = ?,creation_date = ?,update_date = now() WHERE id = ?";
    } else {
        $query = "INSERT INTO products (id,type,product_code,title,description,supplier_id,purchase_price," .
                "sales_price,max_discount,extra_info,vat_type_id,commission_type_id,active,creation_date,update_date) " .
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())";
    }
    $stmt = $con->stmt_init();
    if ($stmt->prepare($query)) {
        if ($editMode) {
            $stmt->bind_param("issssdddsiiisi", $typeId, $product_code, $title, $description, $supplier_id, $purchase_price, $sales_price, $max_discount, $extra_info, $vat_type_id, $commission_type_id, $active, $creation_date, $productId);
        } else {
            $stmt->bind_param("iissssdddsiiis", $productId, $typeId, $product_code, $title, $description, $supplier_id, $purchase_price, $sales_price, $max_discount, $extra_info, $vat_type_id, $commission_type_id, $active, $creation_date);
        }
        if (!$stmt->execute()) {
            logDbErrors('replaceProduct(): ' . $stmt->error);
        } else {
            echo "success";
        }
        $stmt->close();
    }
}

function deletePost($id) {
    global $con;
    $query = "DELETE FROM vats WHERE id = ?";
    $stmt = $con->stmt_init();
    if ($stmt->prepare($query)) {
        $stmt->bind_param("i", $id);
        if (!$stmt->execute()) {
            logDbErrors('deleteVat(): ' . $stmt->error);
        } else {
            echo "success";
        }
        $stmt->close();
    }
}

?>
