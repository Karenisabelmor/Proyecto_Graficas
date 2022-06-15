/**
 * Terrain Generator module that generates a wave-like terrain with 
 * random features.
 * 
 * @module TerrainGenerator
 * @file Terrain generator module for Tiny Wings 3D (ThreeJs)
 * @author Emilio Popovits Blake
 * @author Ana Paola Minchaca
 * @author Karen Morgado
 */

"use strict";

// Import ThreeJs
import { 
    Mesh, TextureLoader, RepeatWrapping, DoubleSide, 
    PlaneBufferGeometry, MeshStandardMaterial, MeshBasicMaterial, 
    SphereGeometry, Vector3, Texture, BufferGeometry
} from '../../libs/three.js/three.module.js';
// import * as THREE from '../libs/three.js/three.module.js';

// Import cannon-es
import { Trimesh, Body, Material } from '../../libs/cannon-es.js/cannon-es.js';
// import * as CANNON from '../../libs/cannon-es.js/cannon-es.js';

/**
 * Terrain Generator class, which accepts settings and can 
 * generate wave-like terrains.
 * @class
 * @property {String[]} islandTextures - Array with paths to island textures.
 * @property {Group[]} clouds - Array with cloud models.
 * @property {Group[]} enemies - Array with enemy models.
 * @property {Group[]} apples - Array with apple models.
 * @property {Group[]} powerups - Array with powerup models.
 * @property {Number} terrainWidth - Terrain width to be used by the generator.
 * @property {Number} terrainLength - Terrain length to be used by the generator.
 */
export default class TerrainGenerator {
    
    /**
     * Array with paths to island textures.
     * @type {String[]}
     */
    islandTextures = [];
    /**
     * Array with cloud models.
     * @type {Group[]}
     */
    clouds = [];
    /**
     * Array with enemy models.
     * @type {Group[]}
     */
    enemies = [];
    /**
     * Array with apple models.
     * @type {Group[]}
     */
    apples = [];
    /**
     * Array with powerup models.
     * @type {Group[]}
     */
    powerups = [];
    /**
     * Array with generated clouds.
     * @type {Group[]}
     */
    generatedClouds = [];
    /**
     * Terrain width to be used by the generator.
     * @type {Number}
     * @default 500
     */
    terrainWidth = 500;
    /**
     * Terrain length to be used by the generator.
     * @type {Number}
     * @default 2000
     */
    terrainLength = 2000;

    /**
     * Constructs a Terrain Generator.
     * @param {String[]} islandTextures - Array with paths to island textures (max 10).
     * @param {Group[]} clouds - Array with cloud models.
     * @param {Group[]} enemies - Array with enemy models.
     * @param {Group[]} powerups - Array with powerup models.
     * @param {Group[]} apples - Array with apple models.
     * @param {Number} cloudNumber - Number of clouds to generate.
     * @param {Number} [terrainWidth=500] - Terrain width to be used by the generator (default 500).
     * @param {Number} [terrainLength=2000] - Terrain length to be used by the generator (default 2000).
     */
    constructor(islandTextures, clouds, enemies, apples, powerups, cloudNumber, terrainWidth, terrainLength) {
        // (Guard Clause) If no textures were recieved in constructor, throw error.
        if (!islandTextures.length) throw new Error('TerrainGenerator needs at least 1 island texture');

        // Fill island textures property with at most 10 textures. If 
        // less than 10 textures were recieved, repeat them until array is 
        // filled.
        this.islandTextures = Array(10).fill().map(( _, idx ) => {
            if (idx >= islandTextures.length) return islandTextures[idx % islandTextures.length];
            return islandTextures[idx];
        });

        // Initialize clouds, enemies, apples and powerups properties
        this.clouds = clouds;
        this.enemies = enemies;
        this.apples = apples;
        this.powerups = powerups;
        this.generatedClouds = this.#generateClouds(cloudNumber);

        // If terrain width or height were recieved, update the properties.
        if (terrainWidth) this.terrainWidth = terrainWidth;
        if (terrainLength) this.terrainLength = terrainLength;
    };

