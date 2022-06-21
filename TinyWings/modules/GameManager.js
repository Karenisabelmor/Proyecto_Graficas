/**
 * Game Manager class which handles collisions, terrain generation 
 * on game advancement, game states, score, audio, and powerups.
 * 
 * @module GameManager
 * @file Game manager module for Cuchi Tales
 * @author Emilio Popovits Blake
 * @author Ana Paola Minchaca Garcia
 * @author Karen Isabel Morgado
 */

"use strict";

// Import third-party libraries
import { Group, Mesh, Box3, Object3D } from '../../libs/three.js/three.module.js';
import { World, Body, ContactMaterial } from '../../libs/cannon-es.js/cannon-es.js';

// Import modules
import TerrainGenerator from './TerrainGenerator.js';
import AudioManager from './AudioManager.js';

/**
 * Game Manager class which handles collisions, terrain generation 
 * on game advancement, game states, score, audio, and powerups.
 * @class
 * @property {Boolean} gameOver - Flag to know if game has ended.
 */
export default class GameManager {
    // Player
    /**
     * Holds a reference to the player, with ThreeJs Mesh 
     * and CANNON Body.
     * @private
     * @type {{ mesh: Mesh, body: Body }}
     */
    #player;
    
    // Models
    /** 
     * Enemy models.
     * @private
     * @type {Group[]} 
     */
    #enemyModels;
    /** 
     * Score object models.
     * @private
     * @type {Group[]} 
     */
    #scoreModels;
    /** 
     * Powerup models.
     * @private
     * @type {Group[]} 
     */
    #powerupModels;

    // Object generation amount
    /**
     * Amount of terrain objects to generate per terrain.
     * @private
     * @type {Number}
     */
    #terrainObjects = 40;
    /**
     * Amount of cloud objects to generate per terrain.
     * @private
     * @type {Number}
     */
    #cloudObjects = 50;
    /**
     * Amount of enemy objects to generate per terrain.
     * @private
     * @type {Number}
     */
    #enemyObjects = 10;
    /**
     * Amount of powerup objects to generate per terrain.
     * @private
     * @type {Number}
     */
    #powerupObjects = 6;
    /**
     * Amount of score objects to generate per terrain.
     * @private
     * @type {Number}
     */
    #scoreObjects = 25;

    // Score
    /**
     * Score tracker.
     * @private
     * @type {Number}
     */
    #score = 0;
    /** 
     * HTMLElement which displays the score to the user.
     * @private
     * @type {HTMLElement} 
     */
    #scoreText = document.getElementById('score');
    
    // Audio
    /** 
     * Audio Manager
     * @private
     * @type {AudioManager} 
     */
    #audio;
    
    // Game State
    /**
     * Flag to know if game has ended.
     * @type {Boolean}
     * @default false
     */
    gameOver = false;
    /** 
     * HTMLElement which displays the game over screen to the user.
     * @private
     * @type {HTMLElement} 
     */
    #gameOverScreen = document.getElementById('gameover-screen');

    // Player Powerups
    /**
     * Flag to know if invisibility powerup is active.
     * @private
     * @type {Boolean}
     */
    #invisible = false;
    /**
     * Reference to the invisibility timeout id, in case another 
     * invisibility powerup is picked up and timeout has 
     * to be cleared.
     * @private
     * @type {Number}
     */
    #invisibleTimeoutId;
    /**
     * Flag to know if smaller enemies powerup is active.
     * @private
     * @type {Boolean}
     */
    #smallerEnemies = false;
    /**
     * References to the smaller enemies timeout ids, 
     * in case another smaller enemies powerup is 
     * picked up and timeouts have to be cleared.
     * @private
     * @type {Number[]}
     */
    #smallerEnemiesTimeoutIds = [];

    // Islands and World
    /** 
     * ThreeJs Group with islands in scene.
     * @private
     * @type {Group} 
     */
    #islandGroup;
    /** 
     * Reference to the CANNON world.
     * @private
     * @type {World} 
     */
    #world;

