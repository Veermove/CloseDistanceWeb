// canvas size
const canvasSizeX = document.querySelector('#background').offsetWidth;
const canvasSizeY = document.querySelector('#background').offsetHeight;

// number of points to be generated
const pointsNumber = 200;

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

const maxPointVelocity = 0.06;
const maxLineLength = canvasSizeX * 0.15;

let canvas = d3.select("#background")
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

    // create color gradient based on distance
    let colorGrad = d3.scaleLinear().domain([0, 0.7 * maxLineLength]).range(["red", "blue"]);

    // function to redrawLines called every frame
    // =======================================================================================
    function redrawLines() {
        // for each point:
        points.forEach(point => {
            // create array of points that should be connected to current point
            point.connect = [];
            point = findNearest(grid, point);

            // store sum of distances to each point that will be connected to current point
            let sumOfDistances = 0;

            // for each point that current point will be connected to:
            point.connect.forEach(endPoint => {
                // calculate distance to current point
                let dist = calcDistance(point, endPoint);

                // if distance from current point to endPoint is greater
                // than some const value - don't draw that line
                if (dist < maxLineLength)
                {
                    // add distance to current point to the sum
                    sumOfDistances += dist;
                    let Lines = canvas.append("line")
                        .attr("x1", point.x)
                        .attr("y1", point.y)
                        .attr("x2", endPoint.x)
                        .attr("y2", endPoint.y)
                        .attr("stroke", colorGrad(dist))
                        .attr("stroke-width", 1);
                }
            });

            // if findNearest(...) doesn't find any points for current point
            // to be connected to, point.connect array is empty
            if (!point.connect.length) {
                // hence treat it's average distance to other points as maximum
                point.avgDist = maxLineLength;
            } else {
                // else calcualte average distance to points connected to it
                point.avgDist = sumOfDistances / point.connect.length;
            }
        });
    }
    // =======================================================================================

    redrawLines();

    window.dontDoIt = true;
    let interval = 45;
    setInterval(() => {
        if (!window.dontDoIt) return;

        // reset grid
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

            // calculate difference in position
            let DeltaX = point.velX * interval;
            let DeltaY = point.velY * interval;

            // update position
            point.x =  ((point.x + DeltaX) + canvasSizeX) % canvasSizeX ;
            point.y =  ((point.y + DeltaY) + canvasSizeY) % canvasSizeY ;

            let xHelp = (canvasSizeX / grid.length);
            let yHelp = (canvasSizeY / grid.length);

            // find place for given point in the grid
            let xAddres = Math.abs((Math.floor( point.x / xHelp) + grid.length) % grid.length);
            let yAddres = Math.abs((Math.floor( point.y / yHelp) + grid[0].length) % grid[0].length);

            // store given point in the grid
            grid[xAddres][yAddres].pointsInside.push(point);
        });

        // call function to re-draw all lines with updated position and color
        redrawLines();

        // re-draw points with updated position and color
        Circles.attr("cx", (d) => { return d.x; })
               .attr("cy", (d) => { return d.y; })
               .attr("fill", (d) => { return colorGrad(d.avgDist); });

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


    currentPoint.connect = [];
    if (distances.length == 0 || distances[0].dist == 0) { return currentPoint; }
    if (!distances[0]) { console.log('HUJ'); return currentPoint; }

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

//takes in sorted by .x set of points
const sqrMethod = (currentPoint, setOfPoints) => {
    let delta = 10;
    let square = {};
    square.top = currentPoint.y - delta;
    square.bot = currentPoint.y + delta;
    square.left = currentPoint.x - delta;
    square.righ = currentPoint.x + delta;
    let found = []

}


window.addEventListener("load", main);
