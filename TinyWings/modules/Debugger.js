/**
 * Debugger class which displays visual helpers to help debug 
 * player movement.
 * 
 * @module Debugger
 * @file Debugger module for Tiny Wings 3D (ThreeJs)
 * @author Emilio Popovits Blake
 */

"use strict";

// Import ThreeJs
import {
    Vector3, Quaternion, Raycaster, Scene, Group, ArrowHelper
} from '../../libs/three.js/three.module.js';

/**
 * Debugger class which displays visual helpers to help debug 
 * player movement.
 * @class
 * @property {Scene} scene - Scene on which to add visual debug helpers.
 * @property {Mesh} player - Player for debug arrows.
 * @property {Boolean} groundRaycastDebug - Flag to know if to show player's ground collision rays for debugging.
 * @property {Raycaster[]} groundRaycasters - Ground raycasters to show debug arrows for.
 * @property {Boolean} velocityDebug - Flag to know if to show player's velocity vector for debugging.
 * @property {Vector3} playerVelocity - Player velocity to show debug arrow for.
 * @property {Boolean} newRotationDebug - Flag to know if to show player's target new rotation for debugging.
 * @property {Boolean} velocityDisplay - Flag to know if to show velocity display.
 */
export default class Debugger {
    /**
     * Scene on which to add visual debug helpers.
     * @type {Scene}
     */
    #scene;

    /**
     * Player for debug arrows.
     * @private
     * @type {Mesh}
     */
    #player;

    // Ground raycast debug
    /**
     * Flag to know if to show player's ground collision rays for debugging.
     * @type {Boolean}
     * @default false
     */
    groundRaycastDebug = false;
    /**
     * Ground raycasters to show debug arrows for.
     * @type {Raycaster[]}
     */
    groundRaycasters = [];
    /**
     * Raycast debugger arrow meshes that represent the player's 
     * ground collision rays.
     * @private
     * @type {Group}
     */
    #groundRaycastDebuggers;

    // Velocity debug
    /**
     * Flag to know if to show player's velocity vector for debugging.
     * @type {Boolean}
     * @default false
     */
    velocityDebug = false;
    /**
     * Player velocity to show debug arrow for.
     * @type {Vector3}
     */
    playerVelocity;
    /**
     * Player velocity arrow mesh that represents the player's 
     * velocity vector.
     * @private
     * @type {Group}
     */
    #velocityDebugger;

    // New rotation debug
    /**
     * Flag to know if to show player's target new rotation for debugging.
     * @type {Boolean}
     * @default false
     */
    newRotationDebug = false;
    /**
     * Player new rotation meshes that represent the player's 
     * target new rotation vector, current velocity vector, and up vector.
     * @private
     * @type {Group}
     */
    #newRotationDebugger;

    // Velocity display
    /**
     * Flag to know if to show speed display.
     * @type {Boolean}
     * @default false
     */
    speedDisplay = false;
    /**
     * Flag to know if speed display HTML was created.
     * @private
     * @type {Boolean}
     * @default false
     */
    #createdSpeedDisplay = false;
    /**
     * Speed display map.
     * @private
     * @type {Map}
     */
    #speedDisplayMap;
    
    /**
     * Constructs a Debugger object.
     * @param {Scene} scene - Scene on which to add visual debug helpers
     * @param {Mesh} player - Player model
     */
    constructor(scene, player) {
        this.#scene = scene;
        this.#player = player;
    };

    /** Shows arrows that represent the ground collision rays visually on scene. */
    #debugGroundRaycasters() {
        if (this.#groundRaycastDebuggers) 
            this.#scene.remove(this.#groundRaycastDebuggers);
        
        const raycastDebuggers = new Group();

        this.groundRaycasters.forEach((raycaster, idx) => {
            raycastDebuggers.add(
                new ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, raycaster.far !== Infinity ? raycaster.far : this.groundRaycasters[idx - 1].far, 0x0000FF)
            );
        });

