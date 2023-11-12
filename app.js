"use strict";


let puzzle = new Alcazar_Puzzle();

let is_drawing = false;
let curr_cell = null;
let curr_flows = [];

let puzzle_type = "";
let puzzle_num = 0;
let puzzle_label = 0;

let canvas = null;
let ctx = null;
let cell_w = 0;
let cell_h = 0;
let grid_w = 0;
let grid_h = 0;

const sounds = new Sounds()
const theme = THEMES[0]

init();


function init() {

	// setup game
	document.getElementById("game-reset-button").addEventListener("click", game_reset_onclick);
	document.getElementById("game-back-button").addEventListener("click", game_back_onclick);

	document.getElementById("you-win-next-button").addEventListener("click", you_win_next_onclick);
	document.getElementById("you-win-back-button").addEventListener("click", game_back_onclick);

	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");

	canvas.addEventListener("pointerdown", canvas_onpointerdown);
	canvas.addEventListener("pointerup", canvas_onpointerup);
	canvas.addEventListener("pointermove", canvas_onpointermove);

	const obs = new ResizeObserver(entries => {
		if(entries[0].contentRect.width !== 0 && entries[0].contentRect.height !== 0) {
			const width = entries[0].contentRect.width;
			const height = entries[0].contentRect.height;
			update_size(width, height);
			// canvas.style.width = `${grid_w}px`
			// canvas.style.height = `${grid_h}px`
		}
	});
	obs.observe(document.getElementById("canvas-container"));

	// init puzzle list
	let container = document.getElementById("puzzle-list");
	let i=0;
	for(let puzzle_type of PUZZLES) {
		let j=0;
		for(let puzzle of puzzle_type.puzzles) {
			const d = document.createElement("li");
			d.dataset.puzzle_type = puzzle_type.type;
			d.dataset.puzzle_num = j;
			d.dataset.puzzle_label = i+1;
			d.addEventListener("click", puzzle_item_onclick);

			const v = document.createElement("div");
			v.innerHTML = i+1;
			d.appendChild(v)

			container.append(d);
			i++
			j++
		}
	}

	// add list item to be a multiple of 5
	let c = 5 - i % 5;
	for(let i=0; i<c; i++) {
		const d = document.createElement("li");
		d.classList.add("v-hidden");
		container.append(d);
	}

	for(let i=0; i<9; i++) {
		sounds.load(`sounds/blip-${i}.wav`)
	}
}


function update_size(width, height) {

	cell_w = Math.floor(width / puzzle.cols);
	cell_h = Math.floor(height / puzzle.rows);

	if(cell_w > cell_h) {
		cell_w = cell_h;
	}
	else {
		cell_h = cell_w;
	}

	grid_w = cell_w * puzzle.cols;
	grid_h = cell_h * puzzle.rows;

	canvas.width = grid_w;
	canvas.height = grid_h;

	window.requestAnimationFrame(draw);
}


function init_game(puzzle_type, puzzle_num) {

	// find category/type
	let puzzles = null
	for(const t of PUZZLES) {
		if(t.type === puzzle_type) {
			puzzles = t.puzzles
			break
		}
	}

	is_drawing = false;
	curr_cell = null;
	curr_flows = [];

	puzzle.load(puzzles[puzzle_num]);
	update_size(canvas.width, canvas.height);
}


