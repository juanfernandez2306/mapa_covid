const selectElement = (element) => document.querySelector(element);

const selectVariableCSS = (element) => getComputedStyle(document.body).getPropertyValue(element);

const url_post_array_community = 'assets/php/create_array_community_points.php';

/**
 * list name month in spanish
 * @constant
 * @type {array}
 * @default
 */
const array_month = ['Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre',
                'Noviembre', 'Diciembre'];

/**
 * create control select in leaflet
 * @param {object} map - instance L.map of leaflet
 * @param {object} layer - instance L.geoJson of leaflet
 * @returns {object} - object div html
 */
function create_control_select({map, layer, data_dpt, initial_coordinates, initial_zoom, legend}){
    var control = L.control({position: 'topright'});

    control.onAdd = function(){
        var input_group = L.DomUtil.create('div', 'input_group');

        L.DomEvent.addListener(input_group, 'mousedown', function(e){
            L.DomEvent.stopPropagation(e);
        })

        input_group.innerHTML = `
        <svg><use xlink:href="#calendario"/></svg>
        <select></select>
        `;

        var select = input_group.querySelector('select');

        array_month.forEach((element, index, array) => {
            var option = document.createElement('option');
            option.value = index + 3;
            option.text = element;
            select.appendChild(option);
        });

        select.addEventListener('change', (e) =>{
            let element = e.target;
            let value = element.value;
            element.disabled = true;

            var FormData_input = new FormData();
            FormData_input.append('number_month', value);

            selectElement('#wallpaper_preloader').classList.remove('hide');
            selectElement('#wallpaper_preloader').classList.add('wallpaper');

            get_post_data_json(url_post_array_community, FormData_input)
            .then((response) =>{
                let geojson = create_geojson(response.data);
                map.removeLayer(layer);
                map.removeControl(legend);
                layer = create_layer_circle(geojson, map, data_dpt);
                legend = create_legend(layer);
                layer.addTo(map);
                legend.addTo(map);
                map.setView(initial_coordinates, initial_zoom);
                element.removeAttribute('disabled');

                stop_animation_loader('success', 'Petición satisfactoria')
            })
            .catch((error) =>{
                stop_animation_loader('error', 'Error de conexión')
                console.log(error);
            })

        }, false);

        return input_group;
    }

    return control;
}

/**
 * calculate area circle
 * @param {number} value_attribute_quantitative - attribute numeric of total
 * @returns {number}
*/
function calculate_proportional_radius(value_attribute_quantitative){
    const scale_factor = 16;

    var circle_area = value_attribute_quantitative * scale_factor;

    return Math.sqrt(circle_area/Math.PI)*2;
}

/**
 * calculate round number
 * @param {number} number 
 * @returns {number}
 */
function round_number(number){
    return Math.round(number)
};

/**
 * create legend html in leaflet
 * @param {object} layer_geojson - instance L.geoJson leaflet
 * @returns {object} - object L.control leaflet
 */

function create_legend(layer_geojson){
    var legend = L.control({position: 'bottomright'});

    var [value_min, value_max] = calculate_values_min_max_layer(layer_geojson);

    var scale_factor = 1;

    if(value_max < 6){
        scale_factor = 4;
    }else if(value_max >= 6 && value_max < 15){
        scale_factor = 2.5;
    }else{
        scale_factor = 1.7;
    }

    legend.onAdd = function(){
        var legend_container = L.DomUtil.create('div', 'legend_container'),
            symbols_container = L.DomUtil.create('div', 'symbols_container');
            average = (value_min + value_max) / 2;
            class_value = [value_min, round_number(average), value_max],
            last_radius = 0,
            current_radius = 0,
            margin = 0;

        L.DomEvent.addListener(legend_container, 'mousedown', function(e){
            L.DomEvent.stopPropagation(e);
        })
        
        legend_container.innerHTML = '<h2># de Casos Confirmados</h2>';
        
        class_value.forEach((value) => {
            var legend_circle = L.DomUtil.create('div', 'legend_circle');
            current_radius = calculate_proportional_radius(value) * scale_factor;
            margin = - current_radius - last_radius - 2;
            legend_circle.style['width'] = (current_radius * 2)/16 + "rem";
            legend_circle.style['height'] = (current_radius * 2)/16 + "rem";
            legend_circle.style['margin-left'] = (margin/16) + "rem";

            if(last_radius != current_radius){
                var span = document.createElement('span');
                span.classList.add('legend_title');
                var text_node = document.createTextNode(value);
                span.appendChild(text_node);
                legend_circle.appendChild(span);
                symbols_container.appendChild(legend_circle);
            }else{
                legend_circle.style['display'] = 'none';
            }

            last_radius = current_radius;
        });

        legend_container.appendChild(symbols_container);
        

        return legend_container;
    }

    return legend;
}

