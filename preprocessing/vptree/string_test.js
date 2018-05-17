const VPTreeFactory = require('./vptreeJS/vptree.js')

// A whole lot of strings
var stringList = [
	'culture',
	'democracy',
	'metaphor',
	'irony',
	'hypothesis',
	'science',
	'fastuous',
	'integrity',
	'synonym',
	'empathy'     // and on and on...
];

function stringLengthDistance(str1, str2) {
	return Math.abs(str1.length - str2.length);
}


query = 'hello'

// building the tree
vptree = VPTreeFactory.build(stringList, stringLengthDistance);

nearests = vptree.search(query, 3);	// [{"i":1,"d":3}]

console.log('Query', query);

nearests.forEach((nearest) =>  {
	console.log(nearest.d, stringList[nearest.i] )
});