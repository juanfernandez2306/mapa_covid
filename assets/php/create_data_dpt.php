<?php 
    require_once 'Class/Database.php';

    $sentence = file_get_contents('sql/query_data_dpt_parr.sql');
    $db = new Database();
    $query = $db -> connect() -> prepare($sentence);
    $query -> execute();

    $data = [];

    while($rows = $query -> fetch(PDO::FETCH_ASSOC)){
        array_push($data, [
            'cod_parr' => $rows['cod_parr'],
            'parroquia' => $rows['parroquia'],
            'municipio' => $rows['municipio']
        ]);
    }

    echo json_encode($data, JSON_NUMERIC_CHECK);
?>