function draw() {

	const cell_half_w = Math.floor(cell_w / 2);
	const cell_half_h = Math.floor(cell_h / 2);
	const path_width = Math.round(cell_w * theme.path_ratio) + Math.round(cell_w * theme.path_ratio) % 2;

	const line_half_width = theme.line_width / 2;
	const PI2 = 2 * Math.PI;

	ctx.fillStyle = theme.background_color;
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// draw grid
	ctx.strokeStyle = theme.line_color;
	ctx.lineWidth = theme.line_width;
	ctx.lineCap = "square";
	ctx.lineJoin = "miter";

	ctx.strokeRect(0, 0, grid_w, grid_h);
	ctx.beginPath();
	ctx.rect(line_half_width, line_half_width, grid_w - theme.line_width, grid_h - theme.line_width);

	// horizontal
	for(let y=1; y<puzzle.rows; y++) {
		ctx.moveTo(line_half_width				, y * cell_h);
		ctx.lineTo(grid_w - theme.line_width	, y * cell_h);
	}

	// vertical
	for(let x=1; x<puzzle.cols; x++) {
		ctx.moveTo(x * cell_w, line_half_width);
		ctx.lineTo(x * cell_w, grid_h - theme.line_width);
	}
	ctx.stroke();

	// draw walls and exits
	ctx.fillStyle = theme.wall_color;
	ctx.lineWidth = theme.line_width;
	ctx.lineCap = "square";
	ctx.lineJoin = "square";

	{
		let cell_index = 0;
		const cell_count = puzzle.grid.length;
		while(cell_index < cell_count) {
	
			let cell = puzzle.grid[cell_index];
			let side_index = 0;
			const side_count = cell.sides.length;
			while(side_index < side_count) {

				const side = cell.sides[side_index]
				if(side_index === DIR.N) {

					if(side === TYP.wall && cell.y === 0) {
						// outside wall
						ctx.beginPath();
						ctx.moveTo(cell.x * cell_w,				cell.y * cell_h);
						ctx.lineTo(cell.x * cell_w + cell_w,	cell.y * cell_h);
						ctx.lineTo(cell.x * cell_w + cell_w,	cell.y * cell_h + cell_h * theme.wall_thickness / 2);
						ctx.lineTo(cell.x * cell_w,				cell.y * cell_h + cell_h * theme.wall_thickness / 2);
						ctx.stroke();
					}
					else if(side === TYP.wall) {
						// inside wall
						ctx.beginPath();
						ctx.moveTo(cell.x * cell_w,				cell.y * cell_h - cell_h * theme.wall_thickness / 2);
						ctx.lineTo(cell.x * cell_w + cell_w,	cell.y * cell_h - cell_h * theme.wall_thickness / 2);
						ctx.lineTo(cell.x * cell_w + cell_w,	cell.y * cell_h + cell_h * theme.wall_thickness / 2);
						ctx.lineTo(cell.x * cell_w,				cell.y * cell_h + cell_h * theme.wall_thickness / 2);
						ctx.stroke();
					}
					else if(side === TYP.exit) {
						// exit
						const length = cell_w * (1 - theme.exit_gap) / 2
						ctx.beginPath();
						ctx.moveTo(cell.x * cell_w,					cell.y * cell_h - cell_h * theme.wall_thickness / 2);
						ctx.lineTo(cell.x * cell_w + length,		cell.y * cell_h - cell_h * theme.wall_thickness / 2);
						ctx.lineTo(cell.x * cell_w + length * 0.8,	cell.y * cell_h + cell_h * theme.wall_thickness / 2);
						ctx.lineTo(cell.x * cell_w,					cell.y * cell_h + cell_h * theme.wall_thickness / 2);
						ctx.lineTo(cell.x * cell_w,					cell.y * cell_h - cell_h * theme.wall_thickness / 2);
						ctx.stroke();
						ctx.beginPath();
						ctx.moveTo(cell.x * cell_w + cell_w - length,		cell.y * cell_h - cell_h * theme.wall_thickness / 2);
						ctx.lineTo(cell.x * cell_w + cell_w,				cell.y * cell_h - cell_h * theme.wall_thickness / 2);
						ctx.lineTo(cell.x * cell_w + cell_w,				cell.y * cell_h + cell_h * theme.wall_thickness / 2);
						ctx.lineTo(cell.x * cell_w + cell_w - length * 0.8,	cell.y * cell_h + cell_h * theme.wall_thickness / 2);
						ctx.lineTo(cell.x * cell_w + cell_w - length,		cell.y * cell_h - cell_h * theme.wall_thickness / 2);
						ctx.stroke();
					}
				}
				else if(side_index === DIR.W) {
					// x0 = cell.x * cell_w
					// y0 = cell.y * cell_h
					// x1 = cell.x * cell_w + cell_w * theme.wall_thickness
					// y1 = cell.y * cell_h + cell_h
				}
				else if(side_index === DIR.S) {
					if(side === TYP.wall && cell.y === puzzle.rows-1) {
						// outside wall
						ctx.beginPath();
						ctx.moveTo(cell.x * cell_w,				(cell.y + 1) * cell_h);
						ctx.lineTo(cell.x * cell_w + cell_w,	(cell.y + 1) * cell_h);
						ctx.lineTo(cell.x * cell_w + cell_w,	(cell.y + 1) * cell_h + cell_h * theme.wall_thickness / 2);
						ctx.lineTo(cell.x * cell_w,				(cell.y + 1) * cell_h + cell_h * theme.wall_thickness / 2);
						ctx.stroke();
					}
					else if(side === TYP.wall) {
						// inside wall
						ctx.beginPath();
						ctx.moveTo(cell.x * cell_w,				(cell.y + 1) * cell_h - cell_h * theme.wall_thickness / 2);
						ctx.lineTo(cell.x * cell_w + cell_w,	(cell.y + 1) * cell_h - cell_h * theme.wall_thickness / 2);
						ctx.lineTo(cell.x * cell_w + cell_w,	(cell.y + 1) * cell_h + cell_h * theme.wall_thickness / 2);
						ctx.lineTo(cell.x * cell_w,				(cell.y + 1) * cell_h + cell_h * theme.wall_thickness / 2);
						ctx.stroke();
					}
					else if(side === TYP.exit) {
						// exit
					}
				}
				else if(side_index === DIR.E) {
					// x0 = cell.x * cell_w
					// y0 = cell.y * cell_h
					// x1 = cell.x * cell_w + cell_w * theme.wall_thickness
					// y1 = cell.y * cell_h + cell_h
				}

				// if(side === TYP.wall) {
				// 	ctx.fillRect(x0, y0, x1-x0, y1-y0)
				// }
				// else if(side === TYP.exit) {
				// 	ctx.beginPath();
				// 	ctx.moveTo(line_half_width				, y * cell_h);
				// 	ctx.lineTo(grid_w - theme.line_width	, y * cell_h);

				// 	ctx.fillRect(x0, y0, x1-x0, y1-y0)
				// }

				side_index++
			}
			cell_index++
		}
	}


	// draw dots and paths
	ctx.lineWidth = path_width;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";

	let cell_index = 0;
	const cell_count = puzzle.grid.length;
	while(cell_index < cell_count) {

		let cell = puzzle.grid[cell_index];

		if(cell.is_dot === true) {
			ctx.beginPath();
			ctx.fillStyle = theme.colors[cell.color_index];
			if(theme.shape === "square") {
				ctx.fillRect(cell.x * cell_w + cell_half_w - dot_radius, cell.y * cell_h + cell_half_h - dot_radius, dot_radius * 2, dot_radius * 2);
			
			}
			else if(theme.shape === "star") {
				draw_star(cell.x * cell_w + cell_half_w, cell.y * cell_h + cell_half_h, dot_radius, dot_radius * 0.4, theme.star_points)
				ctx.fill();
			}
			else {
				ctx.ellipse(cell.x * cell_w + cell_half_w, cell.y * cell_h + cell_half_h, dot_radius, dot_radius, 0, 0, PI2);
				ctx.fill();
			}

			if(cell.exit !== DIR.none) {
				ctx.strokeStyle = theme.colors[cell.color_index];
				ctx.beginPath();
				const cx = cell.x * cell_w + cell_half_w;
				const cy = cell.y * cell_h + cell_half_h;
				ctx.moveTo(cx, cy);
				cell = puzzle.next_cell(cell);
				while(cell !== null) {
					const cx = cell.x * cell_w + cell_half_w;
					const cy = cell.y * cell_h + cell_half_h;
					ctx.lineTo(cx, cy);
					cell = puzzle.next_cell(cell);
				}
				ctx.stroke();
			}
		}
		cell_index++;
	}

	const cover = puzzle.get_coverage()
	const percent = Math.round(cover * 100)
	document.querySelector('#game .status-bar :nth-child(1)').innerHTML = `Flows: ${curr_flows.length}`
	document.querySelector('#game .status-bar :nth-child(2)').innerHTML = `Coverage: ${percent}%`
}


