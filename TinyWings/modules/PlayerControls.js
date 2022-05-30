/**
 * Player Controls class which handles player movement physics and 
 * collisions with wave-like terrain.
 * 
 * @module PlayerControls
 * @file Player controls module for Tiny Wings 3D (ThreeJs)
 * @author Emilio Popovits Blake
 * 
 * References which helped in the creation of this module:
 * - Simondev's third person camera and character controller git tutorial: @see {@link https://github.com/simondevyoutube/ThreeJS_Tutorial_ThirdPersonCamera/blob/main/main.js}
 * - Simondev's third person camera and character controller youtube tutorial: @see {@link https://www.youtube.com/watch?v=UuNPHOJ_V5o&ab_channel=SimonDev}
 * - Sebastian Lague's slope climbing youtube tutorial: @see {@link https://www.youtube.com/watch?v=cwcC2tIKObU&list=PLFt_AvWsXl0f0hqURlhyIoAabKPgRsqjz&index=4&ab_channel=SebastianLague}
 */

"use strict";

// Import ThreeJs
import {
    Mesh, Vector3, Quaternion, Raycaster, Scene, Group, 
    Object3D, Vector2, ArrowHelper, 
} from '../../libs/three.js/three.module.js';
// import * as THREE from '../../libs/three.js/three.module.js';

// Enums for capture keys
const [A, D, SPACE, ENTER] = ['a', 'd', ' ', 'enter'];
const DIRECTIONS = [A, D];
const CAPTUREKEYS = [...DIRECTIONS, SPACE, ENTER];

/**
 * Player Controls class which handles player movement physics and 
 * collisions with wave-like terrain.
 * @class
 * @property {Mesh} player - Player model.
 * @property {Number} playerMass - Player mass.
 * @property {Number} rotateStep - Rotation step in radians used when applying a rotation transformation to the player.
 * @property {Number} turnSpeed - Player's turn speed.
 * @property {Number} moveSpeed - Player's move speed.
 * @property {Number} gravity - Acceleration due to gravity.
 */
export default class PlayerControls {
    /**
     * Player model.
     * @type {Mesh} 
     */
    player;

    // Player settings
    /**
     * Player radius.
     * @private
     * @type {Number}
     */
    #playerRadius;
    /**
     * Player mass.
     * @private
     * @type {Number}
     * @default 10
     */
    #playerMass = 10;
    /**
     * Player weight.
     * @private
     * @type {Number}
     */
    #playerWeight;
    /**
     * Rotation step in radians used when applying a rotation transformation to the 
     * player.
     * @type {Number}
     * @default 0.05
     */
    rotateStep = 0.05;
    /**
     * Player's turn speed.
     * @type {Number}
     * @default 100
     */
    turnSpeed = 100;
    /**
     * Player's move speed.
     * @type {Number}
     * @default 100
     */
    moveSpeed = 100;

    /**
     * Array with references to the terrain the player will be colliding with. 
     * @private
     * @type {Mesh[]} 
     */
    #ground = [];

    // Capture keys
    /**
     * Object used to capture keys.
     * @private
     * @type {Object}
     * @example
     * { 'enter': false, 'a': true, 'space': false, ... }
     */
    #keysPressed = {};

    // State
    /**
     * Flag to know if player is grounded.
     * @private
     * @type {Boolean}
     */
    #isGrounded = false;
    /**
     * Flag to know if game has started.
     * @private
     * @type {Boolean}
     */
    #startGame = false;

    // Player movement and rotation data
    /**
     * Euler angle which describes the player's movement direction.
     * By default, set to forward (0, 0, -1).
     * @private
     * @type {Vector3}
     * @default (0,0,-1)
     */
    #moveDirection = new Vector3(0, 0, -1);
    /**
     * Euler angle which stores the horizontal rotation angle axis (global up).
     * @private
     * @type {Vector3}
     * @default (0,1,0)
     */
    #horizontalRotateAngle = new Vector3(0, 1, 0);
    /**
     * Quaternion which stores the player's total rotation transformations.
     * @private
     * @type {Quaternion}
     */
    #rotateQuaternion = new Quaternion();
    /**
     * Quaternion which stores the player's horizontal rotation transformation.
     * @private
     * @type {Quaternion}
     */
    #horizontalRotateQuaternion = new Quaternion();
    /**
     * Quaternion which stores the player's vertical rotation transformation.
     * @private
     * @type {Quaternion}
     */
    #verticalRotateQuaternion = new Quaternion();

