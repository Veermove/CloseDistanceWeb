const canvasSizeX = 1920;
const canvasSizeY = 1080;

let canvas = d3.select("body")
    .append("svg")
    .attr("width", canvasSizeX)
    .attr("height", canvasSizeY);


const main = () => {
    let points = [];
    for (let i = 0; i < 100; i++) {
        let p = [];
        p.push( Math.random() * canvasSizeX);
        p.push( Math.random() * canvasSizeY);
        points.push(p);
    }
    for (let i = 0; i < points.length; i++) {
        drawCircle(points[i][0], points[i][1]);
    }

    let pointA = points[7];
    const delaunay = d3.Delaunay.from(points);
    let pointB = delaunay.find(points[8], points);
    let line = canvas.append("line")
        .attr("x1", pointA[0])
        .attr("y1", pointA[1])
        .attr("x2", pointB[0])
        .attr("y2", pointB[1])
        .attr("stroke", "red")
        .attr("stroke-width", 2);

}

const drawCircle = (x, y) => {
    let dot1 = canvas.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("fill", "red")
        .attr("r", 3);
}

function findNearestPoint(point, setOfPoints) {

    const delaunay = d3.Delaunay.from(setOfPoints);
    let index = delaunay.find(point, setOfPoints);
    return setOfPoints[index];
}

window.addEventListener("load", main);
