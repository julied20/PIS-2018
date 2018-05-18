let vptree;
let lakes_infos;

let lakeIDs = [];
let lakeDistanceImages = [];

constructVPtree();
loadMetadatas();

let line = d3.line()
  .curve(d3.curveBasis);

const hidden = d3.select('#hidden');

const inspectorDiv = d3.select('#inspectorDiv');
const inspectorImg = d3.select('#inspectorImg');

let drawingSvg = d3.select("svg")
  .call(d3.drag()
    .container(function() { return this; })
    .subject(function() { let p = [d3.event.x, d3.event.y]; return [p, p]; })
    .on("start", dragstarted)
    .on("end", dragstopped));

const svgDiv = d3.select("#svgDiv");

const distanceImageSize = 50;
const distanceCanvasScale = 10;

const resultTable = d3.select('#resultTable');
const resultTableRect = resultTable.node().getBoundingClientRect();

const lakeResultWidth = resultTableRect.width;
const lakeResultHeight = resultTableRect.height / 5.0;

const distanceCanvas = d3.select('body')
  .append('canvas')
  .attr('width', distanceImageSize * distanceCanvasScale)
  .attr('height', distanceImageSize * distanceCanvasScale)
  .attr('style', 'display: none')

function dragstopped() {
  const width = 500;
  const height = 500;

  var doctype = '<?xml version="1.0" standalone="no"?>'
    + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

  // serialize our SVG XML to a string.
  var source = (new XMLSerializer()).serializeToString(drawingSvg.node());

  // create a file blob of our SVG.
  var blob = new Blob([ doctype + source], { type: 'image/svg+xml;charset=utf-8' });
  var url = window.URL.createObjectURL(blob);

  // Put the svg into an image tag so that the Canvas element can read it in.
  let img = hidden.append('img')
    .attr('width', width)
    .attr('height', height)
    .node();

  img.onload = function(){
    // Now that the image has loaded, put the image into a canvas element.
    let canvas = hidden.append('canvas').node();
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    let canvasUrl = canvas.toDataURL("image/png");
    let img2 = hidden.append('img')
      .attr('width', width)
      .attr('height', height)
      .node();

    // this is now the base64 encoded version of our PNG! you could optionally
    // redirect the user to download the PNG by sending them to the url with
    // `window.location.href= canvasUrl`.
    img2.src = canvasUrl;

    $.ajax({
      url: './image_pipeline',
      dataType: 'json',
      data: {img: canvasUrl},
      type: 'POST',
      success: function(distanceImage) {
        displayNeighbors(distanceImage.distance);
      }
    });
  }
  // start loading the image.
  img.src = url;
}

function dragstarted() {
  clearResultTable();

  drawingSvg.selectAll("*").remove();
  hidden.selectAll("*").remove();

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

function OSMconstructURL(lakeID) {
  return 'https://openstreetmap.org/' + lakeID.replace('_', '/');
}

function displayNeighbors(distanceImage) {
  drawDistanceImage(distanceImage);

  results = vptree.search(distanceImage, 5);

  lakeIndex = results[0].i;

  const resultIDs = results.map((result) => lakeIDs[result.i]);

  drawLakes(resultIDs);
  //drawDistanceImage(lakeDistanceImages[lakeIndex])
}


const distance = (pixel1, pixel2) => Math.abs(pixel1 - pixel2);

function pixelDistancesSum(im1, im2) {
  let distancesSum = 0;

	for (let i = 0; i < im1.length; i++) {
		for (let j = 0; j < im1[0].length; j++) {
      distancesSum += distance(im1[i][j], im2[i][j]);
    }
	}

  return distancesSum;
}

function loadMetadatas() {
  $.ajax({
    url: 'static/lakes_infos.json',
    dataType: 'json',
    data: '',
    type: 'GET',
    success: function(lakes_infos_data) {
      lakes_infos = lakes_infos_data;
    },
  });
}

function constructVPtree() {
  $.ajax({
    url: 'static/vptree/distance_images.json',
    dataType: 'json',
    data: '',
    type: 'GET',
    success: function(distancesById) {
      for (let id in distancesById) {
        lakeIDs.push(id)
        lakeDistanceImages.push(distancesById[id])
      }

      vptree = VPTreeFactory.build(lakeDistanceImages, pixelDistancesSum);
    },
  });
}


let colorScale = d3.scaleLinear().domain([0,15])
  .interpolate(d3.interpolateHcl)
  .range([d3.rgb("#FFFFFF"), d3.rgb('#00004C')]);


function drawLakes(resultIDs) {
  const imageSize = Math.min(lakeResultHeight, lakeResultWidth);

  resultIDs.forEach((lakeID) => {
    const lakeTr = resultTable
      .append('tr')
        .attr('class', 'lakeTr')
        .style('width', lakeResultWidth + 'px')
        .style('height', lakeResultHeight + 'px');

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
          .attr('src', lakeImageURL(lakeID))
          .attr('width', imageSize)
          .attr('height', imageSize);

    lakeTr
      .append('td')
        .append('a')
          .attr('class', 'sideText')
          .attr('href', OSMconstructURL(lakeID))
          .attr('target', '_blank')
          .text(lakes_infos[lakeID].name || 'Unnamed lake')
  })
}

const lakeImageURL = (lakeID) =>
  'https://storage.googleapis.com/sketch-a-lake/lakes_collection/' + lakeID + '_raw.png';

function drawDistanceImage(distanceImage){
  clearDistanceCanvas();
  let ctx = distanceCanvas.node().getContext("2d");

  for (let x = 0; x < distanceImageSize; x+=1) {
    for (let y = 0; y < distanceImageSize; y+=1) {
      let distance = distanceImage[x][y]

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

function clearResultTable() {
  resultTable.html("");
}

function clearDistanceCanvas() {
  let ctx = distanceCanvas.node().getContext("2d");
  ctx.clearRect(0, 0, distanceImageSize * distanceCanvasScale, distanceImageSize * distanceCanvasScale);
}