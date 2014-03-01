<?php
header("Access-Control-Allow-Origin: *");
header('Content-type: text/html; charset=utf-8');
define("SITE_NAME", "Εργασία Web");
define("DOCUMENT_PATH", $_SERVER['DOCUMENT_ROOT'] . "/");
define("SERVER_PATH", "http://" . $_SERVER['SERVER_NAME'] . "/");
define("SEND_MAILS", true);

date_default_timezone_set('Europe/Athens');

$defaultMetaDescription = "";
$pageUrl = substr(SERVER_PATH, 0, -1) . $_SERVER['REQUEST_URI'];

?>