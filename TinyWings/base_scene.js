/**
 * Main script that runs Cuchi Tails.
 * 
 * @module BaseScene
 * @file Main script that runs Cuchi Tales
 * @author Emilio Popovits Blake
 * @author Ana Paola Minchaca Garcia
 * @author Karen Isabel Morgado
 */

"use strict";

// Import third-party libraries
import {
    Scene, PerspectiveCamera, WebGLRenderer, Color, PCFShadowMap, 
    DirectionalLight, HemisphereLight, Object3D, Group, Vector3, 
    Clock,
    Mesh
} from '../libs/three.js/three.module.js';
import { OrbitControls } from '../libs/three.js/controls/OrbitControls.js';
import { 
    Body, Sphere, Material, World
} from '../libs/cannon-es.js/cannon-es.js';
import CannonDebugger from '../libs/cannon-es-debugger/cannon-es-debugger.js';

// Import modules
import * as Loaders from './modules/Loaders.js';
import PlayerControls from './modules/PlayerControls.js';
import ThirdPersonCamera from './modules/ThirdPersonCamera.js';
import TerrainGenerator from './modules/TerrainGenerator.js';
import GameManager from './modules/GameManager.js';

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
    const renderer = new WebGLRenderer({ canvas, antialias: true });

    // Set renderer pixel ratio as device's pixel ratio and renderer's viewport size
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.width, canvas.height);

    // Enable shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    
    // Setup Scene
    const scene = new Scene();
    scene.background = new Color( 'skyblue' );

    // Setup Perspective Camera
    // const camera = new PerspectiveCamera(45, canvas.width / canvas.height, 1, 4000);
    const camera = new PerspectiveCamera(45, canvas.width / canvas.height, 1, 10000);
    camera.position.set(0, 220, 1500);

    // Orbit controls
    const orbitControls = new OrbitControls(camera, renderer.domElement);

    // Return the scene, camera, and renderer
    return { renderer, scene, camera, orbitControls };
};

/**
 * Sets up ThreeJs scene lights.
 * @returns {{ directionalLight: DirectionalLight, hemisphereLight: HemisphereLight }} Returns 
 * a directional light and a hemisphere light, already positioned and set up for the scene.
 */
function setupLights() {
    // Directional light
    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(500, 500, -500);
    directionalLight.target.position.set(0, 0, 0);
    directionalLight.castShadow = true;

    // Hemisphere light
    const hemisphereLight = new HemisphereLight(0xaaaaaa, 0x000000, 0.9);

    return { directionalLight, hemisphereLight };
};

/**
 * Loads models and sets them up for usage.
 * @async
 * @returns {{ player: { mesh: Mesh, body: Body }, apple: Group, cloud: Group, enemy: Group, powerups: Group, terrainModels: Group }} 
 * Returns player, apple, cloud, powerup, and terrain models. Player comes with CANNON body.
 */
async function setupModels() {
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

    // Setup player CANNON body
    const playerBody = new Body({
        mass: 1,
        shape: new Sphere(14),
        material: new Material('playerMaterial')
    });

    // Create an object wrapper for the player's mesh, so 
    // player's mesh can be positioned and moved properly
    const playerMesh = new Object3D();
    playerModel.rotateY(Math.PI);
    playerMesh.add(playerModel);

    const player = { mesh: playerMesh, body: playerBody };

    // Rotate apple and enemy models so their +y is up
    apple.rotateX(-Math.PI / 2);
    enemy.rotateX(-Math.PI / 2);

    // Name the powerups for easy access
    const powerups = [powerup0, powerup1, powerup2];
    powerups[0].name = 'Pink';
    powerups[1].name = 'Blue';
    powerups[2].name = 'Green';
    
    // Return the player, apple, cloud, enemy, powerups, and terrain models
    return { player, apple, cloud, enemy, powerups, terrainModels };
};

/** 
 * Main function.
 * @async
 */
async function main() {
    // Setup ThreeJs, lights, and models
    const { renderer, scene, camera, orbitControls } = setupThreeJs();
    const { directionalLight, hemisphereLight } = setupLights();

    const { 
        player, apple, cloud, enemy, powerups, terrainModels
    } = await setupModels();

    // Add lights to scene
    scene.add(directionalLight, hemisphereLight);

    // Initialize CANNON world
    const world = new World();
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
    const islands = new Group();
    islands.name = 'Islands';
    scene.add(islands);

    // Instantiate PlayerControls
    const playerControls = new PlayerControls(player);
    
    // Instantiate ThirdPersonCamera
    const [idealOffset, idealLookat] = [new Vector3(200, 100, 300), new Vector3(50, -20, -200)];
    const thirdPersonCamera = new ThirdPersonCamera(camera, playerControls, islands, idealOffset, idealLookat);

    // Instantiate TerrainGenerator
    const islandTextures = ['./images/water_texture.jpg', './images/desert_texture.jpeg', './images/ice_texture.jpeg', './images/grass_texture.jpeg'];
    const terrainGenerator = new TerrainGenerator(islandTextures, [cloud], terrainModels, 1000);

    // Instantiate GameManager
    const gameManager = new GameManager(player, terrainGenerator, [enemy], [apple], powerups);
   
    // Instantiate cannon debugger, which shows cannon meshes
    const cannonDebugger = new CannonDebugger(scene, world, { color: 0x00FF00, scale: 1.0 });

    const clock = new Clock();
    function animate() {
        // Get deltaTime from ThreeJs
        let deltaTime = clock.getDelta();

        // Call fixedStep from CANNON world, which is done to 
        // calculate the physics with a fixed time step (not 
        // deltaTime)
        world.fixedStep();

        // Call the gameManager update function
        gameManager.update();

        // If the game's over, end animate function here.
        if (gameManager.gameOver) return;

        // Call playerControls and thirdPersonCamera update 
        // functions
        playerControls.update();
        thirdPersonCamera.update(deltaTime);
        
        // [DEBUG] Un-comment for debugging
        // cannonDebugger.update();
        // orbitControls.update();

        // Every frame, copy the player's CANNON body position and rotation 
        // into its ThreeJs mesh so mesh follows cannon body
        player.mesh.position.copy(player.body.position);
        player.mesh.quaternion.copy(player.body.quaternion);

        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    };
    animate();

    // Resize function so canvas resizes on window resize
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
