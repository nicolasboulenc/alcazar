"use strict";

const puzzle = new Editor_Puzzle();

let canvas = null;
let ctx = null;
let offset_x = 0;
let offset_y = 0;
let cell_w = 0;
let cell_h = 0;
let grid_w = 0;
let grid_h = 0;

let curr_color_index = -1;
let curr_mode = ""

// const theme
const theme = {
	body_color: "darkslategray",
	grid_color: "black",
	line_color: "darkgray",
	line_width: 3,
	outside_gap: 20,
	colors: [ "#0c2afe", "#008d00", "#e9e000", "#fa8900", "#fe0000", "#00ffff", "#ff0ac9", "#81007f", "#a52b2a" ]
}

const line_half_width = Math.floor(theme.line_width / 2)
const dot_cell_ratio = 0.7
const dot_end_angle = 2 * Math.PI

init();


function init() {

	document.getElementById("width_input").onchange = update_size;
	document.getElementById("height_input").onchange = update_size;
	document.getElementById("reset_button").onclick = puzzle_reset;
	document.getElementById("export_button").onclick = puzzle_export;

	const dim_elems = document.querySelectorAll("[data-dim]")
	for(let elem of dim_elems) {
		elem.addEventListener("click", dim_onclick)
	}

	const elems = document.querySelectorAll("[data-mode]")
	for(let elem of elems) {
		elem.addEventListener("click", mode_onclick)
	}

	const color_buttons = document.getElementById("color_buttons");
	let color_index = 0;
	for(let color of theme.colors) {
		const button = document.createElement("button");
		button.onclick = color_on_click;
		button.className = "color_button";
		button.style.backgroundColor = color;
		button.dataset.color_index = color_index++;
		color_buttons.append(button);
	}

	canvas = document.getElementById("display_canvas");
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientWidth;

	canvas.addEventListener("mouseup", mouse_up)
	canvas.addEventListener("mousemove", mouse_move)

	ctx = canvas.getContext("2d");
	ctx.lineCap = "round";
	ctx.lineJoin = "round";

	update_size();
}


function update_size(evt) {

	const cols = parseInt(document.getElementById("width_input").value);
	const rows = parseInt(document.getElementById("height_input").value);

	puzzle.init(cols, rows);

	cell_w = Math.floor((canvas.width - theme.outside_gap * 2) / puzzle.cols);
	cell_h = Math.floor((canvas.height - theme.outside_gap * 2) / puzzle.rows);

	offset_x = 0;
	offset_y = 0;

	if(cell_w > cell_h) {
		cell_w = cell_h;
	}
	else {
		cell_h = cell_w;
	}
	offset_x = Math.floor((canvas.width - cell_w * puzzle.cols) / 2);
	offset_y = Math.floor((canvas.height - cell_h * puzzle.rows) / 2);

	grid_w = cell_w * puzzle.cols;
	grid_h = cell_h * puzzle.rows;

	window.requestAnimationFrame(draw);
}


function draw() {

	const transform = ctx.getTransform();

	ctx.fillStyle = theme.body_color;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.translate(offset_x, offset_y);

	// draw grid background
	ctx.fillStyle = theme.grid_color;
	ctx.fillRect(0, 0, grid_w, grid_h);

	// fill empty cells
	ctx.fillStyle = theme.body_color;
	for(let i=0; i<puzzle.shape.length; i++) {
		if(puzzle.shape[i] === 0) {
			const x = (i % puzzle.cols) * cell_w
			const y = Math.floor(i / puzzle.cols) * cell_h
			ctx.fillRect(x, y, cell_w, cell_h)
		}
	}


	// draw grid
	ctx.fillStyle = theme.grid_color;
	ctx.strokeStyle = theme.line_color;
	ctx.lineWidth = theme.line_width;
	ctx.lineCap = "square";
	ctx.lineJoin = "miter";

	// ctx.fillRect(0, 0, grid_w, grid_h);
	ctx.beginPath();
	ctx.rect( line_half_width, line_half_width, grid_w - theme.line_width, grid_h - theme.line_width );

	// horizontal
	for(let y=1; y<puzzle.rows; y++) {
		ctx.moveTo(line_half_width		, y * cell_h);
		ctx.lineTo(grid_w - theme.line_width	, y * cell_h);
	}

	// vertical
	for(let x=1; x<puzzle.cols; x++) {
		ctx.moveTo(x * cell_w, line_half_width);
		ctx.lineTo(x * cell_w, grid_h - theme.line_width);
	}
	ctx.stroke();

	// draw dots and paths


	const dot_radius = cell_w * dot_cell_ratio / 2;
	ctx.lineWidth = 70;

	let cell_index = 0;
	let cell_count = puzzle.grid.length;

	const cell_half_w = Math.floor(cell_w / 2);
	const cell_half_h = Math.floor(cell_h / 2);

	while(cell_index < cell_count) {

		const cell = puzzle.grid[cell_index];
		if(cell !== null && cell.type === "dot") {
			ctx.beginPath();
			ctx.ellipse(cell.x * cell_w + cell_half_w, cell.y * cell_h + cell_half_h, dot_radius, dot_radius, 0, 0, dot_end_angle);
			ctx.fillStyle = theme.colors[cell.color_index];
			ctx.fill();
		}
		cell_index++;
	}

	ctx.setTransform(transform);
}


