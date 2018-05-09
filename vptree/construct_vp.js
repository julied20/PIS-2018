const fs = require('fs');
const VPTreeFactory = require('./vptreeJS/vptree.min.js');

distancesById = JSON.parse(fs.readFileSync('../json/distances_images.json'));

ids = []
images = []

for (let id in distancesById) {
  ids.push(id)
  images.push(distancesById[id])
}


const distance = (pixel1, pixel2) => Math.abs(pixel1 - pixel2)

function pixelDistancesSum(im1, im2) {
  let distancesSum = 0;

	for (let i = 0; i < im1.length; i++) {
		for (let j = 0; j < im1[0].length; j++) {
      distancesSum += distance(im1[i][j], im2[i][j]);
    }
	}

  return distancesSum;
}


query_index = 0

// building the tree
vptree = VPTreeFactory.build(images, pixelDistancesSum);

fs.writeFile("./precomputed_vptree.json", JSON.stringify(vptree), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});

/*nearests = vptree.search(distancesById['way_219554999'], 5);

console.log('Query: lake with id', ids[0]);

nearests.forEach((nearest) => {
	console.log(nearest.d, ids[nearest.i])
});*/