function create_popup(props){
    let html = `
        <table class="table_popup">
        <caption>RESUMEN</caption>
            <tr>
                <th>MUNICIPIO</th>
                <td>${props.municipio}</td>
            </tr>
            <tr>
                <th>PARROQUIA</th>
                <td>${props.parroquia}</td>
            </tr>
            <tr>
                <th>COMUNIDAD</th>
                <td>${props.comunidad}</td>
            </tr>
            <tr>
                <th># CASOS</th>
                <td>${props.total}</td>
            </tr>
        </table>
    `;

    return html;
}

/**
 * create layer circle
 * @param {object} geojson 
 * @param {object} map - instance L.map leaflet
 * @returns {object} layer_geojson - instance L.geoJson leaflet
 */
function create_layer_circle(geojson, map, data_dpt){
    let layer_geojson =  L.geoJson(geojson, {
        pointToLayer: function(feature, latlng){
            return L.circleMarker(latlng, {
                fillColor: selectVariableCSS('--primer-color'),
                color: selectVariableCSS('--primer-color'),
                weight: 1,
                fillOpacity: .6
            });
        },
        onEachFeature: function(feature, layer){
            layer.on({
                click: function(e){
                    var center = e.target._latlng,
                        props = feature.properties;
                    
                    var filter_array_data = data_dpt.filter((data) =>{
                        return data.cod_parr == props.cod_parr
                    });

                    props.municipio = filter_array_data[0].municipio;
                    props.parroquia = filter_array_data[0].parroquia;
                    
                    map.setView(center, 14);

                    var html_content_popup = create_popup(props);

                    layer.bindPopup(html_content_popup).openPopup();
                }
            })
        }
    });

    layer_geojson.eachLayer(function(layer){
        var total = layer.feature.properties.total;
            radius = calculate_proportional_radius(total);
        layer.setRadius(radius);
    });

    return layer_geojson;
}

/**
 * returns value min and value max of attributes layer quantitative total
 * @param {object} layer_geojson - instance L.geoJson leaflet
 * @returns {array} - [value min, value max]
 */
function calculate_values_min_max_layer(layer_geojson){
    let  array_values_quantitative = [];

    layer_geojson.eachLayer(function(layer){
        array_values_quantitative.push(
            layer.feature.properties.total
        );
    });

    let value_min = Math.min.apply(Math, array_values_quantitative);
    let value_max = Math.max.apply(Math, array_values_quantitative);

    return [value_min, value_max];
}

function create_map(geojson, data_dpt){
    const initial_coordinates = [10.90847, -72.08446];
    const initial_zoom = 7;

    var map = L.map('map', {
		center: initial_coordinates,
		zoom: initial_zoom,
		minZoom: 7,
		maxZoom: 16
	});

    L.control.scale({imperial: false}).addTo(map);

    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
		minZoom: 7,
		maxZoom: 19,
		type:'osm'
	}).addTo(map);

    var layer_geojson = create_layer_circle(geojson, map, data_dpt);

    layer_geojson.addTo(map);

    var legend = create_legend(layer_geojson);
    legend.addTo(map);

    let control_select = create_control_select({
        map: map, 
        layer: layer_geojson, 
        data_dpt: data_dpt,
        initial_coordinates: initial_coordinates,
        initial_zoom: initial_zoom,
        legend: legend
    });
    control_select.addTo(map);

    let control_vertical = L.control.custom({
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
                    btn = selectElement('#' + dataset);

                btn.disabled = true;

                if(dataset == 'zoom_init'){
                    map.setView(initial_coordinates, initial_zoom);
                }

                setTimeout(()=>{
                    btn.removeAttribute('disabled');
                }, 2000);
                
            }
        }
    });

    control_vertical.addTo(map);

}

