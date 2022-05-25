/**
 * Terrain Generator module that generates a wave-like terrain with 
 * random features.
 * 
 * @module TerrainGenerator
 * @file Terrain generator module for Tiny Wings 3D (ThreeJs)
 * @author Emilio Popovits Blake
 */

 "use strict";

 // Import ThreeJs
 import { 
     Mesh, TextureLoader, RepeatWrapping, BackSide, 
     PlaneBufferGeometry, MeshStandardMaterial, MeshBasicMaterial, 
     SphereGeometry, Vector3, Texture
 } from '../libs/three.js/three.module.js';
 // import * as THREE from '../libs/three.js/three.module.js';
 
 /**
  * Terrain Generator class, which accepts settings and can 
  * generate wave-like terrains.
  * @class
  * @property {String[]} islandTextures - Array with paths to island textures.
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
     * 
     * @param {String[]} islandTextures - (Required) Array with paths to island textures (max 10).
     * @param {Number} [terrainWidth=500] - Terrain width to be used by the generator (default 500).
     * @param {Number} [terrainLength=2000] - Terrain length to be used by the generator (default 2000).
     */
    constructor(islandTextures, terrainWidth, terrainLength) {
        // (Guard Clause) If no textures were recieved in constructor, throw error.
        if (!islandTextures.length) throw new Error('TerrainGenerator needs at least 1 island texture');

        // Fill island textures property with at most 10 textures. If 
        // less than 10 textures were recieved, repeat them until array is 
        // filled.
        this.islandTextures = Array(10).fill().map(( _, idx ) => {
            if (idx >= islandTextures.length) return islandTextures[idx % islandTextures.length];
            return islandTextures[idx];
        });

        // If terrain width or height were recieved, update the properties.
        if (terrainWidth) this.terrainWidth = terrainWidth;
        if (terrainLength) this.terrainLength = terrainLength;
    };

    /**
     * Generates terrain depending on the island
     * @param {Number} island - Island number to generate terrain for.
     * @returns {Mesh} The mesh of the generated terrain.
     */
    generateTerrain(island) {

        // Clamp island to 0-9
        island = island < 0 ? 0 : island > 9 ? 9 : island;

        // Load island texture
        const map = new TextureLoader().load(this.islandTextures[island]);
        map.wrapS = map.wrapT = RepeatWrapping;
        map.repeat.set(0.5, 20);

        // Create plane
        const plane = new Mesh(
            new PlaneBufferGeometry(this.terrainWidth, this.terrainLength, 200, 200),
            new MeshStandardMaterial({ map, side: BackSide })
            // [DEBUG] Shows shorter plane as wireframe.
            // new PlaneBufferGeometry(500, 1000, 200, 200),
            // new MeshBasicMaterial({ color: 0xFFFFFF, wireframe: true })
        );
        plane.name = `Island ${island}`;
        
        // Transform plane to fit player's perspective.
        plane.rotateX(Math.PI / 2);

        // [DEBUG] Shows plane in a 3rd person perspective.
        // plane.position.set(0, -40, -200);
        // plane.rotateZ(Math.PI / 2);
        
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
        const shape = { wave: 'cos', a: 20 + island * 4, b: 1 / Math.PI / (15 - island * 0.5) };
        const roughness = { wave: randomRoughnessWave, a: island === 0 ? 0 : 10 + island * 4, b: 1 / Math.PI / (70 - island * 4) };
        const slope = 1/(20 - island);
        const terrainEquation = this.#generateTerrainEquation(shape, roughness, slope);

        // Update vertex positions to transform plane into a wave
        const planeVertices = plane.geometry.attributes.position.count;
        for (let i = 0; i < planeVertices; i++) {
            const y = plane.geometry.attributes.position.getY(i);
            plane.geometry.attributes.position.setZ(i, terrainEquation(y))
        }
        // Update plane vertex normals so lighting is computed properly
        plane.geometry.computeVertexNormals();

        // Calculate the ending coordinates of the plane
        const planeEnd = new Vector3(
            plane.geometry.attributes.position.getX(planeVertices - 1) - plane.geometry.parameters.width / 2,
            plane.geometry.attributes.position.getY(planeVertices - 1),
            plane.geometry.attributes.position.getZ(planeVertices - 1)
        );

        // Add ending to island
        const endPlane = this.#generateIslandEnd(map);
        plane.add(endPlane);

        // Calculate the starting coordinates of the endPlane
        const endPlaneStart = new Vector3().copy(planeEnd);
        endPlaneStart.y = planeEnd.y - endPlane.geometry.parameters.height / 2;

        // Set endPlane starting position. (x, y, z) coordinates correspond to (z, x, y) 
        // because of rotation
        endPlane.position.set(endPlaneStart.x, endPlaneStart.y, endPlaneStart.z);

        // Account for the difference between the plane's ending and the transformed 
        // endPlane's start. Re-position the endPlane so both end and start match
        const zDifference = planeEnd.z - endPlane.geometry.attributes.position.getZ(0);
        endPlane.position.z = zDifference;

        // [DEBUG] Shows the end of plane.
        // const sphere = new Mesh(
        //     new SphereGeometry(5),
        //     new MeshBasicMaterial({ color: 0xFF0000 })
        // );
        // plane.add(sphere);
        // sphere.position.set(planeEnd.x, planeEnd.y, planeEnd.z);

        // Return generated terrain
        return plane;
    };

    /**
     * Generates default island end.
     * @private
     * @param {Texture} map - Texture map to use for island end.
     * @returns {Mesh} The mesh of the island end.
     */
    #generateIslandEnd(map) {
        // Create the ending of the island
        const endPlane = new Mesh(
            new PlaneBufferGeometry(this.terrainWidth, 1000, 200, 200),
            new MeshStandardMaterial({ map, side: BackSide })
            // [DEBUG] Show endPlane as a blue wireframe.
            // new MeshBasicMaterial({ color:0x0000FF, wireframe: true })
        );

        // Update vertex positions to create proper endPlane shape
        const numVertices = endPlane.geometry.attributes.position.count;
        for (let i = 0; i < numVertices; i++) {
            const y = endPlane.geometry.attributes.position.getY(i);
            endPlane.geometry.attributes.position.setZ(i, 500 * Math.cos(Math.PI / 1200 * y - 6))
        }
        // Update endPlane vertex normals so lighting is computed properly
        endPlane.geometry.computeVertexNormals();

        // Return island end
        return endPlane;
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
     
};