<?php

function redirectToHome() {
    header("location: " . SERVER_PATH);
    exitApp();
}

function sendEmail($receiverMail, $siteMail, $subject, $message_body, $lang = "el", $adminCopy = true, $printAddSendersMsg = false) {
    $add_to_senders_msg_start = ($lang = "el") ? "Σιγουρευτείτε ότι έχετε προσθέσει το " : "";
    $add_to_senders_msg_end = ($lang = "el") ? " στη λίστα με τους ασφαλείς σας αποστολείς, ώστε να συνεχίσετε να λαμβάνετε email απο εμάς." : "";
    $headers = "MIME-Version: 1.0\n";
    $headers .= "Content-type: text/html; charset=UTF-8" . "\n";
    $headers .= "From: scan-hrms.gr <" . $siteMail . ">" . "\n";
    $headers .= "Reply-to: " . $siteMail . "" . "\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    $subject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

    $message_header = '<html><body><br/><table width="100%" height="100%" cellspacing="0" cellpadding="0" bgcolor="#F9F9F9" style="background:#F9F9F9">';
    $message_header .= '<tbody><tr><td align="center"><table width="724" cellspacing="0" cellpadding="0" border="0" align="center" style="font-family:Arial, Helvetica, sans-serif;font-size:13px;line-height:16px">';
    $message_header .= '<tbody><tr><td width="724" valign="middle" bgcolor="background:#FFFFFF;" align="left" style="border-left:1px solid #F5F5F5;border-right:1px solid #F5F5F5;background:transparent;padding:0">';
    $message_header .= '<img alt="" style="padding:0;font-size:0;line-height:0" src="http://www.scan-hrms.gr/images/scan-logo.png" width="196" height="81"/>';
    $message_header .= '</td></tr><tr><td width="724" bgcolor="#FFFFFF" style="background:#FFFFFF;border-left:1px solid #F5F5F5;border-right:1px solid #F5F5F5">';
    $message_header .= '<table width="724" cellspacing="0" cellpadding="0"><tbody><tr><td width="724" style="padding:0;font-size:15px;line-height:15px" colspan="3"><br style="padding:0;font-size:15px;line-height:15px"></td></tr>';
    $message_header .= '<tr><td width="24">&nbsp;</td><td width="676"><table width="676" cellspacing="0" cellpadding="0"><tbody><tr><td width="676" style="padding:0;font-size:20px;line-height:20px">';
    $message_header .= '<br style="padding:0;font-size:20px;line-height:20px"/></td></tr><tr><td width="676" align="left" style="font-size:14px;line-height:18px">';
    $message_footer = '</td></tr>';
    if ($printAddSendersMsg) {
        $message_footer .= '<tr><td width="724" style="padding:0;font-size:0;line-height:0"><img alt="" style="padding:0;font-size:0;line-height:0" src="http://www.scan-hrms.gr/images/mail-bottom-line.png"/>';
        $message_footer .= '</td></tr><tr><td width="724" valign="middle" align="center" style="padding:0;color:#666666;font-size:12px"><table cellspacing="0" cellpadding="0"><tbody><tr><td width="24">&nbsp;</td>';
        $message_footer .= '<td width="676" align="center" style="text-align:center;padding:0;color:#666666;font-size:12px">' . $add_to_senders_msg_start . $siteMail . $add_to_senders_msg_end;
        $message_footer .= '</td><td width="24">&nbsp;</td></tr><tr><td style="padding:0;font-size:20px;line-height:20px" colspan="3"><br style="padding:0;font-size:20px;line-height:20px"></td></tr></tbody></table></td></tr>';
    }
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

function logErrors($msg, $silent = false) {
    $date = date('d.m.Y h:i:s');
    $log = $msg . "   |  Date:  " . $date . "\n";
    if (SEND_MAILS) {
        error_log($msg, 1, "dimitris.serenidis@gmail.com");
    }
    error_log($log, 3, DOCUMENT_PATH . "logs/db_errors.log");
    if (!$silent) {
        echo 'An unexpected error occured.';
    }
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

function resizeImage($file_path, $file_extension, $file_dest, $target_width, $target_height = NULL, $forceResize = false) {
// Get the image and create a thumbnail
    switch ($file_extension) {
        case 'gif':
            $tmp_img = imagecreatefromgif($file_path);
            break;
        case 'jpg':
        case 'jpeg':
            $tmp_img = imagecreatefromjpeg($file_path);
            break;
        case 'png':
            $tmp_img = imagecreatefrompng($file_path);
            break;
        default:
            echo $file_extension . ' File type not supported.';
            exit(0);
    }

    if (!$tmp_img) {
        echo "ERROR:could not create image handle " . $file_path;
        exit(0);
    }

    $width = imageSX($tmp_img);
    $height = imageSY($tmp_img);

    if (!$width || !$height) {
        echo "ERROR:Invalid width or height";
        exit(0);
    }

    $img_ratio = $width / $height;

//in case we care only about redusing the width ->
//height will be reduced proportionally
    if ($target_height == null) {
        if ($img_ratio > 1) {
            $new_width = $target_width;
            $new_height = ($target_width / $img_ratio);
        } else {
            $new_height = $target_width * $img_ratio;
            $new_width = $target_width * $img_ratio * $img_ratio;
            $target_width = $new_width;
        }
        $target_height = $new_height;
    } else {
        $target_ratio = $target_width / $target_height;

        if ($target_ratio > $img_ratio) {
            $new_height = $target_height;
            $new_width = $img_ratio * $target_height;
        } else {
            $new_height = $target_width / $img_ratio;
            $new_width = $target_width;
        }

        if ($new_height > $target_height) {
            $new_height = $target_height;
        }
        if ($new_width > $target_width) {
            $new_height = $target_width;
        }
    }
    $new_img = ImageCreateTrueColor($target_width, $target_height);
    $white = imagecolorallocate($new_img, 255, 255, 255);
    if (!@imagefilledrectangle($new_img, 0, 0, $target_width - 1, $target_height - 1, $white)) { // Fill the image white
        echo "ERROR:Could not fill new image";
        exit(0);
    }

    if (!@imagecopyresampled($new_img, $tmp_img, ($target_width - $new_width) / 2, ($target_height - $new_height) / 2, 0, 0, $new_width, $new_height, $width, $height)) {
        echo "ERROR:Could not resize image";
        exit(0);
    }

    imagejpeg($new_img, $file_dest, 80);

    imageDestroy($new_img);
    imageDestroy($tmp_img);
}

function generatePublicToken($userMail) {
    return sha1(uniqid($userMail));
}

function generatePrivateToken() {
    return sha1(uniqid(time()));
}

function getRelativeDate($selDate, $daysDiff) {
    return date('Y-m-d', strtotime($daysDiff . ' day', strtotime($selDate)));
}

function validateSqlDate($date) {
    return preg_match('/^(19|20)\d\d[\-\/.](0[1-9]|1[012])[\-\/.](0[1-9]|[12][0-9]|3[01])$/', $date);
}

function validateProfileFields($data, $editMode) {
    $requiredFields = array('first_name', 'last_name', 'mail', 'pass', 'gender', 'birth_date');
    // exit early if obviously invalid fields
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            errorJSON(array('message' => "invalid_fields"));
        }
    }
    if (!(filter_var($data['mail'], FILTER_VALIDATE_EMAIL) && validateSqlDate($data['birth_date']) && validateGender($data['gender']))) {
        errorJSON(array('message' => "invalid_fields"));
    }
    if (!$editMode && !emailAvailable($data['mail'])) {
        errorJSON(array('message' => "existing_email"));
    }
}

function validateGender($gender) {
    return ($gender == 1 || $gender == 2);
}

function exitApp() {
    global $con;
    $con->close;
    exit();
}

?>