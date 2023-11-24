class Editor_Puzzle {

	constructor() {

		this.rows = 0
		this.cols = 0
		this.grid = []		// contains editor cells
		this.shape = []		// 0 for wholes in the grid
		this.elems = []
		this.init(this.cols, this.rows)
	}

	init(cols, rows) {

		this.cols = cols
		this.rows = rows

		// init grid
		this.grid = []
		for(let i=0; i<this.cols*this.rows; i++) {
			const x = i % this.cols
			const y = Math.floor(i / this.rows)
			const cell = new Editor_Cell(x, y)
			this.grid.push(cell)
		}

		// init shape
		this.shape = []
		for(let i=0; i<this.cols*this.rows; i++) {
			this.shape.push(1)
		}

		this.elems = []
	}
}

class Editor_Cell {

	// {"x":1,"y":0,"type":"wall","facing":"S"},
	// {"x":2,"y":0,"type":"exit","facing":"N"},
	// {"x":0,"y":2,"type":"dot","facing":""}

	constructor(x, y) {
		this.x = x
		this.y = y
		this.type = ""
		this.facing = ""
	}
}
