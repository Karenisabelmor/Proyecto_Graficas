"use strict";

import * as THREE from '../libs/three.js/three.module.js';
import * as CANNON from '../libs/cannon-es.js/cannon-es.js';
import CannonDebugger from '../libs/cannon-es-debugger/cannon-es-debugger.js';
import { OrbitControls } from '../libs/three.js/controls/OrbitControls.js';
import TerrainGenerator from './modules/TerrainGenerator.js';
import PlayerControls from './modules/PlayerControls.js';
import ThirdPersonCamera from './modules/ThirdPersonCamera.js';
import * as Loaders from './modules/Loaders.js';

// Variables and flags
let score = 1;
let scoreText = document.getElementById("score");
let colisiones = [];
let dead = false;
let flag = false;
let enemyBox, cloudBox;

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
    const terrainGenerator = new TerrainGenerator(islandTextures, [cloud], [enemy], [apple], powerups, 10);
    const island = terrainGenerator.generateTerrain(3);
    const generatedClouds = terrainGenerator.generatedClouds;
    // island.mesh.receiveShadow = true;
    islands.add(island.mesh);
    world.addBody(island.body);

    let clouds = [];
    // Add clouds to scene
    generatedClouds.forEach((cloud, index) => {
        cloud.name = 'Cloud' + index;
        clouds.push(cloud);
        scene.add(cloud);
    })

    // Transform player
    player.body.position.set(0, 40, 950);
    player.mesh.scale.set(0.2, 0.2, 0.2);
    // player.mesh.castShadow = true;
    // player.mesh.receiveShadow = false;    

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

    let apples = [];
    let powerup1 = [];
    let powerup2 = [];
    let powerup3 = [];
    let enemies = [];

    // Load objects on terrain
    for (let i = 0; i < 15; i ++) {
        const apple = terrainGenerator.generateApple();
        apple.name = 'Apple' + i;
        const enemy = terrainGenerator.generateEnemy();
        enemy.name = 'Enemy' + i;
        const powerup = terrainGenerator.generatePowerup();
        apples.push(apple);
        enemies.push(enemy);
        if (powerup.name == "Pink"){
            powerup1.push(powerup);
        }
        if (powerup.name == "Blue"){
            powerup2.push(powerup);
        }
        if (powerup.name == "Green"){
            powerup3.push(powerup);
        }
        scene.add(apple, powerup, enemy);
    }

    // Audios
    var bg = new Audio('./audio/power_up_bg.mp3');
    var collect_sound = new Audio('./audio/collect_sound.mp3');
    var bird_impact = new Audio('./audio/bird_impact.mp3');
    var game_over = new Audio('./audio/game_over.mp3');

    bg.volume = 0.05;
    bg.play();


    const cannonDebugger = new CannonDebugger(scene, world, { color: 0x00FF00, scale: 1.0 });
    const clock = new THREE.Clock();
    function animate() {
        let deltaTime = clock.getDelta();

        world.fixedStep();

        if(dead == false){
            playerControls.update();
            player.mesh.position.copy(player.body.position);
            player.mesh.quaternion.copy(player.body.quaternion);
            thirdPersonCamera.update(deltaTime);
        } else {
            world.gravity.set(0, 0, 0);
            bird_impact.pause();
            collect_sound.pause();
            bg.pause();
            let element = document.getElementById('gameover-screen');
            let display = ( true ) ? 'block' : 'none';
            element.style.display = display;
        }

        checkCollision();
        // let helper = playerControls.update();
        // scene.add(helper)
        island.mesh.position.copy(island.body.position);
        island.mesh.quaternion.copy(island.body.quaternion);
        requestAnimationFrame(animate);
        // cannonDebugger.update();
        // orbitControls.update();
        renderer.render(scene, camera);

    };

    animate();

    // Check for collisions
    function checkCollision(){
        let playerBox = new THREE.Box3().setFromObject(player.mesh);
        playerBox.max.x = playerBox.max.x - 18;
        playerBox.max.y = playerBox.max.y - 15;
        playerBox.max.z = playerBox.max.z - 18;
        
        // Check for collisions with apples
        for (let i = 0; i < apples.length; i++) {
            const appleBox = new THREE.Box3().setFromObject(apples[i]);
            if (appleBox.intersectsBox(playerBox)) {
                scene.remove(apples[i]);
                if (!colisiones.includes(apples[i].name)) {
                    colisiones.push(apples[i].name)
                    score = score + 1;
                    collect_sound.play();
                    scoreText.innerText = `Score: ${score} ` 
                }
            }
        }
        // Check for collisions with enemies
        if(flag == false){
            for (let i = 0; i < enemies.length; i++) {
                enemies[i].scale.set(0.05, 0.05, 0.05);
                enemyBox = new THREE.Box3().setFromObject(enemies[i]);
                if (enemyBox.intersectsBox(playerBox)) {
                    scene.remove(enemies[i]);
                    bird_impact.play();
                    if (!colisiones.includes(enemies[i].name) && score > 0) {
                        colisiones.push(enemies[i].name)
                        score = score - 1;
                        scoreText.innerText = `Score: ${score} ` 
                    }
                }
            }
        }
        // Check for collisions with clouds
        if(flag == false){
            for (let i = 0; i < clouds.length; i++) {
                clouds[i].scale.set(0.2, 0.2, 0.2);
                cloudBox = new THREE.Box3().setFromObject(clouds[i]);
                cloudBox.max.x = cloudBox.max.x - 22;
                cloudBox.max.y = cloudBox.max.y - 22;
                cloudBox.max.z = cloudBox.max.z - 22;
                if (cloudBox.intersectsBox(playerBox)) {
                    if (!colisiones.includes(clouds[i].name)) {
                        colisiones.push(clouds[i].name)
                        dead = true;
                        game_over.play();
                    }
                }
            }
        }
        // Check for collisions with pink powerup
        for (let i = 0; i < powerup1.length; i++) {
            const pinkBox = new THREE.Box3().setFromObject(powerup1[i]);
            if (pinkBox.intersectsBox(playerBox)) {
                scene.remove(powerup1[i]);
                if (!colisiones.includes(powerup1[i].name)) {
                    colisiones.push(powerup1[i].name)
                    doubleScore();
                }
            }
        }
        // Check for collisions with blue powerup
        for (let i = 0; i < powerup2.length; i++) {
            const blueBox = new THREE.Box3().setFromObject(powerup2[i]);
            if (blueBox.intersectsBox(playerBox)) {
                scene.remove(powerup2[i]);
                if (!colisiones.includes(powerup2[i].name)) {
                    colisiones.push(powerup2[i].name)
                    invisiblePlayer();
                    flag = true;
                }
            }
        }

         // Check for collisions with green powerup
        for (let i = 0; i < powerup3.length; i++) {
            const greenBox = new THREE.Box3().setFromObject(powerup3[i]);
            if (greenBox.intersectsBox(playerBox)) {
                scene.remove(powerup3[i]);
                if (!colisiones.includes(powerup3[i].name)) {
                    colisiones.push(powerup3[i].name)
                    smallerObstacles();
                    flag = true;
                }
            }
        }
    }

    // Double your current score
    function doubleScore(){
        score = score * 2;
        scoreText.innerText = `Score: ${score} ` 
        setTimeout(checkCollision, 2000);
    }

    // Make player invisible against obstacles and enemies
    function invisiblePlayer(){
        enemyBox.makeEmpty();
        cloudBox.makeEmpty();
        setTimeout(function (){
            flag = false;
            checkCollision();
        }, 3000);
    }
    
    function smallerObstacles(){
        for (let i = 0; i < enemies.length; i++) {
            enemies[i].scale.set(0.03, 0.03, 0.03);
        }
        for (let i = 0; i < clouds.length; i++) {
            clouds[i].scale.set(0.09, 0.09, 0.09);
        }
        setTimeout(function (){
            flag = false;
            checkCollision();
        }, 4000);
    }

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
