"use strict";

import * as THREE from '../libs/three.js/three.module.js';
import * as CANNON from '../libs/cannon-es.js/cannon-es.js';
import CannonDebugger from '../libs/cannon-es-debugger/cannon-es-debugger.js';
import { OrbitControls } from '../libs/three.js/controls/OrbitControls.js';
import TerrainGenerator from './modules/TerrainGenerator.js';
import PlayerControls from './modules/PlayerControls.js';
import ThirdPersonCamera from './modules/ThirdPersonCamera.js';
import * as Loaders from './modules/Loaders.js';

/**
 * Sets up ThreeJs environment.
 * @returns {{ scene: Scene, camera: PerspectiveCamera, renderer: WebGLRenderer }} Returns 
 * the scene, camera, and renderer created using ThreeJs.
 */
function setupThreeJs() {
    // Get a reference to the HTML canvas
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById('webglcanvas');

    // Set canvas' width and height
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Setup Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

    // Set renderer pixel ratio as device's pixel ratio and renderer's viewport size
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.width, canvas.height);

    // Enable shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    
    // Setup Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 'skyblue' );

    // Setup Perspective Camera
    const camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 1, 4000);
    camera.position.set(0, 220, 1500);

    // Orbit controls
    const orbitControls = new OrbitControls(camera, renderer.domElement);

    // Return the scene, camera, and renderer
    return { renderer, scene, camera, orbitControls };
};

async function setupScene() {
    // Lights

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(500, 500, -500);
    directionalLight.target.position.set(0, 0, 0);
    directionalLight.castShadow = true;

    // Hemisphere light
    const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);

    // // Audio
    // window.addEventListener("DOMContentLoaded", event => {
    //     const audio = document.querySelector("audio");
    //     audio.volume = 0.05;
    //     audio.play();
    // });

    // Models

    // Apple model data
    const appleModelUrls = {
        obj:'./models/apple/Apple.obj', 
        map:'./models/apple/Apple_BaseColor.png', 
        normalMap:'./models/apple/Apple_Normal.png', 
        specularMap: './models/apple/Apple_Roughtness.png'
    };

    // Load models
    const [playerModel, apple, cloud, enemy, ...powerups] = await Promise.all([
        // Load the player
        Loaders.loadFBX('./models/cerdo/cerdito_alas.fbx'),

        // Load the apples (points)
        Loaders.loadObj(appleModelUrls),

        // Load the clouds
        Loaders.loadFBX('./models/cloud/Cloud_1.fbx'),

        // Load enemies
        Loaders.loadFBX('./models/enemies/pigeon.fbx'),

        // Load powerups
        Loaders.loadFBX('./models/power_ups/pwr1.fbx'),
        Loaders.loadFBX('./models/power_ups/pwr2.fbx'),
        Loaders.loadFBX('./models/power_ups/pwr3.fbx')
    ]);

    const playerBody = new CANNON.Body({
        mass: 1,
        shape: new CANNON.Sphere(14),
        material: new CANNON.Material('playerMaterial')
    });
    playerBody.fixedRotation = true;
    playerBody.updateMassProperties();

    const playerMesh = new THREE.Object3D();
    playerModel.rotateY(Math.PI);
    playerMesh.add(playerModel);


    const player = { mesh: playerMesh, body: playerBody }
    
    return { directionalLight, hemisphereLight, player, apple, cloud, enemy, powerups };
};

async function main() {
    const { renderer, scene, camera, orbitControls } = setupThreeJs();

    const { 
        directionalLight, hemisphereLight, player,
        apple, cloud, enemy, powerups 
    } = await setupScene();
    scene.add(directionalLight, hemisphereLight);

    // Initialize CANNON world
    const world = new CANNON.World();
    world.gravity.set(0, -98.1, 0);

    // Create island group for collision test
    const islands = new THREE.Group();
    islands.name = 'Islands';
    scene.add(islands);

    // Instantiate TerrainGenerator
    const islandTextures = ['./images/water_texture.jpg', './images/desert_texture.jpeg', './images/ice_texture.jpeg', './images/grass_texture.jpeg'];
    const terrainGenerator = new TerrainGenerator(islandTextures, [cloud], [enemy], powerups);
    const island = terrainGenerator.generateTerrain(1);
    islands.add(island.mesh);
    world.addBody(island.body);

    // Transform player
    player.body.position.set(0, 40, 950);
    player.mesh.scale.set(0.2, 0.2, 0.2);

    // Add player to world
    scene.add(player.mesh);
    world.addBody(player.body);

    // Create ground and player contact material
    const slipperyGroundContactMaterial = new CANNON.ContactMaterial(island.body.material, player.body.material, { friction: 0, restitution: 0 });
    world.addContactMaterial(slipperyGroundContactMaterial);

    // Instantiate PlayerControls
    const playerControls = new PlayerControls(player);

    // Instantiate ThirdPersonCamera
    const [idealOffset, idealLookat] = [new THREE.Vector3(200, 100, 200), new THREE.Vector3(50, -30, -100)];
    const thirdPersonCamera = new ThirdPersonCamera(camera, playerControls, islands, idealOffset, idealLookat);

    // const sphere = new THREE.Mesh (
    //     new THREE.SphereGeometry(500),
    //     new THREE.MeshBasicMaterial({ color: 0xFF0000})
    // );
    // sphere.scale.set(0.05, 0.05, 0.05);

    setInterval(_ => {
        const cloud = terrainGenerator.generateClouds();
        // const enemy = terrainGenerator.generateEnemy();
        // const powerup = terrainGenerator.generatePowerup();
        // scene.add(cloud, enemy, powerup);
        scene.add(cloud)
    }, 5000);

    const cannonDebugger = new CannonDebugger(scene, world, { color: 0x00FF00, scale: 1.0 });
    const clock = new THREE.Clock();
    function animate() {
        let deltaTime = clock.getDelta();

        world.fixedStep();

        playerControls.update();
        // thirdPersonCamera.update(deltaTime);

        island.mesh.position.copy(island.body.position);
        island.mesh.quaternion.copy(island.body.quaternion);

        player.mesh.position.copy(player.body.position);
        player.mesh.quaternion.copy(player.body.quaternion);

        requestAnimationFrame(animate);
        // cannonDebugger.update();
        orbitControls.update();
        renderer.render(scene, camera);
    };
    animate();

    function resize() {
        const canvas = document.getElementById("webglcanvas");
    
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
    
        camera.aspect = canvas.width / canvas.height;
    
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();
};

main();