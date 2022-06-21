/**
 * Terrain Generator class, which accepts settings and can 
 * generate wave-like terrains with clouds and vegetation.
 * 
 * @module TerrainGenerator
 * @file Terrain generator module for Cuchi Tales
 * @author Emilio Popovits Blake
 * @author Ana Paola Minchaca Garcia
 */

"use strict";

// Import third-party libraries
import { 
    Mesh, TextureLoader, RepeatWrapping, DoubleSide, 
    PlaneBufferGeometry, MeshStandardMaterial, MeshPhongMaterial, 
    MeshBasicMaterial, SphereGeometry, Vector3, Texture, BufferGeometry, 
    Group, Line, BufferGeometry, LineBasicMaterial
} from '../../libs/three.js/three.module.js';
import { Trimesh, Body, Material } from '../../libs/cannon-es.js/cannon-es.js';

/**
 * Terrain Generator class, which accepts settings and can 
 * generate wave-like terrains with clouds and vegetation.
 * @class
 * @property {String[]} islandTextures - Array with paths to island textures.
 * @property {Group[]} clouds - Array with cloud models.
 * @property {Group[]} terrainModels - Array with terrain models.
 * @property {Number} terrainWidth - Terrain width to be used by the generator.
 */
export default class TerrainGenerator {
    // Textures
    /**
     * Array with paths to island textures.
     * @type {String[]}
     */
    islandTextures = [];
    
    // Models
    /**
     * Array with cloud models.
     * @type {Group[]}
     */
    clouds = [];
    /**
     * Array with terrain models.
     * @type {Group[]}
     */
    terrainModels = [];

    // Terrain settings
    /**
     * Terrain width to be used by the generator.
     * @type {Number}
     * @default 500
     */
    terrainWidth = 500;
    /**
     * Terrain length to be used by the generator.
     * @private
     * @type {Number}
     */
    #terrainLength;

    // Terrain metadata
    /** 
     * Terrain ThreeJs mesh.
     * @private
     * @type {Mesh} 
     */
    #mesh;
    /** 
     * Terrain CANNON body.
     * @private
     * @type {Body} 
     */
    #body;
    /** 
     * Terrain start (z-axis).
     * @private
     * @type {Number} 
     */
    #islandStart;
    /** 
     * Terrain end (z-axis).
     * @private
     * @type {Number} 
     */
    #islandEnd;
    /**
     * Island that's being generated.
     * @private
     * @type {Number}
     */
    #islandNumber;

    // Terrain CANNON Material
    /**
     * Island CANNON Material
     * @private
     * @type {Material}
     */
    #material = new Material('groundMaterial');

