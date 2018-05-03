let line = d3.line()
    .curve(d3.curveBasis);

const hidden = d3.select('#hidden');

let svg = d3.select("svg")
    .call(d3.drag()
        .container(function() { return this; })
        .subject(function() { let p = [d3.event.x, d3.event.y]; return [p, p]; })
        .on("start", dragstarted)
        .on("end", dragstopped));

function dragstopped() {
  const width = 500;
  const height = 500;

  var doctype = '<?xml version="1.0" standalone="no"?>'
    + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

  // serialize our SVG XML to a string.
  var source = (new XMLSerializer()).serializeToString(svg.node());

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
    let img2 = d3.select('body').append('img')
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
      success: function(data) {
        console.log(data);
      }
    });
  }
  // start loading the image.
  img.src = url;
  }

function dragstarted() {
  svg.selectAll("*").remove();
  hidden.selectAll("*").remove();

  let d = d3.event.subject,
      active = svg.append("path").datum(d),
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