function canvas_onpointerdown(evt) {

	canvas.setPointerCapture(evt.pointerId);

	const b = canvas.getBoundingClientRect();
	const pointer_x = evt.clientX - b.left;
	const pointer_y = evt.clientY - b.top;

	const x = Math.floor(pointer_x / cell_w);
	const y = Math.floor(pointer_y / cell_h);
	
	if(pointer_x < 0 || pointer_x >= grid_w) return;
	if(pointer_y < 0 || pointer_y >= grid_h) return;
	
	const i = y * puzzle.cols + x;
	curr_cell = null;

	// if starting from dot
	if(puzzle.grid[i].color_index !== -1 && puzzle.grid[i].is_dot === true) {
		curr_cell = puzzle.grid[i];
		is_drawing = true;
	}
	// if continuing existing path
	else if(puzzle.grid[i].color_index !== -1 && puzzle.grid[i].is_dot === false && puzzle.grid[i].exit === DIR.none) {
		curr_cell = puzzle.grid[i];
		is_drawing = true;
	}

	// if click on a dot remove all previous connections to that point
	if(curr_cell !== null && curr_cell.is_dot === true && (curr_cell.exit !== DIR.none || curr_cell.entry !== DIR.none)) {

		window.requestAnimationFrame(draw);

		let which_way = "exit";
		if(curr_cell.exit === DIR.none) {
			which_way = "entry";
		}

		let search_cell = puzzle.next_cell(curr_cell, which_way);
		curr_cell.entry = DIR.none;
		curr_cell.exit = DIR.none;

		while(search_cell !== null) {
			if(search_cell.is_dot === false) {
				search_cell.color_index = -1;
			}
			let c = puzzle.next_cell(search_cell, which_way);
			search_cell.entry = DIR.none;
			search_cell.exit = DIR.none;
			search_cell = c;
		}
	}
}


