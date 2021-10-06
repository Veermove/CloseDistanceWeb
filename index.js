// canvas size
let canvasSizeX = document.querySelector('#background').offsetWidth;
let canvasSizeY = document.querySelector('#background').offsetHeight;

// number of points to be generated
const pointsNumber = 200;

// number of lines drawn from each point
const n = 5;

// ignore points with distance (from currentPoint when calculating outgoing lines)
// smaller than minDist
const minDist = 0;

// how many squares in a grid are checked
const searchSize = 1;
// searchSize, SquaresLookedAt
//     1:      3x3
//     2:      5x5
//     3:      7x7
//     ...

let indexingHelper = (searchSize * 2 ) + 1;

// max point velocity in px/ms
const maxPointVelocity = 0.06;

// max length of drawn line
let maxLineLength = canvasSizeX >= canvasSizeY ? (canvasSizeX * 0.15) : (canvasSizeY * 0.15);

// create color gradient based on distance
let colorGrad = d3.scaleLinear().domain([0, 0.7 * maxLineLength]).range(["red", "blue"]);

let canvas = d3.select("#background")
    .append("svg")
    .attr("width", canvasSizeX)
    .attr("height", canvasSizeY);

const main = () => {

    // generate scattered points and save them in an array
    let points = [];
    for (let i = 0; i < pointsNumber; i++) {
        let p = {};

        // store index its index in array
        p.index = i;

        // generate rnadom position
        p.x = ( Math.random() * canvasSizeX);
        p.y = ( Math.random() * canvasSizeY);

        // generate random velocity
        p.velX = ( (Math.random() * ( 2 * maxPointVelocity ) - maxPointVelocity) );
        p.velY = ( (Math.random() * ( 2 * maxPointVelocity ) - maxPointVelocity) );
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

    // generate grid and fill it with points from array
    let grid = generateGrid(points);

    // create empty adjecency matrix
    let adjMatrix = new Array(pointsNumber);

    for (let i = 0; i < pointsNumber; i++) {
        adjMatrix[i] = new Array(pointsNumber);
    }

    // redraw all lines based on adjacency matrix
    // ===========================================================================
    function redrawLines(matrix) {
        for (let i = 0; i < matrix.length; i++) {
            // count outgoing lines from current point
            let currentCount = 0;

            // store sum of distances from current point to end points
            let sumOfDist = 0;
            for (let j = i; j < matrix.length; j++) {

                // if two points should connect to a line
                if (matrix[i][j]) {
                    currentCount++;

                    // calcualte length of this line and store it
                    let dist = calcDistance(points[i], points[j]);
                    sumOfDist += dist;

                    // draw line
                    let lines = canvas.append("line")
                        .attr("x1", points[i].x)
                        .attr("y1", points[i].y)
                        .attr("x2", points[j].x)
                        .attr("y2", points[j].y)
                        .attr("stroke", colorGrad(dist))
                        .attr("stroke-width", 1);
                }
            }

            // // if findNearest(...) doesn't find any points for current point
            // // to be connected to, point.connect array is empty
            // if (false) {
            //     // hence treat it's average distance to other points as maximum
            //     points[i].avgDist = maxLineLength;
            // } else {
            //     // for each point calculate average distance to 4 nearest
            //     // points connected to it
            // points[i].avgDist = sumOfDist / currentCount;
            // }
        }
    }

    // in each point store references to points this point should be connected to
    // ===========================================================================
    function findConnections() {
        // for each point:
        points.forEach(point => {
            // create array of points that should be connected to current point
            point.connect = [];

            // find nearest points, and put them in the .connect array
            point = findNearest(grid, point);
        });
    }

    // calculate new position of a given point, returns updated point
    // ===========================================================================
    function updatePoint(point) {
        // calculate difference in position
        let DeltaX = point.velX * interval;
        let DeltaY = point.velY * interval;

        // update position
        point.x =  ((point.x + DeltaX) + canvasSizeX) % canvasSizeX ;
        point.y =  ((point.y + DeltaY) + canvasSizeY) % canvasSizeY ;

        return point;
    }

    // for all points find its 4 nearest neighbours
    findConnections();

    // create and fill adjacency matrix
    adjMatrix = checkMatrixValidity(setAdjMatrix(adjMatrix, points));


    // call function to redraw lines from adjacency matrix
    redrawLines(adjMatrix);

    // pause condition to stop simulation via console
    window.pause = false;

    let interval = 45;

    setInterval(() => {
        if (window.pause) {
            return;
        }

        // clear each square of grid
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid.length; j++) {
                // reset each square
                grid[i][j].pointsInside = [];
            }
        }

        // remove all drawn lines
        canvas.selectAll("line").remove();

        // for each point update it's position and place it in a grid
        points.forEach(point => {

            // call function to update position
            updatePoint(point);

            let xHelp = (canvasSizeX / grid.length);
            let yHelp = (canvasSizeY / grid.length);

            // find place for given point in the grid
            let xAddres = Math.abs((Math.floor( point.x / xHelp) + grid.length) % grid.length);
            let yAddres = Math.abs((Math.floor( point.y / yHelp) + grid[0].length) % grid[0].length);

            // store given point in the grid
            grid[xAddres][yAddres].pointsInside.push(point);
        });

        // for all points
        //     find nearest point to current
        findConnections();

        // calculate new adjacency matrix
        // adjMatrix = checkMatrixValidity(setAdjMatrix(adjMatrix, points));
        adjMatrix = setAdjMatrix(adjMatrix, points);

        // call function to re-draw all lines with updated position and color from adjacency matrix
        redrawLines(adjMatrix);

        points = calculateAvgDistances(adjMatrix, points);
        // re-draw points with updated position and color
        Circles.attr("cx", (d) => { return d.x; })
               .attr("cy", (d) => { return d.y; })
               .attr("fill", (d) => { return colorGrad(d.avgDist); });

    }, interval);
}