    /**
     * Generates terrain equation, to be treated as a math equation that calculates the terrain's y-values.
     * @private
     * @param {{ wave: String, a: Number, b: Number }} shape - The overall shape of the terrain.
     * @param {{ wave: String, a: Number, b: Number }} roughness - The roughness of the terrain.
     * @param {Number} slope - The slope of the terrain.
     * @returns {Function} A function that calculates the terrain's y-values.
     */
    #generateTerrainEquation(shape, roughness, slope) {
        return x => {
            const shapeTerm = shape.a * (shape.wave === 'sin' ? Math.sin(shape.b * x) : Math.cos(shape.b * x));
            const roughnessTerm = roughness.a * (roughness.wave === 'sin' ? Math.sin(roughness.b * x) : Math.cos(roughness.b * x));
            const slopeTerm = slope * x;

            return shapeTerm + roughnessTerm + slopeTerm;
        };
    };

    /**
     * Creates a CANNON trimesh from the ThreeJs buffer geometry recieved.
     * @param {BufferGeometry} geometry - ThreeJs Buffer Geometry.
     * @returns {Trimesh} A CANNON Trimesh, created from the ThreeJs buffer 
     * geometry provided.
     */
    #createTrimesh(geometry) {
        const vertices = geometry.getAttribute('position').array;
        const indices = geometry.index.array;
        return new Trimesh(vertices, indices);
    };

    /**
     * Generates terrain depending on the island
     * @param {Number} islandNumber - Island number to generate terrain for.
     * @returns {{ mesh: Mesh, body: Body }} The mesh of the generated terrain.
     */
    generateTerrain(islandNumber) {
        // Clamp island to 0-9
        islandNumber = islandNumber < 0 ? 0 : islandNumber > 9 ? 9 : islandNumber;

        // Load island texture
        const map = new TextureLoader().load(this.islandTextures[islandNumber]);
        map.wrapS = map.wrapT = RepeatWrapping;
        map.repeat.set(0.5, 20);
        
        /*
        * Set shape, roughness, and slope for the terrain randomly and generate 
        * an equation to automatically calculate vertex positions. 
        * Value Ranges:
        *    Shape:
        *        wave: cos
        *        a: [20, 60],
        *        b: [1/15pi (4bumps), 1/10pi (5-6bumps)]
        *    Roughness:
        *        a: [10, 50],
        *        b: [1/70pi (1-2bumps), 1/30pi (5-6bumps)]
        */
        const randomRoughnessWave = Math.round(Math.random()) === 1 ? 'sin' : 'cos';
        const shape = { wave: 'cos', a: 20 + islandNumber * 4, b: 1 / Math.PI / (15 - islandNumber * 0.5) };
        const roughness = { wave: randomRoughnessWave, a: islandNumber === 0 ? 0 : 10 + islandNumber * 4, b: 1 / Math.PI / (70 - islandNumber * 4) };
        const slope = 1/(20 - islandNumber);
        const terrainEquation = this.#generateTerrainEquation(shape, roughness, slope);

        // Create island start
        const island = this.#generateIslandStart(map, terrainEquation);
        island.mesh.name = `Island ${islandNumber}`;

        // Add ending to island
        const islandEndMesh = this.#generateIslandEnd(map);
        const islandEndShape = this.#createTrimesh(islandEndMesh.geometry);

        // Calculate where the island end should start
        const islandEndStartPosition = this.#calculateIslandEndStart(island.mesh, islandEndMesh)

        // Add both mesh and shape to island, setting islandEndMesh starting position in mesh and 
        // islandEndShape offset in body. (x, y, z) coordinates correspond to (z, x, y) 
        // because of rotation
        island.body.addShape(islandEndShape, islandEndStartPosition);
        island.mesh.add(islandEndMesh);
        islandEndMesh.position.copy(islandEndStartPosition);

        // [DEBUG] Shows the end of plane.
        // const sphere = new Mesh(
        //     new SphereGeometry(5),
        //     new MeshBasicMaterial({ color: 0xFF0000 })
        // );
        // island.mesh.add(sphere);
        // island.mesh.position.copy(islandEndStartPosition);

        // Return generated terrain
        return island;
    };

    /**
     * Generates island start mesh and body.
     * @private
     * @param {Texture} map - Texture map to use for island start.
     * @param {Function} terrainEquation - A function that calculates the terrain's y-values.
     * @returns {{ mesh: Mesh, body: Body }} - Island start mesh and body.
     */
    #generateIslandStart(map, terrainEquation) {
        // Create plane
        const planeMesh = new Mesh(
            new PlaneBufferGeometry(this.terrainWidth, this.terrainLength, 1, this.terrainLength * 0.1),
            new MeshStandardMaterial({ map, side: DoubleSide })
            // [DEBUG] Shows shorter plane as wireframe.
            // new PlaneBufferGeometry(500, 1000, 200, 200),
            // new MeshBasicMaterial({ color: 0xFFFFFF, wireframe: true })
        );
        
        // Transform plane to fit player's perspective.
        // planeMesh.rotateX(Math.PI / 2);

        // [DEBUG] Shows plane in a 3rd person perspective.
        // planeMesh.position.set(0, -40, -200);
        // planeMesh.rotateZ(Math.PI / 2);

        // Update vertex positions to transform plane into a wave
        const planeVertices = planeMesh.geometry.getAttribute('position').count;
        for (let i = 0; i < planeVertices; i++) {
            const y = planeMesh.geometry.getAttribute('position').getY(i);
            planeMesh.geometry.getAttribute('position').setZ(i, terrainEquation(y));
        }
        // Update plane vertex normals so lighting is computed properly
        planeMesh.geometry.computeVertexNormals();

        // Create CANNON plane body
        const planeShape = this.#createTrimesh(planeMesh.geometry);
        const planeBody = new Body({
            type: Body.STATIC,
            material: new Material('groundMaterial')
        });
        planeBody.addShape(planeShape);
        // Transform body to fit player's perspective.
        planeBody.quaternion.setFromEuler(Math.PI / 2, 0, 0);

        // Return plane mesh and body as island
        const island = { mesh: planeMesh, body: planeBody };
        return island;
    };

    /**
     * Generates default island end mesh.
     * @private
     * @param {Texture} map - Texture map to use for island end.
     * @returns {Mesh} The mesh of the island end.
     */
    #generateIslandEnd(map) {
        // Create the ending of the island
        const endPlaneMesh = new Mesh(
            new PlaneBufferGeometry(this.terrainWidth, 1000, 1, 25),
            new MeshStandardMaterial({ map, side: DoubleSide })
            // [DEBUG] Show endPlane as a blue wireframe.
            // new MeshBasicMaterial({ color:0x0000FF, wireframe: true })
        );

        // Update vertex positions to create proper endPlane shape
        const numVertices = endPlaneMesh.geometry.getAttribute('position').count;
        for (let i = 0; i < numVertices; i++) {
            const y = endPlaneMesh.geometry.getAttribute('position').getY(i);
            endPlaneMesh.geometry.getAttribute('position').setZ(i, 500 * Math.cos(Math.PI / 1200 * y - 6))
        }
        // Update endPlane vertex normals so lighting is computed properly
        endPlaneMesh.geometry.computeVertexNormals();

        // Return island end
        return endPlaneMesh;
    };

    /**
     * Calculates where the island ending should start.
     * @param {Mesh} islandStart - Island start mesh.
     * @param {Mesh} islandEnd - Island end mesh.
     * @returns {Vector3} A vector containing the island's ending start coordinates.
     */
    #calculateIslandEndStart(islandStart, islandEnd) {
        // Calculate the ending coordinates of the island's start
        const islandStartVertices = islandStart.geometry.getAttribute('position').count;
        const islandStartEnd = new Vector3(
            islandStart.geometry.getAttribute('position').getX(islandStartVertices - 1) - islandStart.geometry.parameters.width / 2,
            islandStart.geometry.getAttribute('position').getY(islandStartVertices - 1),
            islandStart.geometry.getAttribute('position').getZ(islandStartVertices - 1)
        );

        // Calculate the starting coordinates of the island's ending
        const islandEndStart = new Vector3().copy(islandStartEnd);
        islandEndStart.y = islandStartEnd.y - islandEnd.geometry.parameters.height / 2;

        // Account for the difference between the island's start ending and the transformed 
        // island's ending start. This is to re-position the island so both end and start match
        const zDifference = islandStartEnd.z - islandEnd.geometry.getAttribute('position').getZ(0);

        // Return island ending start coordinates
        return new Vector3(islandEndStart.x, islandEndStart.y, zDifference);
    };

    #generateClouds(amount) {
        const clouds = Array(amount).fill().map(_ => {
            const cloud = this.clouds[Math.round(Math.random() * (this.clouds.length - 1))].clone();
            
            const x = Math.round(Math.random() * this.terrainWidth) - this.terrainWidth / 2;
            //const y = Math.round(Math.random() * 200) + 250;
            const y = Math.round(Math.random() * 200) + 100;
            const z = Math.round(Math.random() * this.terrainLength) - this.terrainLength / 2;

            cloud.position.set(x, y, z);
            cloud.scale.set(0.2, 0.2, 0.2);

            return cloud;
        })

    return clouds;

    };

    generateEnemy() {
        const enemy = this.enemies[Math.round(Math.random() * (this.enemies.length - 1))].clone();
        
        const x = Math.round(Math.random() * this.terrainWidth) - this.terrainWidth / 2;
        const y = Math.round(Math.random() * 200) + 120 / 2;
        const z = Math.round(Math.random() * this.terrainLength) - this.terrainLength / 2;

        enemy.position.set(x, y, z);
        enemy.scale.set(0.05, 0.05, 0.05);

        return enemy;
    };

    generateApple() {
        const apple = this.apples[Math.round(Math.random() * (this.apples.length - 1))].clone();
        
        const x = Math.round(Math.random() * this.terrainWidth) - this.terrainWidth / 2;
        // const y = Math.round(Math.random() * 200) + 120 / 2;
        const y = Math.round(Math.random() * 200);
        const z = Math.round(Math.random() * this.terrainLength) - this.terrainLength / 2;

        apple.position.set(x, y, z);
        apple.scale.set(0.3, 0.3, 0.3);

        return apple;
    };

    /**
     * Generates a random int between min and max.
     * @param {Number} min - The minimum value of the random int.
     * @param {Number} max - The maximum value of the random int.
     * @returns {Function} A fixed function that generates a random int between min and max.
     */
    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);

        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    generatePowerup() {
       const powerup = this.powerups[Math.round(Math.random() * (this.powerups.length - 1))].clone();

        const x = Math.round(Math.random() * this.terrainWidth) - this.terrainWidth / 2;
        const y = Math.round(Math.random() * 200);
        const z = Math.round(Math.random() * this.terrainLength) - this.terrainLength / 2;
    
        //console.log(this.powerups);
        this.powerups[0].name = "Pink";
        this.powerups[1].name = "Blue";
        this.powerups[2].name = "Green";

        powerup.position.set(x, y, z);
        powerup.scale.set(0.08, 0.08, 0.08);

        return powerup;
    };
};