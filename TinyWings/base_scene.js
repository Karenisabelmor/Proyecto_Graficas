"use strict"; 

import * as THREE from '../libs/three.js/three.module.js'
import { OrbitControls } from '../libs/three.js/controls/OrbitControls.js';
import { OBJLoader } from '../libs/three.js/loaders/OBJLoader.js';
import { FBXLoader } from '../libs/three.js/loaders/FBXLoader.js';

// checar ejemplo 11_threejsInteraction

let renderer = null, scene = null, camera = null, groupHill = new THREE.Object3D, objectList = [], orbitControls = null;
let directionalLight = null, hemisphereLight = null;
let paused = false;

let objModelUrl = {obj:'./models/apple/Apple.obj', map:'./models/apple/Apple_BaseColor.png', normalMap:'./models/apple/Apple_Normal.png', specularMap: './models/apple/Apple_Roughtness.png'};

const scoreElement = document.getElementById("score");

function getConfig() {
    if(JSON.parse(window.localStorage.getItem('configuracion')) === null){
        return({
            dificultad:2,
            volumen: 5
        })
    } else {
        return JSON.parse(window.localStorage.getItem('configuracion'));
    }
}

function animate(){

    groupHill.position.x = groupHill.position.x + 0.1;
    groupHill.position.z = groupHill.position.z - 0.02;
}

function update() 
{
    requestAnimationFrame(function() { update(); });

    renderer.render( scene, camera );

    orbitControls.update();
    
    animate();
}

function main()
{
    const canvas = document.getElementById("webglcanvas");

    createScene(canvas);

    const configuracion = getConfig()
    
    update();
}

// Loaders para probar los assets
const fbxLoader = new FBXLoader()
fbxLoader.load(
    './models/cloud/Cloud_1.fbx',
    (cloud) => {
        cloud.scale.set(.02, .02, .02)
        cloud.position.z = -7;
        cloud.position.x = -16;
        cloud.position.y = 6;
        scene.add(cloud);
        groupHill.add(cloud);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
        console.log(error)
    }
)

const fbxLoader_Cerdo = new FBXLoader()
fbxLoader_Cerdo.load(
    './models/cerdo/cerdito_alas.fbx',
    (cerdito) => {
        cerdito.scale.set(0.025, 0.025, 0.025)
        cerdito.position.z = -11;
        cerdito.position.x = 5;
        cerdito.rotation.y = 5;
        cerdito.position.y = 3;
        scene.add(cerdito)
        cerdito.name = "cerdito"
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
        console.log(error)
    }
)

const fbxLoader_Hills = new FBXLoader()
fbxLoader_Hills.load(
    './models/hills/hills.fbx',
    (hill) => {
        hill.scale.set(0.050, 0.050, 0.050)
        hill.position.z = 30;
        hill.position.x = -220;
        hill.position.y = -3;
        hill.rotation.y = 30;
        scene.add(hill);
        groupHill.add(hill);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
        console.log(error)
    }
)

const fbxLoader_Enemies = new FBXLoader()
fbxLoader_Enemies.load(
    './models/enemies/pigeon.fbx',
    (pigeon) => {
        pigeon.scale.set(0.0050, 0.0050, 0.0050)
        pigeon.position.z = -7;
        pigeon.position.x = -16;
        pigeon.rotation.y = 1.7;
        pigeon.position.y = 6;
        scene.add(pigeon);
        groupHill.add(pigeon);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
        console.log(error)
    }
)

const fbxLoader_Pup1 = new FBXLoader()
fbxLoader_Pup1.load(
    './models/power_ups/pwr1.fbx',
    (pw1) => {
        pw1.scale.set(0.0050, 0.0050, 0.0050)
        pw1.position.z = -11;
        pw1.position.x = -10;
        pw1.rotation.y = 2;
        pw1.position.y = 6;
        scene.add(pw1);
        groupHill.add(pw1);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
        console.log(error)
    }
)