function canvas_onpointerup(evt) {

	const new_flows = puzzle.get_flows()
	if(new_flows.length > curr_flows.length) {
		sounds.play(`blip-${new_flows.length-1}.wav`, 1);
	}
	curr_flows = new_flows;
	window.requestAnimationFrame(draw)

	if(puzzle.is_completed() === true)  {
		document.getElementById("you-win").style.display = "flex";
	}
	is_drawing = false;
}


function canvas_onpointermove(evt) {

	if(is_drawing === false) return false;
	
	const b = canvas.getBoundingClientRect();
	let pointer_x = evt.clientX - b.left;
	let pointer_y = evt.clientY - b.top;

	const x = Math.floor(pointer_x / cell_w);
	const y = Math.floor(pointer_y / cell_h);

	if(pointer_x < 0 || pointer_x >= grid_w) return;
	if(pointer_y < 0 || pointer_y >= grid_h) return;

	if(curr_cell.x !== x || curr_cell.y !== y) {

		const i = y * puzzle.cols + x;
		let new_cell = puzzle.grid[i];

		// does not allow to connect one color path with another color dot
		if(new_cell.is_dot === true && new_cell.color_index !== curr_cell.color_index) {
			console.log("Wrong color!");
			is_drawing = false;
			return;
		}

		// backtracking on the same path
		if(new_cell.color_index === curr_cell.color_index && (
			(new_cell.exit === DIR.N && curr_cell.entry === DIR.S) ||
			(new_cell.exit === DIR.S && curr_cell.entry === DIR.N) ||
			(new_cell.exit === DIR.E && curr_cell.entry === DIR.W) ||
			(new_cell.exit === DIR.W && curr_cell.entry === DIR.E)
		)) {
			console.log("Back tracking");
			if(curr_cell.is_dot === false) {
				curr_cell.color_index = -1;
			}
			curr_cell.entry = DIR.none;
			new_cell.exit = DIR.none;
			curr_cell = new_cell;
			window.requestAnimationFrame(draw);
			return;
		}

		// if same color and not backtracking, does not allow to connect to a cell which already has both (an entry and exit) or (is a dot and exit)
		if(new_cell.color_index === curr_cell.color_index) {
			if( (new_cell.entry !== DIR.none && new_cell.exit !== DIR.none) || (new_cell.is_dot === true && new_cell.exit !== DIR.none) ) {
				console.log("Trying to loop!");
				is_drawing = false;
				return;
			}
		}

		// over writting another path
		if(new_cell.is_dot === false && new_cell.color_index !== -1 && new_cell.color_index !== curr_cell.color_index) {

			console.log("overwrite");
			// cut out rest of path if not connectd to a dot
			// doing this one way one should work because the direction always goes from dot > entry > exit
			// if we get to a dot we'll fix the direction further down
			let fix_direction = true;
			let cells = [];
			let n_cell = puzzle.next_cell(new_cell);
			while(n_cell !== null && n_cell.is_dot === false) {
				cells.push(n_cell);
				n_cell = puzzle.next_cell(n_cell);
			}

			if(n_cell === null) {
				fix_direction = false;
				for(let cell of cells) {
					cell.color_index = -1;
					cell.entry = DIR.none;
					cell.exit = DIR.none;
				}
			}

			// fix direction from dots to end otherwise backtracking will break
			if(fix_direction === true) {

				let t = new_cell.exit;
				new_cell.exit = new_cell.entry;
				new_cell.entry = t;

				// swap entry / exit for the rest of the chain
				n_cell = puzzle.next_cell(new_cell, "entry");
				while(n_cell !== null) {
					let t = n_cell.exit;
					n_cell.exit = n_cell.entry;
					n_cell.entry = t;
					n_cell = puzzle.next_cell(n_cell, "entry");
				}
			}

			let c = puzzle.next_cell(new_cell, "entry");
			if(c !== null && c.color_index === new_cell.color_index) {
				c.exit = DIR.none;
				new_cell.entry = DIR.none;
			}

			c = puzzle.next_cell(new_cell);
			if(c !== null && c.color_index === new_cell.color_index) {
				c.exit = DIR.none;
				new_cell.exit = DIR.none;
			}
		}

		// joining 2 paths
		if(new_cell.is_dot === false && new_cell.color_index === curr_cell.color_index) {

			console.log("joining");
			if(new_cell.entry !== DIR.none) {
				let t = new_cell.exit;
				new_cell.exit = new_cell.entry;
				new_cell.entry = t;

				// swap entry / exit for the rest of the chain
				let n_cell = puzzle.next_cell(new_cell);
				while(n_cell !== null) {
					let t = n_cell.exit;
					n_cell.exit = n_cell.entry;
					n_cell.entry = t;
					n_cell = puzzle.next_cell(n_cell);
				}
			}
		}

		// normal path
		// north
		if(x === curr_cell.x && y === curr_cell.y - 1) {
			curr_cell.exit = DIR.N;
			new_cell.entry = DIR.S;
		}
		// south
		else if(x === curr_cell.x && y === curr_cell.y + 1) {
			curr_cell.exit = DIR.S;
			new_cell.entry = DIR.N;
		}
		// west
		else if(x === curr_cell.x - 1 && y === curr_cell.y) {
			curr_cell.exit = DIR.W;
			new_cell.entry = DIR.E;
		}
		// east
		else if(x === curr_cell.x + 1 && y === curr_cell.y) {
			curr_cell.exit = DIR.E;
			new_cell.entry = DIR.W;
		}

		new_cell.color_index = curr_cell.color_index;
		curr_cell = new_cell;

		if(new_cell.is_dot === true && new_cell.color_index === curr_cell.color_index) {
			is_drawing = false;
		}

		window.requestAnimationFrame(draw);
	}
}


