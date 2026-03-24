import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { generate_moves, generate_stack, generate_tasks } from "./stack_logis";

const _rndBuf = new Uint32Array(1);
function randInt(max) {
    crypto.getRandomValues(_rndBuf);
    return _rndBuf[0] % max;
}

let camera;
let renderer;
let scene;
let controls;
let cube;
// crane description
let spreader = [];
let rtg = [];
let container_under_spreader = [];
let container_machinery = [];

let section_positions = [];
let horizontal_positions = [];
let vertical_positions = [];
let model_global_z;
let model_global_y;
//var list_of_actions = [];
var plus_y;
var plus_z;
var current_action = 0;
var mech_color;
var container_geometry;
var container_material;
var res0 = false;
var res1 = false;
var res2 = false;
var max_section = 10;
var max_row = 10;
var max_height = 6;
var stack = generate_stack(max_section, max_row, max_height);
var list_of_tasks;
var rtg_move_bool = true;
var crane_speed = 0.1;
var spreader_speed = 0.1;

function init(){
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x034e1eb )
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 20000 );
    
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    document.body.appendChild( renderer.domElement );
    controls = new MapControls(camera, renderer.domElement);
    controls.enableDamping = true;

    camera.position.x = -50;
    camera.position.y = 40;
    camera.position.z = 6;

    //floor 
    var earth_geom = new THREE.PlaneGeometry(20 *12 + 50, 50);
    var earth_material = new THREE.MeshPhongMaterial({ color : 0x808080 , side : THREE.DoubleSide});
    var earth_plane = new THREE.Mesh( earth_geom, earth_material);
    earth_plane.rotation.x = 3.14 / 2;
    earth_plane.position.z = 15;
    earth_plane.position.x = (20 * 12 ) / 2;
    scene.add(earth_plane);
    
    // lights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.z = 100;
    directionalLight.position.y = 500;
    directionalLight.position.x = -500;
    scene.add(directionalLight)
    
    //const helper = new THREE.DirectionalLightHelper( directionalLight, 0.7 );
    //scene.add( helper );
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight2.position.z = 100;
    directionalLight2.position.y = 500;
    directionalLight2.position.x = 500;
    scene.add(directionalLight2)
    
    //const helper2 = new THREE.DirectionalLightHelper( directionalLight2, 0.7 );
    //scene.add( helper2 );

    const loader = new GLTFLoader();

    // container under spreader data

    loader.load( 'RTG9+Spreader.gltf', function ( gltf ) {
        var rtg_el = {"current_action" : 0, 
                "model" : gltf.scene,
                "list_of_actions" : [],
                "res0" : false,
                "res1" : false,
                "res2" : false,
                "container_under_spreader" : undefined,
                "spreader" : undefined,
                "container_machinery" : []};
        var cont_mach = [];
        scene.add( gltf.scene );
        var min_z = 10000000;
        var max_z = -10000000;
        gltf.scene.children.forEach(element => {
            if(element.name === "Spreader"){
                rtg_el.spreader = element;
            }else if(element.name === "Machinery"){
                cont_mach.push(element);
            }else if(element.name === "Cabin"){
                cont_mach.push(element);
            }else if(element.name === "Line_1"){
                cont_mach.push(element);
            }else if(element.name === "Line_2"){
                cont_mach.push(element);
            }else if(element.name === "Line_3"){
                cont_mach.push(element);
            }else if(element.name === "Line_4"){
                cont_mach.push(element);
            }

            if(element.position.z < min_z){
                min_z = element.position.z;
            }
            if(element.position.z > max_z){
                max_z = element.position.z;
            }
        });
        rtg_el.container_machinery = cont_mach;
        rtg.push(rtg_el);
        var dist = (max_z - min_z) / 2;
        gltf.scene.position.z = dist;
        model_global_z = gltf.scene.position.z;
        model_global_y = gltf.scene.position.y;
    }, undefined, function ( error ) {
        console.error( error );
    } );

    /*loader.load( 'RTG9+Spreader.gltf', function ( gltf ) {
        var rtg_el = {"current_action" : 0, 
                "model" : gltf.scene,
                "list_of_actions" : [],
                "res0" : false,
                "res1" : false,
                "res2" : false,
                "container_under_spreader" : undefined,
                "spreader" : undefined,
                "container_machinery" : []};
        var cont_mach = [];
        scene.add( gltf.scene );
        var min_z = 10000000;
        var max_z = -10000000;
        gltf.scene.children.forEach(element => {
            if(element.name === "Spreader"){
                rtg_el.spreader = element;
            }else if(element.name === "Machinery"){
                cont_mach.push(element);
            }else if(element.name === "Cabin"){
                cont_mach.push(element);
            }else if(element.name === "Line_1"){
                cont_mach.push(element);
            }else if(element.name === "Line_2"){
                cont_mach.push(element);
            }else if(element.name === "Line_3"){
                cont_mach.push(element);
            }else if(element.name === "Line_4"){
                cont_mach.push(element);
            }

            if(element.position.z < min_z){
                min_z = element.position.z;
            }
            if(element.position.z > max_z){
                max_z = element.position.z;
            }
        });
        rtg_el.container_machinery = cont_mach;
        rtg.push(rtg_el);
        var dist = (max_z - min_z) / 2;
        gltf.scene.position.z = dist;
        gltf.scene.position.x = max_section * 12.3;
        model_global_z = gltf.scene.position.z;
        model_global_y = gltf.scene.position.y;
    }, undefined, function ( error ) {
        console.error( error );
    } );*/

    // generate 255 materials with evenly distributed hues
    var container_materials = [];
    for(let m = 0; m < 255; m++){
        var hue = m / 255;
        var color = new THREE.Color().setHSL(hue, 0.7, 0.5);
        container_materials.push(new THREE.MeshPhongMaterial({ color }));
    }

    // generate containers
    container_geometry = new THREE.BoxGeometry(12, 2.9, 2.4);
    plus_z = 3.3;
    plus_y = 1.45;
    for(let k = 0; k < stack.length; k++){
        for(let i = 0; i < stack[k].length; i++){
            for(let j = 0; j < stack[k][i].meshs.length; j++){
                var mat_index = randInt(255);
                mech_color = container_materials[mat_index].color.getHex();
                container_material = container_materials[mat_index];
                var mesh = new THREE.Mesh(container_geometry, container_material);
                scene.add(mesh);
                mesh.position.z = i * 2.7 + plus_z;
                mesh.position.y = 3 * j + plus_y;
                mesh.position.x = 12.3 * k;
                stack[k][i].meshs[j] = mesh;
                stack[k][i].color[j] = mech_color;
            }
        }
    }
    for(let i = 0; i <= max_row; i++){
        horizontal_positions.push(2.7 * i + plus_z);
    }
    for(let j = 0; j <= max_height; j++){
        vertical_positions.push(3 * j + plus_y);
    }
    vertical_positions.push(3 * 6 + 1.45);
    vertical_positions.push(3 * 7 + 1.45);
    for(let k = 0; k < max_section; k++){
        section_positions.push(12.3 * k);
    }
    // add stack lines
    // ---
    // vertical
    var line_material = new THREE.LineBasicMaterial({ color : 0xffff00});
    for(let j = 0; j <= max_row; j++){
        var list_of_ver_points = [];
        list_of_ver_points.push(new THREE.Vector3(0 - 6.25, 0.05, j * 2.7 + plus_z - 1.35));
        list_of_ver_points.push(new THREE.Vector3(max_section * 12.3 - 6.25, 0.01, j * 2.7 + plus_z - 1.35));
        var line_geom = new THREE.BufferGeometry().setFromPoints(list_of_ver_points);
        var var_line = new THREE.Line(line_geom, line_material);
        scene.add(var_line);
    }
    for(let j = 0; j <= max_section; j++){
        var list_of_hor_points = [];
        list_of_hor_points.push(new THREE.Vector3(j * 12.3 - 6.25, 0.01, 0 + plus_z - 1.35));
        list_of_hor_points.push(new THREE.Vector3(j * 12.3 - 6.25, 0.01, max_row * 2.7 + plus_z - 1.35));
        var line_geom = new THREE.BufferGeometry().setFromPoints(list_of_hor_points);
        var var_line = new THREE.Line(line_geom, line_material);
        scene.add(var_line);
    }
}

