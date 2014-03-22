<?php
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

function getPlaces($sort = "id") {
    global $con;
    $resultArray = array();
    $query = "SELECT id, title, description, lat, lng, " .
            "FLOOR(0 + (RAND() * 10000)) as distance " .
            "FROM places " .
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


function redirectToHome() {
    header("location: " . SERVER_PATH);
    exit();
}

function sendEmail($receiverMail, $siteMail, $subject, $message_body, $lang = "el", $adminCopy = true, $printAddSendersMsg = false) {
    $add_to_senders_msg_start = ($lang = "el") ? "Σιγουρευτείτε ότι έχετε προσθέσει το " : "";
    $add_to_senders_msg_end = ($lang = "el") ? " στη λίστα με τους ασφαλείς σας αποστολείς, ώστε να συνεχίσετε να λαμβάνετε email απο εμάς." : "";
    $headers = "MIME-Version: 1.0\n";
    $headers .= "Content-type: text/html; charset=UTF-8" . "\n";
    $headers .= "From: ergasia-web.gr <" . $siteMail . ">" . "\n";
    $headers .= "Reply-to: " . $siteMail . "" . "\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    $subject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

    $message_header = '<html><body><br/><table width="100%" height="100%" cellspacing="0" cellpadding="0" bgcolor="#F9F9F9" style="background:#F9F9F9">';
    $message_header .= '<tbody><tr><td align="center"><table width="724" cellspacing="0" cellpadding="0" border="0" align="center" style="font-family:Arial, Helvetica, sans-serif;font-size:13px;line-height:16px">';
    $message_header .= '<tbody><tr><td width="724" valign="middle" bgcolor="background:#FFFFFF;" align="left" style="border-left:1px solid #F5F5F5;border-right:1px solid #F5F5F5;background:transparent;padding:0">';
    $message_header .= '<img alt="" style="padding:0;font-size:0;line-height:0" src="http://www.ergasia-web.gr/images/logo.png" width="196" height="81"/>';
    $message_header .= '</td></tr><tr><td width="724" bgcolor="#FFFFFF" style="background:#FFFFFF;border-left:1px solid #F5F5F5;border-right:1px solid #F5F5F5">';
    $message_header .= '<table width="724" cellspacing="0" cellpadding="0"><tbody><tr><td width="724" style="padding:0;font-size:15px;line-height:15px" colspan="3"><br style="padding:0;font-size:15px;line-height:15px"></td></tr>';
    $message_header .= '<tr><td width="24">&nbsp;</td><td width="676"><table width="676" cellspacing="0" cellpadding="0"><tbody><tr><td width="676" style="padding:0;font-size:20px;line-height:20px">';
    $message_header .= '<br style="padding:0;font-size:20px;line-height:20px"/></td></tr><tr><td width="676" align="left" style="font-size:14px;line-height:18px">';
    $message_footer = '</td></tr>';
    $message_footer .= '</tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></body></html>';
    $message = $message_header . $message_body . $message_footer;

    if (mail($receiverMail, $subject, $message, $headers)) {
        if ($adminCopy) {
            mail('dimitris.serenidis@gmail.com', $subject, $message, $headers);
        }
        return true;
    }
    return false;
}

function logDbErrors($msg) {
    $date = date('d.m.Y h:i:s');
    $log = $msg . "   |  Date:  " . $date . "\n";
    if (SEND_MAILS) {
        error_log($msg, 1, "dimitris.serenidis@gmail.com");
    }
    error_log($log, 3, DOCUMENT_PATH . "logs/db_errors.log");
    echo 'An unexpected error occured.';
}

function isMobileBrowser() {
    $useragent = $_SERVER['HTTP_USER_AGENT'];
    return (preg_match('/android.+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|meego.+mobile|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i', $useragent) || preg_match('/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i', substr($useragent, 0, 4)));
}

function formatDistance($distance) {
    return (($distance < 1000) ? ceil($distance / 100) * 100 . 'm' : floatval(number_format($distance / 1000, 1)) . 'km');
}

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
