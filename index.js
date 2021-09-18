const canvasSizeX = 1000;
const canvasSizeY = canvasSizeX;
const canvasPosX = 0;
const canvasPosY = 0;
const pointsNumber = 500;

const minDist = 0;

const searchSize = 1;
// searchSize, SquaresLookedAt
//     1:      3x3
//     2:      5x5
//     3:      7x7
//     ...
let indexingHelper = (searchSize * 2 ) + 1;

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
    // draw points from array
    for (let i = 0; i < points.length; i++) {
        drawCircle(points[i].x, points[i].y);
    }


    let t0 = performance.now();
    let grid = generateGrid(points);


    let connected = points.slice();
    connected.forEach(point => {
        findNearestAndDraw(grid, point);
    });
    let t1 = performance.now();

    console.log("time: " + (t1 - t0) + "ms");
}

const findNearestAndDraw = (grid, currentPoint) => {

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

    // Draw line from current point to each of the new found points
    pointsToDraw.forEach(point => {
        let line = canvas.append("line")
            .attr("x1", point.x)
            .attr("y1", point.y)
            .attr("x2", currentPoint.x)
            .attr("y2", currentPoint.y)
            .attr("stroke", "red")
            .attr("stroke-width", 1);
    });
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
}


window.addEventListener("load", main);