function move_forward(row_num, rtg_element){
    if(rtg_element.spreader.position.z + model_global_z > horizontal_positions[row_num]){
        rtg_element.spreader.position.z -= spreader_speed;
        rtg_element.container_machinery.forEach(element =>{
            element.position.z -= spreader_speed;
        });
        if(rtg_element.container_under_spreader != undefined){
            rtg_element.container_under_spreader.position.z -= spreader_speed;
        }
        return !(rtg_element.spreader.position.z + model_global_z >= horizontal_positions[row_num]);
    }else if(rtg_element.spreader.position.z + model_global_z < horizontal_positions[row_num]){
        rtg_element.spreader.position.z += spreader_speed;
        rtg_element.container_machinery.forEach(element =>{
            element.position.z += spreader_speed;
        });
        if(rtg_element.container_under_spreader != undefined){
            rtg_element.container_under_spreader.position.z += spreader_speed;
        }
        return !(rtg_element.spreader.position.z + model_global_z < horizontal_positions[row_num]);
    }else{
        return true;
    }
}

function move_down(tier_num, rtg_element){
    if(rtg_element.spreader.position.y + model_global_y > vertical_positions[tier_num] + 1.45){
        rtg_element.spreader.position.y -= spreader_speed;
        if(rtg_element.container_under_spreader != undefined){
            rtg_element.container_under_spreader.position.y -= spreader_speed;
        }
        return !(rtg_element.spreader.position.y + model_global_y > vertical_positions[tier_num] + 1.45);
    }else if(rtg_element.spreader.position.y + model_global_y < vertical_positions[tier_num] + 1.45){
        rtg_element.spreader.position.y += spreader_speed;
        if(rtg_element.container_under_spreader != undefined){
            rtg_element.container_under_spreader.position.y += spreader_speed;
        }
        return !(rtg_element.spreader.position.y + model_global_y < vertical_positions[tier_num] + 1.45);
    }else{
        return true;    
    }
}