    /**
     * Constructs a Terrain Generator.
     * @param {String[]} islandTextures - Array with paths to island textures (max 10).
     * @param {Group[]} clouds - Array with cloud models.
     * @param {Group[]} terrainModels - Array with terrain models.
     * @param {Number} [terrainWidth=500] - Terrain width to be used by the generator (default 500).
     */
    constructor(islandTextures, clouds, terrainModels, terrainWidth) {
        // (Guard Clause) If no textures were recieved in constructor, throw error.
        if (!islandTextures.length) throw new Error('TerrainGenerator needs at least 1 island texture');

        // Fill island textures property with at most 10 textures. If 
        // less than 10 textures were recieved, repeat them until array is 
        // filled.
        this.islandTextures = Array(10).fill().map(( _, idx ) => {
            if (idx >= islandTextures.length) return islandTextures[idx % islandTextures.length];
            return islandTextures[idx];
        });

        // Initialize clouds and terrainModels properties
        this.clouds = clouds;
        this.terrainModels = terrainModels;

        // If terrain width or height were recieved, update the properties.
        if (terrainWidth) this.terrainWidth = terrainWidth;
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
     * Creates a CANNON trimesh from the ThreeJs buffer geometry recieved.
     * @private
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
     * Generates terrain depending on the island number
     * @param {Number} islandNumber - Island number to generate terrain for.
     * @param {Number} vegetationAmount - Number of terrain vegetation to generate.
     * @param {Number} cloudAmount - Number of clouds to generate.
     * @returns {{mesh: Mesh, body: Body, terrain: { width: Number, length: Number, start: Number, end: Number }}} The 
     * mesh, body, and metadata of the generated terrain.
     */
    generateTerrain(islandNumber, vegetationAmount, cloudAmount) {
        // Clamp island to 0-9
        islandNumber = this.#clamp(islandNumber, 0, 9);
        this.#islandNumber = islandNumber;

        // Load island texture
        const map = new TextureLoader().load(this.islandTextures[islandNumber]);
        map.wrapS = map.wrapT = RepeatWrapping;
        map.repeat.set(0.5, 20);

        // Create island start
        const island = this.#generateIslandStart(islandNumber, map);
        island.mesh.name = `Island ${islandNumber}`;

        // Add ending to island
        const islandEndMesh = this.#generateIslandEnd(map);
        const islandEndShape = this.#createTrimesh(islandEndMesh.geometry);

        // Calculate where the island end should start
        const islandEndStartPosition = this.#calculateIslandEndStart(island.mesh, islandEndMesh);

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

        // Save terrain metadata
        this.#mesh = island.mesh;
        this.#body = island.body;
        this.#islandStart = island.mesh.geometry.getAttribute('position').getY(0);
        this.#islandEnd = island.mesh.geometry.getAttribute('position').getY(island.mesh.geometry.getAttribute('position').count - 1);

        // Populate terrain with trees, rocks, bushes, etc.
        const terrainAssetGroup = new Group();
        terrainAssetGroup.name = 'Terrain Assets';
        island.mesh.add(terrainAssetGroup);
        this.#generateTerrainAssets(terrainAssetGroup, vegetationAmount);

        // Generate clouds
        const cloudGroup = new Group();
        cloudGroup.name = 'Clouds';
        island.mesh.add(cloudGroup);
        this.#generateClouds(cloudGroup, cloudAmount);

        // Create group for objects such as enemies and powerups
        const objectGroup = new Group();
        objectGroup.name = 'Objects';
        island.mesh.add(objectGroup);

        // Return generated terrain
        return {
            ...island, 
            terrain: {
                width: this.terrainWidth, 
                length: this.#terrainLength,
                start: this.#islandStart,
                end: this.#islandEnd
            }
        };
        
    };

    /**
     * Generates island start mesh and body.
     * @private
     * @param {Number} level - The island's level (affects difficulty).
     * @param {Texture} map - Texture map to use for island start.
     * @returns {{ mesh: Mesh, body: Body }} - Island start mesh and body.
     */
    #generateIslandStart(level, map) {
        // Generate terrain keypoints, from which a curve will later be 
        // drawn

        // Set the keypoint ranges on the z and y axes
        const minRangeZ = 450;
        const minRangeY = 150 + 20 * level;
        const rangeZ = 80;
        const rangeY = 40;

        let z = 0;
        let y = 0;
        let sign = 1;
        
        // Max number of keypoints
        const maxKeyPoints = 20;
        // Generate 20 keypoints, alternating their y component's sign, 
        // so they make a wave-like terrain
        const keyPoints = [];
        for (let i = 0; i < maxKeyPoints; i++) {
            z += minRangeZ + Math.random() * rangeZ;
            y += sign * minRangeY + Math.random() * rangeY;
            sign *= -1;

            i === 0
                ? keyPoints.push(new Vector3(0, y, 0))
                : keyPoints.push(new Vector3(0, y, z));
        }

        // [DEBUG] Show line made from keypoints
        // const line = new Line(
        //     new BufferGeometry().setFromPoints(keyPoints),
        //     new LineBasicMaterial({ color: 0xFF0000 })
        // );
        // line.rotateY(Math.PI / 2);
        
        // Connect generated keypoints with a cosine curve, generating 
        // intermediate points between each keypoint and setting their y and 
        // z components to follow a cosine curve between both keypoints
        const curvePoints = [];
        for (let i = 1; i < keyPoints.length; i++) {
            const point0 = keyPoints[i - 1];
            const point1 = keyPoints[i];

            // Each intermediate point will be 2 units away from each other
            const segmentWidth = 2;
            // Calculate the number of horizontal segments between each keypoint
            const horizontalSegments = Math.floor((point1.z - point0.z) / segmentWidth );

            // Calculate the change in z value between one intermediate point and the other
            const delta_z = (point1.z - point0.z) / horizontalSegments;
            // Calculate the change in angle between one intermediate point and the other
            const delta_theta = Math.PI / horizontalSegments;
            // Calculate the midpoint between both keypoints
            const y_mid = (point0.y + point1.y) / 2;
            // Calculate the amplitude between the midpoint of both keypoints and the first 
            // keypoint
            const amplitude = (point0.y - point1.y) / 2;

            // Using the values calculated above, set the intermediate point y and z 
            // components, which describe a cosine curve between both keypoints
            for (let j = 0; j < horizontalSegments + 1; j++) {
                const intermediate_point = new Vector3();
                intermediate_point.z = point0.z + j * delta_z;
                intermediate_point.y = y_mid + amplitude * Math.cos(j * delta_theta);
                curvePoints.push(intermediate_point);
            }
        }

        // [DEBUG] Show curved line made from joining keypoints with cosine curve
        // const curvedLine = new Line(
        //     new BufferGeometry().setFromPoints(curvePoints),
        //     new LineBasicMaterial({ color: 0xFFFFFFF })
        // );
        // curvedLine.rotateY(Math.PI / 2);

        // Calculate the terrain length and save it
        this.#terrainLength = curvePoints[curvePoints.length - 1].z - curvePoints[0].z;;

        // Create the terrain's mesh
        const planeMesh = new Mesh(
            new PlaneBufferGeometry(this.terrainWidth, this.#terrainLength, 1, this.#terrainLength * 0.05),
            new MeshPhongMaterial({ map, side: DoubleSide }),
            // new MeshStandardMaterial({ color: 0xFFFFFF, side: DoubleSide, wireframe: false })
        );

        // Update the terrain mesh's vertices according to the calculated curved points 
        // between each generated keypoint
        const planeVertices = planeMesh.geometry.getAttribute('position').count;
        const firstVertexY = planeMesh.geometry.getAttribute('position').getY(0);
        for (let i = 0; i < planeVertices; i++ ) {
            // As plane is created length: y, width: x, then y values will be 
            // instead z values in calcualted verts
            const y = planeMesh.geometry.getAttribute('position').getY(i);

            // Find a curve point value that matches the plane vertex' value +-6 units
            const curveValue = curvePoints.find(({ z }) => {
                const zFloor = z;
                const yFloor = y + firstVertexY;

                return zFloor === yFloor || (yFloor - 6 < zFloor && zFloor < yFloor + 6) 
            });
            
            // Update the plane's vertex to match the calculated curvepoint
            planeMesh.geometry.getAttribute('position').setZ(i, curveValue.y)
        }
        // Re-compute the plane's vertex normals, so shading works properly
        planeMesh.geometry.computeVertexNormals();

        // Create a CANNON body for the plane, and rotate it appropriately
        const planeShape = this.#createTrimesh(planeMesh.geometry);
        const planeBody = new Body({
            type: Body.STATIC,
            material: this.#material
        });
        planeBody.addShape(planeShape);
        planeBody.quaternion.setFromEuler(Math.PI / 2, 0, 0);

        // Return the generated terrain (island) start
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
            new MeshPhongMaterial({ map, side: DoubleSide })
            // [DEBUG] Show endPlane as a blue wireframe.
            // new MeshBasicMaterial({ color:0x0000FF, wireframe: true })
        );
        endPlaneMesh.name = 'Island End';

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
     * @private
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

    /**
     * Randomly generates terrain asset objects on terrain.
     * @private
     * @param {Group} terrainAssetGroup - Group that holds the terrain's asset objects
     * @param {Number} amount - Ammount of asset objects to generate
     */
    #generateTerrainAssets(terrainAssetGroup, amount) {
        // Select random terrain asset models
        const randIdxs = Array(amount).fill().map(_ => Math.round(Math.random() * (this.terrainModels.length - 1)));
        const randAssets = randIdxs.map(index => this.terrainModels[index].clone());

        // Get the ending start plane index for the island
        const islandEndIndex = this.#mesh.geometry.getAttribute('position').count - 1;

        // Generate terrain asset objects
        randAssets.forEach(asset => {
            // Get a random vertex index from vertex array in range [2, ..., n - 3]
            // (so it doesn't get neither the first or last index)
            const randomVertexIdx = Math.round(Math.random() * (islandEndIndex - 2)) + 2;
    
            // Generate random x, y, and z values for the terrain asset object's position, 
            // and make the terrain asset object generate in the terrain's ground.
            // Note: As this is in local space, -y represents horizontal (forward) position, 
            // and +z represents vertical (upward) position
            const randomX = Math.random() * this.terrainWidth - this.terrainWidth / 2;
            const randomY = this.#mesh.geometry.getAttribute('position').getY(randomVertexIdx);
            const randomZ = this.#mesh.geometry.getAttribute('position').getZ(randomVertexIdx);

            // Approximate angle of rotation for the terrain asset object numerically
            const prevIdx = randomVertexIdx - 2;
            const nextIdx = randomVertexIdx + 2;
            const prevVertex = new Vector3(0, this.#mesh.geometry.getAttribute('position').getY(prevIdx), this.#mesh.geometry.getAttribute('position').getZ(prevIdx));
            const nextVertex = new Vector3(0, this.#mesh.geometry.getAttribute('position').getY(nextIdx), this.#mesh.geometry.getAttribute('position').getZ(nextIdx));

            const prevToCurrentSlope = (prevVertex.y - randomY) / (prevVertex.z - randomZ);
            const currentToNextSlope = (randomY - nextVertex.y) / (randomZ - nextVertex.z);
            const averageSlope = (prevToCurrentSlope + currentToNextSlope) / 2;
            const normalSlope = -1 / averageSlope;
            const normal = new Vector3(0, normalSlope * 1, 1).normalize();

            const worldUp = new Vector3(0, 0, 1);
            const angle = Math.sign(averageSlope) * Math.acos(worldUp.dot(normal));

            // Setup and add terrain asset object to terrain's asset object group
            asset.name = 'Asset';
            // Set the terrain asset object's z component to the generated value minus 5, 
            // so that the model floats a small amount above the terrain
            asset.position.set(randomX, randomY, randomZ - 5);
            // Convert Blender axes into ThreeJs axes and rotate according to terrain
            asset.rotateX(-Math.PI / 2 + angle);
            asset.scale.set(0.5, 0.5, 0.5);
            terrainAssetGroup.add(asset);
        });
    };

    /**
     * Randomly generates clouds on terrain.
     * @param {Group} cloudGroup - Group that holds the terrain's cloud objects
     * @param {Number} amount - Ammount of cloud objects to generate
     */
    #generateClouds(cloudGroup, amount) {
        // Get the ending start plane index for the island
        const islandEndIndex = this.#mesh.geometry.getAttribute('position').count - 1;

        // Generate cloud objects
        Array(amount).fill().forEach((_, idx) => {
            // Select a random cloud object model
            const cloud = this.clouds[Math.round(Math.random() * (this.clouds.length - 1))].clone();
            
            // Select a random vertex index from the start plane
            const randomVertexIdx = Math.round(Math.random() * (islandEndIndex));

            // Clamp the spawn height of cloud object to create, so as player progresses, 
            // cloud objects will generate closer to the terrain, up to a certian point
            const cloudHeight = this.#clamp(700 - 20 * this.#islandNumber, 500, 700);
            // Clamp the spawn height spread of cloud object to create, so as player progresses, 
            // cloud objects will generate with a larger spread in height, up to a certian point
            const cloudSpread = this.#clamp(200 + 20 * this.#islandNumber, 200, 400);

            // Generate random x, y, and z values for the cloud object's position
            // Note: As this is in local space, -y represents horizontal (forward) position, 
            // and +z represents vertical (upward) position
            const x = Math.round(Math.random() * this.terrainWidth) - this.terrainWidth / 2;
            const y = this.#mesh.geometry.getAttribute('position').getY(randomVertexIdx);
            const z = this.#mesh.geometry.getAttribute('position').getZ(randomVertexIdx) - (Math.random() * cloudSpread + cloudHeight);

            // Setup and add cloud object to terrain's cloud object group
            cloud.name = `Cloud ${idx}`;
            cloud.position.set(x, y, z);
            cloud.scale.set(0.2, 0.2, 0.2);
            cloudGroup.add(cloud);
        });
    };
};