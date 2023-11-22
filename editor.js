"use strict";

const puzzle = new Editor_Puzzle();

const theme = THEMES[0]

let curr_color_index = -1;
let cols = 0;
let rows = 0;

let canvas = null;
let ctx = null;
let offset_x = 0;
let offset_y = 0;
let cell_w = 0;
let cell_h = 0;
let grid_w = 0;
let grid_h = 0;

const body_color = "darkslategray";
const grid_color = "black";
const line_color = "darkgray";
const line_width = 3;
const line_half_width = Math.floor(line_width / 2);

const dot_cell_ratio = 0.7;
const dot_end_angle = 2 * Math.PI;
let dot_radius = 0;

setup();

//===============================================================================

function setup() {

	document.getElementById("width_input").onchange = update_size;
	document.getElementById("height_input").onchange = update_size;
	document.getElementById("reset_button").onclick = puzzle_reset;
	document.getElementById("export_button").onclick = puzzle_export;

	canvas = document.getElementById("display_canvas");
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientWidth;

	canvas.onmouseup = mouse_up;

	ctx = canvas.getContext("2d");
	ctx.lineCap = "round";
	ctx.lineJoin = "round";

	update_size();
}

//===============================================================================

function draw() {

	const transform = ctx.getTransform();

	ctx.fillStyle = body_color;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.translate(offset_x, offset_y);

	// draw grid
	ctx.fillStyle = grid_color;
	ctx.strokeStyle = line_color;
	ctx.lineWidth = line_width;
	ctx.lineCap = "square";
	ctx.lineJoin = "miter";

	ctx.fillRect(0, 0, grid_w, grid_h);
	ctx.beginPath();
	ctx.rect( line_half_width, line_half_width, grid_w - line_width, grid_h - line_width );

	// horizontal
	for(let y=1; y<puzzle.rows; y++) {
		ctx.moveTo(line_half_width		, y * cell_h);
		ctx.lineTo(grid_w - line_width	, y * cell_h);
	}

	// vertical
	for(let x=1; x<puzzle.cols; x++) {
		ctx.moveTo(x * cell_w, line_half_width);
		ctx.lineTo(x * cell_w, grid_h - line_width);
	}
	ctx.stroke();

	// draw dots and paths

	ctx.lineWidth = 70;

	let cell_index = 0;
	let cell_count = puzzle.grid.length;

	const cell_half_w = Math.floor(cell_w / 2);
	const cell_half_h = Math.floor(cell_h / 2);

	while(cell_index < cell_count) {

		const cell = puzzle.grid[cell_index];
		if(cell.type === "dot") {
			ctx.beginPath();
			ctx.ellipse(cell.x * cell_w + cell_half_w, cell.y * cell_h + cell_half_h, dot_radius, dot_radius, 0, 0, dot_end_angle);
			ctx.fillStyle = theme.colors[cell.color_index];
			ctx.fill();
		}
		cell_index++;
	}

	ctx.setTransform(transform);
}

//===============================================================================

function mouse_up(evt) {

	const b = canvas.getBoundingClientRect();
	const mouse_x = evt.clientX - b.left;
	const mouse_y = evt.clientY - b.top;

	const x = Math.floor(mouse_x / cell_w);
	const y = Math.floor(mouse_y / cell_h);
	const i = y * puzzle.cols + x;

	const curr_cell = puzzle.grid[i];

	if(curr_cell.type === "dot") {
		curr_cell.type = "";
		curr_cell.color_index = -1;
	}
	else {
		curr_cell.type = "dot";
		curr_cell.color_index = curr_color_index;
	}

	window.requestAnimationFrame(draw);
}

//===============================================================================

function update_size() {

	cols = parseInt(document.getElementById("width_input").value);
	rows = parseInt(document.getElementById("height_input").value);

	puzzle.init(cols, rows);

	cell_w = Math.floor(canvas.width / puzzle.cols);
	cell_h = Math.floor(canvas.height / puzzle.rows);

	offset_x = 0;
	offset_y = 0;

	if(cell_w > cell_h) {
		cell_w = cell_h;
		offset_x = Math.floor((canvas.width - cell_w * puzzle.cols) / 2);
	}
	else {
		cell_h = cell_w;
		offset_y = Math.floor((canvas.height - cell_h * puzzle.rows) / 2);
	}

	grid_w = cell_w * puzzle.cols;
	grid_h = cell_h * puzzle.rows;

	dot_radius = cell_w * dot_cell_ratio / 2;

	window.requestAnimationFrame(draw);
}

//===============================================================================

function puzzle_reset() {
	puzzle.init(cols, rows);
	window.requestAnimationFrame(draw);
}

//===============================================================================

function puzzle_export() {

	const config = {
		rows: rows,
		cols: cols,
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

//===============================================================================

function color_on_click(evt) {
	curr_color_index = evt.currentTarget.dataset.color_index;
}
