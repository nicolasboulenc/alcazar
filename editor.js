"use strict";

const puzzle = new Editor_Puzzle()

let canvas = null
let ctx = null
let offset_x = 0
let offset_y = 0
let cell_w = 0
let cell_h = 0
let grid_w = 0
let grid_h = 0

let curr_color_index = -1
let curr_mode = "stamp"

// const theme
const theme = {
	body_background_color: "#888",
	grid_background_color: "#000",
	grid_color: "#666",
	grid_width: 1,
	outwall_color: "#444",
	outwall_width: 20,
	outside_gap: 20,
	colors: [ "#0c2afe", "#008d00", "#e9e000", "#fa8900", "#fe0000", "#00ffff", "#ff0ac9", "#81007f", "#a52b2a" ]
}

const line_half_width = Math.floor(theme.line_width / 2)
const dot_cell_ratio = 0.7
const dot_end_angle = 2 * Math.PI

init()


function init() {

	document.getElementById("width_input").onchange = update_size
	document.getElementById("height_input").onchange = update_size
	document.getElementById("reset_button").onclick = puzzle_reset
	document.getElementById("export_button").onclick = puzzle_export

	const dim_elems = document.querySelectorAll("[data-dim]")
	for(let elem of dim_elems) {
		elem.addEventListener("click", dim_onclick)
	}

	const elems = document.querySelectorAll("[data-mode]")
	for(let elem of elems) {
		elem.addEventListener("click", mode_onclick)
	}

	const color_buttons = document.getElementById("color_buttons")
	let color_index = 0
	for(let color of theme.colors) {
		const button = document.createElement("button")
		button.onclick = color_on_click
		button.className = "color_button"
		button.style.backgroundColor = color
		button.dataset.color_index = color_index++
		color_buttons.append(button)
	}

	canvas = document.getElementById("display_canvas")
	canvas.width = canvas.clientWidth
	canvas.height = canvas.clientWidth

	canvas.addEventListener("mouseup", mouse_up)
	canvas.addEventListener("mousemove", mouse_move)

	ctx = canvas.getContext("2d", { alpha: false })

	update_size()
}


function update_size(evt) {

	const cols = parseInt(document.getElementById("width_input").value)
	const rows = parseInt(document.getElementById("height_input").value)

	puzzle.init(cols, rows)

	cell_w = Math.floor((canvas.width - theme.outside_gap * 2) / puzzle.cols)
	cell_h = Math.floor((canvas.height - theme.outside_gap * 2) / puzzle.rows)

	offset_x = 0
	offset_y = 0

	if(cell_w > cell_h) {
		cell_w = cell_h
	}
	else {
		cell_h = cell_w
	}
	offset_x = Math.floor((canvas.width - cell_w * puzzle.cols) / 2)
	offset_y = Math.floor((canvas.height - cell_h * puzzle.rows) / 2)

	grid_w = cell_w * puzzle.cols
	grid_h = cell_h * puzzle.rows

	window.requestAnimationFrame(draw)
}