async function get_data_json(url){
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

/**
 * 
 * @param {string} url 
 * @param {object} FormData_input - instance new FormData JS
 * @returns 
 */
async function get_post_data_json(url, FormData_input){
    let response = await fetch(url, {
        method : 'POST',
        body : FormData_input
    });
    let data = await response.json();
    return data;
}

function create_geojson(array_response_data){
    let geojson = {
        type : 'FeatureCollection',
        features : []
    };

    array_response_data.forEach((element) => {
        geojson.features.push(
            {
                type : 'Feature',
                geometry : {
                    type : 'Point',
                    coordinates: [element[3], element[4]]
                },
                properties: {
                    total: element[0],
                    comunidad: element[1],
                    cod_parr : element[2]
                }
            }
        )
    });

    return geojson;
}

function restart_style_preloader_wallpaper(e){
    e.preventDefault;
    let btn = e.target;
    btn.disabled = true;

    var preloader = selectElement('.preloader_wallpaper');
    preloader.classList.remove('error');
    preloader.classList.remove('success');
    preloader.classList.remove('stop_animation_preloader');
    preloader.querySelector('h3').innerHTML = 'Espere un momento';

    selectElement('#wallpaper_preloader').classList.remove('wallpaper');
    selectElement('#wallpaper_preloader').classList.add('hide');

    selectElement('main').style['animation-name'] = 'fade_in_data';

    setTimeout(() => {
        btn.removeAttribute('disabled');
        selectElement('main').style['animation-name'] = '';
    }, 1000);

}

function stop_animation_loader(class_response, text_response){
    var preloader = selectElement('.preloader_wallpaper');
    preloader.classList.add(class_response);
    preloader.classList.add('stop_animation_preloader');
    preloader.querySelector('h3').innerHTML = text_response;
}

function create_option_chart(){
    return {
        scales: {
            x: {
                stacked: false,
                display: false,
                title: {
                    display: false,
                    text: '',
                    color: selectVariableCSS('--segundo-color'),
                    font: {
                        size: 18,
                        family: selectVariableCSS('--font-body')
                    }
                },
                ticks: {
                    color: selectVariableCSS('--segundo-color')
                }
            },
            y: {
                stacked: false,
                display: false,
                title: {
                    display: false,
                    text: '',
                    color: selectVariableCSS('--segundo-color'),
                    font: {
                        size: 18,
                        family: selectVariableCSS('--font-body')
                    }
                },
                ticks: {
                    color: selectVariableCSS('--segundo-color')
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: selectVariableCSS('--segundo-color'),
                    font: {
                        size: 16,
                        family: selectVariableCSS('--font-body')
                    }
                }
            },
            title: {
                display: true,
                text: '',
                color: selectVariableCSS('--segundo-color'),
                font: {
                    size: 18,
                    family: selectVariableCSS('--font-body')
                }
            }
        }
    };
}

/**
 * create chart pie for distribution sex
 * @param {String} id_element - name id target canvas
 * @param {Array.<Number, Number>} data_array - [count male, count female] 
 */
function create_chart_pie(id_element, data_array){
    var options = create_option_chart();
    options.plugins.title.text = 'Distribución por sexo';

    let data = {
        datasets: [{
            data: data_array,
            backgroundColor: [
                selectVariableCSS('--firts-color-bar'),
                selectVariableCSS('--third-color-bar')
            ],
            hoverOffset: 4
        }],
        labels: [
            'Masculino',
            'Femenino'
        ]
    };

    let ctx = document.getElementById(id_element);
    let myChart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: options
    });
}

/**
 * Create chart stacked bar distribution age
 * @param {Object} param
 * @param {String} param.id_element - name id target element canvas
 * @param {Array.<Number>} param.array_data_male
 * @param {Array.<Number>} param.array_data_female
 * @returns {Object} myChart - Object type Chart JS
 */
function create_chart_stacked_bar({id_element, array_data_male, array_data_female}){

    let text_media_query = '(max-width: 600px)';

    var options = create_option_chart();
    options.plugins.title.text = 'Distribución por edad';
    options.scales.x.stacked = true;
    options.scales.x.display = true;
    options.scales.x.title.display = true;
    options.scales.x.title.text = '# de casos';

    options.scales.y.stacked = true;
    options.scales.y.display = true;
    options.scales.y.title.display = true;
    options.scales.y.title.text = 'Rango de edad (años)';

    options.maintainAspectRatio = false;

    let data = {
        labels: ['0-10', '11-20', '21-30', '31-40',
                '41-50', '51-60', '> 61'],
        datasets: [{
          label: 'Masculino',
          data: array_data_male,
          backgroundColor: selectVariableCSS('--firts-color-bar'),
          borderColor: selectVariableCSS('--segundo-color'),
          borderWidth: 1
        },
        {
          label: 'Femenino',
          data: array_data_female,
          backgroundColor: selectVariableCSS('--third-color-bar'),
          borderColor: selectVariableCSS('--segundo-color'),
          borderWidth: 1
        }
      ]
    };

    
    if(window.matchMedia(text_media_query).matches){
        options.indexAxis = 'x';
    }else{
        options.indexAxis = 'y';
    }
        
    let ctx = document.getElementById(id_element);
    let myChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: options
    });
    
    return myChart;
    
}

