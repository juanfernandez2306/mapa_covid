<?php 
    function validation_input_integer($value){
        if(is_numeric($value)){
            return (int) $value;
        }else{
            return null;
        }
    }

    function remove_duplicate_text($text){
        $array_text = explode(',', $text);
        $array_text = array_unique($array_text);
        $count_items = count($array_text);
        $text = implode(', ', $array_text);

        return ['text' => $text, 'count' => $count_items];
    }
    
?>