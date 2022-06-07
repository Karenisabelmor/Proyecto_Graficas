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

// Import Debugger
import Debugger from './Debugger.js';

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
     * Player weight, calculated as mass * gravity.
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
     * @private
     * @type {Number}
     * @default 100
     */
    #moveSpeed = 100;

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
     * Flag to know if it's the first time the player hits 
     * the ground.
     * @private
     * @type {Boolean}
     * @default true
     */
    #groundFirstImpact = true;
    /**
     * Flag to know if game has started.
     * @private
     * @type {Boolean}
     */
    #startGame = false;

    // Player movement and rotation data
    /**
     * Movement velocity vector of the player.
     * By default, set to forward (0, 0, -1).
     * @private
     * @type {Vector3}
     * @default (0,0,-1)
     */
    #moveVelocity = new Vector3(0, 0, -1);
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

    // Physics
    /**
     * Acceleration due to gravity.
     * @private
     * @type {Number}
     * @default -9.81
     */
    #gravity = -9.81;
    /**
     * Variable for vertical acceleration to use.
     * @private
     * @type {Number}
     * @default 0
     */
    #verticalAcceleration = 0;

    // Debug
    /**
     * Visual debug helper.
     * @type {Debugger}
     */
    debugger;

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
        this.#playerWeight = this.#playerMass * this.#gravity;

        // Initialize rotation quaternion and movement direction to match 
        // player's initial rotation
        this.player.rotation.order.toLowerCase().split('').forEach(axis => {
            if (axis === 'x') this.#verticalRotateQuaternion.setFromAxisAngle(new Vector3(1, 0, 0), this.player.rotation[axis]);
            if (axis === 'y') this.#horizontalRotateQuaternion.setFromAxisAngle(new Vector3(0, 1, 0), this.player.rotation[axis]);
        });

        this.#rotateQuaternion.copy(this.#verticalRotateQuaternion);
        this.#rotateQuaternion.multiply(this.#horizontalRotateQuaternion);

        this.#moveVelocity.applyQuaternion(this.#rotateQuaternion);
        this.#moveVelocity.normalize().multiplyScalar(this.#moveSpeed);

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
     * Player's mass.
     * @param {Number} playerMass - The new player's mass
     * @default 10
     */
    set playerMass(playerMass) {
        this.#playerMass = playerMass;
        this.#playerWeight = this.#playerMass * this.#gravity;
    };

    /**
     * Player's mass.
     * @returns {Number} The player's mass.
     */
    get playerMass() {
        return this.#playerMass;
    };

    /**
     * Player's move speed.
     * @param {Number} moveSpeed - The new player's moveSpeed to use
     * @default 100
     */
    set moveSpeed(moveSpeed) {
        this.#moveSpeed = moveSpeed;
        this.#moveVelocity.normalize().multiplyScalar(this.#moveSpeed);
    };

    /**
     * Player's move speed.
     * @returns {Number} Player's move speed.
     */
    get moveSpeed() {
        return this.#moveSpeed;
    };

    /**
     * Acceleration due to gravity.
     * @param {Number} gravity - The new gravity to use
     * @default -9.81
     */
    set gravity(gravity) {
        this.#gravity = gravity;
        this.#playerWeight = this.#playerMass * this.#gravity;
    };

    /**
     * Acceleration due to gravity.
     * @returns {Number} Acceleration due to gravity.
     */
    get gravity() {
        return this.#gravity;
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
        // dy = v0t + 1/2 a t^2
        // v = a * t
        this.#verticalAcceleration = this.#playerWeight;
        this.#moveVelocity.y += this.#verticalAcceleration * deltaTime;
    };

    /**
     * Applies a stronger gravity to the player to make him fall faster.
     * @private
     * @param {Number} deltaTime - Time elapsed since the last frame
     */
    #applyGravity(deltaTime) {
        if (this.#isGrounded) return;
        this.#verticalAcceleration = this.#playerWeight * 4;
        this.#moveVelocity.y += this.#verticalAcceleration * deltaTime;
    };

    /**
     * Rotates and moves player horizontally when a directional key (A or D) is pressed.
     * @private
     * @param {Number} deltaTime - Time elapsed since the last frame
     */
    // #movePlayerHorizontally(deltaTime) {
    //     /**
    //      * Gets player movement direction depending on what directional key was 
    //      * pressed.
    //      * @param {Object} keysPressed - Object used to capture keys
    //      * @returns {Number} The player's movement direction (in radians)
    //      */
    //     function getPlayerDirection(keysPressed) {
    //         if (keysPressed[A]) return Math.PI / 8; // A (left)
    //         if (keysPressed[D]) return -1 * Math.PI / 8;    // D (right)
    //     };

    //     // Get player direction
    //     const playerDirection = getPlayerDirection(this.#keysPressed);

    //     /*
    //     * Rotate player, with Y being up (normalized)
    //     * 
    //     * Set the horizontal rotation quaternion, and then multiply it by the vertical 
    //     * rotation quaternion to not affect the player's vertical rotation when changing 
    //     * directions.
    //     */
    //     this.#horizontalRotateQuaternion.setFromAxisAngle(this.#horizontalRotateAngle, playerDirection);
    //     this.#rotateQuaternion.copy(this.#horizontalRotateQuaternion)
    //     this.#rotateQuaternion.multiply(this.#verticalRotateQuaternion);
    //     this.player.quaternion.rotateTowards(this.#rotateQuaternion, this.rotateStep);

    //     // Calculate the player's new movement direction
    //     // const moveSpeed = this.#moveVelocity.length();
    //     // this.#moveVelocity = new Vector3(0, 0, -1);
    //     // this.#moveVelocity = new Vector3(0, -1, 0);
    //     // this.#moveVelocity.applyQuaternion(this.#rotateQuaternion);
    //     // this.#moveVelocity.normalize();
    //     // this.#moveVelocity.applyAxisAngle(this.#horizontalRotateAngle, playerDirection);
    //     // this.#moveVelocity.multiplyScalar(moveSpeed);

    //     const moveSpeed = this.#moveVelocity.length();
    //     this.#moveVelocity = new Vector3(0, 0, -1).applyQuaternion(this.#rotateQuaternion);
    //     this.#moveVelocity.normalize();
    //     this.#moveVelocity.multiplyScalar(moveSpeed);

    // };
    // #movePlayerHorizontally(deltaTime) {
    //     /**
    //      * Gets player movement direction depending on what directional key was 
    //      * pressed.
    //      * @param {Object} keysPressed - Object used to capture keys
    //      * @returns {Number} The player's movement direction (in radians)
    //      */
    //     function getPlayerDirection(keysPressed) {
    //         if (keysPressed[A]) return Math.PI / 8; // A (left)
    //         if (keysPressed[D]) return -1 * Math.PI / 8;    // D (right)
    //     };

    //     // Get player direction
    //     const playerDirection = getPlayerDirection(this.#keysPressed);

    //     // Get axis for player up
    //     const playerUp = new Vector3(0, 1, 0).applyQuaternion(this.#rotateQuaternion).normalize();

    //     /*
    //     * Rotate player, with Y being up (normalized)
    //     * 
    //     * Set the horizontal rotation quaternion, and then multiply it by the vertical 
    //     * rotation quaternion to not affect the player's vertical rotation when changing 
    //     * directions.
    //     */
    //     this.#horizontalRotateQuaternion.setFromAxisAngle(playerUp, playerDirection);
    //     this.#rotateQuaternion.copy(this.#horizontalRotateQuaternion);
    //     this.#rotateQuaternion.multiply(this.#verticalRotateQuaternion);
    //     this.player.quaternion.rotateTowards(this.#rotateQuaternion, this.rotateStep);

    //     // Calculate the player's new movement direction
    //     const moveSpeed = this.#moveVelocity.length();
    //     this.#moveVelocity = new Vector3(0, 0, -1).applyQuaternion(this.player.quaternion);
    //     this.#moveVelocity.normalize();
    //     this.#moveVelocity.multiplyScalar(moveSpeed);

    //     /*
    //         This works when vertical rotation is not taken into account. When player rotates 
    //         vertically, player may spin or not loose altitude. An idea for the cause of this 
    //         is that the calculated new direction's Y component is slightly above the current 
    //         move velocity's Y component. Maybe making them the same would solve this issue.
    //     */
    // };

    // Temporary solution for horizontal movement.
    #movePlayerHorizontally(deltaTime) {
        if (this.#keysPressed[A]) return this.player.position.x -= this.#moveVelocity.length() / 3 * deltaTime;
        if (this.#keysPressed[D]) return this.player.position.x += this.#moveVelocity.length() / 3 * deltaTime;
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

        // Rotate the normal of the face by the conjugate of the object's quaternion
        // (i.e. reset object's rotation to get the propper normal vector direction)
        const faceRotation = new Quaternion();
        intersect.object.getWorldQuaternion(faceRotation)
        faceRotation.conjugate();
        normal.applyQuaternion(faceRotation);

        const moveAngle = Math.sign(normal.z) * Math.acos(worldUp.dot(normal) / (worldUp.length() * normal.length()));

        // If it's the first ground impact, rotate player immediately. Else, rotate 
        // according to the rotate step.
        const rotateStep = this.#groundFirstImpact ? 100 : this.rotateStep;
        if (this.#groundFirstImpact) this.#groundFirstImpact = false;

        /*
        * Rotate player along the X axis
        * 
        * Set the vertical rotation quaternion, and then multiply it by the horizontal 
        * rotation quaternion to not affect the player's horizontal rotation when changing 
        * directions.
        */
        this.#verticalRotateQuaternion.setFromAxisAngle(new Vector3(1, 0, 0), moveAngle);
        this.#rotateQuaternion.copy(this.#verticalRotateQuaternion);
        this.#rotateQuaternion.multiply(this.#horizontalRotateQuaternion);
        this.player.quaternion.rotateTowards(this.#rotateQuaternion, rotateStep);

        // Calculate the player's new movement direction
        const moveSpeed = this.#moveVelocity.length();
        this.#moveVelocity = new Vector3(0, 0, -1).applyQuaternion(this.player.quaternion);
        this.#moveVelocity.normalize();
        this.#moveVelocity.multiplyScalar(moveSpeed);
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

    #rotatePlayerOnAir() {
        // As player is in the air, set the first ground impact to true so the 
        // player rotates immediately when he collides with terrain.
        if (!this.#groundFirstImpact) this.#groundFirstImpact = true;

        // Calculate the air rotation angle
        const worldForward = new Vector3(0,0,-1);
        const rotateAngle =  Math.sign(this.#moveVelocity.y) * Math.acos( worldForward.dot(this.#moveVelocity) / (worldForward.length() * this.#moveVelocity.length()) );

        // Rotate player in the air according to where he's flying towards (so player 
        // looks up when flying up, and looks down when flying down)
        this.#verticalRotateQuaternion.setFromAxisAngle(new Vector3(1, 0, 0), rotateAngle);
        this.#rotateQuaternion.copy(this.#verticalRotateQuaternion);
        this.#rotateQuaternion.multiply(this.#horizontalRotateQuaternion);
        this.player.quaternion.rotateTowards(this.#rotateQuaternion, this.rotateStep);

        // Calculate the player's new movement direction
        const moveSpeed = this.#moveVelocity.length();
        this.#moveVelocity = new Vector3(0, 0, -1).applyQuaternion(this.player.quaternion);
        this.#moveVelocity.normalize();
        this.#moveVelocity.multiplyScalar(moveSpeed);
    };

    #calculateMomentum(intersects, deltaTime) {
        // p = m * v
        // https://www.physicsclassroom.com/class/momentum/Lesson-2/Momentum-Conservation-Principle#:~:text=The%20law%20of%20momentum%20conservation%20can%20be%20stated%20as%20follows,two%20objects%20after%20the%20collision.
        
        // Get the intersection with the smallest distance from all rays except the up one
        intersects = intersects.slice(0, intersects.length - 1).filter(intersect => intersect !== undefined);
        intersects.sort((a, b) => a.distance - b.distance);
        const intersect = intersects[0];

        const normal = intersect.face.normal;

        if (Math.sign(normal.z) > 0) this.#moveVelocity.y -= 5;
    };

    /**
     * Function called every frame to perform player controls actions.
     * @param {Number} deltaTime - Time elapsed since the last frame
     */
    update(deltaTime) {
        // If visual debugger is enabled, run it
        if (this.debugger) {
            if (this.debugger.groundRaycastDebug) 
                this.debugger.groundRaycasters = Object.keys(this.#raycastersGround).map(key => this.#raycastersGround[key]);
            
            if (this.debugger.velocityDebug)
                this.debugger.playerVelocity = this.#moveVelocity;

            if (this.debugger.newRotationDebug)
                this.debugger.playerVelocity = this.#moveVelocity;

            if (this.debugger.speedDisplay)
                this.debugger.playerVelocity = this.#moveVelocity;
            
            this.debugger.update(deltaTime);
        }

        // When enter is pressed, start movement
        const enterPressed = this.#keysPressed[ENTER] === true;
        if (enterPressed) this.#startGame = true;
        if (!this.#startGame) return;

        // Move the player
        this.player.position.y += this.#moveVelocity.y * deltaTime + 1/2 * this.#verticalAcceleration * deltaTime;
        this.player.position.z += this.#moveVelocity.z * deltaTime;

        // Make it so that the least movement velocity is the one set in this.#moveSpeed
        if (Math.abs(this.#moveVelocity.z) < this.#moveSpeed) this.#moveVelocity.z = Math.sign(this.#moveVelocity.z) * this.#moveSpeed;

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
        // map) and rotate player according to terrain
        if (this.#isGrounded) {
            // Player moves towards where he's looking, so rotate player according to 
            // terrain curvature
            this.#rotatePlayerOnGround(intersects);

            // Make sure player does not go through the ground
            this.#clampPlayerToGround(intersects);

            // this.#calculateMomentum(intersects, deltaTime);
        }

        // If the player is in the air, rotate the player according to velocity Y component
        else this.#rotatePlayerOnAir();

        // If player goes through the map, reset his position to above the map
        // if (intersects[3] !== undefined) this.player.position.y = intersects[3].point.y + this.#raycastersGround.down.far;
        if (intersects[3] !== undefined) this.player.position.y = intersects[3].point.y + this.#playerRadius;
    };

    /** 
     * Enables visual debugger. 
     * @param {Scene} scene - Scene on which to add visual debug helpers
     */
    enableDebugger(scene) {
        this.debugger = new Debugger(scene, this.player);
    };

    /** Disables visual debugger. */
    disableDebugger() {
        this.debugger = undefined;
    };
};