/**
 * 
 * @param {Object} param
 * @param {String} param.id_element - name id target canvas
 * @param {Array.<Number>} param.label_array
 * @param {Array.<Number>} param.data_count
 * @param {Array.<Number>} param.data_month
 */
function create_chart_line({id_element, label_array, data_count, data_month}){

    let options = create_option_chart();
    options.plugins.title.text = 'Consolidado por semana';
    options.scales.x.display = true;
    options.scales.x.title.display = true;
    options.scales.x.title.text = 'Semana epidemiologica';

    options.scales.y.display = true;
    options.scales.y.title.display = true;
    options.scales.y.title.text = '# de casos';

    options.plugins.legend.display = false;
    
    /**
     * search name month in spanish
     * @param {Object} tooltipItems
     * @returns {String} - return name month in spanish
     */
    const footer = (tooltipItems) => {
        let month_value = '';
      
        tooltipItems.forEach(function(tooltipItem){
          var index = tooltipItem.parsed.x;
          var month_index_array = data_month[index];
          month_value = array_month[month_index_array - 3];
        });
        return 'Mes: ' + month_value;
    };

    options.plugins.tooltip = {
        callbacks: {
            footer: footer
        }
    }

    let data = {
        labels: label_array,
        datasets: [{
            data: data_count,
            borderColor: selectVariableCSS('--second-color-bar'),
            pointBackgroundColor: selectVariableCSS('--second-color-bar'),
            fill: false
        }]
    };

    let ctx = document.getElementById(id_element);
    let myChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
}

/**
 * 
 * @param {Object} param
 * @param {String} param.id_element - name id target canvas html
 * @param {Array.<Number>} param.data_count
 * @param {Array.<String>} param.label_array - name municipality
 * @returns {Object} myChart - Object type chartjs
 */
function create_chart_data_bar({id_element, data_count, label_array}){

    let options = create_option_chart();
    options.plugins.title.text = 'Consolidado por municipios';
    options.plugins.subtitle = {
        display: true,
        text: 'Casos por 10.000 habitantes',
        color: selectVariableCSS('--segundo-color'),
        font: {
            size: 18,
            family: selectVariableCSS('--font-body')
        }
    }

    options.scales.x.display = true;
    options.scales.x.title.display = true;
    options.scales.x.title.text = '# de casos por 10.000 hab';

    options.scales.y.display = true;
    options.scales.y.title.display = true;
    options.scales.y.title.text = 'Municipios';

    options.plugins.legend.display = false;

    options.indexAxis = 'y';
    options.maintainAspectRatio = false;

    let data = {
        labels: label_array,
        datasets: [{
          data: data_count,
          fill: false,
          borderColor: selectVariableCSS('--second-color-bar'),
          backgroundColor: selectVariableCSS('--firts-color-bar')
        }]
    };

    let ctx = document.getElementById(id_element);

    myChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: options
    });

    return myChart;
}

/**
 * create table
 * @param {Array.<Number>} data_count 
 * @param {Array.<String>} label_array - name municipality
 * @returns {Object} table - table html
 */
function create_table_data_bar(data_count, label_array){
    let table = document.createElement('table');
    let caption = document.createElement('caption');
    caption.innerHTML = '<h2>Consolidado por municipios</h2><h3>Casos por 10.000 hab</h3>';

    table.appendChild(caption);

    data_count.forEach((element, index, array) => {
        var tr = document.createElement('tr');
        var th = document.createElement('th');
        var value_th = label_array[index];
        var text_th = document.createTextNode(value_th);
        th.appendChild(text_th);
        tr.appendChild(th);

        var td = document.createElement('td');
        var number_round = Math.round((element + Number.EPSILON) * 10) / 10;
        var text_td = document.createTextNode(number_round);
        td.appendChild(text_td);
        tr.appendChild(td);

        table.appendChild(tr);
    })

    return table;
}

