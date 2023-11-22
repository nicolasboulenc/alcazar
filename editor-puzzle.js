class Editor_Puzzle {

	constructor() {

		this.rows = 0;
		this.cols = 0;
		this.grid = [];
		this.elems = [];
		this.init(this.cols, this.rows);
	}

	init(cols, rows) {

		this.cols = cols;
		this.rows = rows;

		// init grid
		this.grid = [];
	}

}

class Editor_Cell {

	// {"x":1,"y":0,"type":"wall","facing":"S"},
	// {"x":2,"y":0,"type":"exit","facing":"N"},
	// {"x":0,"y":2,"type":"dot","facing":""}

	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.type = "";
		this.facing = "";
	}
}
