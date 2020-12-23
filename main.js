// Variables
let canvas = {};
let colors = {};
let buttons = {
  drawWall: document.getElementById(`buttonDrawWall`),
  drawStart: document.getElementById(`buttonDrawStart`),
  start: document.getElementById(`buttonStart`)
};

let gridSize = 16;
let state = `drawWall`;
let mouseAction = ``;

let openCells = [];
let closedCells = [];

let grid;

// Classes
class Grid {
  constructor (size) {
    this.size = size;
    this.data = [];
    this.start = { x: -1, y: -1 };

    this.build();
  }

  build () {
    buttons.start.disabled = true;
    this.w = canvas.w / this.size;
    this.h = canvas.h / this.size;

    this.start = { x: -1, y: -1 };
    this.data = [];
    for (let x = 0; x < this.w; x ++) {
      this.data[x] = [];
      for (let y = 0; y < this.h; y ++) {
        this.data[x][y] = {
          x: x, y: y,
          type: `empty`,
          lead: null
        }
      }
    }
  }

  getNeighbors (x, y) {
    let n = [];

    n.push(this.getCell(x, y - 1));
    n.push(this.getCell(x - 1, y));
    n.push(this.getCell(x + 1, y));
    n.push(this.getCell(x, y + 1));

    n = n.filter(n => n != null);

    return n;
  }

  getStart () {
    if (this.start.x == -1 && this.start.y == -1) return null;
    else return this.getCell(this.start.x, this.start.y);
  }

  getCell (x, y) {
    if (x >= 0 && x < this.w && y >= 0 && y < this.h) return this.data[x][y];
    else return null;
  }

  getCellMouse () {
    let x = mouseX, y = mouseY;

    x -= x % this.size; x /= this.size;
    y -= y % this.size; y /= this.size;

    if (x >= 0 && x < this.w && y >= 0 && y < this.h) return this.getCell(x, y);
    else return null;
  }

  placeStart (x, y) {
    if (this.start.x != -1 && this.start.y != -1) {
      this.getCell(this.start.x, this.start.y).type = `empty`;
    }

    this.start.x = x; this.start.y = y;
    this.getCell(x, y).type = `start`;
    buttons.start.disabled = false;
  }

  draw () {
    strokeWeight(1); stroke(colors.gray);
    
    for (let x = 0; x < this.w; x ++) {
      for (let y = 0; y < this.h; y ++) {
        switch (this.getCell(x, y).type) {
          case `empty`: noFill(); break;
          case `wall`: fill(colors.black); break;
          case `start`: fill(colors.green); break;
          case `open`: fill(colors.gray); break;
          case `closed`: fill(colors.blue); break;
          default: noFill(); break;
        }

        rect(x * this.size, y * this.size, this.size, this.size);
      }
    }
  }
}

// p5 Functions
function setup () {
  // Canvas
  canvas.e = createCanvas();
  canvas.e.parent(`canvas`);
  windowResized();

  // Variables
  colors = {
    black: color(0),
    gray: color(128),
    white: color(255),

    green: color(0, 255, 0),
    blue: color(0, 0, 255),
    red: color(255, 0, 0),

    pink: color(255, 192, 203)
  }

  grid = new Grid(gridSize);
}

function draw () {
  // Clearing
  background(colors.white);

  // Drawing existing cells.
  grid.draw();

  // Do the pathing
  if (state == `calc`) {
    if (openCells.length > 0) {
      let cell = openCells.shift();
      let n = grid.getNeighbors(cell.x, cell.y);
  
      n = n.filter(x => x.type == `empty`);
      for (let i = 0; i < n.length; i ++) {
        n[i].type = `open`;
        n[i].lead = cell;
        openCells.push(n[i]);
      }
  
      if (cell.type == `open`) cell.type = `closed`;
      closedCells.push(cell);
    } else {
      changeState(`path`);
    }
  } else if (state == `path`) {
    let cell = grid.getCellMouse();
    if (cell != null && cell.lead != null) {
      stroke(colors.white); strokeWeight(1);

      while (cell.type != `start`) {
        let lead = cell.lead;

        let half = gridSize / 2;
        let x1 = cell.x * gridSize + half;
        let y1 = cell.y * gridSize + half;
        let x2 = lead.x * gridSize + half;
        let y2 = lead.y * gridSize + half;

        line(x1, y1, x2, y2);

        cell = lead;
      }
    }
  }
}

function windowResized () {
  let size = getCanvasSize();

  let w = size[0];
  w -= w % gridSize;

  let h = size[1];
  h -= h % gridSize;

  canvas.w = w;
  canvas.h = h;

  if (grid) grid.build();
  resizeCanvas(w, h);
}

function mousePressed () {
  let cell = grid.getCellMouse();
  if (cell != null) {
    if (state == `drawWall`) {
      if (cell.type == `empty`) {
        mouseAction = `drawWall`;
        cell.type = `wall`;
      }  else if (cell.type == `wall`) {
        mouseAction = `eraseWall`;
        cell.type = `empty`;
      }
    } else if (state == `drawStart`) {
      if (cell.type == `empty`) grid.placeStart(cell.x, cell.y);
    }
  }
}

function mouseReleased () {
  mouseAction = ``;
}

function mouseDragged () {
  if (mouseAction.length > 0) {
    let cell = grid.getCellMouse();
    if (cell != null) {

      if (mouseAction == `drawWall` && cell.type == `empty`) cell.type = `wall`;
      else if (mouseAction == `eraseWall` && cell.type == `wall`) cell.type = `empty`;

    }
  }
}

// Functions
function getElementSize (elm) {
  // Returns the width and height of an element, without padding.

  let style = window.getComputedStyle(elm, null);

  let w = style.getPropertyValue(`width`);
  w = Number(w.substring(0, w.length - 2));

  let h = style.getPropertyValue(`height`);
  h = Number(h.substring(0, h.length - 2));

  return { w: w, h: h };
}

function getCanvasSize () {
  // Calculates the size that the canvas should be.

  let container = { e: document.getElementsByClassName(`container`)[0] };
  container.s = getElementSize(container.e);

  let width = container.s.w;
  let height = width / 16 * 9;

  if (height > window.innerHeight) {
    height = window.innerHeight * 0.85;
    width = height / 9 * 16;
  }

  return [width, height];
}

function changeState (s) {
  let oldState = state;
  state = s;

  let text;
  switch (s) {
    case `drawWall`: text = `Draw Walls`; break;
    case `drawStart`: text = `Place Start`; break;
    case `calc`: text = `Calculating paths...`; break;
    case `path`: text = `Pathfinding`; break;
    default: text = `Unknown`; break;
  }

  if (s == `calc`) {
    openCells = [ grid.getStart() ];
    closedCells = [];
  }

  if ((oldState == `calc` || oldState == `path`) && (s != `calc` && s != `path`)) {
    for (let cell of openCells) {
      if (cell.type != `start`) {
        cell.type = `empty`;
        cell.lead = null;
      }
    }
    for (let cell of closedCells) {
      if (cell.type != `start`) {
        cell.type = `empty`;
        cell.lead = null;
      }
    }

    openCells = [];
    closedCells = [];
  }

  document.getElementById(`spanState`).innerHTML = text;
}

// Bindings
document.getElementById(`buttonDrawWall`).addEventListener(`click`, () => changeState(`drawWall`));
document.getElementById(`buttonDrawStart`).addEventListener(`click`, () => changeState(`drawStart`));
document.getElementById(`buttonStart`).addEventListener(`click`, () => changeState(`calc`));