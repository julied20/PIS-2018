
// Size of the raw distance image
const distanceImageSize = 50;

// Final canvas scale compared to the raw distance image
const distanceCanvasScale = 10;

// Append canvas to draw the distance image on
const distanceCanvas = d3.select('body')
  .append('canvas')
  .attr('width', distanceImageSize * distanceCanvasScale)
  .attr('height', distanceImageSize * distanceCanvasScale)
  .attr('style', 'display: none')

/**
 * Clears the distance image canvas from previous display
 */
function clearDistanceCanvas() {
  let ctx = distanceCanvas.node().getContext("2d");
  ctx.clearRect(0, 0, distanceImageSize * distanceCanvasScale, distanceImageSize * distanceCanvasScale);
}

/**
 * Color scale for the distance image pixels
 * Input: value between 0 and 15
 * Output: color between #FFF and #00004C
 */
let colorScale = d3.scaleLinear().domain([0,15])
  .interpolate(d3.interpolateHcl)
  .range([d3.rgb("#FFFFFF"), d3.rgb('#00004C')]);

/**
 * Draw distance image on the canvas
 */
function drawDistanceImage(distanceImage){
  clearDistanceCanvas();

  // Ge the canvas 2d context
  let ctx = distanceCanvas.node().getContext("2d");

  // For each pixel in the distanceImage
  for (let x = 0; x < distanceImageSize; x+=1) {
    for (let y = 0; y < distanceImageSize; y+=1) {
      let distance = distanceImage[x][y]

      /* Fill the canvas with a pixel of the color representing the distance
      at that point */
      if (distance > 0) {
        ctx.fillStyle = colorScale(distance);
        ctx.fillRect(
          x * distanceCanvasScale, y * distanceCanvasScale,
          distanceCanvasScale, distanceCanvasScale
        );
      }
    }
  }
}
