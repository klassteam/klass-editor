Klass.DOM.nodes = function(elements, options){
	options = Object.append({ddup: true, cash: true}, options);
	elements = elements || [];
	if ( options.ddup || options.cash ) {
		var uniques = {}, returned = [];
		for (var i = 0, l = elements.length; i < l; i++) {
			var element = document.node(elements[i], !options.cash);
			//if ( options.ddup ) {
			//	if ( uniques[element.uid] ) continue;	
			//	uniques[element.uid] = true;
			//}
			if ( element ) returned.push(element);
		}
		elements = returned;
	}
	return elements;
};