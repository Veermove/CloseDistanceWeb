// canvas size
const canvasSizeX = 1000;
const canvasSizeY = canvasSizeX;

// canvas position/offset
const canvasPosX = 0;
const canvasPosY = 0;

// number of points to be generated
const pointsNumber = 500;

// number of lines drawn from each point
const n = 4;

// ignore points with distance (from currentPoint when calculating outgoing lines)
// smaller than minDist
const minDist = 0;

const searchSize = 1;
let indexingHelper = (searchSize * 2 ) + 1;
// searchSize, SquaresLookedAt
//     1:      3x3
//     2:      5x5
//     3:      7x7
//     ...

const maxPointVelocity = 0.1;
const maxLineLength = 150;

let canvas = d3.select("body")
    .append("svg")
    .attr("width", canvasSizeX)
    .attr("height", canvasSizeY);

const main = () => {
    // generate scattered points and save them in an array
    let points = [];
    for (let i = 0; i < pointsNumber; i++) {
        let p = {};
        p.x = ( Math.random() * canvasSizeX);
        p.y = ( Math.random() * canvasSizeY);
        p.velX = ( (Math.random() * ( 2 * maxPointVelocity ) - maxPointVelocity) );
        p.velY = ( (Math.random() * ( 2 * maxPointVelocity ) - maxPointVelocity) );
        // p.velX = ( (Math.random() * maxPointVelocity) );
        // p.velY = ( (Math.random() * maxPointVelocity) );
        points.push(p);
    }
    // draw points from array and connect them to SVG circles
    let Circles = canvas.selectAll("cricle")
                        .data(points)
                        .enter()
                            .append("circle")
                            .attr("cx", (d) => { return d.x; })
                            .attr("cy", (d) => { return d.y; })
                            .attr("fill", "red")
                            .attr("r", 3);

    // NOTE TO SELF
    // TO REDRAW IE. SET OF POINTS USE
    //     Circles.attr("cx", (d) => { return d.x; })
    //            .attr("cy", (d) => { return d.y; });
    // ADD ALL CHANGED ATTRIBUTES

    // generate grid and fill it with points from array
    let grid = generateGrid(points);

    // for each point calcualte all outgoing lines
    // calculated lines store in 'allLines' array
    // line consists of starting point as 'start' and
    // ending point as 'end'
    let allLines = [];
    points.forEach(point => {
        allLines = allLines.concat( findNearest(grid, point) );
    });

    // draw lines from array and connect them to SVG lines
    let Lines = canvas.selectAll("line")
                .data(allLines)
                .enter()
                .append("line")
                    .attr("x1", (d) => { return d.start.x; })
                    .attr("y1", (d) => { return d.start.y; })
                    .attr("x2", (d) => { return d.end.x; })
                    .attr("y2", (d) => { return d.end.y; })
                    .attr("stroke", "red")
                    .attr("stroke-width", 1);

    let interval = 45;
    setInterval(() => {
        if (window.dontDoIt) return;

        let t0 = performance.now();

        function resetGrid() {
            for (let i = 0; i < grid.length; i++) {
                for (let j = 0; j < grid.length; j++) {
                    // reset each square
                    grid[i][j].pointsInside = [];
                }
            }
        }
        resetGrid();

        allLines = [];

        points.forEach(point => {
            point.x = (point.x + (point.velX * interval)) % canvasSizeX;
            point.y = (point.y + (point.velY * interval)) % canvasSizeY;

            let xHelp = (canvasSizeX / grid.length);
            let yHelp = (canvasSizeY / grid.length);

            // find place for given point in the grid
            let xAddres = (Math.floor( point.x / xHelp) + grid.length) % grid.length;
            let yAddres = (Math.floor( point.y / yHelp) + grid[0].length) % grid[0].length;

            // store given point in the grid
            grid[xAddres][yAddres].pointsInside.push(point);
            let addition = findNearest(grid, point)

            allLines = allLines.concat( addition );
        });

        Circles.attr("cx", (d) => { return d.x; })
               .attr("cy", (d) => { return d.y; });


        canvas.selectAll("line").remove();
        allLines.forEach(line => {
            if (calcDistance(line.start, line.end) < maxLineLength) {
                let lix = canvas.append("line")
                .attr("x1", line.start.x)
                .attr("y1", line.start.y)
                .attr("x2", line.end.x)
                .attr("y2", line.end.y)
                .attr("stroke", "red")
                .attr("stroke-width", 1);

            }
        });

        let t1 = performance.now();
        console.log("time: " + (t1 - t0) + "ms");
    }, interval);
}

