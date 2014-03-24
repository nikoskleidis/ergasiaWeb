<?php
ini_set('max_execution_time', 9600); //2400 seconds = 40 minutes
header('Content-Type: text/html; charset=utf-8');
$con = new mysqli('localhost', 'root', '', 'ergasiaweb_db');
if (mysqli_connect_errno()) {
    printf("Connection to database server failed: %s\n", mysqli_connect_error());
    exit();
}
/* change character set to utf8 */
if (!$con->set_charset("utf8")) {
    printf("Error loading character set utf8: %s\n", $con->error);
}

importKmlFile('archaia_theatra', 3);
importKmlFile('dhmosia_kthria', 2);
importKmlFile('dhmosia_wifi', 1);
importKmlFile('galazies_shmaies_2010', 4);

$con->close();

function importKmlFile($file, $categoryId) {
    global $con;
    $kmlObj = simplexml_load_file($file . '.kml');

    $query = "INSERT INTO places (`category_id`,`title`,`description`,`lat`,`lng`) " .
            "VALUES ($categoryId, ?, ?, ?, ?)";
    $stmt = $con->stmt_init();
    if ($stmt->prepare($query)) {
        foreach ($kmlObj->Document->Folder->Placemark as $place) {
            $title = $place->name;
            $description = $place->ExtendedData->SchemaData->SimpleData[4] . ' ' . $place->ExtendedData->SchemaData->SimpleData[5];
            $coords = explode(",", $place->Point->coordinates);
            $lat = $coords[0];
            $lng = $coords[1];
            $stmt->bind_param("ssdd", $title, $description, $lat, $lng);
            if (!$stmt->execute()) {
                echo $stmt->error;
            }
        }
        $stmt->close();
    }
}