    // Raycasters
    /** 
     * Player's ground collision raycasters.
     * @private
     * @type {{down: Raycaster, diagonal: Raycaster, forward: Raycaster, up: Raycaster}}
     */
    #raycastersGround = { down: undefined, diagonal: undefined, forward: undefined, up: undefined };
    /**
     * Flag to know if to show player's ground collision rays for debugging.
     * @private
     * @type {Boolean}
     * @default false
     */
    #raycastDebug = false;
    /**
     * Reference to the scene on where to show the debug ground collision rays.
     * @private
     * @type {Scene}
     */
    #raycastDebugScene;
    /**
     * Previous arrow meshes that represent the player's ground collision rays.
     * @private
     * @type {Group}
     */
    #previousArrowHelpers;

    // Physics
    /**
     * Acceleration due to gravity.
     * @type {Number}
     * @default -9.81
     */
    gravity = -9.81;
    /**
     * Player's vertical velocity.
     * @private
     * @type {Number}
     * @default 0
     */
    #verticalVelocity = 0;

    /**
     * Constructs a Player Controls object.
     * @param {Mesh} player - Player model
     * @param {Mesh[]} ground - Array with references to the terrain the player will be colliding with
     */
    constructor(player, ground) {
        // Initialize player controls's player and ground properties
        this.player = player;
        this.#ground = ground;
        
        // Initialize player's weight
        this.#playerWeight = this.#playerMass * this.gravity;

        // Initialize rotation quaternion and movement direction to match 
        // player's initial rotation
        this.#rotateQuaternion.copy(this.player.quaternion)
        this.#moveDirection.applyQuaternion(this.#rotateQuaternion);
        this.#moveDirection.normalize();

        // Capture keys relevant to the player controls
        this.#initCaptureKeys();

        // Initialize the player's radius
        this.#playerRadius = this.player.geometry.parameters.radius * this.player.scale.y;
        
        // Initialize the raycasters that check for ground collisions
        this.#raycastersGround.down = new Raycaster(this.player.position, new Vector3(0, -1, 0).applyQuaternion(this.#rotateQuaternion).normalize());
        this.#raycastersGround.diagonal = new Raycaster(this.player.position, new Vector3(0, -1, -1).applyQuaternion(this.#rotateQuaternion).normalize());
        this.#raycastersGround.forward = new Raycaster(this.player.position, new Vector3(0, 0, -1).applyQuaternion(this.#rotateQuaternion).normalize());
        this.#raycastersGround.up = new Raycaster(this.player.position, new Vector3(0, 1, 0));
        
        // Make all raycasters cast rays 5 units bigger than the player, except for the up 
        // raycaster. Make that one cast infinitely towards global up, to know when player 
        // falls through the map
        for (const key in this.#raycastersGround) this.#raycastersGround[key].far = this.#playerRadius + 5;
        this.#raycastersGround.up.far = Infinity;
    };

    /**
     * Sets the player's mass.
     * @param {Number} playerMass - The new player's mass
     */
    set playerMass(playerMass) {
        this.#playerMass = playerMass;
        this.#playerWeight = this.#playerMass * this.gravity;
    };

    /**
     * Gets the player's mass.
     * @returns {Number} The player's mass.
     */
    get playerMass() {
        return this.#playerMass;
    };

    /**
     * Initializes event listeners that listen for key presses relevant to 
     * the player controls.
     * @private
     */
    #initCaptureKeys() {
        document.addEventListener('keydown', e => {
            if (CAPTUREKEYS.includes(e.key.toLowerCase()))
                this.#keysPressed[e.key.toLowerCase()] = true;
        });
        document.addEventListener('keyup', e => {
            if (CAPTUREKEYS.includes(e.key.toLowerCase()))
                this.#keysPressed[e.key.toLowerCase()] = false;
        });
    };

    /**
     * Applies a constant gravity to the player.
     * @private
     * @param {Number} deltaTime - Time elapsed since the last frame
     */
    #applyGlobalGravity(deltaTime) {
        if (this.#isGrounded) return;
        this.player.position.y += this.#verticalVelocity * deltaTime + 1/2 * this.#playerWeight / 2 * Math.pow(deltaTime, 2);
        this.#verticalVelocity += this.#playerWeight / 2 * deltaTime;
    };

    /**
     * Applies a stronger gravity to the player to make him fall faster.
     * @private
     * @param {Number} deltaTime - Time elapsed since the last frame
     */
    #applyGravity(deltaTime) {
        if (this.#isGrounded) return;
        this.player.position.y += this.#verticalVelocity * deltaTime + 1/2 * this.#playerWeight * Math.pow(deltaTime, 2);
        this.#verticalVelocity += this.#playerWeight * deltaTime;
    };

