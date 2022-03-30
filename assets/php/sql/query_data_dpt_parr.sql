SELECT
p.cod_parr,
UPPER(p.parroquia) AS parroquia,
UPPER(m.municipio) AS municipio
FROM parroquias AS p
LEFT JOIN municipios AS m ON m.cod_mun = p.cod_mun
WHERE cod_estado = 23