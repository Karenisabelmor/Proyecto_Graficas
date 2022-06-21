"use strict";

import TerrainGenerator from './TerrainGenerator.js';
import AudioManager from './AudioManager.js';
import * as THREE from '../../libs/three.js/three.module.js';
import * as CANNON from '../../libs/cannon-es.js/cannon-es.js';

export default class GameManager {
    /** @type {THREE.Group[]} */
    enemyModels;
    /** @type {THREE.Group[]} */
    scoreModels;
    /** @type {THREE.Group[]} */
    powerupModels;

    terrainObjects = 15;
    cloudObjects = 15;
    enemyObjects = 15;
    powerupObjects = 15;
    scoreObjects = 15;

    #score = 0;
    /** @type {AudioManager} */
    audio;
    /** @type {HTMLElement} */
    #scoreText = document.getElementById('score');
    
    gameOver = false;
    #gameOverScreen = document.getElementById('gameover-screen');

    // Player state
    #invisible = false;
    #invisibleTimeoutId;
    #smallerEnemies = false;
    #smallerEnemiesTimeoutIds = [];

    // Island state
    /** @type {TerrainGenerator} */
    #terrainGenerator;
    /** @type {THREE.Group} */
    #islandGroup;
    /** @type {CANNON.World} */
    #world;

    /** @type {{mesh: THREE.Mesh, body: CANNON.Body, terrain: { width: Number, length: Number, start: Number, end: Number }}} */
    #currentIsland;
    /** @type {{mesh: THREE.Mesh, body: CANNON.Body, terrain: { width: Number, length: Number, start: Number, end: Number }}} */
    #nextIsland;
    #islandNumber = 0;
    #playerIsland = 0;

    /**
     * Constructs a Game Manager.
     * @param {mesh: THREE.Mesh, body: CANNON.Body} player - 
     * @param {TerrainGenerator} terrainGenerator - 
     * @param {Group[]} enemyModels - Array with enemy models.
     * @param {Group[]} scoreModels - Array with score models.
     * @param {Group[]} powerupModels - Array with powerup models.
     */
    constructor(player, terrainGenerator, enemyModels, scoreModels, powerupModels, settings) {
        this.player = player;
        this.enemyModels = enemyModels;
        this.scoreModels = scoreModels;
        this.powerupModels = powerupModels;

        this.#islandGroup = this.player.mesh.parent.getObjectByName('Islands');
        this.#world = this.player.body.world;

        this.cloudObjects = settings.cloudObjects ?? this.cloudObjects;
        this.terrainObjects = settings.terrainObjects ?? this.terrainObjects;
        this.enemyObjects = settings.enemyObjects ?? this.enemyObjects;
        this.scoreObjects = settings.scoreObjects ?? this.scoreObjects;
        this.powerupObjects = settings.powerupObjects ?? this.powerupObjects;

        this.audio = new AudioManager(
            './audio/power_up_bg.mp3', './audio/collect_sound.mp3',
            './audio/bird_impact.mp3', './audio/game_over.mp3',
        );
        this.audio.backgroundVolume = 0.05;
        this.audio.play(AudioManager.BACKGROUND);

        this.#terrainGenerator = terrainGenerator;

        this.#currentIsland = this.#terrainGenerator.generateTerrain(this.#islandNumber, this.terrainObjects, this.cloudObjects);
        this.#nextIsland = this.#terrainGenerator.generateTerrain(this.#islandNumber + 1, this.terrainObjects + 4, this.cloudObjects);

        this.#currentIsland.terrain.start = 950;
        this.#currentIsland.terrain.end = this.#currentIsland.terrain.start - (this.#currentIsland.terrain.length + 1000);
        this.#currentIsland.body.position.set(0, 0, this.#currentIsland.terrain.start - this.#currentIsland.terrain.length / 2);

        this.#nextIsland.terrain.start = this.#currentIsland.terrain.end - 3000;
        this.#nextIsland.terrain.end = this.#nextIsland.terrain.start - (this.#nextIsland.terrain.length + 1000);
        this.#nextIsland.body.position.set(0, 0, this.#nextIsland.terrain.start - this.#nextIsland.terrain.length / 2);

        this.#currentIsland.mesh.position.copy(this.#currentIsland.body.position);
        this.#currentIsland.mesh.quaternion.copy(this.#currentIsland.body.quaternion);
        this.#nextIsland.mesh.position.copy(this.#nextIsland.body.position);
        this.#nextIsland.mesh.quaternion.copy(this.#nextIsland.body.quaternion);

        this.#islandGroup.add(this.#currentIsland.mesh);
        this.#world.addBody(this.#currentIsland.body);
        this.#islandGroup.add(this.#nextIsland.mesh);
        this.#world.addBody(this.#nextIsland.body);

        this.#populateIslandObjects(this.#currentIsland);

        // Create ground and player contact material
        const slipperyGroundContactMaterial = new CANNON.ContactMaterial(this.#currentIsland.body.material, this.player.body.material, { friction: 0, restitution: 0 });
        this.#world.addContactMaterial(slipperyGroundContactMaterial);
    };

    get score() { return this.#score; };
    set score(value) {
        this.#score = value;
        this.#scoreText.innerText = `Score: ${this.#score}`; 
    };

    #populateIslandObjects(island) {
        this.#generateEnemies(island);
        this.#generateScoreObjects(island);
        this.#generatePowerups(island);
    };

    #generateEnemies(island) {
        const islandObjectGroup = island.mesh.getObjectByName('Objects');

        const islandEndIndex = island.mesh.geometry.getAttribute('position').count - 1;

        const enemyObjects = this.#clamp(this.enemyObjects + 5 * this.#islandNumber, this.enemyObjects, 40);
        Array(enemyObjects).fill().forEach((_, idx) => {
            const enemy = this.enemyModels[Math.round(Math.random() * (this.enemyModels.length - 1))].clone();
            
            const randomVertexIdx = Math.round(Math.random() * (islandEndIndex));
            
            const x = Math.random() * island.terrain.width - island.terrain.width / 2;
            const y = island.mesh.geometry.getAttribute('position').getY(randomVertexIdx);
            const z = island.mesh.geometry.getAttribute('position').getZ(randomVertexIdx) - (Math.random() * 100);

            
            enemy.name = `Enemy ${idx}`;
            enemy.position.set(x, y, z);
            enemy.scale.set(0.05, 0.05, 0.05);
            islandObjectGroup.add(enemy);
        });
    };

