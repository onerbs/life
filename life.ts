/** the square root of the total cells in the board */
const CELLS = 20

/** the number of renders per second */
const RPS = 5

/** Create a new size*size matrix */
function matrix(size: number): boolean[][] {
  let res: boolean[][] = new Array(size)
  for (let i = 0; i < size; i++)
    res[i] = new Array<boolean>(size).fill(false)
  return res
}

/**
 * Create a copy of a matrix
 * @param source the original matrix
 */
function copy<T>(source: T[][]): T[][] {
  return source.map(row => Array.from(row))
}

/**
 * fit n between range [0, CELLS - 1]
 * @param n the target number
 */
function fit(n: number) {
  while (n < 0) n += CELLS
  while (n > CELLS - 1) n -= CELLS
  return n
}

// handle Cell mouse events
let mouseIsDown = false
let givingLife = false

/** The representation of a Cell */
class Cell {
  state: boolean
  coord: { x: number, y: number }

  /**
   * @param state the state of the cell. 0 = dead; 1 = alive.
   * @param x the X axis coordinate
   * @param y the Y axis coordinate
   */
  constructor(state: boolean, x: number, y: number) {
    this.state = state
    this.coord = { x, y }
  }

  /** Create a span element with the data of this cell */
  spany(): HTMLSpanElement {
    const span = document.createElement('span')
    if (this.state) span.classList.add('alive')
    span.addEventListener('mousedown', (event) => {
      mouseIsDown = true
      // give life with left click
      // take life with right click
      givingLife = event.button < 2
      if (event.target === event.currentTarget) {
        game.board.toggle(this.coord.x, this.coord.y, givingLife)
      }
    })
    // allow continuous painting
    span.addEventListener('mouseover', () => {
      if (mouseIsDown) game.board.toggle(this.coord.x, this.coord.y, givingLife)
    })
    span.addEventListener('mouseup', () => {
      mouseIsDown = false
      givingLife = false
    })
    return span
  }
}

/** Custom Array of Cells */
class ArrayOfCells {
  data: Cell[]

  constructor() {
    this.data = []
  }

  /** Push a {@link Cell} to this array */
  push(cell: Cell) {
    this.data.push(cell)
  }

  /** Create an array of span elements */
  spany(): HTMLSpanElement[] {
    let res: HTMLSpanElement[] = []
    for (let cell of this.data)
      res.push(cell.spany())
    return res
  }
}

/** The Game Board */
class Board {
  self: HTMLDivElement
  state: boolean[][]

  constructor(self: HTMLDivElement, state: boolean[][]) {
    this.self = self
    this.state = state
  }

  toggle(x: number, y: number, state = true) {
    this.state[y][x] = state
    this.paint()
  }

  render() {
    // operate on a snapshot of the current state
    let snapshot: boolean[][] = copy(this.state)

    // clculate the new state
    for (let y = 0; y < CELLS; y++) {
      for (let x = 0; x < CELLS; x++) {
        // calculate the number of live neighbors
        let neighbors: number = (
            Number(this.state[fit(y - 1)][fit(x - 1)])
          + Number(this.state[fit(y - 1)][x])
          + Number(this.state[fit(y - 1)][fit(x + 1)])
          + Number(this.state[y]         [fit(x - 1)])
          + Number(this.state[y]         [fit(x + 1)])
          + Number(this.state[fit(y + 1)][fit(x - 1)])
          + Number(this.state[fit(y + 1)][x])
          + Number(this.state[fit(y + 1)][fit(x + 1)])
        )

        // Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.
        if (!snapshot[y][x] && neighbors === 3) snapshot[y][x] = true

        // Any live cell with fewer than two live neighbours dies, as if by underpopulation.
        // Any live cell with more than three live neighbours dies, as if by overpopulation.
        else if (snapshot[y][x] && (neighbors < 2 || neighbors > 3)) snapshot[y][x] = false
      }
    }
    // update the actual state
    this.state = copy(snapshot)
    this.paint()
  }

  /** Draw the cells on the board */
  paint() {
    let cells = new ArrayOfCells()
    this.state.forEach((rows, y) => {
      rows.forEach((state, x) => {
        cells.push(new Cell(state, x, y))
      })
    })
    this.self.innerHTML = ""
    this.self.append(...cells.spany())
  }
}

/** The Game of Life */
class GameOfLife {
  board: Board
  isPaused: boolean
  control: HTMLDivElement
  interval: number

  constructor() {
    // create the root element
    let root = document.createElement('div')
    root.setAttribute('id', 'root')
    root.style.maxWidth = `${CELLS * 20}px`

    // create the control button
    this.control = document.createElement('div')
    this.control.innerText = 'Play'
    this.control.setAttribute('id', 'control')
    this.control.addEventListener('click', () => {
      this.control.innerText = this.pause() ? 'Play' : 'Pause'
    })

    // setup the board
    this.board = new Board(root, matrix(CELLS))

    // start paused
    this.isPaused = true

    // append the ui to the body
    document.body.append(root, this.control)
  }

  play() {
    this.interval = setInterval(() => {
      this.board.render()
    }, Math.floor(1000 / RPS))
  }

  pause() {
    this.isPaused = !this.isPaused
    this.isPaused ? clearInterval(this.interval) : this.play()
    return this.isPaused
  }

  start() {
    this.isPaused ? this.board.paint() : this.play()
  }
}

const game = new GameOfLife()

// Walking automat
// 0 1 0
// 0 0 1
// 1 1 1
game.board.toggle(0, 1)
game.board.toggle(1, 2)
game.board.toggle(2, 0)
game.board.toggle(2, 1)
game.board.toggle(2, 2)

game.start()