    /**
     * Rotates and moves player horizontally when a directional key (A or D) is pressed.
     * @private
     * @param {Number} deltaTime - Time elapsed since the last frame
     */
    #movePlayerHorizontally(deltaTime) {
        /**
         * Gets player movement direction depending on what directional key was 
         * pressed.
         * @param {Object} keysPressed - Object used to capture keys
         * @returns {Number} The player's movement direction (in radians)
         */
        function getPlayerDirection(keysPressed) {
            if (keysPressed[A]) return Math.PI / 8; // A (left)
            if (keysPressed[D]) return -1 * Math.PI / 8;    // D (right)
        };

        // Get player direction
        const playerDirection = getPlayerDirection(this.#keysPressed);

        /*
        * Rotate player, with Y being up (normalized)
        * 
        * Set the horizontal rotation quaternion, and then multiply it by the vertical 
        * rotation quaternion to not affect the player's vertical rotation when changing 
        * directions.
        */
        this.#horizontalRotateQuaternion.setFromAxisAngle(this.#horizontalRotateAngle, playerDirection);
        this.#rotateQuaternion.copy(this.#horizontalRotateQuaternion)
        this.#rotateQuaternion.multiply(this.#verticalRotateQuaternion);
        this.player.quaternion.rotateTowards(this.#rotateQuaternion, this.rotateStep);

        // Calculate the player's new movement direction
        this.#moveDirection = new Vector3(0, 0, -1);
        this.#moveDirection.applyQuaternion(this.#rotateQuaternion);
        this.#moveDirection.normalize();
        this.#moveDirection.applyAxisAngle(this.#horizontalRotateAngle, playerDirection);

        // Move player horizontally towards where he's looking
        const moveX = this.#moveDirection.x * this.turnSpeed * deltaTime;
        const moveZ = this.#moveDirection.z * (this.turnSpeed - this.moveSpeed) * deltaTime;
        this.player.position.x += moveX;
        this.player.position.z += moveZ;
    };

    /**
     * Rotates player according to terrain curvature.
     * @private
     * @param {[{distance: Number, point: Vector3, 
     *  face: *, object: Object3D, uv: Vector2}]} intersects - Array with intersections 
     * found by the ground collision rays.
     */
    #rotatePlayerOnGround(intersects) {
        // (Guard clause) If intersects is empty or undefined, do nothing
        if (!intersects) return;

        // Get the intersection with the smallest distance from all rays except the up one
        intersects = intersects.filter(intersect => intersect !== undefined);
        intersects.sort((a, b) => a.distance - b.distance);
        const intersect = intersects[0];

        // Find the angle to rotate the player by using linear algebra
        const worldUp = new Vector3(0, 1, 0);
        const normal = intersect.face.normal;
        normal.applyAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);

        let moveAngle = Math.acos(worldUp.dot(normal) / (worldUp.length() * normal.length()));

        // Get angle sign, to know if player must rotate upwards or downwards. 
        // Apply the angle to the movement angle
        const sign = normal.z / Math.abs(normal.z);
        moveAngle *= sign;

        /*
        * Rotate player along the X axis
        * 
        * Set the vertical rotation quaternion, and then multiply it by the horizontal 
        * rotation quaternion to not affect the player's horizontal rotation when changing 
        * directions.
        */
        this.#verticalRotateQuaternion.setFromAxisAngle(new Vector3(1, 0, 0), moveAngle);
        this.#rotateQuaternion.setFromAxisAngle(new Vector3(1, 0, 0), moveAngle);
        this.#rotateQuaternion.multiply(this.#horizontalRotateQuaternion);
        this.player.quaternion.rotateTowards(this.#rotateQuaternion, this.rotateStep);

        // Calculate the player's new movement direction
        this.#moveDirection = new Vector3(0, 0, -1).applyQuaternion(this.#rotateQuaternion);
        this.#moveDirection.normalize();
    };

    /**
     * Clamp player to the ground to prevent him from falling through it.
     * @private
     * @param {[{distance: Number, point: Vector3, 
     *  face: *, object: Object3D, uv: Vector2}]} intersects - Array with intersections 
     * found by the ground collision rays.
     */
    #clampPlayerToGround(intersects) {
        // Get the intersection with the smallest distance from all rays except the up one
        intersects = intersects.slice(0, intersects.length - 1).filter(intersect => intersect !== undefined);
        intersects.sort((a, b) => a.distance - b.distance);
        const intersect = intersects[0];

        // If the intersection's distance is less than the player's radius, increment the 
        // player's Y position to clamp him to the ground and not let him fall through it.
        if (intersect.distance <= this.#playerRadius) this.player.position.y += Math.abs(this.#playerRadius - intersect.distance);
    };

