<?php 
require_once 'Class/Database.php';
require_once 'function.php';

function distribution_sex_chart_pie($number_month){
    $sentence = file_get_contents('sql/query_sex_distribution.sql');
    $db = new Database();
    $query = $db -> connect() -> prepare($sentence);
    $query -> execute(['number_month' => $number_month]);
    $row = $query -> fetch(PDO::FETCH_ASSOC);

    return [$row['male'], $row['female']];
}

function distribution_age_chart_stacked_bar($number_month, $sex_input){
    $sentence = file_get_contents('sql/query_age_distribution.sql');
    $db = new Database();
    $query = $db -> connect() -> prepare($sentence);
    $query -> execute(['number_month' => $number_month,
                        'sex_input' => $sex_input]);

    $row = $query -> fetch(PDO::FETCH_ASSOC);

    return [$row['g1'], $row['g2'], $row['g3'], $row['g4'], 
            $row['g5'], $row['g6'], $row['g7']];
}

function distribution_cases_week_epi($number_month){
    $sentence = file_get_contents('sql/query_distribution_cases_week_epi.sql');
    $db = new Database();
    $query = $db -> connect() -> prepare($sentence);
    $query -> execute(['number_month' => $number_month]);

    $label = [];
    $count = [];
    $month = [];

    while($rows = $query -> fetch(PDO::FETCH_ASSOC)){
        array_push($count, $rows['total']);
        array_push($label, $rows['week_epi']);
        array_push($month, $rows['month_date']);
    }

    return [
        'label' => $label,
        'count' => $count,
        'month' => $month
    ];

}

$number_month = isset($_POST['number_month']) ? validation_input_integer($_POST['number_month']) : null;

if($number_month == null){
    $response = false;
    $data = null;
}else{
    $data['distribution_sex'] = distribution_sex_chart_pie($number_month);
    $data['distribution_age'] = [
        'male' => distribution_age_chart_stacked_bar($number_month, 'm'),
        'female' => distribution_age_chart_stacked_bar($number_month, 'f')
    ];
    $data['distribution_week_epi'] = distribution_cases_week_epi($number_month);
    $response = true;
}

echo json_encode([
    'response' => $response,
    'data' => $data], 
JSON_NUMERIC_CHECK);

?>