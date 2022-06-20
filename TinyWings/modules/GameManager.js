"use strict";

import TerrainGenerator from './TerrainGenerator2.js';
import * as THREE from '../../libs/three.js/three.module.js';

export default class GameManager {
    /** @type {TerrainGenerator} */
    island;
    /** @type {THREE.Group[]} */
    enemyModels;
    /** @type {THREE.Group[]} */
    scoreModels;
    /** @type {THREE.Group[]} */
    powerupModels;

    enemyObjects = 15;
    powerupObjects = 15;
    scoreObjects = 15;

    /**
     * Constructs a Game Manager.
     * @param {TerrainGenerator} island - TerrainGenerator island object.
     * @param {mesh: THREE.Mesh, body: CANNON.Body} player - 
     * @param {Group[]} enemyModels - Array with enemy models.
     * @param {Group[]} scoreModels - Array with score models.
     * @param {Group[]} powerupModels - Array with powerup models.
     */
    constructor(island, player, enemyModels, scoreModels, powerupModels) {
        this.island = island;
        this.player = player;
        this.enemyModels = enemyModels;
        this.scoreModels = scoreModels;
        this.powerupModels = powerupModels;
    };

    populateIslandObjects() {
        this.#generateEnemies();
        // this.#generateScoreObjects();
        // this.#generatePowerups();
    };

    #generateEnemies() {
        const islandObjectGroup = this.island.mesh.getObjectByName('Objects');

        const islandEndIndex = this.island.mesh.geometry.getAttribute('position').count - 1;

        Array(this.enemyObjects).fill().forEach((_, idx) => {
            const enemy = this.enemyModels[Math.round(Math.random() * (this.enemyModels.length - 1))].clone();
            
            const randomVertexIdx = Math.round(Math.random() * (islandEndIndex));
            
            const x = Math.random() * this.island.terrainWidth - this.island.terrainWidth / 2;
            const y = this.island.mesh.geometry.getAttribute('position').getY(randomVertexIdx);
            const z = this.island.mesh.geometry.getAttribute('position').getZ(randomVertexIdx) - (Math.random() * 200 + 60);

            
            enemy.name = `Enemy ${idx}`;
            enemy.position.set(x, y, z);
            enemy.scale.set(0.05, 0.05, 0.05);
            islandObjectGroup.add(enemy);
        });
    };

    #generateScoreObjects() {
        const islandObjectGroup = this.island.mesh.getObjectByName('Objects');
        const islandEndIndex = this.island.mesh.geometry.getAttribute('position').count - 1;
        Array(this.scoreObjects).fill().forEach((_, idx) => {
            const scoreObject = this.scoreModels[Math.round(Math.random() * (this.scoreModels.length - 1))].clone();
            
            const randomVertexIdx = Math.round(Math.random() * (islandEndIndex));

            const x = Math.round(Math.random() * this.island.terrainWidth) - this.island.terrainWidth / 2;
            const y = this.island.mesh.geometry.getAttribute('position').getY(randomVertexIdx);
            const z = this.island.mesh.geometry.getAttribute('position').getZ(randomVertexIdx) - (Math.random() * 200);

            scoreObject.name = `Score Object ${idx}`;
            scoreObject.position.set(x, y, z);
            scoreObject.scale.set(0.3, 0.3, 0.3);
            islandObjectGroup.add(scoreObject);
        });
    };

    #generatePowerups() {
        const islandObjectGroup = this.island.mesh.getObjectByName('Objects');
        const islandEndIndex = this.island.mesh.geometry.getAttribute('position').count - 1;
        Array(this.powerupObjects).fill().forEach((_, idx) => {
            const powerup = this.powerupModels[Math.round(Math.random() * (this.powerupModels.length - 1))].clone();
            
            const randomVertexIdx = Math.round(Math.random() * (islandEndIndex));
    
            const x = Math.round(Math.random() * this.island.terrainWidth) - this.island.terrainWidth / 2;
            const y = this.island.mesh.geometry.getAttribute('position').getY(randomVertexIdx);
            const z = this.island.mesh.geometry.getAttribute('position').getZ(randomVertexIdx) - (Math.random() * 200);

            powerup.position.set(x, y, z);
            powerup.scale.set(0.08, 0.08, 0.08);
            islandObjectGroup.add(powerup);
        });
    };

    #collisionWith(object) {
        if (object.name.includes('Score Object')) {
            // score++;
            // collect_sound.play();
            // scoreText.innerText = `Score: ${score} `;
            return;
        }

        if (object.name.includes('Enemy')) {
            // bird_impact.play();
            // if (score <= 0) return;
            // colisiones.push(enemies[i].name)
            // score = score - 1;
            // scoreText.innerText = `Score: ${score} `;
            return;
        }

        if (object.name.includes('Cloud')) {
            // colisiones.push(clouds[i].name)
            // dead = true;
            // game_over.play();
            return;
        }

        if (object.name.includes('Pink')) {
            // score = score * 2;
            // scoreText.innerText = `Score: ${score} ` ;
            // setTimeout(checkCollision, 2000);
            return;
        }

        if (object.name.includes('Blue')) {
            // enemyBox.makeEmpty();
            // cloudBox.makeEmpty();
            // setTimeout(function (){
            //     flag = false;
            //     checkCollision();
            // }, 3000);
            return;
        }

        if (object.name.includes('Green')) {
            // for (let i = 0; i < enemies.length; i++) {
            //     enemies[i].scale.set(0.03, 0.03, 0.03);
            // }
            // for (let i = 0; i < clouds.length; i++) {
            //     clouds[i].scale.set(0.09, 0.09, 0.09);
            // }
            // setTimeout(function (){
            //     flag = false;
            //     checkCollision();
            // }, 4000);
            return;
        }
    };

    update() {
        const playerBox = new THREE.Box3().setFromObject(this.player.mesh);
        playerBox.max.x -= 18;
        playerBox.max.y -= 15;
        playerBox.max.z -= 18;

        const objectCollider = new THREE.Box3();

        const objectsGroup = this.island.mesh.getObjectByName('Objects');
        const cloudGroup = this.island.mesh.getObjectByName('Clouds');
        const objects = [...objectsGroup.children, ...cloudGroup.children];
        
        for (let i = 0; i < objects.length; i++) {
            const object = objects[i];
            objectCollider.setFromObject(object);
            
            if (!objectCollider.intersectsBox(playerBox)) continue;

            objectCollider.makeEmpty();
            if (!object.name.includes('Cloud')) objectsGroup.remove(object);
            this.#collisionWith(object);
        }
    };
};