"use strict";

import * as THREE from '../libs/three.js/three.module.js';
import * as CANNON from '../libs/cannon-es.js/cannon-es.js';
import CannonDebugger from '../libs/cannon-es-debugger/cannon-es-debugger.js';
import { OrbitControls } from '../libs/three.js/controls/OrbitControls.js';
import TerrainGenerator from './modules/TerrainGenerator.js';
import PlayerControls from './modules/PlayerControls.js';
import ThirdPersonCamera from './modules/ThirdPersonCamera.js';
import GameManager from './modules/GameManager.js';
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
    // const camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 1, 4000);
    const camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 1, 10000);
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

    // Models

    // Apple model data
    const appleModelUrls = {
        obj:'./models/apple/Apple.obj', 
        map:'./models/apple/Apple_BaseColor.png', 
        normalMap:'./models/apple/Apple_Normal.png', 
        specularMap: './models/apple/Apple_Roughtness.png'
    };

    // Load models
    const [
        playerModel, apple, cloud, enemy, 
        powerup0, powerup1, powerup2, ...terrainModels
    ] = await Promise.all([
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
        Loaders.loadFBX('./models/power_ups/pwr3.fbx'),

        // Load terrain models
        Loaders.loadFBX('./models/hill_assets/bush1.fbx'),
        Loaders.loadFBX('./models/hill_assets/bush2.fbx'),
        Loaders.loadFBX('./models/hill_assets/bush3.fbx'),
        Loaders.loadFBX('./models/hill_assets/combo.fbx'),
        Loaders.loadFBX('./models/hill_assets/rock1.fbx'),
        Loaders.loadFBX('./models/hill_assets/rock2.fbx'),
        Loaders.loadFBX('./models/hill_assets/rock3.fbx'),
        Loaders.loadFBX('./models/hill_assets/rock4.fbx'),
        Loaders.loadFBX('./models/hill_assets/rock5.fbx'),
        Loaders.loadFBX('./models/hill_assets/tree1.fbx'),
        Loaders.loadFBX('./models/hill_assets/tree2.fbx'),
    ]);

    const playerBody = new CANNON.Body({
        mass: 1,
        shape: new CANNON.Sphere(14),
        material: new CANNON.Material('playerMaterial')
    });
    // playerBody.fixedRotation = false;
    // playerBody.updateMassProperties();

    const playerMesh = new THREE.Object3D();
    playerModel.rotateY(Math.PI);
    playerMesh.add(playerModel);

    const player = { mesh: playerMesh, body: playerBody };

    apple.rotateX(-Math.PI / 2);
    enemy.rotateX(-Math.PI / 2);

    const powerups = [powerup0, powerup1, powerup2];
    powerups[0].name = 'Pink';
    powerups[1].name = 'Blue';
    powerups[2].name = 'Green';
    
    return { directionalLight, hemisphereLight, player, apple, cloud, enemy, powerups, terrainModels };
};

async function main() {
    const { renderer, scene, camera, orbitControls } = setupThreeJs();

    const { 
        directionalLight, hemisphereLight, player,
        apple, cloud, enemy, powerups, terrainModels
    } = await setupScene();
    scene.add(directionalLight, hemisphereLight);

    // Initialize CANNON world
    const world = new CANNON.World();
    // world.gravity.set(0, -98.1, 0);
    world.gravity.set(0, -98.1, 0);

    // Transform player
    player.body.position.set(0, 40, 950);
    player.mesh.scale.set(0.2, 0.2, 0.2);
    // player.mesh.castShadow = true;
    // player.mesh.receiveShadow = false;

    // Add player to world
    scene.add(player.mesh);
    world.addBody(player.body);

    // Create island group for collision test
    const islands = new THREE.Group();
    islands.name = 'Islands';
    scene.add(islands);

    // Instantiate PlayerControls
    const playerControls = new PlayerControls(player);
    
    // Instantiate ThirdPersonCamera
    const [idealOffset, idealLookat] = [new THREE.Vector3(200, 100, 300), new THREE.Vector3(50, -20, -200)];
    const thirdPersonCamera = new ThirdPersonCamera(camera, playerControls, islands, idealOffset, idealLookat);

    // Instantiate TerrainGenerator
    const islandTextures = ['./images/water_texture.jpg', './images/desert_texture.jpeg', './images/ice_texture.jpeg', './images/grass_texture.jpeg'];
    const terrainGenerator = new TerrainGenerator(islandTextures, [cloud], terrainModels, 1000);

    // Instantiate GameManager
    const gameManagerSettings = {
        cloudObjects: 50,
        terrainObjects: 40,
        enemyObjects: 10,
        scoreObjects: 25,
        powerupObjects: 6,
    };
    const gameManager = new GameManager(player, terrainGenerator, [enemy], [apple], powerups, gameManagerSettings);
   

    const cannonDebugger = new CannonDebugger(scene, world, { color: 0x00FF00, scale: 1.0 });
    const clock = new THREE.Clock();
    function animate() {
        let deltaTime = clock.getDelta();

        world.fixedStep();

        gameManager.update();

        if (gameManager.gameOver) return;

        playerControls.update();
        thirdPersonCamera.update(deltaTime);
        // cannonDebugger.update();
        // orbitControls.update();

        player.mesh.position.copy(player.body.position);
        player.mesh.quaternion.copy(player.body.quaternion);

        requestAnimationFrame(animate);
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
