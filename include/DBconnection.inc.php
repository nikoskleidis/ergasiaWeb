<?php
$con = new mysqli('db27.grserver.gr', 'handpick_user', 'fsd&*#(s2)@^@@$-21', 'handpick_db');
if (mysqli_connect_errno()) {
    printf("Connection to database server failed: %s\n", mysqli_connect_error());
    exit();
}
/* change character set to utf8 */
if (!$con->set_charset("utf8")) {
    printf("Error loading character set utf8: %s\n", $con->error);
}
?>