// returns array of lines to be drawn from current point
// and asigned to SVGs
const findNearest = (grid, currentPoint) => {

    let distances = [];

    // find addres of current point
    let xAddres = Math.floor( currentPoint.x / (canvasSizeX / grid.length));
    let yAddres = Math.floor( currentPoint.y / (canvasSizeY / grid.length));

    // search around square of current point
    for (let dx = -searchSize; dx < indexingHelper; dx++) {
        for (let dy = -searchSize; dy < indexingHelper; dy ++) {

            // ignore border cases
            if (!grid[xAddres + dx] || !grid[xAddres + dx][yAddres + dy]) { continue; }

            // console.log('pointsInsideLengt ' + grid[xAddres + dx][yAddres + dy].pointsInside.length);
            if (!grid[xAddres + dx][yAddres + dy].pointsInside.length) {continue; }

            // for each point in current square calculate and store distance to given point
            grid[xAddres + dx][yAddres + dy].pointsInside.forEach(point => {
                let distance = calcDistance(currentPoint, point);
                if (distance) {
                    let distPoint = {};
                    distPoint.p = point;
                    distPoint.dist = distance
                    if (distPoint.dist > minDist) {
                        distances.push(distPoint);
                    }
                }
            });
        }
    }



    if (distances.length == 0 || distances[0].dist == 0) { return []; }
    // if (!distances[0]) { console.log('HUJ'); return []; }

    let pointsToDraw = [];
    for (let i = 0; i < n; i++) {

        let min = distances[0].dist;
        let minIndex = 0;
        for (let j = 0; j < distances.length; j++) {

            if (min > distances[j].dist) {
                min = distances[j].dist;
                minIndex = j;
            }
        }
        pointsToDraw.push(distances[minIndex].p);
        distances.splice(minIndex, 1);
        if (distances.length === 0) {
            break;
        }
    }

    // Create array of lines to be drawn
    let lines = [];
    pointsToDraw.forEach(point => {
        let curLine = {};
        curLine.start = point;
        curLine.end = currentPoint;
        lines.push(curLine);
    });
    return lines;
}

const calcDistance = (pointA, pointB) => {
    let xDif = (pointA.x - pointB.x);
    let yDif = (pointA.y - pointB.y);
    return Math.sqrt( (xDif * xDif) + (yDif * yDif) );
}

const generateGrid = (setOfPoints) => {
    // for n points grid should consist of z = sqrt(n) squares,
    // so grid side should consist of sqrt(z) squares
    let gridSize = Math.ceil( Math.sqrt( Math.sqrt( pointsNumber ) ) );
    console.log('N x N where n = ' + gridSize);

    // generate 2-dimensional sqaure array with side length of gridSize
    let grid = new Array(gridSize);
    for (let i = 0; i < gridSize; i++) {
        grid[i] = new Array(gridSize);
    }

    // for all squares in grid:
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            grid[i][j] = {};

            // define boundaries of each sqaure
            grid[i][j].xStart = canvasPosX + (i * (canvasSizeX / gridSize));
            grid[i][j].xEnd = canvasPosX + ( (i + 1)  * (canvasSizeX / gridSize));

            grid[i][j].yStart = canvasPosY + (j * (canvasSizeY / gridSize));
            grid[i][j].yEnd = canvasPosY + ( (j + 1)  * (canvasSizeY / gridSize));

            // allow points to be stored inside each sqaure
            grid[i][j].pointsInside = [];
        }
    }

    let xHelp = (canvasSizeX / gridSize);
    let yHelp = (canvasSizeY / gridSize);

    function findPlace(point) {
        // find place for given point in the grid
        let xAddres = Math.floor( point.x / xHelp);
        let yAddres = Math.floor( point.y / yHelp);

        // store given point in the grid
        grid[xAddres][yAddres].pointsInside.push(point);
    }

    // place each point in the grid
    setOfPoints.forEach(point => findPlace(point));

    return grid;
}

window.addEventListener("load", main);
