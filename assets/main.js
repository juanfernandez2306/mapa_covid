const seleccionarElemento = (element) => document.querySelector(element);
const meses = ['Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre',
                'Noviembre', 'Diciembre'];

function obtener_mes(numero){

    return meses[numero - 1];
}

function cargar_texto_input(texto_entrada){
    var texto_temporal = L.control({position: 'bottomleft'});

    texto_temporal.onAdd = function(){
        var div_texto = L.DomUtil.create('div', 'texto_temporal');
        div_texto.innerHTML = `<svg><use xlink:href="#calendario"/></svg>
            <h3 id="texto_temporal">${texto_entrada}</h3>`;

        return div_texto;
    }

    return texto_temporal;
}

function cargar_control_deslizante(){
    var control = L.control({position: 'bottomleft'});

    control.onAdd = function(){
        var input_control = L.DomUtil.create('input', 'control_tiempo');

        L.DomEvent.addListener(input_control, 'mousedown', function(e){
            L.DomEvent.stopPropagation(e);
        })

        input_control.type = 'range';
        input_control.min = 1
        input_control.max = 10;
        input_control.step = 1;
        input_control.value = 1;

        input_control.addEventListener('change', (e) =>{
            var value = e.target.value,
                mes = obtener_mes(value);
                seleccionarElemento('#texto_temporal').innerHTML = mes;
        }, false);

        return input_control;

    }

    return control;
}

function cargar_control_seleccion(){
    var control = L.control({position: 'topright'});

    control.onAdd = function(){
        var input_group = L.DomUtil.create('div', 'input_group');

        input_group.innerHTML = `
        <svg><use xlink:href="#calendario"/></svg>
        <select></select>
        `;

        var select = input_group.querySelector('select');

        meses.forEach((element, index, array) => {
            var option = document.createElement('option');
            option.value = index + 1;
            option.text = element;
            select.appendChild(option);
        });

        L.DomEvent.addListener(select, 'mousedown', function(e){
            L.DomEvent.stopPropagation(e);
        })

        return input_group;
    }

    return control;
}

function cargar_mapa(){
    const coordenadas_iniciales = [10.90847, -72.08446];
    const zoom_inicial = 7;

    var map = L.map('map', {
		center: coordenadas_iniciales,
		zoom: zoom_inicial,
		minZoom: 7,
		maxZoom: 18
	});

    L.control.scale({imperial: false}).addTo(map);

    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
		minZoom: 7,
		maxZoom: 19,
		type:'osm'
	}).addTo(map);

    var control_rango = null,
        control_select = null;

    const media_query = "(max-width: 400px)";

    if(window.matchMedia(media_query).matches){

        control_select = cargar_control_seleccion();
        control_select.addTo(map);

    }else{
        var div_texto = cargar_texto_input('Marzo');
        control_rango = cargar_control_deslizante();

        control_rango.addTo(map);
        div_texto.addTo(map);
    }

    window.addEventListener('resize', function(){
        if(window.matchMedia(media_query).matches){

            if(control_rango != null){
                map.removeControl(div_texto);
                map.removeControl(control_rango);
                control_rango = null;
            }

            if(control_select == null){
                control_select = cargar_control_seleccion();
                control_select.addTo(map);
            }

        }else{

            if(control_select != null){
                map.removeControl(control_select);
                control_select = null;
            }

            if(control_rango == null){
                div_texto = cargar_texto_input('Marzo');
                control_rango = cargar_control_deslizante();

                control_rango.addTo(map);
                div_texto.addTo(map);
            }
            
        }
    }, false);

}

function iniciar(){
    cargar_mapa();
}

window.addEventListener('load', iniciar, false);