    // Terrain Generation
    /** 
     * Terrain Generator.
     * @private
     * @type {TerrainGenerator} 
     */
    #terrainGenerator;
    /**
     * Island the player is currently in.
     * @private 
     * @type {{mesh: Mesh, body: Body, terrain: { width: Number, length: Number, start: Number, end: Number }}} 
     */
    #currentIsland;
    /** 
     * Island that comes after the island the player is 
     * currently in.
     * @private
     * @type {{mesh: Mesh, body: Body, terrain: { width: Number, length: Number, start: Number, end: Number }}} 
     */
    #nextIsland;
    /**
     * Current island number, used for terrain generation.
     * @private
     * @type {Number}
     */
    #islandNumber = 0;
    /**
     * Island the player is in, used for terrain generation
     * and difficulty.
     * @private
     * @type {Number}
     */
    #playerIsland = 0;

    /**
     * Constructs a Game Manager.
     * @param {mesh: Mesh, body: Body} player - Player with ThreeJs Mesh and CANNON Body.
     * @param {TerrainGenerator} terrainGenerator - Instantiated TerrainGenerator object for terrain generation.
     * @param {Group[]} enemyModels - Array with enemy models.
     * @param {Group[]} scoreModels - Array with score models.
     * @param {Group[]} powerupModels - Array with powerup models.
     * @param {{cloudObjects: Number, terrainObjects: Number, enemyObjects: Number, scoreObjects: Number, powerupObjects: Number}} [settings] - Optional 
     * settings object with the starting (level 0) amount of objects to generate of each model. Attributes that 
     * are not included are set to the default numbers.
     */
    constructor(player, terrainGenerator, enemyModels, scoreModels, powerupModels, settings) {
        // Initialize player property
        this.#player = player;

        // Initialize models properties
        this.#enemyModels = enemyModels;
        this.#scoreModels = scoreModels;
        this.#powerupModels = powerupModels;

        // Initialize islands and world properties from the received player object
        this.#islandGroup = this.#player.mesh.parent.getObjectByName('Islands');
        this.#world = this.#player.body.world;

        // Initialize object generation amount properties with values provided in 
        // settings values, or default values if they were not provided.
        this.#cloudObjects = settings.cloudObjects ?? this.#cloudObjects;
        this.#terrainObjects = settings.terrainObjects ?? this.#terrainObjects;
        this.#enemyObjects = settings.enemyObjects ?? this.#enemyObjects;
        this.#scoreObjects = settings.scoreObjects ?? this.#scoreObjects;
        this.#powerupObjects = settings.powerupObjects ?? this.#powerupObjects;

        // Initialize audio manager and start playing background music
        this.#audio = new AudioManager(
            './audio/power_up_bg.mp3', './audio/collect_sound.mp3',
            './audio/bird_impact.mp3', './audio/game_over.mp3',
        );
        this.#audio.backgroundVolume = 0.05;
        this.#audio.play(AudioManager.BACKGROUND);

        // Initialize terrain generator
        this.#terrainGenerator = terrainGenerator;

        // Generate first and second islands
        this.#currentIsland = this.#terrainGenerator.generateTerrain(this.#islandNumber, this.#terrainObjects, this.#cloudObjects);
        this.#nextIsland = this.#terrainGenerator.generateTerrain(this.#islandNumber + 1, this.#terrainObjects + 4, this.#cloudObjects);

        // Calculate terrain start and end for current and next terrain, and position 
        // both terrains appropriately
        this.#currentIsland.terrain.start = 950;
        this.#currentIsland.terrain.end = this.#currentIsland.terrain.start - (this.#currentIsland.terrain.length + 1000);
        this.#currentIsland.body.position.set(0, 0, this.#currentIsland.terrain.start - this.#currentIsland.terrain.length / 2);

        this.#nextIsland.terrain.start = this.#currentIsland.terrain.end - 3000;
        this.#nextIsland.terrain.end = this.#nextIsland.terrain.start - (this.#nextIsland.terrain.length + 1000);
        this.#nextIsland.body.position.set(0, 0, this.#nextIsland.terrain.start - this.#nextIsland.terrain.length / 2);

        // Update both terrains mesh position and quaternion from their body's positions 
        // and quaternions
        this.#currentIsland.mesh.position.copy(this.#currentIsland.body.position);
        this.#currentIsland.mesh.quaternion.copy(this.#currentIsland.body.quaternion);
        this.#nextIsland.mesh.position.copy(this.#nextIsland.body.position);
        this.#nextIsland.mesh.quaternion.copy(this.#nextIsland.body.quaternion);