/**
 * load chart with chartJS
 * @param {Object} data_response
 * @property {Boolean} data_response.response
 * @property {Object} data_response.data
 * @property {Array.<Number>} data_response.data.distribution_sex
 * @property {Object} data_response.data.distribution_age
 * @property {Array.<Number>} data_response.data.distribution_age.male
 * @property {Array.<Number>} data_response.data.distribution_age.female
 * @property {Object} data_response.data.distribution_week_epi
 * @property {Array.<string>} data_response.data.distribution_week_epi.label
 * @property {Array.<Number>} data_response.data.distribution_week_epi.count
 * @property {Array.<Number>} data_response.data.distribution_week_epi.month
 * @property {Object} data_response.data.distribution_population
 * @property {Array.<string>} data_response.data.distribution_population.label
 * @property {Array.<Number>} data_response.data.distribution_population.count
 */
function load_simple_metrics(data_response){
    
    create_chart_pie(
        'chart_pie_sex',
        data_response.data.distribution_sex
    )

    let chart_stacked_bar = create_chart_stacked_bar({
        id_element: 'group_age',
        array_data_male: data_response.data.distribution_age.male,
        array_data_female: data_response.data.distribution_age.female
    });

    /**
     * value initial media query match
     * @type {Boolean}
     * @constant
     */
    let media_query_stacked_bar = window.matchMedia('(max-width: 600px)').matches;

    window.addEventListener('resize', function(){
        /**
         * value for rezise window media query match
         * @type {Boolean}
         * @constant
         */
        let media_query_stacked_bar_change = window.matchMedia('(max-width: 600px)').matches;

        if(media_query_stacked_bar != media_query_stacked_bar_change){
            if(chart_stacked_bar){
                chart_stacked_bar.destroy();
            }
    
            chart_stacked_bar = create_chart_stacked_bar({
                id_element: 'group_age',
                array_data_male: data_response.data.distribution_age.male,
                array_data_female: data_response.data.distribution_age.female
            });

            media_query_stacked_bar = media_query_stacked_bar_change;
        }
    }, false);

    create_chart_line({
        id_element: 'week_epi',
        label_array: data_response.data.distribution_week_epi.label,
        data_count: data_response.data.distribution_week_epi.count,
        data_month: data_response.data.distribution_week_epi.month
    })

    let text_media_query_chart_bar = "(min-width: 800px)";

    let initial_value_media_query_chart_bar = window.matchMedia(text_media_query_chart_bar).matches;

    let chart_bar = false;

    let table_chart_bar = create_table_data_bar(
        data_response.data.distribution_population.count,
        data_response.data.distribution_population.label
    );

    if(initial_value_media_query_chart_bar){
        selectElement('#table_content_bar').style.display = 'none';

        chart_bar = create_chart_data_bar({
            id_element: 'distribution_population',
            data_count: data_response.data.distribution_population.count,
            label_array: data_response.data.distribution_population.label
        });
    }else{
        selectElement('#distribution_population').style.display = 'none';
        selectElement('#table_content_bar').appendChild(table_chart_bar);
    }

    window.addEventListener('resize', function(){
        let value_media_query_chart_bar_change = window.matchMedia(text_media_query_chart_bar).matches;

        if(value_media_query_chart_bar_change == false){
            if(chart_bar){
                chart_bar.destroy();
                chart_bar = false;

                selectElement('#distribution_population').style.display = 'none';
                selectElement('#table_content_bar').style.display = 'block';
                selectElement('#table_content_bar').appendChild(table_chart_bar);
            }
        }else{
            if(chart_bar == false){
                selectElement('#table_content_bar').style.display = 'none';
                selectElement('#table_content_bar').innerHTML = '';

                selectElement('#distribution_population').style.display = 'block';
                chart_bar = create_chart_data_bar({
                    id_element: 'distribution_population',
                    data_count: data_response.data.distribution_population.count,
                    label_array: data_response.data.distribution_population.label
                });
            }
        }
    }, false);

}

function load(){

    let FormData_input = new FormData();
    FormData_input.append('number_month', 12);

    selectElement('#restart_preloader').addEventListener('click', restart_style_preloader_wallpaper, false);
    
    Promise.all([
        get_post_data_json(url_post_array_community, FormData_input),
        get_data_json('assets/php/create_data_dpt.php'),
        get_post_data_json('assets/php/load_simple_metrics.php', FormData_input)
    ])
    .then((array_response_data) =>{
        let array_data_point = array_response_data[0];
        let data_dpt = array_response_data[1];
        let data_metrics = array_response_data[2];
        let geojson = create_geojson(array_data_point.data);

        load_simple_metrics(data_metrics);
        
        //create_map(geojson, data_dpt);
    })
    .catch((error) => {
		console.log(error);
	});

}

window.addEventListener('load', load, false);