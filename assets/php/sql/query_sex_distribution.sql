SELECT 
SUM(CASE WHEN sexo = 'm' THEN 1 ELSE 0 END) AS male,
SUM(CASE WHEN sexo = 'f' THEN 1 ELSE 0 END) AS female
FROM casos_covid AS c 
WHERE c.sexo IS NOT NULL AND EXTRACT(MONTH FROM fecha) = :number_month