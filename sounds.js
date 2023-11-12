'use strict';

class Sounds {

	constructor() {
		this._volume = 100;
		this._sounds = [];
		this._context = new AudioContext();
		document.addEventListener("pointerdown", this._on_user_interact.bind(this));
	}

	async load(url) {
		const sound = new Sound();
		this._sounds.push(sound);
		await sound.load(url);
		if(this._context.state === "running") {
			console.log("decoding audio data.")
			sound._buffer = await this._context.decodeAudioData(sound._data);
		}
		return sound;
	}

	play(sound_id) {
		let sound = this._sounds.find(s => s._url === sound_id);
		if(typeof sound !== "undefined") {
			const source = this._context.createBufferSource();
			source.buffer = sound._buffer;
			source.connect(this._context.destination);
			source.start(0, 0);
		}
	}

	async _on_user_interact() {
		if(this._context.state === "suspended") {
			await this._context.resume();
		}
		// decode all data
		for(let sound of this._sounds) {
			if(sound._buffer === null) {
				// console.log(`decoding ${sound._url}`);
				sound._buffer = await this._context.decodeAudioData(sound._data);
			}
		}
	}
};


class Sound {

	constructor() {
		this._url = "";
		this._is_loaded = false;
		this._data = null;
		this._buffer = null;
	}

	async load(url) {

		this._url = url;
		const response = await fetch(url);
		// async/await, anything could happen between these 2 lines !!!!
		// equiv to return promise
		this._data = await response.arrayBuffer();
		// async/await, anything could happen between these 2 lines !!!!
		// equiv to return promise
		this._is_loaded = true;
	}
};