    /** 
     * Enables raycast debug. Shows the player's ground collision rays visually. 
     * @param {Scene} raycastDebugScene - Reference to the scene on where to show the debug ground collision rays
     */
    enableRaycastDebug(raycastDebugScene) {
        this.#raycastDebugScene = raycastDebugScene;
        this.#raycastDebug = true;
    };

    /**
     * Shows arrows that represent the ground collision rays visually on scene.
     * @param {Number} rayLength - Length of the visual ground collision ray helpers
     */
    #showRayDebug(rayLength) {
        if (this.#previousArrowHelpers) 
            this.#raycastDebugScene.remove(this.#previousArrowHelpers);
        const arrowHelpers = new Group();
        arrowHelpers.add(
            new ArrowHelper(this.#raycastersGround.down.ray.direction, this.#raycastersGround.down.ray.origin, rayLength, 0x0000FF),
            new ArrowHelper(this.#raycastersGround.diagonal.ray.direction, this.#raycastersGround.diagonal.ray.origin, rayLength, 0x0000FF),
            new ArrowHelper(this.#raycastersGround.forward.ray.direction, this.#raycastersGround.forward.ray.origin, rayLength, 0x0000FF),
            new ArrowHelper(this.#raycastersGround.up.ray.direction, this.#raycastersGround.up.ray.origin, rayLength, 0x0000FF),
        );
        this.#previousArrowHelpers = arrowHelpers;
        this.#raycastDebugScene.add(this.#previousArrowHelpers);
    };

    /**
     * Function called every frame to perform player controls actions.
     * @param {Number} deltaTime - Time elapsed since the last frame
     */
    update(deltaTime) {
        // When enter is pressed, start movement
        const enterPressed = this.#keysPressed[ENTER] === true;
        if (enterPressed) this.#startGame = true;
        if (!this.#startGame) return;

        // Start moving player
        this.player.position.y += this.#moveDirection.y * this.moveSpeed * deltaTime;
        this.player.position.z += this.#moveDirection.z * this.moveSpeed * deltaTime;

        // Apply global gravity
        this.#applyGlobalGravity(deltaTime);

        // When space is pressed, make player fall down faster
        const spacePressed = this.#keysPressed[SPACE] === true;
        if (spacePressed) this.#applyGravity(deltaTime);

        // If a directional key (A, D) is pressed, move player horizontally
        const directionPressed = DIRECTIONS.some(key => this.#keysPressed[key] === true);
        if(directionPressed) this.#movePlayerHorizontally(deltaTime);
        
        // Update raycast positions for rays in all directions, and update their rotation to match 
        // player orientation
        this.#raycastersGround.down.set(this.player.position, new Vector3(0, -1, 0).applyQuaternion(this.#rotateQuaternion).normalize());
        this.#raycastersGround.diagonal.set(this.player.position, new Vector3(0, -1, -1).applyQuaternion(this.#rotateQuaternion).normalize());
        this.#raycastersGround.forward.set(this.player.position, new Vector3(0, 0, -1).applyQuaternion(this.#rotateQuaternion).normalize());
        // Up raycast will always be towards global up, to know when player goes through map
        this.#raycastersGround.up.set(this.player.position, new Vector3(0, 1, 0));

        // Check if any of the player's rays intersect with the ground
        const intersects = Object.keys(this.#raycastersGround).map(key => this.#raycastersGround[key].intersectObjects(this.#ground)[0]);

        // Check if character is grounded by getting all (except up ray) ray intersections and 
        // sorting them by distance. Get the one with the smallest distance and check if the 
        // distance is smaller than 1 + the player's radius
        this.#isGrounded = intersects.slice(0, intersects.length - 1)
            .filter(intersect => intersect !== undefined)
            .sort((a, b) => a.distance - b.distance)[0]?.distance <= 1 + this.#playerRadius;

        // If the player is grounded, clamp player to floor (so he doesn't go through the 
        // map)
        if (this.#isGrounded) {
            // Player moves towards where he's looking, so rotate player according to 
            // terrain curvature
            this.#rotatePlayerOnGround(intersects);

            // Make sure player does not go through the ground
            this.#clampPlayerToGround(intersects);
        }

        // If player goes through the map, reset his position to above the map
        if (intersects[3] !== undefined) this.player.position.y = intersects[3].point.y + this.#raycastersGround.down.far;

        // If raycast debug is enabled, show ground collision rays
        if (this.#raycastDebug) this.#showRayDebug(this.#playerRadius + 15);
    };
};