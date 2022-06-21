"use strict";

export default class AudioManager {

    #backgroundMusic;
    #collect;
    #impact;
    #gameOver;

    constructor (backgroundMusic, collect, impact, gameOver) {
        this.#backgroundMusic = new Audio(backgroundMusic);
        this.#collect = new Audio(collect);
        this.#impact = new Audio(impact);
        this.#gameOver = new Audio(gameOver);

        this.#backgroundMusic.volume = 0.05;
        this.#collect.volume = 1;
        this.#impact.volume = 1;
        this.#gameOver.volume = 1;
    };

    set backgroundVolume(volume) {
        this.#backgroundMusic.volume = volume;
    };

    set collectVolume(volume) {
        this.#collect.volume = volume;
    };

    set impactVolume(volume) {
        this.#impact.volume = volume;
    };

    set gameOverVolume(volume) {
        this.#gameOver.volume = volume;
    };

    play(audio) {
        if (audio === 'background_music') return this.#backgroundMusic.play();
        if (audio === 'collect_effect') return this.#collect.play();
        if (audio === 'impact_effect') return this.#impact.play();
        if (audio === 'game_over_effect') return this.#gameOver.play();
    };

    pause (audio) {
        if (audio === 'background_music') return this.#backgroundMusic.pause();
        if (audio === 'collect_effect') return this.#collect.pause();
        if (audio === 'impact_effect') return this.#impact.pause();
        if (audio === 'game_over_effect') return this.#gameOver.pause();
    };

    pauseAll() {
        this.#backgroundMusic.pause();
        this.#collect.pause();
        this.#impact.pause();
        this.#gameOver.pause();
    };
};

AudioManager.BACKGROUND = 'background_music';
AudioManager.COLLECT = 'collect_effect';
AudioManager.IMPACT = 'impact_effect';
AudioManager.GAMEOVER = 'game_over_effect';