# Mapa Zulia - COVID19
Plantilla  de diseño web adaptable  (del ingles _responsive web design_) 
para crear aplicaciones de mapas web con __LeafletJS__.

Este mapa interactivo, tiene la intención de mostrar las potencialidades 
del manejo de la __información geográfica__ para dar una nueva perspectiva, 
al manejo de la emergencia sanitaria ocurrida después 
de la epidemia del __coronavirus__, desatada en Wuhan, China, en Diciembre de 2019.

## :eye_speech_bubble: Overview

### :computer: Web

![Img overview project](assets/img/overview.gif)

### :iphone: Mobile

<img src="./assets/img/overview_mobile.gif" width=280>

## Demo

[Demo](https://mapacovid.jfcoordenadas.xyz/)

## :keyboard: Framework
- [Leaflet JS](https://leafletjs.com/)
- [ChartJS](https://www.chartjs.org/)

### Plugin Leaflet

-[Leaflet Control Custom](https://github.com/yigityuce/Leaflet.Control.Custom)

## :rocket: Instalación
Clonar proyecto
```
	git clone https://github.com/juanfernandez2306/mapa_covid.git
```

- Crear una base de datos MySQL +V5.7 con codificación UTF-8
- Nombre de la base de datos _mapa_zulia_
- Cargar script assets/database/01_dpt.sql
- Cargar script assets/database/02_places_community.sql
- Cargar script assets/database/03_cases_covid_example.sql
- De ser necesario modificar parametros de conexión bd en assets/php/Class/Constants.php

## :bust_in_silhouette: Contactos
- Twitter : https://twitter.com/juancho_2306

## Licencia
Este proyecto está bajo la Licencia [MIT](/LICENSE) - mira el archivo [LICENSE.md](LICENSE.md) para detalles.