function draw() {

	const transform = ctx.getTransform()

	ctx.fillStyle = theme.body_background_color
	ctx.fillRect(0, 0, canvas.width, canvas.height)

	ctx.translate(offset_x, offset_y)

	// draw grid background
	ctx.fillStyle = theme.grid_background_color
	ctx.fillRect(0, 0, grid_w, grid_h)

	// draw empty cells
	ctx.fillStyle = theme.body_background_color
	for(let i=0; i<puzzle.shape.length; i++) {
		if(puzzle.shape[i] === 0) {
			const x = (i % puzzle.cols) * cell_w
			const y = Math.floor(i / puzzle.cols) * cell_h
			ctx.fillRect(x, y, cell_w, cell_h)
		}
	}

	// draw grid lines
	ctx.strokeStyle = theme.grid_color
	ctx.lineWidth = theme.grid_width
	ctx.lineCap = "butt"
	ctx.lineJoin = "miter"

	ctx.beginPath()

	for(let y=0; y<puzzle.rows; y++) {
		for(let x=0; x<puzzle.cols; x++) {

			if(puzzle.grid[y*puzzle.cols+x] === null) continue
			
			// check if cell right
			if(x < puzzle.cols - 1 && puzzle.grid[y*puzzle.cols+(x+1)] !== null) {
				ctx.moveTo((x + 1) * cell_w, y * cell_h)
				ctx.lineTo((x + 1) * cell_w, (y+1) * cell_h)
			}
			// check if cell below
			if(y < puzzle.rows - 1 && puzzle.grid[(y+1)*puzzle.cols+x] !== null) {
				ctx.moveTo(x * cell_w, (y+1)*cell_h)
				ctx.lineTo((x+1) * cell_w, (y+1)*cell_h)
			} 
		}
	}
	ctx.stroke()	
	ctx.closePath()

	// draw outside walls
	ctx.strokeStyle = theme.outwall_color
	ctx.lineWidth = theme.outwall_width
	ctx.lineCap = "butt"
	ctx.lineJoin = "miter"

	const half_outwall = Math.floor(theme.outwall_width / 2)
	const full_outwall = theme.outwall_width

	ctx.beginPath()

	for(let y=0; y<puzzle.rows; y++) {
		for(let x=0; x<puzzle.cols; x++) {

			if(puzzle.grid[y*puzzle.cols+x] === null) continue

			if(y === 0) {
				// top wall
				ctx.moveTo(x * cell_w - full_outwall, y * cell_h - half_outwall)
				ctx.lineTo((x + 1) * cell_w + full_outwall, y * cell_h - half_outwall)
			}
			else if(y === puzzle.rows-1) {
				// bottom wall
				ctx.moveTo(x * cell_w - full_outwall, (y+1) * cell_h + half_outwall)
				ctx.lineTo((x + 1) * cell_w + full_outwall, (y+1) * cell_h + half_outwall)
			}
			if(x === 0) {
				// left walls
				ctx.moveTo(x * cell_w - half_outwall, y * cell_h - full_outwall)
				ctx.lineTo(x * cell_w - half_outwall, (y + 1) * cell_h + full_outwall)
			}
			else if(x === puzzle.cols-1) {
				// right walls
				ctx.moveTo((x+1) * cell_w + half_outwall, y * cell_h - full_outwall)	
				ctx.lineTo((x+1) * cell_w + half_outwall, (y + 1) * cell_h + full_outwall)
			}

			// top walls
			if(puzzle.grid[(y-1)*puzzle.cols+x] === null) {

				let left_pad = 0
				if(puzzle.grid[(y-1)*puzzle.cols+(x-1)] === null && puzzle.grid[y*puzzle.cols+(x-1)] === null) {
					left_pad = -full_outwall
				}
				let right_pad = 0
				if(puzzle.grid[(y-1)*puzzle.cols+(x+1)] === null && puzzle.grid[y*puzzle.cols+(x+1)] === null) {
					right_pad = +full_outwall
				}				
				ctx.moveTo(x * cell_w + left_pad, y * cell_h - half_outwall)
				ctx.lineTo((x + 1) * cell_w + right_pad, y * cell_h - half_outwall)
			}
			// bottom walls
			if(puzzle.grid[(y+1)*puzzle.cols+x] === null) {
				let left_pad = 0
				if(puzzle.grid[(y+1)*puzzle.cols+(x-1)] === null && puzzle.grid[y*puzzle.cols+(x-1)] === null) {
					left_pad = -full_outwall
				}
				let right_pad = 0
				if(puzzle.grid[(y+1)*puzzle.cols+(x+1)] === null && puzzle.grid[y*puzzle.cols+(x+1)] === null) {
					right_pad = +full_outwall
				}

				ctx.moveTo(x * cell_w + left_pad, (y+1) * cell_h + half_outwall)
				ctx.lineTo((x + 1) * cell_w + right_pad, (y+1) * cell_h + half_outwall)
			}
			// left walls
			if(puzzle.grid[y*puzzle.cols+(x-1)] === null) {
				ctx.moveTo(x * cell_w - half_outwall, y * cell_h)
				ctx.lineTo(x * cell_w - half_outwall, (y + 1) * cell_h)
			}
			// right walls
			if(puzzle.grid[y*puzzle.cols+(x+1)] === null) {
				ctx.moveTo((x+1) * cell_w + half_outwall, y * cell_h)	
				ctx.lineTo((x+1) * cell_w + half_outwall, (y + 1) * cell_h)
			}
		}
	}
	ctx.stroke()
	ctx.closePath()


	// draw walls
	ctx.beginPath()
	for(const elem of puzzle.elems) {
		if(elem.type === "wall") {
			if(elem.facing === "N") {
				ctx.moveTo(elem.x * cell_w, 		 elem.y * cell_h)
				ctx.lineTo(elem.x * cell_w + cell_w, elem.y * cell_h)
			}
			else if(elem.facing === "S") {
				ctx.moveTo(elem.x * cell_w, 		 elem.y * cell_h + cell_h)
				ctx.lineTo(elem.x * cell_w + cell_w, elem.y * cell_h + cell_h)
			}
			else if(elem.facing === "E") {
				ctx.moveTo(elem.x * cell_w + cell_w, elem.y * cell_h)
				ctx.lineTo(elem.x * cell_w + cell_w, elem.y * cell_h + cell_h)
			}
			else if(elem.facing === "W") {
				ctx.moveTo(elem.x * cell_w, elem.y * cell_h)
				ctx.lineTo(elem.x * cell_w, elem.y * cell_h + cell_h)
			}
		}
	}
	ctx.stroke()
	ctx.closePath()




	// draw dots and paths
	const dot_radius = cell_w * dot_cell_ratio / 2
	ctx.lineWidth = 70

	let cell_index = 0
	let cell_count = puzzle.grid.length

	const cell_half_w = Math.floor(cell_w / 2)
	const cell_half_h = Math.floor(cell_h / 2)

	while(cell_index < cell_count) {

		const cell = puzzle.grid[cell_index]
		if(cell !== null && cell.type === "dot") {
			ctx.beginPath()
			ctx.ellipse(cell.x * cell_w + cell_half_w, cell.y * cell_h + cell_half_h, dot_radius, dot_radius, 0, 0, dot_end_angle)
			ctx.fillStyle = theme.colors[cell.color_index]
			ctx.fill()
		}
		cell_index++
	}

	ctx.setTransform(transform)
}


