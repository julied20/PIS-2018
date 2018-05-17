const fs = require('fs');
const VPTreeFactory = require('./vptreeJS/vptree.min.js');



images = JSON.parse(fs.readFileSync('images.dump'));



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

function roughSizeOfObject( object ) {
    var objectList = [];
    var stack = [ object ];
    var bytes = 0;

    while ( stack.length ) {
        var value = stack.pop();

        if ( typeof value === 'boolean' ) {
            bytes += 4;
        }
        else if ( typeof value === 'string' ) {
            bytes += value.length * 2;
        }
        else if ( typeof value === 'number' ) {
            bytes += 8;
        }
        else if
        (
            typeof value === 'object'
            && objectList.indexOf( value ) === -1
        )
        {
            objectList.push( value );

            for( var i in value ) {
                stack.push( value[ i ] );
            }
        }
    }
    return bytes;
}

function compare(im1, im2) {
  console.log("Comparing", im1.name, 'and', im2.name);
  console.log(pixelDistancesSum(im1.distance, im2.distance));
}


query_index = 0//images.findIndex((im) => im.name == 'Lac de Roy')

// building the tree
vptree = VPTreeFactory.build(images.map((im) => im.distance), pixelDistancesSum);

nearests = vptree.search(images[query_index].distance, 5);	// [{"i":1,"d":3}]

console.log('Query', images[query_index].name);

nearests.forEach((nearest) => {
	console.log(nearest.d, images[nearest.i].name)
});


console.log('Size of vptree', roughSizeOfObject(vptree));
console.log('Size of images', roughSizeOfObject(images));