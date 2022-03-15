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

function calcular_radio_proporcional(valor_atributo){
    const factor_escala = 16 * 5;

    var area_circulo = valor_atributo * factor_escala;

    return Math.sqrt(area_circulo/Math.PI)*2;
}

function redondear_numero(valor_atributo){
    return Math.round(valor_atributo)
};

function crear_leyenda(Valor_minimo, valor_maximo){
    var leyenda = L.control({position: 'bottomright'});

    leyenda.onAdd = function(){
        var contenedor_leyenda = L.DomUtil.create('div', 'contenedor_leyenda'),
            contenedor_simbolos = L.DomUtil.create('div', 'contenedor_simbolos');
            promedio = (Valor_minimo + valor_maximo) / 2;
            clases = [Valor_minimo, redondear_numero(promedio), valor_maximo],
            ultimo_radio = 0,
            radio_actual = 0,
            margin = 0;

        L.DomEvent.addListener(contenedor_leyenda, 'mousedown', function(e){
            L.DomEvent.stopPropagation(e);
        })
        
        contenedor_leyenda.innerHTML = '<h2># de Casos Confirmados</h2>';
        clases.forEach((value)=>{
            var leyenda_circulo = L.DomUtil.create('div', 'leyenda_circulo');
            radio_actual = calcular_radio_proporcional(value);
            margin = - radio_actual - ultimo_radio - 2;
            leyenda_circulo.style['width'] = (radio_actual * 2)/16 + "rem";
            leyenda_circulo.style['height'] = (radio_actual * 2)/16 + "rem";
            leyenda_circulo.style['margin-left'] = (margin/16) + "rem";

            var span = document.createElement('span');
            span.classList.add('titulo_leyenda');
            var texto_nodo = document.createTextNode(value);
            span.appendChild(texto_nodo);
            leyenda_circulo.appendChild(span);
            contenedor_simbolos.appendChild(leyenda_circulo);
            ultimo_radio = radio_actual;
        });

        contenedor_leyenda.appendChild(contenedor_simbolos);

        return contenedor_leyenda;
    }

    return leyenda;
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

    var leyenda = crear_leyenda(1, 10);

    leyenda.addTo(map);

    var control_rango = null,
        control_select = null;

    const media_query = "(max-width: 600px)";

    if(window.matchMedia(media_query).matches){

        control_select = cargar_control_seleccion();
        control_select.addTo(map);

    }else{
        var div_texto = cargar_texto_input('Marzo');
        control_rango = cargar_control_deslizante();

        control_rango.addTo(map);
        div_texto.addTo(map);
    }

    var control_vertical = L.control.custom({
        position: 'topright',
        content : `
            <button data-btn="zoom_init" class="btn_custom" id="zoom_init">
                <svg data-btn="zoom_init">
                    <use data-btn="zoom_init"xlink:href="#home"/>
                </svg>
            </buton>
            <button id="graficas" data-btn="graficas" class="btn_custom">
                <svg data-btn="graficas">
                    <use data-btn="graficas" xlink:href="#bar_chart"/>
                </svg>
            </buton>
            <button id="resumen" data-btn="resumen" class="btn_custom">
                <svg data-btn="resumen">
                    <use data-btn="resumen" xlink:href="#nasal_covid"/>
                </svg>
            </buton>
            <button id="informacion" data-btn="informacion" class="btn_custom">
                <svg data-btn="informacion">
                    <use data-btn="informacion" xlink:href="#info"/>
                </svg>
            </buton>
        `,
        classes : 'btn-group-vertical btn-group-sm',
        style   :
        {
            margin: '1rem',
            padding: '0px 0 0 0',
            cursor: 'pointer',
        },
        events:
        {
            click: function(data)
            {
                var dataset = data.target.dataset.btn,
                    btn = seleccionarElemento('#' + dataset);

                btn.disabled = true;

                setTimeout(()=>{
                    btn.removeAttribute('disabled');
                }, 2000);
                
            }
        }
    });

    control_vertical.addTo(map);

    window.addEventListener('resize', function(){
        if(window.matchMedia(media_query).matches){

            if(control_rango != null){
                map.removeControl(div_texto);
                map.removeControl(control_rango);
                map.removeControl(control_vertical);
                control_rango = null;
            }

            if(control_select == null){
                control_select = cargar_control_seleccion();
                control_select.addTo(map);
                control_vertical.addTo(map);
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