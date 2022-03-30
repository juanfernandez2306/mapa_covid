SELECT
SUM(CASE WHEN edad >= 0 AND edad <= 10 THEN 1 ELSE 0 END) AS g1,
SUM(CASE WHEN edad > 10 AND edad <= 20 THEN 1 ELSE 0 END) AS g2,
SUM(CASE WHEN edad > 20 AND edad <= 30 THEN 1 ELSE 0 END) AS g3,
SUM(CASE WHEN edad > 30 AND edad <= 40 THEN 1 ELSE 0 END) AS g4,
SUM(CASE WHEN edad > 40 AND edad <= 50 THEN 1 ELSE 0 END) AS g5,
SUM(CASE WHEN edad > 50 AND edad <= 60 THEN 1 ELSE 0 END) AS g6,
SUM(CASE WHEN edad > 60 THEN 1 ELSE 0 END) AS g7
FROM casos_covid
WHERE EXTRACT(MONTH FROM fecha) = :number_month AND sexo = :sex_input