        this.#groundRaycastDebuggers = raycastDebuggers;
        this.#scene.add(this.#groundRaycastDebuggers);
    };

    /** Shows arrow that represents the player's velocity vector visually on scene. */
    #debugVelocity() {
        if (this.#velocityDebugger) this.#scene.remove(this.#velocityDebugger);

        const velocityDirecton = new Vector3().copy(this.playerVelocity).normalize();
        const velocityMagnitude = this.playerVelocity.length();

        const velocityDebugger = new Group();

        velocityDebugger.add(
            new ArrowHelper(velocityDirecton, this.#player.position, velocityMagnitude, 0x00FF00)
        );

        this.#velocityDebugger = velocityDebugger;
        this.#scene.add(this.#velocityDebugger);
    };

    #debugNewRotation() {
        if (this.#newRotationDebugger) this.#scene.remove(this.#newRotationDebugger);

        const playerUp = new Vector3(0, 1, 0).applyQuaternion(this.#player.quaternion).normalize();

        const velocityDirecton = new Vector3().copy(this.playerVelocity).normalize();
        const velocityMagnitude = this.playerVelocity.length();

        const rotation = new Quaternion().setFromAxisAngle(playerUp, Math.PI/8);
        const newDirection = new Vector3().copy(this.playerVelocity).applyQuaternion(rotation).normalize();
        // New direction when player is rotated X PI/4
        // const newDirection = new Vector3(-0.38268343236508984, 0.6532814824381884,-0.6532814824381883);

        // Axis angle test
        // const target = new Quaternion(0.37533027751786524, 0.18023995550173696, 0.0746578340503426, 0.9061274463528878);
        // const axisAngle = new Vector3(
        //     target.x / Math.sin(Math.PI / 16),
        //     target.y / Math.sin(Math.PI / 16),
        //     target.z / Math.sin(Math.PI / 16)
        // ).normalize();
        // console.log(axisAngle, newDirection);

        // [NOTE] Previously on player controller
        // this.#horizontalRotateQuaternion.setFromAxisAngle(playerUp, Math.PI/8);
        // this.#rotateQuaternion.copy(this.#horizontalRotateQuaternion);
        // this.#rotateQuaternion.multiply(this.#verticalRotateQuaternion);
        // this.player.quaternion.rotateTowards(this.#rotateQuaternion, this.rotateStep);
        // console.log(this.#moveVelocity, newDirection, playerUp)

        const newRotationDebugger = new Group();

        newRotationDebugger.add(
            new ArrowHelper(playerUp, this.#player.position, velocityMagnitude, 0xFF0000),
            new ArrowHelper(velocityDirecton, this.#player.position, velocityMagnitude, 0x00FF00),
            new ArrowHelper(newDirection, this.#player.position, velocityMagnitude, 0xFFFFFF)
        );

        this.#newRotationDebugger = newRotationDebugger;
        this.#scene.add(this.#newRotationDebugger);
    };

    #showSpeedDisplay() {
        if (!this.#createdSpeedDisplay) {
            const background = document.createElement('div');
            const velocity = document.createElement('div');
            const speed = document.createElement('div');
            const angle = document.createElement('div');
            
            this.#speedDisplayMap = new Map();
            this.#speedDisplayMap.set('velocity', velocity);
            this.#speedDisplayMap.set('speed', speed);
            this.#speedDisplayMap.set('angle', angle);

            background.style.position = 'absolute';
            background.style.background = 'rgba(0, 0, 0, 0.8)';
            background.style.bottom = `${25}px`;
            background.style.right = `${25}px`;
            background.style.width = '500px';
            background.style.padding = '20px';

            this.#speedDisplayMap.forEach((value, key) => {
                value.style.color = 'white';
                value.style.fontSize = '25px';
                value.style.fontFamily = 'sans-serif';
                value.style.position = 'relative';
                value.textContent = `${key[0].toUpperCase()+key.substring(1, key.length)}: `;
            });

            this.#speedDisplayMap.forEach(value => background.append(value));
            document.body.append(background);
            
            this.#createdSpeedDisplay = true;
        };

        const playerVelocity = this.playerVelocity.toArray().map(value => Number(value.toFixed(2)));
        const playerSpeed = Number(this.playerVelocity.length().toFixed(2));

        this.#speedDisplayMap.get('velocity').textContent = `Velocity: (${playerVelocity})`;
        this.#speedDisplayMap.get('speed').textContent = `Speed: ${playerSpeed}`;

        const worldUp = new Vector3(0, 1, 0);
        const playerUp = new Vector3(0, 1, 0).applyQuaternion(this.#player.quaternion).normalize();
        const angle = Number(Math.sign(playerUp.z) * Math.acos(worldUp.dot(playerUp) / (worldUp.length() * playerUp.length())).toFixed(2));

        this.#speedDisplayMap.get('angle').textContent = `Angle: ${angle}`;

    };

    /**
     * Function called every frame to perform debugger actions.
     * @param {Number} deltaTime - Time elapsed since the last frame
     */
    update(deltaTime) {
        if (this.groundRaycastDebug) this.#debugGroundRaycasters();
        if (this.velocityDebug) this.#debugVelocity();
        if (this.newRotationDebug) this.#debugNewRotation();
        if (this.speedDisplay) this.#showSpeedDisplay();
    };
};