/**
 * Audio Manager class which helps with handling audio 
 * in game.
 * 
 * @module AudioManager
 * @file Audio manager module for Cuchi Tales
 * @author Emilio Popovits Blake
 * @author Ana Paola Minchaca Garcia
 * @author Karen Isabel Morgado
 */

"use strict";

/**
 * Audio Manager class which helps with handling audio 
 * in game.
 * @class
 */
export default class AudioManager {
    /**
     * Background music audio object.
     * @private
     * @type {HTMLAudioElement}
     */
    #backgroundMusic;
    /**
     * Object collection sound effect audio object.
     * @private
     * @type {HTMLAudioElement}
     */
    #collect;
    /**
     * Object impact sound effect audio object.
     * @private
     * @type {HTMLAudioElement}
     */
    #impact;
    /**
     * Game Over sound effect audio object.
     * @private
     * @type {HTMLAudioElement}
     */
    #gameOver;

    /**
     * Constructs an Audio Manager object.
     * @param {String} backgroundMusic - Path to background music
     * @param {String} collect - Path to object collection sound effect
     * @param {String} impact - Path to object impact sound effect
     * @param {String} gameOver - Path to game over sound effect
     */
    constructor (backgroundMusic, collect, impact, gameOver) {
        // Initialize audio manager's audio properties
        this.#backgroundMusic = new Audio(backgroundMusic);
        this.#collect = new Audio(collect);
        this.#impact = new Audio(impact);
        this.#gameOver = new Audio(gameOver);

        // Set default audio volumes to use
        this.#backgroundMusic.volume = 0.05;
        this.#collect.volume = 1;
        this.#impact.volume = 1;
        this.#gameOver.volume = 1;
    };

    /**
     * Set the background music volume.
     * @param {Number} volume - New background music volume
     */
    set backgroundVolume(volume) {
        this.#backgroundMusic.volume = volume;
    };

    /**
     * Set the object collection sound effect volume.
     * @param {Number} volume - New object collection sound effect volume
     */
    set collectVolume(volume) {
        this.#collect.volume = volume;
    };

    /**
     * Set the object impact sound effect volume.
     * @param {Number} volume - New object impact sound effect volume
     */
    set impactVolume(volume) {
        this.#impact.volume = volume;
    };

    /**
     * Set the game over sound effect volume.
     * @param {Number} volume - New game over sound effect volume
     */
    set gameOverVolume(volume) {
        this.#gameOver.volume = volume;
    };

    /**
     * Plays selected audio.
     * @param {String} audio - (AudioManager Enum) Audio to play
     */
    play(audio) {
        if (audio === AudioManager.BACKGROUND) return this.#backgroundMusic.play();
        if (audio === AudioManager.COLLECT) return this.#collect.play();
        if (audio === AudioManager.IMPACT) return this.#impact.play();
        if (audio === AudioManager.GAMEOVER) return this.#gameOver.play();
    };

    /**
     * Pauses selected audio.
     * @param {String} audio - (AudioManager Enum) Audio to pause
     */
    pause (audio) {
        if (audio === AudioManager.BACKGROUND) return this.#backgroundMusic.pause();
        if (audio === AudioManager.COLLECT) return this.#collect.pause();
        if (audio === AudioManager.IMPACT) return this.#impact.pause();
        if (audio === AudioManager.GAMEOVER) return this.#gameOver.pause();
    };

    /** Pauses all audio. */
    pauseAll() {
        this.#backgroundMusic.pause();
        this.#collect.pause();
        this.#impact.pause();
        this.#gameOver.pause();
    };
};

// Enums for each audio music or sound effect
AudioManager.BACKGROUND = 'background_music';
AudioManager.COLLECT = 'collect_effect';
AudioManager.IMPACT = 'impact_effect';
AudioManager.GAMEOVER = 'game_over_effect';