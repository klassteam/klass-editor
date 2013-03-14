(function(local){

	var dtd = local.Editor.dtd;

	// Elements that may be considered the "Block boundary" in an element path.
	var blockElements = {
		address: 1,
		blockquote: 1,
		dl: 1,
		h1: 1,
		h2: 1,
		h3: 1,
		h4: 1,
		h5: 1,
		h6: 1,
		p: 1,
		pre: 1,
		li: 1,
		dt: 1,
		dd: 1
	};
	
	// Elements that may be considered the "Block limit" in an element path.
	var blockLimitElements = {
		body: 1,
		div: 1,
		table: 1,
		tbody: 1,
		tr: 1,
		td: 1,
		th: 1,
		caption: 1,
		form: 1
	};
	
	// Check if an element contains any block element.
	var checkHasBlock = function(element){
		var childNodes = element.children();
		for (var i = 0, l = childNodes.length; i < l; i++){
			var child = childNodes[i];
			if (child.$element && dtd.$block[child.name()]) return true;
		}
		return false;
	};
	
	/**
	 * @class
	 */
	local.DOM.elementPath = new Class({
		
		initialize: function(lastNode){
			var block = null;
			var blockLimit = null;
			var elements = [];
			
			var element = lastNode;
			
			while (element){
				if (element.$element){
					var tagName = element.name();
					if (!this.lastElement) this.lastElement = element;
					if (!blockLimit){
						if (!block && blockElements[tagName]) block = element;
						if (blockLimitElements[tagName]){
							// DIV is considered the Block, if no block is available (#525)
							// and if it doesn't contain other blocks.
							if (!block && tagName == 'div' && !checkHasBlock(element)) block = element;
							else blockLimit = element;
						}
					}

					elements.push(element);
					
					if (tagName === 'body') break;
				}
				element = element.parent();
			}
			
			this.block = block;
			this.blockLimit = blockLimit;
			this.elements = elements;
		},

		/**
		 * Compares this element path with another one.
		 * @param {Klass.DOM.elementPath} otherPath The elementPath object to be
		 * compared with this one.
		 * @returns {Boolean} "true" if the paths are equal, containing the same
		 * number of elements and the same elements in the same order.
		 */
		compare: function(otherPath){
			var thisElements = this.elements;
			var otherElements = otherPath && otherPath.elements;
			
			if (!otherElements || thisElements.length != otherElements.length) return false;
			
			for (var i = 0, l = thisElements.length; i < l; i++){
				if (!thisElements[i].equals(otherElements[i])) return false;
			}
			
			return true;
		},
		
		contains: function(tagNames){
			var elements = this.elements;
			for (var i = 0, l = elements.length; i < l; i++){
				if (elements[i].name() in tagNames) return elements[i];
			}
			return null;
		}

	});

})(Klass);