        // Add both islands to the ThreeJs Islands Group in 
        // scene and CANNON World
        this.#islandGroup.add(this.#currentIsland.mesh);
        this.#world.addBody(this.#currentIsland.body);
        this.#islandGroup.add(this.#nextIsland.mesh);
        this.#world.addBody(this.#nextIsland.body);

        // Populate the first island with model objects
        this.#populateIslandObjects(this.#currentIsland);

        // Create ground and player contact material and add it to 
        // the CANNON World
        const slipperyGroundContactMaterial = new ContactMaterial(this.#currentIsland.body.material, this.#player.body.material, { friction: 0, restitution: 0 });
        this.#world.addContactMaterial(slipperyGroundContactMaterial);
    };

    /**
     * Get the score tracker value.
     * @returns {Number} The score tracker value.
     */
    get score() { return this.#score; };

    /**
     * Update the score tracker value and UI score display.
     * @param {Number} value - New value of the score tracker.
     */
    set score(value) {
        this.#score = value;
        this.#scoreText.innerText = `Score: ${this.#score}`; 
    };

    /**
     * Populates island with model objects.
     * @private
     * @param {{mesh: Mesh, body: Body, terrain: { width: Number, length: Number, start: Number, end: Number }}} island - Island 
     * to populate with model objects.
     */
    #populateIslandObjects(island) {
        this.#generateEnemies(island);
        this.#generateScoreObjects(island);
        this.#generatePowerups(island);
    };

    /**
     * Clamps a given number to a minimum and maximum value.
     * @private
     * @param {Number} number - Number to clamp
     * @param {Number} min - Minimum value of the number to clamp
     * @param {Number} max - Maximum value of the number to clamp
     * @returns {Number} Clamped number.
     */
    #clamp = (number, min, max) => Math.min(Math.max(number, min), max);

    /**
     * Populates island with enemy objects.
     * @private
     * @param {{{mesh: Mesh, body: Body, terrain: { width: Number, length: Number, start: Number, end: Number }}}} island - Island 
     * to populate with enemy objects.
     */
    #generateEnemies(island) {
        // Get island group which holds the objects
        const islandObjectGroup = island.mesh.getObjectByName('Objects');

        // Get the ending start plane index for the island
        const islandEndIndex = island.mesh.geometry.getAttribute('position').count - 1;

        // Clamp the number of enemy objects to create, so as player progresses, 
        // more enemies will generate up to a certain point
        const enemyObjects = this.#clamp(this.#enemyObjects + 5 * this.#islandNumber, this.#enemyObjects, 40);
        