function game_reset_onclick() {

	const youwin = document.getElementById("you-win");
	youwin.style.display = "none";

	puzzle.clear();

	is_drawing = false;
	curr_cell = null;
	curr_flows = [];

	window.requestAnimationFrame(draw);
}


function puzzle_item_onclick(evt) {

	sounds.play("blip-3.wav", 1)

	const puzzles = document.getElementById("main");
	puzzles.style.display = "none";

	const game = document.getElementById("game");
	game.style.display = "flex";

	puzzle_type = evt.currentTarget.dataset.puzzle_type
	puzzle_num = parseInt(evt.currentTarget.dataset.puzzle_num)
	puzzle_label = parseInt(evt.currentTarget.dataset.puzzle_label)
	const title = document.querySelector("#game .title-bar > h1")
	title.innerHTML = `Puzzle #${puzzle_label}`

	init_game(puzzle_type, puzzle_num);
}


function game_back_onclick(evt) {

	document.getElementById("you-win").style.display = "none"
	const game = document.getElementById("game");
	game.style.display = "none";

	const puzzles = document.getElementById("main");
	puzzles.style.display = "flex";
}


function you_win_next_onclick(evt) {

	// find next puzzle
	for(const t of PUZZLES) {
		if(t.type === puzzle_type) {
			if(puzzle_num + 1 < t.puzzles.length) {
				puzzle_num++
				break
			}
			else {
				puzzle_num = 0
				continue
			}
		}

		if(puzzle_num === 0) {
			puzzle_type = t.type
			break
		}
	}

	puzzle_label++

	document.getElementById("you-win").style.display = "none"

	const title = document.querySelector("#game .title-bar > h1")
	title.innerHTML = `Puzzle #${puzzle_label}`

	init_game(puzzle_type, puzzle_num)
}