const fbxLoader_Pup2 = new FBXLoader()
fbxLoader_Pup2.load(
    './models/power_ups/pwr2.fbx',
    (pw2) => {
        pw2.scale.set(0.0050, 0.0050, 0.0050)
        pw2.position.z = -7;
        pw2.position.x = -10;
        pw2.rotation.y = 2;
        pw2.position.y = 6;
        scene.add(pw2);
        groupHill.add(pw2);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
        console.log(error)
    }
)

const fbxLoader_Pup3 = new FBXLoader()
fbxLoader_Pup3.load(
    './models/power_ups/pwr3.fbx',
    (pw3) => {
        pw3.scale.set(0.0050, 0.0050, 0.0050)
        pw3.position.z = -13;
        pw3.position.x = -13;
        pw3.rotation.y = 2;
        pw3.position.y = 6;
        scene.add(pw3);
        groupHill.add(pw3);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
        console.log(error)
    }
)

async function loadObj(objModelUrl, objectList)
{
    try
    {
        const object = await new OBJLoader().loadAsync(objModelUrl.obj);

        let texture = objModelUrl.hasOwnProperty('normalMap') ? new THREE.TextureLoader().load(objModelUrl.map) : null;
        let normalMap = objModelUrl.hasOwnProperty('normalMap') ? new THREE.TextureLoader().load(objModelUrl.normalMap) : null;
        let specularMap = objModelUrl.hasOwnProperty('specularMap') ? new THREE.TextureLoader().load(objModelUrl.specularMap) : null;

            for(const child of object.children)
            {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.map = texture;
                child.material.normalMap = normalMap;
                child.material.specularMap = specularMap;
            }

        object.scale.set(0.015, 0.015, 0.015);
        object.position.z = -9;
        object.position.x = -10;
        object.rotation.y = -3;
        object.position.y = 3;
        object.name = "objObject";
        
        objectList.push(object);
        scene.add(object);
        groupHill.add(object);
    }
    catch (err) 
    {
        onError(err);
    }
}

function onKeyDown ( event ) {
    var cerdo = scene.getObjectByName('cerdito');
    console.log(cerdo);
    switch ( event.keyCode ) {
        case 37: // left
        case 65: // a
            // cerdo.rotation.x += 0.1;
            cerdo.position.z += 0.5;
            break;
        case 38: // up
        case 87: // w
            //cerdo.rotation.z -= 0.1;
            cerdo.position.y += 0.5;
            break;
        case 39: // right
        case 68: // d
            //cerdo.rotation.x -= 0.1;
            cerdo.position.z -= 0.5;
            break;
        case 40: // down
        case 83: // s
            //cerdo.rotation.z += 0.1;
            cerdo.position.y -= 0.5;
            break;
    }
};

function createScene(canvas) 
{
    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);

    // Turn on shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    
    // Create a new Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 'skyblue' );

    // Camera
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    // camera.position.set(20, 10, -30);
    camera.position.set(20, 10, -25);

    // events
    document.addEventListener( 'keydown', onKeyDown, false );

    // Orbit controls
    orbitControls = new OrbitControls(camera, renderer.domElement);

    // Lights
    directionalLight = new THREE.DirectionalLight( 0xffffff, .9);
    directionalLight.position.set(.5, 1, -3);
    directionalLight.target.position.set(0,0,0);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9);
    scene.add(hemisphereLight);

    // Audio
    window.addEventListener("DOMContentLoaded", event => {
        const audio = document.querySelector("audio");
        audio.volume = 0.2;
        audio.play();
    });

    // Create the objects
    loadObj(objModelUrl, objectList);

    // Group objects
    scene.add(groupHill)
}

function resize()
{
    const canvas = document.getElementById("webglcanvas");

    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;

    camera.aspect = canvas.width / canvas.height;

    camera.updateProjectionMatrix();
    renderer.setSize(canvas.width, canvas.height);
}

window.addEventListener('resize', resize, false);

main();
resize(); 