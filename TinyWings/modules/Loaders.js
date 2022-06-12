"use strict";

import * as THREE from '../../libs/three.js/three.module.js'
import { OBJLoader } from '../../libs/three.js/loaders/OBJLoader.js';
import { FBXLoader } from '../../libs/three.js/loaders/FBXLoader.js';

/**
 * 
 * @async
 * @param {{obj: String, map: String, normalMap: String, 
 * specularMap: String}} modelData - Object which holds urls for loading the model
 * @returns {THREE.Group} Model that was loaded.
 */
export async function loadObj(modelData) {
    try {
        const model = await new OBJLoader().loadAsync(modelData.obj);

        const texture = modelData.map ? new THREE.TextureLoader().load(modelData.map) : null;
        const normalMap = modelData.normalMap ? new THREE.TextureLoader().load(modelData.normalMap) : null;
        const specularMap = modelData.specularMap ? new THREE.TextureLoader().load(modelData.specularMap) : null;

        for(const child of model.children) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.map = texture;
            child.material.normalMap = normalMap;
            child.material.specularMap = specularMap;
        }
        
        return model;
    } catch (error) {
        console.error(error);
    }
};

/**
 * 
 * @param {String} modelUrl - Path to the model to load
 * @returns 
 */
export async function loadFBX(modelUrl) {
    try {
        const onProgress = xhr => console.log(`${xhr.loaded / xhr.total * 100}% loaded`);
        const model = await new FBXLoader().loadAsync(modelUrl, onProgress);
        return model;
    } catch (error) {
        console.error(error);
    }
};