function puzzle_reset() {

	const cols = parseInt(document.getElementById("width_input").value);
	const rows = parseInt(document.getElementById("height_input").value);

	puzzle.init(cols, rows);
	window.requestAnimationFrame(draw);
}


function puzzle_export() {

	const config = {
		rows: puzzle.rows,
		cols: puzzle.cols,
		elems: []
	}

	let cell_index = 0;
	let cell_count = puzzle.grid.length;

	while(cell_index < cell_count) {

		const cell = puzzle.grid[cell_index];
		if(cell.type !== "") {
			config.elems.push({"x": cell.x, "y": cell.y, "type": cell.type, "color_index": cell.color_index});
		}
		cell_index++;
	}

	console.log(JSON.stringify(config));
	return config;
}


function mouse_move(evt) {

	const dist = 10
	const b = canvas.getBoundingClientRect()
	const mouse_x = evt.clientX - b.left - offset_x
	const mouse_y = evt.clientY - b.top - offset_y

	if(curr_mode === "wall") {
		if( mouse_x % cell_w < dist || 
			cell_w - (mouse_x % cell_w) < dist || 
			mouse_y % cell_h < dist || 
			cell_h - (mouse_y % cell_h) < dist ) {
				console.log("close")
		}
	}
}


function mouse_up(evt) {

	const b = canvas.getBoundingClientRect()
	const mouse_x = evt.clientX - b.left - offset_x
	const mouse_y = evt.clientY - b.top - offset_y

	const x = Math.floor(mouse_x / cell_w)
	const y = Math.floor(mouse_y / cell_h)
	const i = y * puzzle.cols + x

	const curr_cell = puzzle.grid[i]

	if(curr_mode === "dot" && curr_cell !== null) {
		if(curr_cell.type !== "") {
			curr_cell.type = ""
			curr_cell.color_index = -1
		}
		else {
			curr_cell.type = curr_mode
			curr_cell.color_index = curr_color_index
		}
	}
	else if(curr_mode === "stamp") {
		if(puzzle.shape[i] === 1) {
			// erase
			puzzle.shape[i] = 0
			puzzle.grid[i] = null
		}
		else {
			// add
			puzzle.shape[i] = 1
			puzzle.grid[i] = new Editor_Cell(x, y)

		}
	}
	else if(curr_mode === "wall") {
		const dist = 10
			
		if(mouse_x % cell_w < dist) {
			if(x % puzzle.cols !== 0) {
				const idx = y * puzzle.cols + (x - 1)
				if(puzzle.shape[i] === 1) {
					const wall = { "x": x, "y": y, "type": "wall", "facing": "W" }
					puzzle.elems.push(wall)
				}
				else {
					console.error("No adjacent cell!")
				}
			}
			else {
				console.error("Cannot place wall on edge!")
			}
		}
		else if(cell_w - (mouse_x % cell_w) < dist) {
			const wall = { "x": x, "y": y, "type": "wall", "facing": "E" }
			puzzle.elems.push(wall)
		}
		else if(mouse_y % cell_h < dist) {
			const wall = { "x": x, "y": y, "type": "wall", "facing": "S" }
			puzzle.elems.push(wall)
		}
		else if(cell_h - (mouse_y % cell_h) < dist) {
			const wall = { "x": x, "y": y, "type": "wall", "facing": "N" }
			puzzle.elems.push(wall)
		}
	}


	window.requestAnimationFrame(draw);
}


function color_on_click(evt) {
	curr_color_index = evt.currentTarget.dataset.color_index;
}


function dim_onclick(evt) {
	const op = evt.currentTarget.dataset["dim"]
	if(op === "width-dec") {
		const input = document.getElementById("width_input")
		input.value = parseInt(input.value) - 1
	}
	else if(op === "width-inc") {
		const input = document.getElementById("width_input")
		input.value = parseInt(input.value) + 1
	}
	else if(op === "height-dec") {
		const input = document.getElementById("height_input")
		input.value = parseInt(input.value) - 1
	}
	else if(op === "height-inc") {
		const input = document.getElementById("height_input")
		input.value = parseInt(input.value) + 1
	}

	update_size()
}

function mode_onclick(evt) {
	curr_mode = evt.currentTarget.dataset["mode"]
	document.getElementById("mode_label").innerHTML = curr_mode
}