// set adjacency matrix to be false at every adress
// returns 'empty' adjacency matrix
function resetAdjMatrix(matrix) {
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix.length; j++) {
            matrix[i][j] = false;
        }
    }
    return matrix;
}

// fill adjacency matrix from adjacency list (here adjacency array)
// returns 'filled' matrix
function setAdjMatrix(matrix, setOfPoints) {

    // reset matrix before filling
    matrix = resetAdjMatrix(matrix);

    // for all points in a given set of points
    for (let i = 0; i < setOfPoints.length; i++) {
        // set connection to itself as false
        matrix[i][i] = false;

        // create connection
        setOfPoints[i].connect.forEach(connection => {
            // ensure both way connection
            matrix[i][connection.index] = true;
            matrix[connection.index][i] = true;
        });
    }
    return matrix;
}

function calculateAvgDistances(matrix, setOfPoints) {
    for (let i = 0; i < matrix.length; i++) {
        let sum = 0;
        let count = 0;
        for (let j = 0; j < matrix.length; j++) {
            if (matrix[i][j]) {
                count++;
                sum += calcDistance(setOfPoints[i], setOfPoints[j]);
            }
        }
        setOfPoints[i].avgDist = sum / count;
    }
    return setOfPoints;
}

function checkMatrixValidity(matrix) {
    for (let i = 0; i < matrix.length; i++) {
        let count = 0;
        for (let j = 0; j < matrix.length; j++) {
            if (matrix[i][j]) {
                count++;
            }
            if (count > n && matrix[i][j]) {
                matrix[i][j] = false;
                matrix[j][i] = false;
            }
        }
    }
    return matrix;
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


    currentPoint.connect = [];
    if (distances.length == 0 || distances[0].dist == 0) { return currentPoint; }
    if (!distances[0]) { return currentPoint; }

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

    // Store connections in current point

    pointsToDraw.forEach(point => {
        currentPoint.connect.push(point);
    });
    return currentPoint;
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

    // generate 2-dimensional sqaure array with side length of gridSize
    let grid = new Array(gridSize);
    for (let i = 0; i < gridSize; i++) {
        grid[i] = new Array(gridSize);
    }

    // for all squares in grid:
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            // create empty
            grid[i][j] = {};

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

// add event listener when resizing window
window.addEventListener('resize', function(event) {
    // save new canvas size
    canvasSizeX = document.querySelector('#background').offsetWidth;
    canvasSizeY = document.querySelector('#background').offsetHeight;

    // clear canvas of lines created on old size
    canvas.selectAll("line").remove();

    // update canvas attributes
    canvas.attr("width", canvasSizeX).attr("height", canvasSizeY);

    // recalculate maxLineLength based on greater length of canvas
    maxLineLength = canvasSizeX >= canvasSizeY ? (canvasSizeX * 0.15) : (canvasSizeY * 0.15);

    // recalculate color gradient based on maxLineLength
    colorGrad = d3.scaleLinear().domain([0, 0.7 * maxLineLength]).range(["red", "blue"]);
}, true);

