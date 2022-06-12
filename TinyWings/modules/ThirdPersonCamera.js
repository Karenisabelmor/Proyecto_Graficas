/**
 * Third Person Camera class which handles camera movement 
 * with respect to the player's movement.
 * 
 * @module ThirdPersonCamera
 * @file Third person camera module for Tiny Wings 3D (ThreeJs)
 * @author Emilio Popovits Blake
 * @author Karen Morgado
 * 
 * References which helped in the creation of this module:
 * - Simondev's third person camera and character controller git tutorial: @see {@link https://github.com/simondevyoutube/ThreeJS_Tutorial_ThirdPersonCamera/blob/main/main.js}
 * - Simondev's third person camera and character controller youtube tutorial: @see {@link https://www.youtube.com/watch?v=UuNPHOJ_V5o&ab_channel=SimonDev}
 */

"use strict";

// Import ThreeJs
import { 
    Raycaster, Vector3, PerspectiveCamera, Group, Quaternion 
} from '../../libs/three.js/three.module.js';

// Import PlayerControls
import PlayerControls from './PlayerControls.js';

/**
 * Third Person Camera class which handles camera movement 
 * with respect to the player's movement.
 * @class
 * @property {Vector3} idealOffset - Camera's ideal offset, relative to the player.
 * @property {Vector3} idealLookat - Camera's ideal lookat, relative to the player.
 */
export default class ThirdPersonCamera {
    /** 
     * Perspective camera that follows the player.
     * @private
     * @type {PerspectiveCamera} 
     */
    #camera;
    /**
     * Reference to the player controls object.
     * @private
     * @type {PlayerControls}
     */
    #playerControls;
    /**
     * ThreeJs Group containing the islands for collision testing.
     * @private 
     * @type {Group} 
     */
    #islands;

    /**
     * Holds the camera's current position.
     * @private
     * @type {Vector3}
     */
    #currentPosition = new Vector3();
    /**
     * Holds the camera's current lookat.
     * @private
     * @type {Vector3}
     */
    #currentLookat = new Vector3();

    /**
     * Camera's ideal offset, relative to the player.
     * @type {Vector3} 
     */
    idealOffset = new Vector3();
    /**
     * Camera's ideal lookat, relative to the player.
     * @type {Vector3}
     */
    idealLookat = new Vector3();

    /**
     * Constructs a Third Person Camera object.
     * @param {PerspectiveCamera} camera - Perspective camera that follows the player
     * @param {PlayerControls} playerControls - Reference to the player controls object
     * @param {Group} islands - ThreeJs Group containing the islands for collision testing
     * @param {Vector3} idealOffset - Camera's ideal offset, relative to the player
     * @param {Vector3} idealLookat - Camera's ideal lookat, relative to the player
     */
    constructor(camera, playerControls, islands, idealOffset, idealLookat) {
        // Initialize the third person camera's properties
        this.#camera = camera;
        this.#playerControls = playerControls;
        this.#islands = islands;
        this.idealOffset = idealOffset;
        this.idealLookat = idealLookat;
        
        // Initialize camera position and lookat
        const initialOffset = new Vector3().copy(this.idealOffset).add(this.#playerControls.player.body.position);
        const initialLookat = new Vector3().copy(this.idealLookat).add(this.#playerControls.player.body.position);
        this.#currentPosition.copy(initialOffset);
        this.#currentLookat.copy(initialLookat);
        this.#camera.position.copy(this.#currentPosition);
        this.#camera.lookAt(this.#currentLookat);
    };

    /**
     * Calculates camera's ideal offset relative to the player.
     * @returns {Vector3} Camera's ideal offset.
     */
    #calculateIdealOffset() {
        const idealOffset = new Vector3().copy(this.idealOffset);
        idealOffset.add(this.#playerControls.player.body.position);
        return idealOffset;
    };
    
    /**
     * Calculates camera's ideal lookat relative to the player.
     * @returns {Vector3} Camera's ideal lookat.
     */
    #calculateIdealLookat() {
        const idealLookat = new Vector3().copy(this.idealLookat);
        idealLookat.add(this.#playerControls.player.body.position);
        return idealLookat;
    };

    /**
     * Performs third person camera's update every frame.
     * @param {Number} deltaTime - Time elapsed since last frame.
     */
    update(deltaTime) {
        // Calculate camera's ideal offset and lookat
        const idealOffset = this.#calculateIdealOffset();
        const idealLookat = this.#calculateIdealLookat();

        // Cast a ray from the camera's ideal lookat point towards the camera, 
        // to check if there's terrain between the camera's ideal lookat position 
        // and the camera. This is to prevent the camera from clipping through 
        // terrain.
        const rotationToCamera = new Quaternion().setFromAxisAngle(new Vector3(-1, 0, 0), Math.atan2(this.idealOffset.y, this.idealOffset.z));
        const lookatRay = new Raycaster(idealLookat, new Vector3(0, 0, 1).applyQuaternion(rotationToCamera).normalize());
        const intersect = lookatRay.intersectObjects(this.#islands.children)[0];
        
        // If there's terrain between the camera and the ideal lookat point, 
        // move camera up so it doesn't clip terrain
        if (intersect) {
            // Calculate angle of terrain normal to calculate how far up to move 
            // the camera
            const worldUp = new Vector3(0, 1, 0);
            const normal = intersect.face.normal;
            const faceRotation = new Quaternion();
            intersect.object.getWorldQuaternion(faceRotation);
            faceRotation.conjugate();
            normal.applyQuaternion(faceRotation);
            
            const angle = Math.sign(normal.z) * Math.acos(worldUp.dot(normal) / (worldUp.length() * normal.length()));
            
            // Move the camera up by the calculated distance
            idealOffset.y += Math.abs(Math.sin(angle) * this.idealOffset.z);
        }

        // Interpolate between the current position and lookat and the ideal 
        // position and lookat at a frame consistent rate, so camera moves in a 
        // spring-like way
        const interpolationParam = 1 - Math.pow(0.001, deltaTime);
        this.#currentPosition.lerp(idealOffset, interpolationParam / 3);
        this.#currentLookat.lerp(idealLookat, interpolationParam);

        // Update the camera's position and lookat
        this.#camera.position.copy(this.#currentPosition);
        this.#camera.lookAt(this.#currentLookat);
    };
};