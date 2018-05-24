/**
 * Config variables
 */
const NEIGHBORS_COUNT = 5;
const LAKE_IMG_URL = 'https://storage.googleapis.com/sketch-a-lake/lakes_collection/';
const UNAMED_LAKE_STR = 'Unamed lake';

/**
 * Construct the Vantage Point Tree
 * Used to search nearest neighbors of drawn lakes in an efficient manner.
 */
let vptree;
let lakeIDs = [];
let lakeDistanceImages = [];
constructVPtree();

/**
 * Load lake metadatas such as lake name, angle, geo coordinates
 */
let lakes_metadatas;
loadMetadatas();

/**
 * Div that shows a zoomed image of a lake, when hovering on it on the right
 */
const inspectorDiv = d3.select('#inspectorDiv');
const inspectorImg = d3.select('#inspectorImg');


/**
 * The svg on which to draw the lakes
 */
const svgDiv = d3.select("#svgDiv");
const drawingSvg =
  d3.select("svg")
  .call(
    d3.drag()
      .container(function() { return this; })
      .subject(function() { let p = [d3.event.x, d3.event.y]; return [p, p]; })
      .on("start", dragstarted)
      .on("end", dragstopped)
  );

/**
 * Temporary div used during svg conversion to binary image
 */
const tempDiv = d3.select('#tempDiv');

/**
 * Called when drag is stopped (end of drawing).
 * Convert the svg drawing to a base64 image, and
 * sends it to the image processing pipeline.
 */
function dragstopped() {
  // Width and height of the svg drawing
  const width = drawingSvg.attr('width');
  const height = drawingSvg.attr('height');

  // Doctype
  var doctype = '<?xml version="1.0" standalone="no"?>'
    + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

  // Serialize our SVG XML to a string.
  var source = (new XMLSerializer()).serializeToString(drawingSvg.node());

  // Create a file blob of our SVG.
  var blob = new Blob([ doctype + source], { type: 'image/svg+xml;charset=utf-8' });
  var url = window.URL.createObjectURL(blob);

  // Put the svg into an image tag so that the Canvas element can read it in.
  let img = tempDiv.append('img')
    .attr('width', width)
    .attr('height', height)
    .node();

  // Will be called when image has finished loading
  img.onload = function() {
    // Now that the image has loaded, put the image into a canvas element.
    let canvas = tempDiv.append('canvas').node();
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Base64 encoded version of the png
    let base64Image = canvas.toDataURL("image/png");

    // Send base64 image to the image pipeline
    $.ajax({
      url: './image_pipeline',
      dataType: 'json',
      data: {img: base64Image},
      type: 'POST',
      success: function(distanceImage) {
        // Display results on pipeline success
        displayResults(distanceImage.distance);
      },
      error: function(xhr, textStatus, errorThrown){
        // If pipeline fails, simply clear drawing
        clearDrawing();
     },
    });
  }

  // Start loading the image. Triggers previous callbacks.
  img.src = url;
}

/**
 * Clear the drawing svg and temporary div
 */
function clearDrawing() {
  drawingSvg.selectAll("*").remove();
  tempDiv.selectAll("*").remove();
}

/**
 * Clear the result table
 */
function clearResultTable() {
  resultTable.html("");
}


// Drawing line
let line = d3.line()
  .curve(d3.curveBasis);

/**
 * Called when drag is started (beggining of drawing).
 * Clear previous drawing and results.
 * Add new path to the svg.
 */
function dragstarted() {
  clearResultTable();
  clearDrawing();

  let d = d3.event.subject,
    active = drawingSvg.append("path").attr('fill', '#044f67').datum(d),
    x0 = d3.event.x,
    y0 = d3.event.y;

  d3.event.on("drag", function() {
    let x1 = d3.event.x,
      y1 = d3.event.y,
      dx = x1 - x0,
      dy = y1 - y0;

    if (dx * dx + dy * dy > 100) d.push([x0 = x1, y0 = y1]);
    else d[d.length - 1] = [x1, y1];
    active.attr("d", line);
  });
}

/**
 * Search neighbors in the VP tree and display results
 * @param {array[array[number]]} distanceImage
 */