function move_section_forward(section_num, rtg_element){
    if(rtg_element.model.position.x < section_positions[section_num]){
        rtg_element.model.position.x += crane_speed;
        if(rtg_element.container_under_spreader != undefined){
            rtg_element.container_under_spreader.position.x += crane_speed;
        }
        return !(rtg_element.model.position.x < section_positions[section_num]);
    }else if(rtg_element.model.position.x > section_positions[section_num]){
        rtg_element.model.position.x -= crane_speed;
        if(rtg_element.container_under_spreader != undefined){
            rtg_element.container_under_spreader.position.x -= crane_speed;
        }
        return !(rtg_element.model.position.x > section_positions[section_num]);
    }else{
        return true;
    }
}


function move_rtg(){
    rtg.forEach(rtg_element => {
        if(rtg_element.current_action < rtg_element.list_of_actions.length){
            var section_num = rtg_element.list_of_actions[rtg_element.current_action][0];
            var row_num = rtg_element.list_of_actions[rtg_element.current_action][1];
            var tier_num = rtg_element.list_of_actions[rtg_element.current_action][2];
            var cont = rtg_element.list_of_actions[rtg_element.current_action][3];
            if(cont === "with_cont" && rtg_element.container_under_spreader === undefined){
                var mesh = rtg_element.list_of_actions[rtg_element.current_action-1]?.[5];
                if(mesh && mesh.isObject3D){
                    rtg_element.container_under_spreader = mesh;
                    scene.add(rtg_element.container_under_spreader);
                }
            }else if(cont === "no_cont" && rtg_element.container_under_spreader != undefined){
                rtg_element.container_under_spreader = undefined;
            }
            if(rtg_element.res1){
                rtg_element.res2 = move_down(tier_num, rtg_element);
            }else if (rtg_element.res0){
                rtg_element.res1 = move_forward(row_num, rtg_element);
            }else{
                rtg_element.res0 = move_section_forward(section_num, rtg_element);
            }
            if(rtg_element.res0 && rtg_element.res1 && rtg_element.res2){
                // remove or add cont
                if(rtg_element.list_of_actions[rtg_element.current_action][4] === "remove_cont"){
                    var var_obj = rtg_element.list_of_actions[rtg_element.current_action][5];
                    scene.remove(var_obj);
                }
                rtg_element.current_action += 1;
                rtg_element.res0 = false;
                rtg_element.res1 = false;
                rtg_element.res2 = false;
            }
        }else{
            var list_of_actions = [];
            list_of_tasks = generate_tasks(stack, 1, rtg_element, rtg);
            if(list_of_tasks.length > 0){
                list_of_tasks.forEach(element =>{
                    list_of_actions.push(...generate_moves(stack, element));
                });
                rtg_element.current_action = 0;
            }
            rtg_element.list_of_actions = list_of_actions;
            //alert(list_of_actions);
        }
    });
    return true;
}

function animate() {
    move_rtg();
    controls.update();
	renderer.render( scene, camera );
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();