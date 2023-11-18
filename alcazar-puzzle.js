"use strict";

const DIR = {
	none: 0,
	N: 1,
	W: 2,
	S: 4,
	E: 8,
}

const TYP = {
	none: 0,
	wall_internal: 1,
	wall_external: 2,
	exit: 4,
}


class Alcazar_Puzzle {

	constructor() {

		this.rows = 0;
		this.cols = 0;
		this.grid = [];
		this.paths = [];

		this.init(this.cols, this.rows);
	}

	init(cols, rows) {

		this.cols = cols;
		this.rows = rows;

		// init grid
		this.grid = [];
	}

	load(config) {

		this.init(config.cols, config.rows);

		// allocate grid
		// sparse grid
		if(Array.isArray(config.grid) == true) {
			for(let i=0; i<config.grid.length; i++) {
				if(config.grid[i] === 1) {
					const x = i % config.cols
					const y = Math.floor(i / config.rows)
					const cell = new Cell(x, y)
					this.grid.push(cell);
				}
				else {
					const cell = null
					this.grid.push(cell);
				}
			}
			// place walls
			for(let y=0; y<this.rows; y++) {
				for(let x=0; x<this.cols; x++) {
					const index = y * this.cols + x
					const indexm1 = y * this.cols + x - 1
					if( x === 0 || (x > 0 && this.grid[indexm1] === null && this.grid[index] !== null) ) {
						this.grid[index].sides[DIR.W] = TYP.wall_external
					}
					const cell = new Cell(x, y)
					this.grid.push(cell);
				}
			}
		}
		// standard rectangular grid
		else {
			for(let y=0; y<this.rows; y++) {
				for(let x=0; x<this.cols; x++) {
					const cell = new Cell(x, y)
					this.grid.push(cell);
				}
			}
			// north external walls
			for(let x=0; x<this.cols; x++) {
				const index = 0 * this.cols + x
				this.grid[index].sides[DIR.N] = TYP.wall_external
			}
			// south external walls
			for(let x=0; x<this.cols; x++) {
				const index = (this.rows - 1) * this.cols + x
				this.grid[index].sides[DIR.S] = TYP.wall_external
			}
			// west external walls
			for(let y=0; y<this.rows; y++) {
				const index = y * this.cols + 0
				this.grid[index].sides[DIR.W] = TYP.wall_external
			}
			// east external walls
			for(let y=0; y<this.rows; y++) {
				const index = y * this.cols + (this.rows - 1)
				this.grid[index].sides[DIR.E] = TYP.wall_external
			}
		}


		for(let elem of config.elems) {
			const index = elem.y * this.cols + elem.x;
			if(elem.type === "wall") {
				if(elem.facing === "N") {
					this.grid[index].sides[DIR.N] = TYP.wall_internal;
				}
				else if(elem.facing === "W") {
					this.grid[index].sides[DIR.W] = TYP.wall_internal;
				}
				else if(elem.facing === "S") {
					this.grid[index].sides[DIR.S] = TYP.wall_internal;
				}
				else if(elem.facing === "E") {
					this.grid[index].sides[DIR.E] = TYP.wall_internal;
				}
			}
			else if(elem.type === "exit") {
				if(elem.facing === "N") {
					this.grid[index].sides[DIR.N] = TYP.exit;
				}
				else if(elem.facing === "W") {
					this.grid[index].sides[DIR.W] = TYP.exit;
				}
				else if(elem.facing === "S") {
					this.grid[index].sides[DIR.S] = TYP.exit;
				}
				else if(elem.facing === "E") {
					this.grid[index].sides[DIR.E] = TYP.exit;
				}
			}
		}
	}

	clear() {

		for(let cell of this.grid) {
			cell.entry = DIR.none;
			cell.exit = DIR.none;
		}
	}

	next_cell(cell, which_way="exit") {
		// returns next cell in an existing path
		const next_inc = {
			1: { x: +0, y: -1 },	// N
			2: { x: -1, y: +0 },	// W
			4: { x: +0, y: +1 },	// S
			8: { x: +1, y: +0 },	// E
		};

		const dir = cell[which_way];
		if(dir === DIR.none) return null;

		const inc = next_inc[dir];
		const next_cell = this.grid[(cell.y + inc.y) * this.cols + (cell.x + inc.x)];

		return next_cell;
	}

	get_flows() {

		const flows = [];

		for(let cell of this.grid) {

			if(cell.is_dot === true && cell.exit !== DIR.none) {

				let n_cell = this.next_cell(cell, "exit");
				while(n_cell !== null && n_cell.is_dot === false) {
					n_cell = this.next_cell(n_cell, "exit");
				}

				if(n_cell !== null && n_cell.is_dot === true) {
					flows.push(cell);
				}
			}
		}
		return flows;
	}

	get_coverage() {
		let cell_count = 0;
		let cell_cover = 0;
		for(let cell of this.grid) {
			cell_count++
			if(cell.color_index !== -1) {
				cell_cover++
			}
		}
		return cell_cover / cell_count
	}

	is_completed() {

		let is_complete = true;
		for(let cell of this.grid) {

			if(cell.is_dot === true) {

				let which_way = "exit";
				if(cell.exit === DIR.none) {
					which_way = "entry";
				}

				let n_cell = this.next_cell(cell, which_way);
				while(n_cell !== null && n_cell.is_dot === false) {
					n_cell = this.next_cell(n_cell, which_way);
				}

				if(n_cell === null) {
					is_complete = false;
					break;
				}
			}
		}
		return is_complete;
	}
};

class Cell {

	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.entry = 0;
		this.exit = 0;
		this.type = 0;
		this.color_index = -1;
		this.sides = [TYP.none, TYP.none, TYP.none, TYP.none, TYP.none];
	}
	
	get is_dot() { return this.type === TYP.dot }
};