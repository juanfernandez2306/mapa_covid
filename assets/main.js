const selectElement = (element) => document.querySelector(element);

const selectVariableCSS = (element) => getComputedStyle(document.body).getPropertyValue(element);

const url_post_array_community = 'assets/php/create_array_community_points.php';

/**
 * wait time in millisecond
 * @type {Number}
 * @constant
 */
const wait_time_sidebar = 1000;
const wait_time_close_sidebar = 2100;

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
        <select id="select_month" data-currentValue="3"></select>
        `;

        var select = input_group.querySelector('select');

        array_month.forEach((element, index, array) => {
            var option = document.createElement('option');
            option.value = index + 3;
            option.text = element;
            select.appendChild(option);
        });

        select.addEventListener('change', (e) =>{
            let element_select = e.target;
            let value_select = element_select.value;
            element_select.disabled = true;

            var FormData_input = new FormData();
            FormData_input.append('number_month', value_select);

            selectElement('#response_preloader').classList.remove('hide');
            selectElement('#response_preloader').classList.add('wallpaper');

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
                element_select.removeAttribute('disabled');
                element_select.setAttribute('data-currentValue', value_select);

                stop_animation_loader('success')
            })
            .catch((error) =>{
                stop_animation_loader('error');
                let currentValue =  element_select.getAttribute('data-currentValue');
                element_select.value = currentValue;
                element_select.removeAttribute('disabled');
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
 * @param {Object} layer - Object layer instance Leaflet
 * @param {String} content_table - table html
 */

function add_popup_layer(layer, content_table){
    let text_media_query = "(max-width: 900px)";
    if(window.matchMedia(text_media_query).matches){
        let section_body_sidebar = selectElement('#sidebar_popup section:nth-child(2)');
        section_body_sidebar.innerHTML = content_table;
        selectElement('#screen').style['animation-name'] = 'fade_in_screen';

        setTimeout(() => {
            selectElement('#sidebar_popup').classList.remove('hide');
            selectElement('#sidebar_popup').classList.add('sidebar');
            selectElement('#wallpaper').classList.remove('hide');
            selectElement('#wallpaper').classList.add('wallpaper');
        }, wait_time_sidebar);

        setTimeout(() => {
            selectElement('#screen').style['animation-name'] = '';
        }, wait_time_close_sidebar);

    }else{
        layer.bindPopup(content_table).openPopup();
    }
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
                fillColor: selectVariableCSS('--firts-color'),
                color: selectVariableCSS('--firts-color'),
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

                    add_popup_layer(layer, html_content_popup);

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

function get_callback_metrics_simple(FormData_input){
    selectElement('#response_preloader').classList.remove('hide');
    selectElement('#response_preloader').classList.add('wallpaper');

    get_post_data_json('assets/php/load_simple_metrics.php', FormData_input)
    .then((data_response)=>{
        stop_animation_loader('success');

        function load_click_btn(){
            selectElement('#screen').style['animation-name'] = 'fade_in_screen';
            selectElement('#wallpaper').classList.remove('hide');
            selectElement('#wallpaper').classList.add('wallpaper');

            setTimeout(() => {
                selectElement('#sidebar_response').classList.remove('hide');
                selectElement('#sidebar_response').classList.add('sidebar');
                load_simple_metrics(data_response);
            }, wait_time_sidebar);

            setTimeout(() => {
                selectElement('#screen').style['animation-name'] = '';
                selectElement('#restart_preloader').removeEventListener('click', load_click_btn, false);
            }, wait_time_close_sidebar);
        }

        selectElement('#restart_preloader').addEventListener('click', load_click_btn, false);
        
    })
    .catch((error) =>{
        console.log(error);
        stop_animation_loader('error')
    })

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
            <button id="load_chart" data-btn="load_chart" class="btn_custom">
                <svg data-btn="load_chart">
                    <use data-btn="load_chart" xlink:href="#bar_chart"/>
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

                if(dataset == 'load_chart'){
                    let FormData_input = new FormData();
                    let value_current_select = selectElement('#select_month').value;
                    FormData_input.append('number_month', value_current_select);

                    get_callback_metrics_simple(FormData_input);

                }

                if(dataset == 'informacion'){
                    selectElement('#screen').style['animation-name'] = 'fade_in_screen';
                    selectElement('#wallpaper').classList.remove('hide');
                    selectElement('#wallpaper').classList.add('wallpaper');

                    setTimeout(() => {
                        selectElement('#sidebar_information').classList.remove('hide');
                        selectElement('#sidebar_information').classList.add('sidebar');
                    }, wait_time_sidebar);

                    setTimeout(() => {
                        selectElement('#screen').style['animation-name'] = '';
                    }, wait_time_close_sidebar);
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

function restart_style_preloader(){
    var preloader = selectElement('#response_preloader .preloader_wallpaper');
    preloader.classList.remove('error');
    preloader.classList.remove('success');
    preloader.classList.remove('success_summary');
    preloader.classList.remove('stop_animation_preloader');

    selectElement('#response_preloader').classList.remove('wallpaper');
    selectElement('#response_preloader').classList.add('hide');

}

function restart_style_preloader_click_button(e){
    e.preventDefault;
    let btn = e.target;
    btn.disabled = true;

    restart_style_preloader();

    selectElement('main').style['animation-name'] = 'fade_in_data';

    setTimeout(() => {
        btn.removeAttribute('disabled');
        selectElement('main').style['animation-name'] = '';
    }, wait_time_sidebar);

}

function stop_animation_loader(class_response){
    var preloader = selectElement('#response_preloader .preloader_wallpaper');
    preloader.classList.add(class_response);
    preloader.classList.add('stop_animation_preloader');
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
                    color: selectVariableCSS('--firts-color'),
                    font: {
                        size: 18,
                        family: selectVariableCSS('--font-body')
                    }
                },
                ticks: {
                    color: selectVariableCSS('--firts-color')
                }
            },
            y: {
                stacked: false,
                display: false,
                title: {
                    display: false,
                    text: '',
                    color: selectVariableCSS('--firts-color'),
                    font: {
                        size: 18,
                        family: selectVariableCSS('--font-body')
                    }
                },
                ticks: {
                    color: selectVariableCSS('--firts-color')
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: selectVariableCSS('--firts-color'),
                    font: {
                        size: 16,
                        family: selectVariableCSS('--font-body')
                    }
                }
            },
            title: {
                display: true,
                text: '',
                color: selectVariableCSS('--firts-color'),
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
 * @returns {Object} myChart - Object type Chart JS
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
            borderColor: selectVariableCSS('--firts-color'),
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

    return myChart;
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

    var options = create_option_chart();
    options.plugins.title.text = 'Distribución por edad';
    options.scales.x.stacked = true;
    options.scales.x.display = true;
    options.scales.x.title.display = true;
    options.scales.x.title.text = 'Rango de edad (años)';

    options.scales.y.stacked = true;
    options.scales.y.display = true;
    options.scales.y.title.display = true;
    options.scales.y.title.text = '# de casos';

    options.maintainAspectRatio = false;
    options.indexAxis = 'x';

    let data = {
        labels: ['0-10', '11-20', '21-30', '31-40',
                '41-50', '51-60', '> 61'],
        datasets: [{
          label: 'Masculino',
          data: array_data_male,
          backgroundColor: selectVariableCSS('--firts-color-bar'),
          borderColor: selectVariableCSS('--firts-color'),
          borderWidth: 1
        },
        {
          label: 'Femenino',
          data: array_data_female,
          backgroundColor: selectVariableCSS('--third-color-bar'),
          borderColor: selectVariableCSS('--firts-color'),
          borderWidth: 1
        }
      ]
    };
        
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
 * @returns {Object} myChart - Object type Chart JS
 */
function create_chart_line({id_element, label_array, data_count, data_month}){

    let options = create_option_chart();
    options.plugins.title.text = 'Acumulado por semana';
    options.scales.x.display = true;
    options.scales.x.title.display = true;
    options.scales.x.title.text = 'Semana epidemiologica';

    options.scales.y.display = true;
    options.scales.y.title.display = true;
    options.scales.y.title.text = '# de casos';

    options.plugins.legend.display = false;

    options.maintainAspectRatio = false;
    
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
            borderColor: selectVariableCSS('--third-color-bar'),
            pointBackgroundColor: selectVariableCSS('--third-color-bar'),
            fill: false
        }]
    };

    let ctx = document.getElementById(id_element);
    let myChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });

    return myChart;
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
 * @property {Array.<Number>} data_response.data.distribution_week_epi.label
 * @property {Array.<Number>} data_response.data.distribution_week_epi.count
 * @property {Array.<Number>} data_response.data.distribution_week_epi.month
 */
function load_simple_metrics(data_response){
    
    let chart_pie = create_chart_pie(
        'chart_pie_sex',
        data_response.data.distribution_sex
    )
    
    let chart_stacked_bar = create_chart_stacked_bar({
        id_element: 'group_age',
        array_data_male: data_response.data.distribution_age.male,
        array_data_female: data_response.data.distribution_age.female
    });

    let chart_line = create_chart_line({
        id_element: 'week_epi',
        label_array: data_response.data.distribution_week_epi.label,
        data_count: data_response.data.distribution_week_epi.count,
        data_month: data_response.data.distribution_week_epi.month
    });

    let btn = document.querySelectorAll('.close_response');

    function remove_chart(){
        setTimeout(() => {
            chart_pie.destroy();
            chart_stacked_bar.destroy();
            chart_line.destroy();
        }, wait_time_sidebar);

        btn.forEach((element) =>{
            element.removeEventListener('click', remove_chart, false);
        });
    }

    btn.forEach((element) =>{
        element.addEventListener('click', remove_chart, false);
    });

}

function close_sidebar_btn(e){
    e.preventDefault();
    let btn = e.target;
    btn.disabled = true;

    /**
     * name sidebar id target is requerid 
     * for remove class sidebar and wallpaper
     * @type {String}
     * @constant
     */
    let name_sidebar = btn.dataset.sidebar;
    let sidebar = document.getElementById(name_sidebar);
    selectElement('#screen').style['animation-name'] = 'fade_in_screen';

    setTimeout(() => {
        sidebar.classList.remove('sidebar');
        sidebar.classList.add('hide');
        selectElement('#wallpaper').classList.remove('wallpaper');
        selectElement('#wallpaper').classList.add('hide');
    }, wait_time_sidebar);

    setTimeout(() => {
        selectElement('#screen').style['animation-name'] = '';
        btn.removeAttribute('disabled');
    }, wait_time_close_sidebar);

}

const appHeight = () => {
    const doc = document.documentElement;
    let vh = window.innerHeight * 0.01;
    doc.style.setProperty('--app-height', `${vh}px`)
}

function load(){

    if(window.matchMedia('(pointer: coarse)').matches){
        appHeight();
        window.addEventListener('resize', appHeight, false);
    }

    let FormData_input = new FormData();
    FormData_input.append('number_month', 3);

    selectElement('#restart_preloader').addEventListener('click', restart_style_preloader_click_button, false);

    let btn_close = document.querySelectorAll('.close_popup, .close_response');

    btn_close.forEach((element) =>{
        element.addEventListener('click', close_sidebar_btn, false);
    });
    
    Promise.all([
        get_post_data_json(url_post_array_community, FormData_input),
        get_data_json('assets/php/create_data_dpt.php')
    ])
    .then((array_response_data) =>{
        var preloader = selectElement('#init_preloader .preloader_wallpaper');
        preloader.classList.add('success');
        preloader.classList.add('stop_animation_preloader');

        let array_data_point = array_response_data[0];
        let data_dpt = array_response_data[1];
        let geojson = create_geojson(array_data_point.data);

        setTimeout(() => {
            selectElement('#init_preloader').classList.remove('init_preloader');
            selectElement('#init_preloader').classList.add('hide');
            selectElement('main').classList.remove('hide');

            create_map(geojson, data_dpt);

            selectElement('main').style['animation-name'] = 'fade_in_data';
            
            setTimeout(() => {
                selectElement('main').style['animation-name'] = '';
            }, wait_time_sidebar);

            

        }, wait_time_sidebar);
        
    })
    .catch((error) => {
		var preloader = selectElement('#init_preloader .preloader_wallpaper');
        preloader.classList.add('error');
        preloader.classList.add('stop_animation_preloader');
	});
    
    
}

window.addEventListener('load', load, false);