function displayResults(distanceImage) {
  // Search neighbors
  results = vptree.search(distanceImage, NEIGHBORS_COUNT);

  // Get lakeID for each result
  const resultIDs = results.map((result) => lakeIDs[result.i]);

  // Draw the result lakes
  drawResultLakes(resultIDs);
}

/**
 * Distance function for pixels: L1 norm between two pixels
 * @param {number} pixel1 the first pixel
 * @param {number} pixel2 the second pixel
 */
const pixelDistance = (pixel1, pixel2) => Math.abs(pixel1 - pixel2);

/**
 * Distance function for distance image:
 * the pixel-wise sum of the pixelDistance between two pixels.
 */
function imageDistance(im1, im2) {
  let distancesSum = 0;

	for (let i = 0; i < im1.length; i++) {
		for (let j = 0; j < im1[0].length; j++) {
      distancesSum += pixelDistance(im1[i][j], im2[i][j]);
    }
	}

  return distancesSum;
}

/**
 * Load the metadatas from the json
 */
function loadMetadatas() {
  $.ajax({
    url: 'static/lakes_infos.json',
    dataType: 'json',
    data: '',
    type: 'GET',
    success: function(lakes_infos_data) {
      // Put retrieved data in the variable
      lakes_metadatas = lakes_infos_data;
    },
  });
}

/**
 * Construct the Vantage Point Tree
 * Use the distance image of each lakes and the imageDistance distance function
 */
function constructVPtree() {
  // Get the distance images from the json
  $.ajax({
    url: 'static/vptree/distance_images.json',
    dataType: 'json',
    data: '',
    type: 'GET',
    success: function(distancesById) {
      // Then separate lake IDs and distance image into arrays
      for (let id in distancesById) {
        lakeIDs.push(id)
        lakeDistanceImages.push(distancesById[id])
      }

      // Build the VP tree
      vptree = VPTreeFactory.build(lakeDistanceImages, imageDistance);
    },
  });
}

/**
 * Construct Open Street Map url from lakeID
 * @param {string} lakeID
 */
function OSMconstructURL(lakeID) {
  return 'https://openstreetmap.org/' + lakeID.replace('_', '/');
}

/**
 * Table to hold the results of the query
 * Shows the five nearest lakes and their names
 */
const resultTable = d3.select('#resultTable');
const resultTableRect = resultTable.node().getBoundingClientRect();

// Each result takes a portion of the height, depending on the number of neighbors
const lakeResultWidth = resultTableRect.width;
const lakeResultHeight = resultTableRect.height / NEIGHBORS_COUNT;

/**
 * Draw the lake image and names as results
 * @param {array[string]} resultIDs array of lakeIDs
 */
function drawResultLakes(resultIDs) {
  const imageSize = Math.min(lakeResultHeight, lakeResultWidth);

  // For each lakeID in the results
  resultIDs.forEach((lakeID) => {
    // Append a row to the table
    const lakeTr = resultTable
      .append('tr')
        .attr('class', 'lakeTr')
        .style('width', lakeResultWidth + 'px')
        .style('height', lakeResultHeight + 'px');

    // Add a cell containing the lake image
    lakeTr
      .append('td')
        .style('width', imageSize + 'px')
        .style('height', imageSize + 'px')
        .on('mouseover', () => {
          inspectorDiv.attr('class', '');
          inspectorImg.attr('src', lakeImageURL(lakeID))
          svgDiv.attr('class', 'hidden');
        })
        .on('mouseout', () => {
          inspectorDiv.attr('class', 'hidden');
          svgDiv.attr('class', '');
        })
        .append('img')
          .attr('src', lakeImageURL(lakeID));

    // Add a cell containing the lake name
    lakeTr
      .append('td')
        .append('a')
          .attr('class', 'sideText')
          // Link to the OSM page
          .attr('href', OSMconstructURL(lakeID))
          .attr('target', '_blank')
          .text(lakes_metadatas[lakeID].name || UNAMED_LAKE_STR)
  })
}

/**
 * Construct image URL for a given lake ID
 * @param {string} lakeID
 */
const lakeImageURL = (lakeID) =>
  LAKE_IMG_URL + lakeID + '_raw.png';
