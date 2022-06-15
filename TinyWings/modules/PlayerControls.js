/**
 * Player Controls class which handles player movement.
 * 
 * @module PlayerControls
 * @file Player controls module for Tiny Wings 3D (ThreeJs)
 * @author Emilio Popovits Blake
 */

"use strict";

// Import ThreeJs
import { Mesh, Vector3, Quaternion} from '../../libs/three.js/three.module.js';
// import * as THREE from '../../libs/three.js/three.module.js';

// Import cannon-es
import { Body } from '../../libs/cannon-es.js/cannon-es.js';
// import * as CANNON from '../../libs/cannon-es.js/cannon-es.js';

// Enums for capture keys
const [W, A, D, ENTER, SPACE] = ['w', 'a', 'd', 'enter', ' '];
const DIRECTION_KEYS = [W, A, D];
const CAPTURE_KEYS = [...DIRECTION_KEYS, ENTER, SPACE];

/**
 * Player Controls class which handles player movement.
 * @class
 * @property {{ mesh: Mesh, body: Body }} player - Player to enable controls for.
 */
export default class PlayerControls {
    /**
     * Player to enable controls for.
     * @type {{ mesh: Mesh, body: Body }} 
     */
    player;

    /**
     * Object that keeps track of keys that are 
     * being pressed.
     * @private
     * @type {Object}
     * @example
     * { 'enter': false, 'a': true, 'space': false, ... }
     */
    #keysPressed = {};

    /**
     * Flag to know if to start player movement.
     * @private
     * @type {Boolean}
     * @default false
     */
    #startGame = false;

    /**
     * Constructs a Player Controls object.
     * @param {{ mesh: Mesh, body: Body }} player - Player model
     */
    constructor(player) {
        // Initialize player controls's player property
        this.player = player;
        // Capture keys relevant to the player controls
        this.#initKeyCapture();
    };

    /**
     * Initializes event listeners that listen for key presses relevant to 
     * the player controls.
     * @private
     */
    #initKeyCapture() {
        document.addEventListener('keydown', e => {
            if (CAPTURE_KEYS.includes(e.key.toLowerCase()))
                this.#keysPressed[e.key.toLowerCase()] = true;
        });
        document.addEventListener('keyup', e => {
            if (CAPTURE_KEYS.includes(e.key.toLowerCase()))
                this.#keysPressed[e.key.toLowerCase()] = false;
        });
    };

    /** Function called every frame to perform player controls actions. */
    update() {
        // If enter is pressed, start game
        const enterPressed = this.#keysPressed[ENTER] === true;
        if (enterPressed) this.#startGame = true;
        // if (!this.#startGame) return;

        // If space is pressed, increase player's mass so he falls faster
        const spacePressed = this.#keysPressed[SPACE] === true;
        if (spacePressed) this.player.body.mass = 10;
        else this.player.body.mass = 1;
        
        // Clamp the player movement on Z (forward) to at least -100
        const moveSpeed = 100;
        if (Math.abs(this.player.body.velocity.z) < moveSpeed || this.player.body.velocity.z > 0) this.player.body.velocity.z = -moveSpeed;

        // If no directional key was pressed, keep the player's horizontal movement velocity 
        // as it was. Else, move player in the direction that was pressed (horizontally on X). 
        const directionPressed = DIRECTION_KEYS.some(key => this.#keysPressed[key] === true);
        if (!directionPressed) this.player.body.velocity.x = 0;
        // else if (this.#keysPressed[W] === true) this.player.body.velocity.x = 0;
        else if (this.#keysPressed[A] === true) this.player.body.velocity.x = -100;
        else this.player.body.velocity.x = 100;

        // Calculate the rotation angle
        const playerVelocity = new Vector3().copy(this.player.body.velocity);
        const worldForward = new Vector3(0, 0, -1);
        const rotateAngle =  Math.sign(playerVelocity.y) * Math.acos( worldForward.dot(playerVelocity) / (worldForward.length() * playerVelocity.length()) );

        // Rotate player in according to where he's moving towards (so player 
        // looks up when moving up, and looks down when moving down)
        const playerRotation = new Quaternion().copy(this.player.body.quaternion);
        const newRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), rotateAngle);
        playerRotation.rotateTowards(newRotation, 0.2);
        this.player.body.quaternion.copy(playerRotation);
    };

};