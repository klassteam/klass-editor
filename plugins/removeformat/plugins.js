
Klass.Editor.plugins.implement({

	removeformat: function(editor){

		var $ = Klass.Editor.constants;

		/**
		 * Perform the remove format filters on the passed element.
		 * @param {Klass.editor} editor
		 * @param {Klass.dom.element} element
		 */
		var filter = function(editor, element){
			var filters = editor.storage.removeFormatFilters;
			for (var i = 0, l = filters.length; i < l; i++){
				if (filters[i](element) === false) return false;
			}
			return true;
		};

		var command = {
			
			execute: function(){
			
				var tagsRegex = editor.storage.removeFormatRegex || 
					(editor.storage.removeFormatRegex = new RegExp('^(?:' + editor.config.removeFormatTags.replace(/,/g, '|') + ')$', 'i'));
				
				var removeAttributes = editor.storage.removeAttributes || 
					(editor.storage.removeAttributes = editor.config.removeFormatAttributes.split(','));
				
				var selection = editor.getSelection(),
					ranges = selection.getRanges(1),
					iterator = ranges.createIterator(),
					range;

				while ((range = iterator.getNextRange())){
					if (!range.collapsed) range.enlarge($['ENLARGE_ELEMENT']);
					
					// Bookmark the range so we can re-select it after processing.
					var bookmark = range.createBookmark(),
						startNode = bookmark.startNode,
						endNode = bookmark.endNode,
						currentNode;
					
					var breakParent = function(node){
						// Let's start checking the start boundary.
						var path = new Klass.DOM.elementPath(node);
						var pathElements = path.elements;
						
						for (var i = 1, pathElement; pathElement = pathElements[i]; i++){
							if (pathElement.equals(path.block) || pathElement.equals(path.blockLimit)) break;
							
							// If this element can be removed (even partially).
							if (tagsRegex.test(pathElement.name()) && filter(editor, pathElement)) node.breakParent(pathElement);
						}
					};
					
					breakParent(startNode);

					if (endNode){
						breakParent(endNode);
					
						currentNode = startNode.getNextSourceNode(true, $['NODE_ELEMENT']);
					
						while (currentNode) {
							// If we have reached the end of the selection, stop looping.
							if (currentNode.equals(endNode)) break;
							
							// Cache the next node to be processed. Do it now, because
							// currentNode may be removed.
							var nextNode = currentNode.getNextSourceNode(false, $['NODE_ELEMENT']);
							
							// This node must not be a fake element.
							if (!(currentNode.is('img') && currentNode.data('kse-realelement') && filter(editor, currentNode))){
								// Remove elements nodes that match with this style rules.
								if (tagsRegex.test(currentNode.name())) currentNode.dispose(true);
								else currentNode.removeProperties(removeAttributes);
							}
							
							currentNode = nextNode;
						}
					}
					range.moveToBookmark(bookmark);
				}
				selection.selectRanges(ranges);
			}
		};
		
		editor.addCommand('removeFormat', command);

		editor.storage.removeFormatFilters = [];
	}
	
});

/**
 * Add to a collection of functions to decide whether a specific
 * element should be considered as formatting element and thus
 * could be removed during <b>removeFormat</b> command,
 * Note: Only available with the existence of 'removeformat' plugin.
 * @param {Function} func The function to be called, which will be passed a {Klass.dom.element} element to test.
 */
Klass.Editor.prototype.addRemoveFormatFilter = function(fn){
	return this.storage.removeFormatFilters.push(fn);
};

/**
 * A comma separated list of elements to be removed when executing the "remove
 " format" command. Note that only inline elements are allowed.
 * @type String
 * @default 'b,big,code,del,dfn,em,font,i,ins,kbd,q,samp,small,span,strike,strong,sub,sup,tt,u,var'
 */
Klass.Editor.config.removeFormatTags = 'b,big,code,del,dfn,em,font,i,ins,kbd,q,samp,small,span,strike,strong,sub,sup,tt,u,var';


/**
 * A comma separated list of elements attributes to be removed when executing
 * the "remove format" command.
 * @type string
 * @default 'class,style,lang,width,height,align,hspace,valign'
 */
Klass.Editor.config.removeFormatAttributes = 'class,style,lang,width,height,align,hspace,valign';