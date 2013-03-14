
// v0.2.x Reconstruction

(function(local){

	var blockElements = {
		address: 1,
		div: 1,
		h1: 1,
		h2: 1,
		h3: 1,
		h4: 1,
		h5: 1,
		h6: 1,
		p: 1,
		pre: 1
	};

	var objectElements = {
		a: 1,
		embed: 1,
		hr: 1,
		img: 1,
		li: 1,
		object: 1,
		ol: 1,
		table: 1,
		td: 1,
		tr: 1,
		th: 1,
		ul: 1,
		dl: 1,
		dt: 1,
		dd: 1,
		form: 1
	};
	
	var semicolonFixRegex = /\s*(?:;\s*|$)/;

	var notBookmark = local.DOM.walker.bookmark(0, 1);

	var editorConstructor = local.Editor;

	var utils = editorConstructor.utils;

	var $ = editorConstructor.constants;
	
	editorConstructor.style = new Class({
		
		initialize: function(styleDefinition, variablesValues){
			if (variablesValues){
				styleDefinition = utils.clone(styleDefinition);
				
				replaceVariables(styleDefinition.attributes, variablesValues);
				replaceVariables(styleDefinition.styles, variablesValues);
			}
			
			var element = this.element = (styleDefinition.element || '*').toLowerCase();
			
			this.styleDefinition = styleDefinition;

			this.syncType(styleDefinition.type || 
				(blockElements[element] ? $['STYLE_BLOCK'] : 
				objectElements[element] ? $['STYLE_OBJECT'] : 
				$['STYLE_INLINE']));

			if (typeof element === 'object') this.syncType($['STYLE_OBJECT']);
		},

		syncType: function(type){
			if (type){
				this.type = type;
				if ($['STYLE_BLOCK'] === type) this.$block = true;
				if ($['STYLE_OBJECT'] === type) this.$object = true;
				if ($['STYLE_INLINE'] === type) this.$inline = true;
			}
		},
	
		apply: function(document, ignoreCollapsed){
			applyStyle.call(this, document, false, ignoreCollapsed);
		},
		
		remove: function(document, ignoreCollapsed){
			applyStyle.call(this, document, true, ignoreCollapsed);
		},
		
		applyToRange: function(range){
			return (this.$inline ? applyInlineStyle : this.$block ? applyBlockStyle : this.$object ? applyObjectStyle : null).call(this, range);
		},
		
		removeFromRange: function(range){
			return (this.$inline ? removeInlineStyle : this.$block ? removeBlockStyle : this.$object ? removeObjectStyle : null).call(this, range);
		},
		
		applyToObject: function(element){
			setupElement(element, this);
		},
		
		/**
		 * Get the style state inside an element path. Returns "true" if the
		 * element is active in the path.
		 */
		checkActive: function(elementPath){
			switch (this.type){
				case $['STYLE_BLOCK']:
					return this.checkElementRemovable(elementPath.block || elementPath.blockLimit, true);
					
				case $['STYLE_OBJECT']:
				case $['STYLE_INLINE']:
					
					var elements = elementPath.elements;
					
					for (var i = 0, element, l = elements.length; i < l; i++){
						element = elements[i];
						
						if (this.$inline && (element == elementPath.block || element == elementPath.blockLimit)) continue;
						
						if (this.$object && !(element.name() in objectElements)) continue;
						
						if (this.checkElementRemovable(element, true)) return true;
					}
			}
			return false;
		},
		
		/**
		 * Whether this style can be applied at the element path.
		 * @param elementPath
		 */
		checkApplicable: function(elementPath){
			switch (this.type){
				case $['STYLE_INLINE']:
				case $['STYLE_BLOCK']:
					break;
					
				case $['STYLE_OBJECT']:
					return elementPath.lastElement.getAscendant(this.element, true);
			}
			
			return true;
		},

		// Check if the element matches the current style definition.
		checkElementMatch: function(element, match){
			var def = this.styleDefinition;

			if (!element && !element.ignoreReadonly && element.isReadOnly()) return false;

			var attributes, name = element.name();

			// If the element name is the same as the style name.
			if (typeof this.element === 'string' ? name === this.element : name in this.element){
				// If no attributes are defined in the element.
				if (!match && !element.hasAttributes()) return true;

				attributes = getAttributesForComparison(def);
				if (attributes._length){
					for (var attribute in attributes){
						if (attribute == '_length') continue;
						
						var property = element.getProperty(attribute) || '';
						
						// Special treatment for 'style' attribute is required.
						if (attribute == 'style' ? compareCssText(attributes[attribute], normalizeCssText(property, false)) : attributes[attribute] == property){
							if (!match) return true;
						} else if (match) return false;
					}
					if (match) return true;
				} else return true;
			}

			return false;
		},
		
		// Checks if an element, or any of its attributes, is removable by the
		// current style definition.
		checkElementRemovable: function(element, match){
			// Check element matches the style itself.
			if (this.checkElementMatch(element, match)) return true;
			
			// Check if the element can be somehow overriden.
			var override = getOverrides(this)[element.name()];
			if (override){
				// If no attributes have been defined, remove the element.
				if (!(attributes = override.attributes)) return true;
				
				for (var i = 0, l = attributes.length; i < l; i++){
					attribute = attributes[i][0];
					var actualAttrValue = element.getProperty(attribute);
					if (actualAttrValue){
						var value = attributes[i][1];
						
						// Remove the attribute if:
						//    - The override definition value is null;
						//    - The override definition value is a string that
						//      matches the attribute value exactly.
						//    - The override definition value is a regex that
						//      has matches in the attribute value.
						if (value === null || (typeof value == 'string' && actualAttrValue == value) || value.test(actualAttrValue)) return true;
					}
				}
			}
			return false;
		},
		
		// Builds the preview HTML based on the styles definition.
		buildPreview: function(){
			var styleDefinition = this.styleDefinition, html = [], tagName = styleDefinition.element;
			// Avoid <bdo> in the preview.
			if (tagName == 'bdo') tagName = 'span';
			
			html = ['<', tagName];
			
			// Assign all defined attributes.
			var attributes = styleDefinition.attributes;
			if (attributes){
				for (var attribute in attributes){
					html.push(' ', attribute, '="', attributes[attribute], '"');
				}
			}
			
			// Assign the style attribute.
			var cssStyle = editorConstructor.style.getStyleText(styleDefinition);
			if (cssStyle) html.push(' style="', cssStyle, '"');
			
			html.push('>', styleDefinition.name, '</', tagName, '>');
			
			return html.join('');
		}

	});
	
	// Build the cssText based on the styles definition.
	editorConstructor.style.getStyleText = function(styleDefinition){
		// If we have already computed it, just return it.
		var stylesDef = styleDefinition._ST;
		if (stylesDef) return stylesDef;
		
		stylesDef = styleDefinition.styles;
		
		// Builds the StyleText.
		var stylesText = (styleDefinition.attributes && styleDefinition.attributes['style']) || '', specialStylesText = '';
		
		if (stylesText.length) stylesText = stylesText.replace(semicolonFixRegex, ';');
		
		for (var style in stylesDef){
			var styleVal = stylesDef[style], text = (style + ':' + styleVal).replace(semicolonFixRegex, ';');
			
			// Some browsers don't support 'inherit' property value, leave them intact. (#5242)
			if (styleVal == 'inherit') specialStylesText += text;
			else stylesText += text;
		}
		
		// Browsers make some changes to the style when applying them. So, here
		// we normalize it to the browser format.
		if (stylesText.length) stylesText = normalizeCssText(stylesText);
		
		stylesText += specialStylesText;
		
		// Return it, saving it to the next request.
		return (styleDefinition._ST = stylesText);
	};
	
	// Gets the parent element which blocks the styling for an element. This
	// can be done through read-only elements (contenteditable=false) or
	// elements with the "data-kse-nostyle" attribute.
	function getUnstylableParent(element){
		var unstylable, editable;
		
		while ((element = element.parent())){
			if (element.is('body')) break;
			
			if (element.getProperty('data-nostyle')) unstylable = element;
			else if (!editable){
				var contentEditable = element.getProperty('contentEditable');
				
				if (contentEditable == 'false') unstylable = element;
				else if (contentEditable == 'true') editable = 1;
			}
		}
		
		return unstylable;
	}
	
	function applyInlineStyle(range){
		var document = range.document;

		if (range.collapsed){
			// Create the element to be inserted in the DOM.
			var collapsedElement = getElement(this, document);
			
			// Insert the empty element into the DOM at the range position.
			range.insertNode(collapsedElement);
			
			// Place the selection right inside the empty element.
			range.moveToPosition(collapsedElement, $['POSITION_BEFORE_END']);
			
			return;
		}

		var elementName = this.element;
		var def = this.styleDefinition;
		var isUnknownElement;

		// Indicates that fully selected read-only elements are to be included in the styling range.
		var includeReadonly = def.includeReadonly;
		
		// If the read-only inclusion is not available in the definition, try
		// to get it from the document data.
		if (includeReadonly == undefined) includeReadonly = document.retrieve('kse-includeReadonly');

		// Get the DTD definition for the element. Defaults to "span".
		var dtd = editorConstructor.dtd[elementName] || (isUnknownElement = true, editorConstructor.dtd.span);

		// Expand the range.
		range.enlarge($['ENLARGE_ELEMENT']);
		range.trim();

		// Get the first node to be processed and the last, which concludes the
		// processing.
		var boundaryNodes = range.createBookmark(), firstNode = boundaryNodes.startNode, lastNode = boundaryNodes.endNode;

		var currentNode = firstNode;
		
		var styleRange;

		// Check if the boundaries are inside non stylable elements.
		var firstUnstylable = getUnstylableParent(firstNode), lastUnstylable = getUnstylableParent(lastNode);

		// If the first element can't be styled, we'll start processing right
		// after its unstylable root.
		if (firstUnstylable) currentNode = firstUnstylable.getNextSourceNode(true);

		// If the last element can't be styled, we'll stop processing on its
		// unstylable root.
		if (lastUnstylable) lastNode = lastUnstylable;

		// Do nothing if the current node now follows the last node to be processed.
		if (currentNode.compareDocumentPosition(lastNode) == $['POSITION_FOLLOWING']) currentNode = 0;

		while (currentNode){
			var applyStyle = false;

			if (currentNode.equals(lastNode)){
				currentNode = null;
				applyStyle = true;
			} else {
				var nodeName = currentNode.$element ? currentNode.name() : null;
				var nodeIsReadonly = nodeName && (currentNode.getProperty('contentEditable') == 'false');
				var nodeIsNoStyle = nodeName && currentNode.getProperty('data-nostyle');

				if (nodeName && currentNode.data('kse-bookmark')){
					currentNode = currentNode.getNextSourceNode(true);
					continue;
				}

				// Check if the current node can be a child of the style element.
				if (!nodeName || (dtd[nodeName] && !nodeIsNoStyle && (!nodeIsReadonly || includeReadonly) &&
				(currentNode.compareDocumentPosition(lastNode) | $['POSITION_PRECEDING'] | $['POSITION_IDENTICAL'] | $['POSITION_IS_CONTAINED']) == ($['POSITION_PRECEDING'] + $['POSITION_IDENTICAL'] + $['POSITION_IS_CONTAINED']) &&
				(!def.childRule || def.childRule(currentNode)))){
					var currentParent = currentNode.parent();
					
					// Check if the style element can be a child of the current
					// node parent or if the element is not defined in the DTD.
					if (currentParent && ((currentParent.dtd() || editorConstructor.dtd.span)[elementName] || isUnknownElement) &&
					(!def.parentRule || def.parentRule(currentParent))){
						// This node will be part of our range, so if it has not
						// been started, place its start right before the node.
						// In the case of an element node, it will be included
						// only if it is entirely inside the range.
						if (!styleRange && (!nodeName || !editorConstructor.dtd.$removeEmpty[nodeName] || (currentNode.compareDocumentPosition(lastNode) | $['POSITION_PRECEDING'] | $['POSITION_IDENTICAL'] | $['POSITION_IS_CONTAINED']) == ($['POSITION_PRECEDING'] + $['POSITION_IDENTICAL'] + $['POSITION_IS_CONTAINED']))){
							styleRange = new local.DOM.range(document);
							styleRange.setStartBefore(currentNode);
						}

						// Non element nodes, readonly elements, or empty
						// elements can be added completely to the range.
						if (currentNode.$text || nodeIsReadonly || (currentNode.$element && !currentNode.length())){
							var includedNode = currentNode;
							var parentNode;
							
							// This node is about to be included completelly, but,
							// if this is the last node in its parent, we must also
							// check if the parent itself can be added completelly
							// to the range.
							while ((applyStyle = !includedNode.next(notBookmark)) &&
							(parentNode = includedNode.parent(), dtd[parentNode.name()]) &&
							(parentNode.compareDocumentPosition(firstNode) | $['POSITION_FOLLOWING'] | $['POSITION_IDENTICAL'] | $['POSITION_IS_CONTAINED']) == ($['POSITION_FOLLOWING'] + $['POSITION_IDENTICAL'] + $['POSITION_IS_CONTAINED']) &&
							(!def.childRule || def.childRule(parentNode))){
								includedNode = parentNode;
							}
							
							styleRange.setEndAfter(includedNode);
						}
					} else applyStyle = true;
				} else applyStyle = true;

				// Get the next node to be processed.
				currentNode = currentNode.getNextSourceNode(nodeIsNoStyle || nodeIsReadonly);
			}

			// Apply the style if we have something to which apply it.
			if (applyStyle && styleRange && !styleRange.collapsed){

				// Build the style element, based on the style object definition.
				var styleNode = getElement(this, document), styleHasAttrs = styleNode.hasAttributes();

				// Get the element that holds the entire range.
				var parent = styleRange.getCommonAncestor();
				
				var removeList = {
					styles: {},
					attrs: {},
					// Styles cannot be removed.
					blockedStyles: {},
					// Attrs cannot be removed.
					blockedAttrs: {}
				};
				
				var attName, styleName, value;

				// Loop through the parents, removing the redundant attributes
				// from the element to be applied.
				while (styleNode && parent){
					if (parent.name() == elementName){
						for (attName in def.attributes){
							if (removeList.blockedAttrs[attName] || !(value = parent.getProperty(styleName))) continue;
							
							if (styleNode.getProperty(attName) == value) removeList.attrs[attName] = 1;
							else removeList.blockedAttrs[attName] = 1;
						}
						
						for (styleName in def.styles){
							if (removeList.blockedStyles[styleName] || !(value = parent.style(styleName))) continue;
							
							if (styleNode.style(styleName) == value) removeList.styles[styleName] = 1;
							else removeList.blockedStyles[styleName] = 1;
						}
					}
					
					parent = parent.parent();
				}

				for (attName in removeList.attrs) 
					styleNode.removeProperty(attName);

				for (styleName in removeList.styles) 
					styleNode.removeStyle(styleName);

				if (styleHasAttrs && !styleNode.hasAttributes()) styleNode = null;

				if (styleNode){
					// Move the contents of the range to the style element.
					styleRange.extractContents().appendTo(styleNode);

					// Here we do some cleanup, removing all duplicated
					// elements from the style element.
					removeFromInsideElement(this, styleNode);
					
					// Insert it into the range position (it is collapsed after
					// extractContents.
					styleRange.insertNode(styleNode);
					
					// Let's merge our new style with its neighbors, if possible.
					styleNode.mergeSiblings();

					// Replication current selection text
					if (def.replication) styleNode.html(def.replication);

					// As the style system breaks text nodes constantly, let's normalize
					// things for performance.
					// With IE, some paragraphs get broken when calling normalize()
					// repeatedly. Also, for IE, we must normalize body, not documentElement.
					// IE is also known for having a "crash effect" with normalize().
					// We should try to normalize with IE too in some way, somewhere.
					if (!local.env.ie) styleNode[0].normalize();
				} else {
					styleNode = local.DOM.createElement('span');
					styleRange.extractContents().appendTo(styleNode);
					styleRange.insertNode(styleNode);
					removeFromInsideElement(this, styleNode);
					styleNode.dispose(true);
				}

				// Style applied, let's release the range, so it gets
				// re-initialization in the next loop.
				styleRange = null;
			}
		}

		// Remove the bookmark nodes.
		range.moveToBookmark(boundaryNodes);

		// Minimize the result range to exclude empty text nodes. (#5374)
		range.shrink($['SHRINK_TEXT']);
	}
	
	function removeInlineStyle(range){
		/*
		 * Make sure our range has included all "collpased" parent inline nodes so
		 * that our operation logic can be simpler.
		 */
		range.enlarge($['ENLARGE_ELEMENT']);

		var bookmark = range.createBookmark(), startNode = bookmark.startNode;

		if (range.collapsed){
		
			var startPath = new local.DOM.elementPath(startNode.parent()),   // The topmost element in elementspatch which we should jump out of.
			boundaryElement;
			
			
			for (var i = 0, element; i < startPath.elements.length && (element = startPath.elements[i]); i++){
				/*
				 * 1. If it's collaped inside text nodes, try to remove the style from the whole element.
				 *
				 * 2. Otherwise if it's collapsed on element boundaries, moving the selection
				 *  outside the styles instead of removing the whole tag,
				 *  also make sure other inner styles were well preserverd.(#3309)
				 */
				if (element == startPath.block || element == startPath.blockLimit) break;
				
				if (this.checkElementRemovable(element)){
					var isStart;
					
					if (range.collapsed &&
					(range.checkBoundaryOfElement(element, $['END']) ||
					(isStart = range.checkBoundaryOfElement(element, $['START'])))){
						boundaryElement = element;
						boundaryElement.match = isStart ? 'start' : 'end';
					} else {
						/*
						 * Before removing the style node, there may be a sibling to the style node
						 * that's exactly the same to the one to be removed. To the user, it makes
						 * no difference that they're separate entities in the DOM tree. So, merge
						 * them before removal.
						 */
						element.mergeSiblings();
						removeFromElement(this, element);
						
					}
				}
			}
			
			// Re-create the style tree after/before the boundary element,
			// the replication start from bookmark start node to define the
			// new range.
			if (boundaryElement){
				var clonedElement = startNode;
				for (i = 0;; i++){
					var newElement = startPath.elements[i];
					if (newElement.equals(boundaryElement)) break;
					// Avoid copying any matched element.
					else if (newElement.match) continue;
					else newElement = newElement.clone();
					newElement.append(clonedElement);
					clonedElement = newElement;
				}
				clonedElement[boundaryElement.match == 'start' ? 'injectBefore' : 'injectAfter'](boundaryElement);
			}
		} else {
			/*
			 * Now our range isn't collapsed. Lets walk from the start node to the end
			 * node via DFS and remove the styles one-by-one.
			 */
			var endNode = bookmark.endNode, me = this;
			
			/*
			 * Find out the style ancestor that needs to be broken down at startNode
			 * and endNode.
			 */
			function breakNodes(){
				var startPath = new local.DOM.elementPath(startNode.parent()),
					endPath = new local.DOM.elementPath(endNode.parent()), 
					breakStart = null, breakEnd = null;
				for (var i = 0; i < startPath.elements.length; i++){
					var element = startPath.elements[i];
					
					if (element == startPath.block || element == startPath.blockLimit) break;
					
					if (me.checkElementRemovable(element)) breakStart = element;
				}
				for (i = 0; i < endPath.elements.length; i++){
					element = endPath.elements[i];
					
					if (element == endPath.block || element == endPath.blockLimit) break;
					
					if (me.checkElementRemovable(element)) breakEnd = element;
				}
				
				if (breakEnd) endNode.breakParent(breakEnd);
				if (breakStart) startNode.breakParent(breakStart);
			}
			breakNodes();

			// Now, do the DFS walk.
			var currentNode = startNode.next();
			while (!currentNode.equals(endNode)){
				/*
				 * Need to get the next node first because removeFromElement() can remove
				 * the current node from DOM tree.
				 */
				var nextNode = currentNode.getNextSourceNode();
				if (currentNode.$element && this.checkElementRemovable(currentNode)){
					// Remove style from element or overriding element.
					if (currentNode.is(this.element)) removeFromElement(this, currentNode);
					else removeOverrides(currentNode, getOverrides(this)[currentNode.name()]);
	
					/*
					 * removeFromElement() may have merged the next node with something before
					 * the startNode via mergeSiblings(). In that case, the nextNode would
					 * contain startNode and we'll have to call breakNodes() again and also
					 * reassign the nextNode to something after startNode.
					 */
					if (nextNode.$element && nextNode.contains(startNode)){
						breakNodes();
						nextNode = startNode.next();
					}
				}
				currentNode = nextNode;

			}
		}

		range.moveToBookmark(bookmark);
	}
	
	function applyObjectStyle(range){
		var root = range.getCommonAncestor(true, true), element = root.getAscendant(this.element, true);
		element && setupElement(element, this);
	}
	
	function removeObjectStyle(range){
		var root = range.getCommonAncestor(true, true), element = root.getAscendant(this.element, true);
		
		if (!element) return;
		
		var style = this;
		var def = style.styleDefinition;
		var attributes = def.attributes;
		var styles = editorConstructor.style.getStyleText(def);
		
		// Remove all defined attributes.
		if (attributes){
			for (var att in attributes){
				element.removeProperty(att, attributes[att]);
			}
		}
		
		// Assign all defined styles.
		if (def.styles){
			for (var i in def.styles){
				if (!def.styles.hasOwnProperty(i)) continue;
				
				element.removeStyle(i);
			}
		}
	}
	
	function applyBlockStyle(range){
		// Serializible bookmarks is needed here since
		// elements may be merged.
		var bookmark = range.createBookmark(true);
		
		var iterator = range.createIterator();
		iterator.enforceRealBlocks = true;
		
		// make recognize <br /> tag as a separator in ENTER_BR mode (#5121)
		if (this.enterMode) iterator.enlargeBr = (this.enterMode != $['ENTER_BR']);
		
		var block;
		var doc = range.document;
		var previousPreBlock;
		
		while ((block = iterator.getNextParagraph())) // Only one =
		{
			var newBlock = getElement(this, doc, block);
			replaceBlock(block, newBlock);
		}
		
		range.moveToBookmark(bookmark);
	}

	function removeBlockStyle(range){
		// Serializible bookmarks is needed here since
		// elements may be merged.
		var bookmark = range.createBookmark(1);
		
		var iterator = range.createIterator();
		iterator.enforceRealBlocks = true;
		iterator.enlargeBr = this.enterMode != $['ENTER_BR'];
		
		var block;
		while ((block = iterator.getNextParagraph())) {
			if (this.checkElementRemovable(block)) {
				// <pre> get special treatment.
				if (block.is('pre')) {
					var newBlock = this.enterMode == $['ENTER_BR'] ? null : range.document.createElement(this.enterMode == $['ENTER_P'] ? 'p' : 'div');
					
					newBlock && block.copyAttributes(newBlock);
					replaceBlock(block, newBlock);
				} else removeFromElement(this, block, 1);
			}
		}
		
		range.moveToBookmark(bookmark);
	}
	
	// Replace the original block with new one, with special treatment
	// for <pre> blocks to make sure content format is well preserved, and merging/splitting adjacent
	// when necessary.(#3188)
	function replaceBlock(block, newBlock){
		var removeBlock = !newBlock;

		if (removeBlock){
			newBlock = block.getDocument().createElement('div');
			block.copyAttributes(newBlock);
		}

		var newBlockIsPre = newBlock && newBlock.is('pre');
		var blockIsPre = block.is('pre');
		
		var isToPre = newBlockIsPre && !blockIsPre;
		var isFromPre = !newBlockIsPre && blockIsPre;
		
		if (isToPre) newBlock = toPre(block, newBlock);
		else if (isFromPre)  // Split big <pre> into pieces before start to convert.
		newBlock = fromPres(removeBlock ? [block.html()] : splitIntoPres(block), newBlock);
		else block.moveChildren(newBlock);
		
		newBlock.replaces(block);
		
		if (newBlockIsPre) mergePre(newBlock);
		else if (removeBlock) removeNoAttribsElement(newBlock);
	}
	
	var nonWhitespaces = local.DOM.walker.whitespaces(true);
	/**
	 * Merge a <pre> block with a previous sibling if available.
	 */
	function mergePre(preBlock){
		var previousBlock;
		if (!((previousBlock = preBlock.prev(nonWhitespaces)) && previousBlock.is && previousBlock.is('pre'))) return;
		
		// Merge the previous <pre> block contents into the current <pre>
		// block.
		//
		// Another thing to be careful here is that currentBlock might contain
		// a '\n' at the beginning, and previousBlock might contain a '\n'
		// towards the end. These new lines are not normally displayed but they
		// become visible after merging.
		var mergedHtml = replace(previousBlock.html(), /\n$/, '') + '\n\n' +
		replace(preBlock.html(), /^\n/, '');
		
		// Krugle: IE normalizes innerHTML from <pre>, breaking whitespaces.
		if (local.env.ie) preBlock[0].outerHTML = '<pre>' + mergedHtml + '</pre>';
		else preBlock.html(mergedHtml);
		
		previousBlock.dispose();
	}
	
	/**
	 * Split into multiple <pre> blocks separated by double line-break.
	 * @param preBlock
	 */
	function splitIntoPres(preBlock){
		// Exclude the ones at header OR at tail,
		// and ignore bookmark content between them.
		var duoBrRegex = /(\S\s*)\n(?:\s|(<span[^>]+data-kse-bookmark.*?\/span>))*\n(?!$)/gi, 
			blockName = preBlock.name(), 
			splitedHtml = replace(preBlock.outerHTML(), duoBrRegex, function(match, charBefore, bookmark){
				return charBefore + '</pre>' + bookmark + '<pre>';
			});
		
		var pres = [];
		splitedHtml.replace(/<pre\b.*?>([\s\S]*?)<\/pre>/gi, function(match, preContent){
			pres.push(preContent);
		});
		return pres;
	}
	
	// Wrapper function of String::replace without considering of head/tail bookmarks nodes.
	function replace(str, regexp, replacement){
		var headBookmark = '', tailBookmark = '';
		
		str = str.replace(/(^<span[^>]+data-kse-bookmark.*?\/span>)|(<span[^>]+data-kse-bookmark.*?\/span>$)/gi, function(str, m1, m2){
			m1 && (headBookmark = m1);
			m2 && (tailBookmark = m2);
			return '';
		});
		return headBookmark + str.replace(regexp, replacement) + tailBookmark;
	}
	/**
	 * Converting a list of <pre> into blocks with format well preserved.
	 */
	function fromPres(preHtmls, newBlock){
		var docFrag = new local.DOM.fragment(newBlock.getDocument());
		var spaceChar = '&nbsp';
		for (var i = 0, l = preHtmls.length; i < l; i++){
			var blockHtml = preHtmls[i];
			
			// 1. Trim the first and last line-breaks immediately after and before <pre>,
			// they're not visible.
			blockHtml = blockHtml.replace(/(\r\n|\r)/g, '\n');
			blockHtml = replace(blockHtml, /^[ \t]*\n/, '');
			blockHtml = replace(blockHtml, /\n$/, '');
			// 2. Convert spaces or tabs at the beginning or at the end to &nbsp;
			blockHtml = replace(blockHtml, /^[ \t]+|[ \t]+$/g, function(match, offset, s){
				if (match.length == 1) return spaceChar;
				else if (!offset) return spaceChar.repeat(match.length - 1) + ' ';
				else return ' ' + spaceChar.repeat(match.length - 1);
			});
			
			// 3. Convert \n to <BR>.
			// 4. Convert contiguous (i.e. non-singular) spaces or tabs to &nbsp;
			blockHtml = blockHtml.replace(/\n/g, '<br>');
			blockHtml = blockHtml.replace(/[ \t]{2,}/g, function(match){
				return spaceChar.repeat(match.length - 1) + ' ';
			});

			if (docFrag){
				var newBlockClone = newBlock.clone();
				newBlockClone.html(blockHtml).appendTo(docFrag);
			} else newBlock.html(blockHtml);
			
		}
		return docFrag || newBlock;
	}
	
	/**
	 * Converting from a non-PRE block to a PRE block in formatting operations.
	 */
	function toPre(block, newBlock){
		var bogus = block.getBogus();
		bogus && bogus.dispose();

		// First trim the block content.
		var preHtml = block.html();
		
		// 1. Trim head/tail spaces, they're not visible.
		preHtml = replace(preHtml, /(?:^[ \t\n\r]+)|(?:[ \t\n\r]+$)/g, '');
		// 2. Delete ANSI whitespaces immediately before and after <BR> because
		//    they are not visible.
		preHtml = preHtml.replace(/[ \t\r\n]*(<br[^>]*>)[ \t\r\n]*/gi, '$1');
		// 3. Compress other ANSI whitespaces since they're only visible as one
		//    single space previously.
		// 4. Convert &nbsp; to spaces since &nbsp; is no longer needed in <PRE>.
		preHtml = preHtml.replace(/([ \t\n\r]+|&nbsp;)/g, ' ');
		// 5. Convert any <BR /> to \n. This must not be done earlier because
		//    the \n would then get compressed.
		preHtml = preHtml.replace(/<br\b[^>]*>/gi, '\n');
		
		// Krugle: IE normalizes innerHTML to <pre>, breaking whitespaces.
		if (local.env.ie){
			var temp = block.getDocument().createElement('div').append(newBlock);
			newBlock[0].outerHTML = '<pre>' + preHtml + '</pre>';
			newBlock.copyAttributes(temp.first());
			newBlock = temp.first().dispose();
		} else newBlock.html(preHtml);
		
		return newBlock;
	}
	
	// Removes a style from an element itself, don't care about its subtree.
	function removeFromElement(style, element){
		var def = style.styleDefinition, 
			attributes = Object.merge({}, def.attributes, getOverrides(style)[element.name()]), 
			styles = def.styles,
			removeEmpty = utils.isEmpty(attributes) && utils.isEmpty(styles);
		
		// Remove definition attributes/style from the elemnt.
		for (var attribute in attributes){
			// The 'class' element value must match (#1318).
			if ((attribute == 'class' || style.styleDefinition.fullMatch) &&
			element.getProperty(attribute) != normalizeProperty(attribute, attributes[attribute])) continue;
			removeEmpty = element.hasAttribute(attribute);
			element.removeProperty(attribute);
		}
		
		for (var styleName in styles){
			// Full match style insist on having fully equivalence. (#5018)
			if (style.styleDefinition.fullMatch &&
			element.style(styleName) != normalizeProperty(styleName, styles[styleName], true)) continue;
			
			removeEmpty = removeEmpty || !!element.style(styleName);
			element.removeStyle(styleName);
		}

		if (removeEmpty){
			def.alwaysRemoveElement ? removeNoAttribsElement(element, true) : 
				!editorConstructor.dtd.$block[element.name()] || style.enterMode == $['ENTER_BR'] && !element.hasAttributes() ? 
				removeNoAttribsElement(element) : 
				element.rename(style.enterMode == $['ENTER_P'] ? 'p' : 'div');
		}
	}
	
	// Removes a style from inside an element.
	function removeFromInsideElement(style, element){
		var def = style.styleDefinition, overrides = getOverrides(style);

		var innerElements = element.find(style.element);

		for (var i = innerElements.length; --i >= 0;) 
			removeFromElement(style, innerElements[i]);
		
		// Now remove any other element with different name that is
		// defined to be removed or overriden.
		if (def.removed && !overrides[def.removed]){
			overrides = Object.clone(overrides);
			overrides[def.removed] = def.removed;
		}

		for (var overrideElement in overrides){
			if (overrideElement != style.element){
				innerElements = element.find(overrideElement);
				for (i = innerElements.length - 1; i >= 0; i--){
					var innerElement = innerElements[i];
					removeOverrides(innerElement, overrides[overrideElement]);
				}
			}
		}
		
	}
	
	/**
	 * Remove overriding styles/attributes from the specific element.
	 * Note: Remove the element if no attributes remain.
	 * @param {Object} element
	 * @param {Object} overrides
	 */
	function removeOverrides(element, overrides){
		var attributes = overrides && overrides.attributes;
		
		if (attributes){
			for (var i = 0, l = attributes.length; i < l; i++){
				var attribute = attributes[i][0], actualAttrValue;
				
				if ((actualAttrValue = element.getProperty(attribute))){
					var value = attributes[i][1];
					
					// Remove the attribute if:
					//    - The override definition value is null ;
					//    - The override definition valie is a string that
					//      matches the attribute value exactly.
					//    - The override definition value is a regex that
					//      has matches in the attribute value.
					if (value === null ||
					(value.test && value.test(actualAttrValue)) ||
					(typeof value == 'string' && actualAttrValue == value)) element.removeProperty(attribute);
				}
			}
		}
		
		removeNoAttribsElement(element);
	}
	
	// If the element has no more attributes, remove it.
	function removeNoAttribsElement(element, forceRemove){
		// If no more attributes remained in the element, remove it,
		// leaving its children.
		if (!element.hasAttributes() || forceRemove){
			if (editorConstructor.dtd.$block[element.name()]){
				var previous = element.prev(nonWhitespaces), next = element.next(nonWhitespaces);
				
				if (previous && (previous.$text || !previous.isBlockBoundary({br: 1}))) element.prepend('br');
				if (next && (next.$text || !next.isBlockBoundary({br: 1}))) element.append('br');
				
				element.dispose(true);
			} else {
				// Removing elements may open points where merging is possible,
				// so let's cache the first and last nodes for later checking.
				var firstChild = element.first();
				var lastChild = element.last();
				
				element.dispose(true);
				
				if (firstChild){
					// Check the cached nodes for merging.
					firstChild.$element && firstChild.mergeSiblings();
					
					if (lastChild && !firstChild.equals(lastChild) && lastChild.$element) lastChild.mergeSiblings();
				}
			}
		}
	}
	
	function getElement(style, targetDocument, element){
		var newElement;
		
		var def = style.styleDefinition;
		
		var elementName = style.element;

		// The "*" element name will always be a span for this function.
		if (elementName == '*') elementName = 'span';
		
		// Create the element.
		newElement = local.DOM.createElement(elementName, null, targetDocument);
		
		// #6226: attributes should be copied before the new ones are applied
		if (element) element.copyAttributes(newElement);

		newElement = setupElement(newElement, style);

		// Avoid ID duplication.
		if (targetDocument.retrieve('doc_processing_style') && newElement.hasAttribute('id')) newElement.removeProperty('id');
		else targetDocument.store('doc_processing_style', 1);

		return newElement;
	}
	
	function setupElement(element, style){
		var definition = style.styleDefinition;
		var attributes = definition.attributes;
		var styles = editorConstructor.style.getStyleText(definition);
		
		// Assign all defined attributes.
		if (attributes){
			for (var attribute in attributes){
				element.setProperty(attribute, attributes[attribute]);
			}
		}
		
		// Assign all defined styles.
		if (styles) element.setProperty('style', styles);
		
		return element;
	}
	
	var varRegex = /#\((.+?)\)/g;
	function replaceVariables(list, variablesValues){
		for (var item in list){
			list[item] = list[item].replace(varRegex, function(match, varName){
				return variablesValues[varName];
			});
		}
	}
	
	
	// Returns an object that can be used for style matching comparison.
	// Attributes names and values are all lowercased, and the styles get
	// merged with the style attribute.
	function getAttributesForComparison(styleDefinition){
		// If we have already computed it, just return it.
		var attribs = styleDefinition._AC;
		if (attribs) return attribs;
		
		attribs = {};
		
		var length = 0;
		
		// Loop through all defined attributes.
		var styleAttribs = styleDefinition.attributes;
		if (styleAttribs){
			for (var styleAtt in styleAttribs){
				length++;
				attribs[styleAtt] = styleAttribs[styleAtt];
			}
		}
		
		// Includes the style definitions.
		var styleText = editorConstructor.style.getStyleText(styleDefinition);
		if (styleText){
			if (!attribs['style']) length++;
			attribs['style'] = styleText;
		}
		
		// Appends the "length" information to the object.
		attribs._length = length;
		
		// Return it, saving it to the next request.
		return (styleDefinition._AC = attribs);
	}
	
	/**
	 * Get the the collection used to compare the elements and attributes,
	 * defined in this style overrides, with other element. All information in
	 * it is lowercased.
	 * @param {editorConstructor.style} style
	 */
	function getOverrides(style){
		if (style.overrides) return style.overrides;
		
		var overrides = (style.overrides = {}), definition = style.styleDefinition.overrides;
		
		if (definition){
			// The override description can be a string, object or array.
			// Internally, well handle arrays only, so transform it if needed.
			if (!local.isArray(definition)) definition = [definition];
			
			// Loop through all override definitions.
			for (var i = 0; i < definition.length; i++){
				var override = definition[i];
				var elementName;
				var overrideEl;
				var attrs;
				
				// If can be a string with the element name.
				if (typeof override == 'string') elementName = override.toLowerCase();
				// Or an object.
				else {
					elementName = override.element ? override.element.toLowerCase() : style.element;
					attrs = override.attributes;
				}
				
				// We can have more than one override definition for the same
				// element name, so we attempt to simply append information to
				// it if it already exists.
				overrideEl = overrides[elementName] || (overrides[elementName] = {});
				
				if (attrs){
					// The returning attributes list is an array, because we
					// could have different override definitions for the same
					// attribute name.
					var overrideAttrs = (overrideEl.attributes = overrideEl.attributes || new Array());
					for (var attName in attrs){
						// Each item in the attributes array is also an array,
						// where [0] is the attribute name and [1] is the
						// override value.
						overrideAttrs.push([attName.toLowerCase(), attrs[attName]]);
					}
				}
			}
		}
		
		return overrides;
	}
	
	// Make the comparison of attribute value easier by standardizing it.
	function normalizeProperty(name, value, isStyle){
		var temp = local.DOM.createElement('span');
		temp[isStyle ? 'style' : 'setProperty'](name, value);
		return temp[isStyle ? 'style' : 'getProperty'](name);
	}
	
	// Make the comparison of style text easier by standardizing it.
	function normalizeCssText(unparsedCssText, nativeNormalize){
		var styleText;
		if (nativeNormalize !== false){
			// Injects the style in a temporary span object, so the browser parses it,
			// retrieving its final format.
			var temp = local.DOM.createElement('span');
			temp.setProperty('style', unparsedCssText);
			styleText = temp.getProperty('style') || '';
		} else styleText = unparsedCssText;
		
		// Shrinking white-spaces around colon and semi-colon (#4147).
		// Compensate tail semi-colon.
		return styleText.replace(/\s*([;:])\s*/, '$1').replace(/([^\s;])$/, '$1;').replace(/,\s+/g, ',').replace(/\"/g, '').toLowerCase();
	}
	
	// Turn inline style text properties into one hash.
	function parseStyleText(styleText){
		var retval = {};
		styleText.replace(/&quot;/g, '"').replace(/\s*([^ :;]+)\s*:\s*([^;]+)\s*(?=;|$)/g, function(match, name, value){
			retval[name] = value;
		});
		return retval;
	}
	
	/**
	 * Compare two bunch of styles, with the speciality that value 'inherit'
	 * is treated as a wildcard which will match any value.
	 * @param {Object|String} source
	 * @param {Object|String} target
	 */
	function compareCssText(source, target){
		typeof source == 'string' && (source = parseStyleText(source));
		typeof target == 'string' && (target = parseStyleText(target));
		for (var name in source){
			if (!(name in target &&
			(target[name] == source[name] ||
			source[name] == 'inherit' ||
			target[name] == 'inherit'))){
				return false;
			}
		}
		return true;
	}
	
	function applyStyle(document, remove, ignore){
		var selection = document.getSelection(),
			// Bookmark the range so we can re-select it after processing.
			bookmarks = selection.createBookmarks(1), 
			ranges = selection.getRanges(), 
			fn = remove ? this.removeFromRange : this.applyToRange, range;

		var iterator = ranges.createIterator();

		while ((range = iterator.getNextRange())){
			if (ignore && range.collapsed) continue;
			fn.call(this, range);
		}

		if (bookmarks.length == 1 && bookmarks[0].collapsed){
			selection.selectRanges(ranges);
			document.get(bookmarks[0].startNode).dispose();
		} else selection.selectBookmarks(bookmarks);

		document.eliminate('doc_processing_style');
	}

	editorConstructor.styleCommand = new Class({

		initialize: function(style){
			this.style = style;
			this.config = style.styleDefinition || {};
		},

		execute: function(editor){
			editor.focus();
			
			var document = editor.document;

			if (document){
				if (this.state == $['TRISTATE_OFF']) this.style.apply(document);
				else if (this.state == $['TRISTATE_ON']) this.style.remove(document);
			}
			
			return !!document;
		}

	});

	//editorConstructor.setStyles = new CKEDITOR.resourceManager('', 'stylesSet');

	// Backward compatibility (#5025).
	//editorConstructor.addStylesSet = editorConstructor.tools.bind(CKEDITOR.stylesSet.add.bind(CKEDITOR.stylesSet);
	//editorConstructor.loadStylesSet = function(name, url, callback){
	//	editorConstructor.stylesSet.addExternal(name, url, '');
	///	editorConstructor.stylesSet.load(name, callback);
	//};

	/**
	 * Gets the current styleSet for this instance
	 * @param {Function} callback The function to be called with the styles data.
	 * @example
	 * editor.getStylesSet( function( stylesDefinitions ){} );
	 */
	editorConstructor.implement({

		attachStyleStateChange: function(style, callback){
			// Try to get the list of attached callbacks.
			var styleStateChangeCallbacks = this.storage.styleStateChangeCallbacks;
			
			// If it doesn't exist, it means this is the first call. So, let's create
			// all the structure to manage the style checks and the callback calls.
			if (!styleStateChangeCallbacks){
				// Create the callbacks array.
				styleStateChangeCallbacks = this.storage.styleStateChangeCallbacks = [];
				
				// Attach to the selectionChange event, so we can check the styles at
				// that point.
				this.addEvent('selectionChange', function(ev){
					// Loop throw all registered callbacks.
					for (var i = 0, l = styleStateChangeCallbacks.length; i < l; i++){
						var callback = styleStateChangeCallbacks[i];

						// Check the current state for the style defined for that
						// callback.
						var currentState = callback.style.checkActive(ev.path) ? $['TRISTATE_ON'] : $['TRISTATE_OFF'];
						
						// If the state changed since the last check.
						if (callback.state !== currentState){
							// Call the callback function, passing the current
							// state to it.
							callback.fn.call(this, currentState);
							
							// Save the current state, so it can be compared next
							// time.
							callback.state = currentState;
						}
					}
				});
			}
			
			// Save the callback info, so it can be checked on the next occurrence of
			// selectionChange.
			styleStateChangeCallbacks.push({
				style: style,
				fn: callback
			});
		}/*,

		getStylesSet: function(callback){
			if (!this.storage.stylesDefinitions){
				var editor = this,  // Respect the backwards compatible definition entry
				configStyleSet = editor.config.stylesCombo_stylesSet || editor.config.stylesSet || 'default';
				
				// #5352 Allow to define the styles directly in the config object
				if (configStyleSet instanceof Array){
					editor._.stylesDefinitions = configStyleSet;
					callback(configStyleSet);
					return;
				}
				
				var partsStylesSet = configStyleSet.split(':'), styleSetName = partsStylesSet[0], externalPath = partsStylesSet[1], pluginPath = CKEDITOR.plugins.registered.styles.path;
				
				CKEDITOR.stylesSet.addExternal(styleSetName, externalPath ? partsStylesSet.slice(1).join(':') : pluginPath + 'styles/' + styleSetName + '.js', '');
				
				CKEDITOR.stylesSet.load(styleSetName, function(stylesSet){
					editor._.stylesDefinitions = stylesSet[styleSetName];
					callback(editor._.stylesDefinitions);
				});
			} else callback(this.storage.stylesDefinitions);
		}*/

	});

})(Klass);