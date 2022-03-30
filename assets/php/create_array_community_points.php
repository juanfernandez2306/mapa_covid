<?php 
require_once 'Class/Database.php';
require_once 'function.php';

$number_month = isset($_POST['number_month']) ? validation_input_integer($_POST['number_month']) : null;

$header = ['total', 'comunidad', 'cod_parr', 'x', 'y'];

if($number_month != null){

    $sentence = file_get_contents('sql/query_community_points.sql');

    $db = new Database();
    $query = $db -> connect() -> prepare($sentence);
    $query -> execute(['number_month' => $number_month]);

    $data = [];

    while($rows = $query -> fetch(PDO::FETCH_ASSOC)){
        array_push($data, [
            $rows['total'],
            strtoupper($rows['comunidad']),
            $rows['cod_parr'],
            round($rows['x'], 5),
            round($rows['y'], 5)
        ]);
    }

    $response = True;

}else{

    $data = [];
    $response = False;

}

echo json_encode([
    'response' => $response,
    'header' => $header,
    'data' => $data
], JSON_NUMERIC_CHECK);

?>