function puzzle_reset() {

	const cols = parseInt(document.getElementById("width_input").value)
	const rows = parseInt(document.getElementById("height_input").value)

	puzzle.init(cols, rows)
	window.requestAnimationFrame(draw)
}


function puzzle_export() {

	const config = {
		rows: puzzle.rows,
		cols: puzzle.cols,
		elems: []
	}

	let cell_index = 0
	let cell_count = puzzle.grid.length

	while(cell_index < cell_count) {

		const cell = puzzle.grid[cell_index]
		if(cell.type !== "") {
			config.elems.push({"x": cell.x, "y": cell.y, "type": cell.type, "color_index": cell.color_index})
		}
		cell_index++
	}

	console.log(JSON.stringify(config))
	return config
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

	const bbox = canvas.getBoundingClientRect()
	const mouse_x = evt.clientX - bbox.left - offset_x
	const mouse_y = evt.clientY - bbox.top - offset_y

	const cell_x = Math.floor(mouse_x / cell_w)
	const cell_y = Math.floor(mouse_y / cell_h)
	if(cell_x < 0 || cell_y < 0 || cell_x >= puzzle.cols || cell_y >= puzzle.rows) {
		console.error("Clicked outside grid!")
		return
	}


	if(curr_mode === "dot" && curr_cell !== null) {

		const idx = cell_y * puzzle.cols + cell_x
		const curr_cell = puzzle.grid[idx]

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
		
		const idx = cell_y * puzzle.cols + cell_x
		if(puzzle.shape[idx] === 1) {
			// erase
			puzzle.shape[idx] = 0
			puzzle.grid[idx] = null
		}
		else {
			// add
			puzzle.shape[idx] = 1
			puzzle.grid[idx] = new Editor_Cell(cell_x, cell_y)

		}
	}
	else if(curr_mode === "wall") {
		const dist = 10
		// We only use N and W walls:
		// S wall = (y+1) N wall
		// E wall = (x+1) W wall

		let vert = false

		if(mouse_x % cell_w < dist) {
			// check edge of the grid
			if(cell_x % puzzle.cols === 0) {
				console.error("Cannot place wall on edge!")
				return
			}
			// check there is a cell to the left
			const idx0 = cell_y * puzzle.cols + cell_x - 1
			const idx1 = cell_y * puzzle.cols + cell_x
			if(puzzle.shape[idx0] === 0 || puzzle.shape[idx1] === 0) {
				console.error("No adjacent cell!")
				return
			}
			
			// if(wall_exists) delete
			// else create

			const wall = { "x": cell_x, "y": cell_y, "type": "wall", "facing": "W" }
			puzzle.elems.push(wall)
		}
		else if(cell_w - (mouse_x % cell_w) < dist) {
			// check edge of the grid
			if((cell_x + 1) % puzzle.cols === 0) {
				console.error("Cannot place wall on edge!")
				return
			}
			// check there is a cell to the left
			const idx0 = cell_y * puzzle.cols + (cell_x + 1) - 1
			const idx1 = cell_y * puzzle.cols + (cell_x + 1)
			if(puzzle.shape[idx0] === 0 || puzzle.shape[idx1] === 0) {
				console.error("No adjacent cell!")
				return
			}
			const wall = { "x": (cell_x + 1), "y": cell_y, "type": "wall", "facing": "W" }
			puzzle.elems.push(wall)
		}

		else if(mouse_y % cell_h < dist) {
			// check edge of the grid
			if(cell_y === 0) {
				console.error("Cannot place wall on edge!")
				return
			}
			// check there is a cell to the left
			const idx0 = cell_y * puzzle.cols - puzzle.cols + cell_x
			const idx1 = cell_y * puzzle.cols + cell_x
			if(puzzle.shape[idx0] === 0 || puzzle.shape[idx1] === 0) {
				console.error("No adjacent cell!")
				return
			}
			const wall = { "x": cell_x, "y": cell_y, "type": "wall", "facing": "N" }
			puzzle.elems.push(wall)
		}
		else if(cell_h - (mouse_y % cell_h) < dist) {
			// check edge of the grid
			if(cell_y + 1 >= puzzle.rows) {
				console.error("Cannot place wall on edge!")
				return
			}
			// check there is a cell to the left
			const idx0 = (cell_y + 1) * puzzle.cols - puzzle.cols + cell_x
			const idx1 = (cell_y + 1) * puzzle.cols + cell_x
			if(puzzle.shape[idx0] === 0 || puzzle.shape[idx1] === 0) {
				console.error("No adjacent cell!")
				return
			}
			const wall = { "x": cell_x, "y": cell_y + 1, "type": "wall", "facing": "N" }
			puzzle.elems.push(wall)
		}
	}

	window.requestAnimationFrame(draw)
}


function color_on_click(evt) {
	curr_color_index = evt.currentTarget.dataset.color_index
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

	// uncheck previous mode
	const elems = document.querySelectorAll("button[data-mode] > input")
	for(const elem of elems) {
		elem.checked = false
	}
	// check new mode
	const elem = evt.currentTarget.querySelector("input")
	elem.checked = true

	curr_mode = evt.currentTarget.dataset["mode"]
}