    #clamp(number, min, max) {
        return Math.min(Math.max(number, min), max);
    };

    #generateScoreObjects(island) {
        const islandObjectGroup = island.mesh.getObjectByName('Objects');
        const islandEndIndex = island.mesh.geometry.getAttribute('position').count - 1;
        const scoreObjects = this.#clamp(this.scoreObjects - 2 * this.#islandNumber, 5, this.scoreObjects);
        Array(scoreObjects).fill().forEach((_, idx) => {
            const scoreObject = this.scoreModels[Math.round(Math.random() * (this.scoreModels.length - 1))].clone();
            
            const randomVertexIdx = Math.round(Math.random() * (islandEndIndex));

            const scoreObjectHeight = this.#clamp(200 + 100 * this.#islandNumber, 200, 800);
            const x = Math.round(Math.random() * island.terrain.width) - island.terrain.width / 2;
            const y = island.mesh.geometry.getAttribute('position').getY(randomVertexIdx);
            const z = island.mesh.geometry.getAttribute('position').getZ(randomVertexIdx) - (Math.random() * scoreObjectHeight);

            scoreObject.name = `Score Object ${idx}`;
            scoreObject.position.set(x, y, z);
            scoreObject.scale.set(0.3, 0.3, 0.3);
            islandObjectGroup.add(scoreObject);
        });
    };

    #generatePowerups(island) {
        const islandObjectGroup = island.mesh.getObjectByName('Objects');
        const islandEndIndex = island.mesh.geometry.getAttribute('position').count - 1;

        const powerupObjects = this.#clamp(this.powerupObjects - Math.floor(0.5 * this.#islandNumber), 1, this.powerupObjects);

        Array(this.powerupObjects).fill().forEach((_, idx) => {
            const powerup = this.powerupModels[Math.round(Math.random() * (this.powerupModels.length - 1))].clone();
            
            const randomVertexIdx = Math.round(Math.random() * (islandEndIndex));
    
            const x = Math.round(Math.random() * island.terrain.width) - island.terrain.width / 2;
            const y = island.mesh.geometry.getAttribute('position').getY(randomVertexIdx);
            const z = island.mesh.geometry.getAttribute('position').getZ(randomVertexIdx) - (Math.random() * 200);

            powerup.position.set(x, y, z);
            powerup.scale.set(0.08, 0.08, 0.08);
            islandObjectGroup.add(powerup);
        });
    };

    #gameOver() {
        this.#gameOverScreen.style.display = 'block';
        this.audio.pauseAll();
        this.audio.play(AudioManager.GAMEOVER);
        this.#world.gravity.set(0, 0, 0);
    };

    #collisionWith(object) {
        if (object.name.includes('Score Object')) {
            console.log(`Collided with ${object.name}`);
            this.score++;
            this.audio.play(AudioManager.COLLECT);
            return;
        }

        if (object.name.includes('Enemy')) {
            console.log(`Collided with ${object.name}`);
            this.audio.play(AudioManager.IMPACT);
            if (this.score <= 0) return;
            this.score--;
            return;
        }

        if (object.name.includes('Cloud')) {
            console.log(`Collided with ${object.name}`);
            this.gameOver = true;
            this.#gameOver();
            return;
        }

        if (object.name.includes('Pink')) {
            console.log(`Collided with ${object.name}`);
            this.score *= 2;
            return;
        }

        if (object.name.includes('Blue')) {
            console.log(`Collided with ${object.name}`);
            if (this.#invisible && this.#invisibleTimeoutId) clearTimeout(this.#invisibleTimeoutId);
            this.#invisible = true;
            this.#invisibleTimeoutId = setTimeout(_ => {
                this.#invisible = false;
                this.#invisibleTimeoutId = undefined;
            }, 10 * 1000);
            return;
        }

        if (object.name.includes('Green')) {
            console.log(`Collided with ${object.name}`);
            const clouds = this.#currentIsland.mesh.getObjectByName('Clouds').children;
            const enemies = this.#currentIsland.mesh.getObjectByName('Objects').children.filter(({ name }) => name.includes('Enemy'));

            if (this.#smallerEnemies && this.#smallerEnemiesTimeoutIds.length > 0) this.#smallerEnemiesTimeoutIds.forEach(id => clearTimeout(id));
            this.#smallerEnemies = true;
            enemies.forEach(enemy => {
                enemy.scale.set(0.03, 0.03, 0.03);
                this.#smallerEnemiesTimeoutIds.push(setTimeout(_ => enemy.scale.set(0.05, 0.05, 0.05), 6 * 1000));
            });

            clouds.forEach(cloud => {
                cloud.scale.set(0.09, 0.09, 0.09);
                this.#smallerEnemiesTimeoutIds.push(setTimeout(_ => cloud.scale.set(0.2, 0.2, 0.2), 6 * 1000));
            });

            this.#smallerEnemiesTimeoutIds.push(_ => this.#smallerEnemies = false, 6 * 1000);
            return;
        }
    };

    #generateNewIsland() {
        this.#currentIsland.mesh.removeFromParent();
        this.#world.removeBody(this.#currentIsland.body);
        this.#currentIsland.mesh.geometry.dispose();
        this.#currentIsland.mesh.material.dispose();

        this.#currentIsland.mesh.children.forEach(child => {
            if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
            child.clear();
        });
        this.#currentIsland.mesh.clear();

        this.#currentIsland = this.#nextIsland;
        this.#nextIsland = this.#terrainGenerator.generateTerrain(this.#islandNumber + 1, this.terrainObjects, this.cloudObjects);

        this.#nextIsland.terrain.start = this.#currentIsland.terrain.end - 3000;
        this.#nextIsland.terrain.end = this.#nextIsland.terrain.start - (this.#nextIsland.terrain.length + 1000);
        this.#nextIsland.body.position.set(0, 0, this.#nextIsland.terrain.start - this.#nextIsland.terrain.length / 2);

        this.#nextIsland.mesh.position.copy(this.#nextIsland.body.position);
        this.#nextIsland.mesh.quaternion.copy(this.#nextIsland.body.quaternion);

        this.#islandGroup.add(this.#nextIsland.mesh);
        this.#world.addBody(this.#nextIsland.body);

        this.#populateIslandObjects(this.#currentIsland);
    };

    #updatePlayerIsland() {
        const playerPosition = this.player.body.position.z;
        if (this.#currentIsland.terrain.end < playerPosition && playerPosition < this.#currentIsland.terrain.start)
            return this.#playerIsland = parseInt(this.#currentIsland.mesh.name.split(' ')[1]);
        
        if (playerPosition + 400 < this.#currentIsland.terrain.end) {
            this.#playerIsland = parseInt(this.#nextIsland.mesh.name.split(' ')[1]);
            this.#islandNumber = this.#playerIsland;
            this.terrainObjects += this.#clamp(4 * this.#islandNumber, 0, 90);
            this.#generateNewIsland();
            return;
        }
    };

    update() {
        if (this.gameOver) return;

        // If player falls out of the map, end game
        if (this.player.body.position.y < -800) {
            this.gameOver = true;
            this.#gameOver();
            return;
        }

        // Generate terrain as player progresses
        this.#updatePlayerIsland();

        // Collissions
        const playerBox = new THREE.Box3().setFromObject(this.player.mesh);
        playerBox.max.x -= 18;
        playerBox.max.y -= 15;
        playerBox.max.z -= 18;

        const objectCollider = new THREE.Box3();

        const objectsGroup = this.#currentIsland.mesh.getObjectByName('Objects');
        const cloudGroup = this.#currentIsland.mesh.getObjectByName('Clouds');
        let objects = !this.#invisible
            ? [...objectsGroup.children, ...cloudGroup.children]
            : [...objectsGroup.children];
        
        for (let i = 0; i < objects.length; i++) {
            const object = objects[i];
            
            if (this.#invisible && object.name.includes('Enemy')) continue;

            objectCollider.setFromObject(object);
            
            if (!objectCollider.intersectsBox(playerBox)) continue;

            objectCollider.makeEmpty();
            if (!object.name.includes('Cloud')) objectsGroup.remove(object);
            this.#collisionWith(object);
        }
        
        // Remove objects as player passes them
        const terrainAssetGroup = this.#currentIsland.mesh.getObjectByName('Terrain Assets');
        objects = [...objectsGroup.children, ...cloudGroup.children, ...terrainAssetGroup.children];
        const terrainCenter = this.#currentIsland.terrain.start - this.#currentIsland.terrain.length / 2;
        objects.forEach(object => {
            if (object.position.y + terrainCenter > this.player.body.position.z + 400) {
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