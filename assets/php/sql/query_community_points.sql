SELECT 
COUNT(c.id_comunidad) AS total,
CASE 
    WHEN com.sector IS NULL THEN
        CASE 
        WHEN com.id_categoria < 6 OR com.id_categoria IS NULL 
            THEN com.nombre
        ELSE CONCAT(cat.tipo, ' ', com.nombre)
        END
    ELSE
        CASE
        WHEN com.id_categoria < 6 OR com.id_categoria IS NULL 
            THEN CONCAT(com.nombre, ' ST ', com.sector)
        WHEN com.id_categoria = 7 
            THEN CONCAT(cat.tipo, ' ', com.nombre, ' ', com.sector)
        ELSE CONCAT(cat.tipo, ' ', com.nombre, ' ST ', com.sector)
        END
END AS comunidad,
com.cod_parr,
X(geom) AS x,
Y(geom) AS y
FROM casos_covid AS c
LEFT JOIN comunidades AS com ON com.id_comunidad = c.id_comunidad
LEFT JOIN categorias_comunidades AS cat ON cat.id_categoria = com.id_categoria
WHERE c.id_comunidad IS NOT NULL AND EXTRACT(MONTH FROM c.fecha) = :number_month
GROUP BY com.cod_parr, comunidad, x, y