        // Generate enemies
        Array(enemyObjects).fill().forEach((_, idx) => {
            // Select a random enemy model
            const enemy = this.#enemyModels[Math.round(Math.random() * (this.#enemyModels.length - 1))].clone();
            
            // Select a random vertex index from the start plane
            const randomVertexIdx = Math.round(Math.random() * (islandEndIndex));
            
            // Generate random x, y, and z values for the enemy's position
            // Note: As this is in local space, -y represents horizontal (forward) position, 
            // and +z represents vertical (upward) position
            const x = Math.random() * island.terrain.width - island.terrain.width / 2;
            const y = island.mesh.geometry.getAttribute('position').getY(randomVertexIdx);
            const z = island.mesh.geometry.getAttribute('position').getZ(randomVertexIdx) - (Math.random() * 100);

            // Setup and add enemy to island's object group
            enemy.name = `Enemy ${idx}`;
            enemy.position.set(x, y, z);
            enemy.scale.set(0.05, 0.05, 0.05);
            islandObjectGroup.add(enemy);
        });
    };

    /**
     * Populates island with score objects.
     * @private
     * @param {{{mesh: Mesh, body: Body, terrain: { width: Number, length: Number, start: Number, end: Number }}}} island - Island 
     * to populate with score objects.
     */
    #generateScoreObjects(island) {
        // Get island group which holds the objects
        const islandObjectGroup = island.mesh.getObjectByName('Objects');

        // Get the ending start plane index for the island
        const islandEndIndex = island.mesh.geometry.getAttribute('position').count - 1;

        // Clamp the number of score objects to create, so as player progresses, 
        // less score objects will generate up to a certian point
        const scoreObjects = this.#clamp(this.#scoreObjects - 2 * this.#islandNumber, 5, this.#scoreObjects);
        
        // Generate score objects
        Array(scoreObjects).fill().forEach((_, idx) => {
            // Select a random score object model
            const scoreObject = this.#scoreModels[Math.round(Math.random() * (this.#scoreModels.length - 1))].clone();
            
            // Select a random vertex index from the start plane
            const randomVertexIdx = Math.round(Math.random() * (islandEndIndex));

            // Clamp the spawn height of score object to create, so as player progresses, 
            // score objects will generate higher up, up to a certian point
            const scoreObjectHeight = this.#clamp(200 + 100 * this.#islandNumber, 200, 800);

            // Generate random x, y, and z values for the score object's position
            // Note: As this is in local space, -y represents horizontal (forward) position, 
            // and +z represents vertical (upward) position
            const x = Math.round(Math.random() * island.terrain.width) - island.terrain.width / 2;
            const y = island.mesh.geometry.getAttribute('position').getY(randomVertexIdx);
            const z = island.mesh.geometry.getAttribute('position').getZ(randomVertexIdx) - (Math.random() * scoreObjectHeight);

            // Setup and add score object to island's object group
            scoreObject.name = `Score Object ${idx}`;
            scoreObject.position.set(x, y, z);
            scoreObject.scale.set(0.3, 0.3, 0.3);
            islandObjectGroup.add(scoreObject);
        });
    };

    /**
     * Populates island with powerup objects.
     * @private
     * @param {{{mesh: Mesh, body: Body, terrain: { width: Number, length: Number, start: Number, end: Number }}}} island - Island 
     * to populate with powerup objects.
     */
    #generatePowerups(island) {
        // Get island group which holds the objects
        const islandObjectGroup = island.mesh.getObjectByName('Objects');
        
        // Get the ending start plane index for the island
        const islandEndIndex = island.mesh.geometry.getAttribute('position').count - 1;

        // Clamp the number of powerup objects to create, so as player progresses, 
        // less powerup objects will generate up to a certian point
        const powerupObjects = this.#clamp(this.#powerupObjects - Math.floor(0.5 * this.#islandNumber), 1, this.#powerupObjects);

        // Generate powerup objects
        Array(powerupObjects).fill().forEach((_, idx) => {
            // Select a random powerup object model
            const powerup = this.#powerupModels[Math.round(Math.random() * (this.#powerupModels.length - 1))].clone();        

            // Select a random vertex index from the start plane
            const randomVertexIdx = Math.round(Math.random() * (islandEndIndex));
    
            // Generate random x, y, and z values for the powerup object's position
            // Note: As this is in local space, -y represents horizontal (forward) position, 
            // and +z represents vertical (upward) position
            const x = Math.round(Math.random() * island.terrain.width) - island.terrain.width / 2;
            const y = island.mesh.geometry.getAttribute('position').getY(randomVertexIdx);
            const z = island.mesh.geometry.getAttribute('position').getZ(randomVertexIdx) - (Math.random() * 200);

            // Setup and add powerup object to island's object group
            powerup.position.set(x, y, z);
            powerup.scale.set(0.08, 0.08, 0.08);
            islandObjectGroup.add(powerup);
        });
    };

    /** 
     * Ends game and displays game over scene. 
     * @private
     */
    #gameOver() {
        this.#gameOverScreen.style.display = 'block';
        this.#audio.pauseAll();
        this.#audio.play(AudioManager.GAMEOVER);
        this.#world.gravity.set(0, 0, 0);
    };

    /**
     * Handles appropriate collision effect when player 
     * collides with the given object.
     * @private
     * @param {Object3D} object - Object player collided with.
     */
    #collisionWith(object) {
        // If player collided with a score object, increment 
        // the player's score
        if (object.name.includes('Score Object')) {
            console.log(`Collided with ${object.name}`);
            this.score++;
            this.#audio.play(AudioManager.COLLECT);
            return;
        }

        // If player collided with an enemy object, decrement 
        // the player's score
        if (object.name.includes('Enemy')) {
            console.log(`Collided with ${object.name}`);
            this.#audio.play(AudioManager.IMPACT);
            if (this.score <= 0) return;
            this.score--;
            return;
        }

        // If player collided with a cloud object, end 
        // game
        if (object.name.includes('Cloud')) {
            console.log(`Collided with ${object.name}`);
            this.gameOver = true;
            this.#gameOver();
            return;
        }

        // If player collided with a pink powerup object, 
        // multiply the player's score by 2
        if (object.name.includes('Pink')) {
            console.log(`Collided with ${object.name}`);
            this.score *= 2;
            return;
        }

        // If player collided with a blue powerup object, 
        // make player "invisible" for 10 seconds, so he can't 
        // collide with clouds nor enemies
        if (object.name.includes('Blue')) {
            console.log(`Collided with ${object.name}`);
            // If player was already invisible, clear previous timeout and set a new one
            if (this.#invisible && this.#invisibleTimeoutId) clearTimeout(this.#invisibleTimeoutId);
            this.#invisible = true;
            this.#invisibleTimeoutId = setTimeout(_ => {
                this.#invisible = false;
                this.#invisibleTimeoutId = undefined;
            }, 10 * 1000);
            return;
        }

        // If player collided with a green powerup object, 
        // make clouds and enemies smaller for 6 seconds
        if (object.name.includes('Green')) {
            console.log(`Collided with ${object.name}`);
            // Get clouds and enemies
            const clouds = this.#currentIsland.mesh.getObjectByName('Clouds').children;
            const enemies = this.#currentIsland.mesh.getObjectByName('Objects').children.filter(({ name }) => name.includes('Enemy'));

            // If enemies were already smaller, clear previous timeouts and set new ones
            if (this.#smallerEnemies && this.#smallerEnemiesTimeoutIds.length > 0) this.#smallerEnemiesTimeoutIds.forEach(id => clearTimeout(id));
            this.#smallerEnemies = true;
            
            // Make enemies smaller
            enemies.forEach(enemy => {
                enemy.scale.set(0.03, 0.03, 0.03);
                this.#smallerEnemiesTimeoutIds.push(setTimeout(_ => enemy.scale.set(0.05, 0.05, 0.05), 6 * 1000));
            });

            // Make clouds smaller
            clouds.forEach(cloud => {
                cloud.scale.set(0.09, 0.09, 0.09);
                this.#smallerEnemiesTimeoutIds.push(setTimeout(_ => cloud.scale.set(0.2, 0.2, 0.2), 6 * 1000));
            });

            // Set timeout to reset clouds and enemies to starting size
            this.#smallerEnemiesTimeoutIds.push(_ => this.#smallerEnemies = false, 6 * 1000);
            return;
        }
    };

    /** 
     * Updates the current island and generates the island 
     * that comes after the new current island. Destroys all objects 
     * from previous island.
     * @private
     */
    #generateNewIsland() {
        // Destroy previous island's mesh and CANNON body, removing 
        // it from the scene
        this.#currentIsland.mesh.removeFromParent();
        this.#world.removeBody(this.#currentIsland.body);
        this.#currentIsland.mesh.geometry.dispose();
        this.#currentIsland.mesh.material.dispose();

        // Destroy all previous island's child objects and remove 
        // them from the scene
        this.#currentIsland.mesh.children.forEach(child => {
            if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
            child.clear();
        });
        this.#currentIsland.mesh.clear();

        // Update the current island and generate the following island
        this.#currentIsland = this.#nextIsland;
        this.#nextIsland = this.#terrainGenerator.generateTerrain(this.#islandNumber + 1, this.#terrainObjects, this.#cloudObjects);

        // Calculate terrain start and end for the new island, and position 
        // the island appropriately
        this.#nextIsland.terrain.start = this.#currentIsland.terrain.end - 3000;
        this.#nextIsland.terrain.end = this.#nextIsland.terrain.start - (this.#nextIsland.terrain.length + 1000);
        this.#nextIsland.body.position.set(0, 0, this.#nextIsland.terrain.start - this.#nextIsland.terrain.length / 2);

        // Update the new island's mesh position and quaternion from its body's position 
        // and quaternion
        this.#nextIsland.mesh.position.copy(this.#nextIsland.body.position);
        this.#nextIsland.mesh.quaternion.copy(this.#nextIsland.body.quaternion);

        // Add the new island to the ThreeJs island group and to the CANNON World
        this.#islandGroup.add(this.#nextIsland.mesh);
        this.#world.addBody(this.#nextIsland.body);

        // Populate the new current island with model objects
        this.#populateIslandObjects(this.#currentIsland);
    };

    /**
     * Checks in what island the player currently is in. If player 
     * moves onto the following island, it updates the playerIsland, 
     * islandNumber, and terrainObjects properties and generates the 
     * following island.
     * Note: Positions are checked taking into account that player is 
     * moving towards -z.
     * @private 
     */
    #updatePlayerIsland() {
        // Get player z position
        const playerPosition = this.#player.body.position.z;

        // If the player is between the current island's start and end, set 
        // playerIsland to the current island's number
        if (this.#currentIsland.terrain.end < playerPosition && playerPosition < this.#currentIsland.terrain.start)
            return this.#playerIsland = parseInt(this.#currentIsland.mesh.name.split(' ')[1]);
        
        // If the player is past the current island, update the class' properties and 
        // generate the island that comes after the next island. 
        if (playerPosition + 400 < this.#currentIsland.terrain.end) {
            this.#playerIsland = parseInt(this.#nextIsland.mesh.name.split(' ')[1]);
            this.#islandNumber = this.#playerIsland;
            this.#terrainObjects += this.#clamp(4 * this.#islandNumber, 0, 90);
            this.#generateNewIsland();
            return;
        }
    };

    /** Function called every frame to perform game manager's actions. */
    update() {
        // If game is over, do nothing
        if (this.gameOver) return;

        // If player falls out of the map, end game
        if (this.#player.body.position.y < -800) {
            this.gameOver = true;
            this.#gameOver();
            return;
        }

        // Generate terrain as player progresses
        this.#updatePlayerIsland();

        // Collissions

        // Create an AABB for the player
        const playerBox = new Box3().setFromObject(this.#player.mesh);
        playerBox.max.x -= 18;
        playerBox.max.y -= 15;
        playerBox.max.z -= 18;

        // Create an AABB for the island's objects
        const objectCollider = new Box3();

        // Get the island's objects and clouds
        const objectsGroup = this.#currentIsland.mesh.getObjectByName('Objects');
        const cloudGroup = this.#currentIsland.mesh.getObjectByName('Clouds');
        // If the player is invisible, don't get the clouds
        let objects = !this.#invisible
            ? [...objectsGroup.children, ...cloudGroup.children]
            : [...objectsGroup.children];
        
        // Check collissions between player and all island objects
        for (let i = 0; i < objects.length; i++) {
            const object = objects[i];
            
            // If player is invisible and collides with an enemy, ignore collission
            if (this.#invisible && object.name.includes('Enemy')) continue;

            // Give the current object an AABB
            objectCollider.setFromObject(object);
            
            // If object is not colliding with the player, continue to next object
            if (!objectCollider.intersectsBox(playerBox)) continue;

            // If object collided with the player, reset the object's AABB and 
            // remove the object from the object's group in scene if it's not a cloud
            objectCollider.makeEmpty();
            if (!object.name.includes('Cloud')) objectsGroup.remove(object);

            // Enact collission consequences for the player with this object
            this.#collisionWith(object);
        }
        
        // Remove objects as player passes them

        // Get all island objects
        const terrainAssetGroup = this.#currentIsland.mesh.getObjectByName('Terrain Assets');
        objects = [...objectsGroup.children, ...cloudGroup.children, ...terrainAssetGroup.children];
        
        // Calculate terrain center, to calculate island objects' world positions
        const terrainCenter = this.#currentIsland.terrain.start - this.#currentIsland.terrain.length / 2;
        
        // Check if player passed objects
        objects.forEach(object => {
            // If player passed object, destroy the object, remove it from scene, and destroy 
            // all its children
            if (object.position.y + terrainCenter > this.#player.body.position.z + 400) {
                object.children.forEach(child => {
                    if (child.isMesh) {
                        child.geometry.dispose();
                        child.material.length 
                            ? child.material.forEach(material => material.dispose())
                            : child.material.dispose();
                    }
                    child.clear();
                    child.removeFromParent();
                });
            }
        });
    };
};