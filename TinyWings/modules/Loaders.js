/**
 * Loaders module that helps with loading .obj and .fbx models.
 * 
 * @module Loaders
 * @file Loaders module for Cuchi Tales
 * @author Ana Paola Minchaca Garcia
 * @author Karen Isabel Morgado
 */

"use strict";

import { Group, TextureLoader } from '../../libs/three.js/three.module.js'
import { OBJLoader } from '../../libs/three.js/loaders/OBJLoader.js';
import { FBXLoader } from '../../libs/three.js/loaders/FBXLoader.js';

/**
 * Loads .obj model asynchronously and sets up its texture, normal, and 
 * specular maps. Also sets up its shadows.
 * @async
 * @param {{obj: String, map: String, normalMap: String, 
 * specularMap: String}} modelData - Object which holds urls for loading the model
 * @returns {Group} Model that was loaded.
 */
export async function loadObj(modelData) {
    try {
        const model = await new OBJLoader().loadAsync(modelData.obj);

        const texture = modelData.map ? new TextureLoader().load(modelData.map) : null;
        const normalMap = modelData.normalMap ? new TextureLoader().load(modelData.normalMap) : null;
        const specularMap = modelData.specularMap ? new TextureLoader().load(modelData.specularMap) : null;

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
 * Loads .fbx model asynchronously.
 * @param {String} modelUrl - Path to the model to load
 * @returns {Group} Loaded .fbx model.
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