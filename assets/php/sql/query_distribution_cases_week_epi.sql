SELECT
COUNT(
    WEEK(fecha, 6)
) AS total,
WEEK(fecha, 6) AS week_epi,
EXTRACT(MONTH FROM fecha) AS month_date
FROM casos_covid
WHERE EXTRACT(MONTH FROM fecha) <= :number_month
GROUP BY week_epi, month_date ORDER BY week_epi ASC