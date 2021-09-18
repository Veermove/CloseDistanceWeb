const canvasSizeX = 1000;
const canvasSizeY = canvasSizeX;
const canvasPosX = 0;
const canvasPosY = 0;
const pointsNumber = 500;

const minDist = 0;

const searchSize = 1;
let indexingHelper = (searchSize * 2 ) + 1;
// searchSize, SquaresLookedAt
//     1:      3x3
//     2:      5x5
//     3:      7x7
//     ...


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

    let t0 = performance.now();

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
    let line = canvas.selectAll("line")
                .data(allLines)
                .enter()
                .append("line")
                    .attr("x1", (d) => { return d.start.x; })
                    .attr("y1", (d) => { return d.start.y; })
                    .attr("x2", (d) => { return d.end.x; })
                    .attr("y2", (d) => { return d.end.y; })
                    .attr("stroke", "red")
                    .attr("stroke-width", 1);

    let t1 = performance.now();
    console.log("time: " + (t1 - t0) + "ms");
}

// returns array of lines to be drawn and asigned to SVGs
const findNearest = (grid, currentPoint) => {

    let distances = [];

    // search around square of current point
    let xAddres = Math.floor( currentPoint.x / (canvasSizeX / grid.length));
    let yAddres = Math.floor( currentPoint.y / (canvasSizeY / grid.length));

    for (let dx = -searchSize; dx < indexingHelper; dx++) {
        for (let dy = -searchSize; dy < indexingHelper; dy ++) {
            // ignore border cases
            if (!grid[xAddres + dx] || !grid[xAddres + dx][yAddres + dy]) { continue; }

            grid[xAddres + dx][yAddres + dy].pointsInside.forEach(point => {
                let distPoint = {};
                distPoint.p = point;
                distPoint.dist = calcDistance(currentPoint, point);
                if (distPoint.dist > minDist) {
                    distances.push(distPoint);
                }
            });
        }
    }

    // find n smallest values by distance
    let n = 4;
    let pointsToDraw = [];
    for (let i = 0; i < 4; i++) {
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

const drawCircle = (x, y) => {
    let dot1 = canvas.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("fill", "red")
        .attr("r", 3);
    return dot1;
}


window.addEventListener("load", main);
