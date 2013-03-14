(function(local){

	var editorConstructor = local.Editor;

	var env = local.env;

	var $ = editorConstructor.constants;

	var $dtd = editorConstructor.dtd;

	var utils = editorConstructor.utils;

	var DOM = local.DOM;

	var inlineChildReqElements = {
		abbr: 1,
		acronym: 1,
		b: 1,
		bdo: 1,
		big: 1,
		cite: 1,
		code: 1,
		del: 1,
		dfn: 1,
		em: 1,
		font: 1,
		i: 1,
		ins: 1,
		label: 1,
		kbd: 1,
		q: 1,
		samp: 1,
		small: 1,
		span: 1,
		strike: 1,
		strong: 1,
		sub: 1,
		sup: 1,
		tt: 1,
		u: 1,
		'var': 1
	};

	// Updates the "collapsed" property for the given range object.
	var updateCollapsed = function(range){
		range.collapsed = (range.startContainer && range.endContainer && 
			range.startContainer.equals(range.endContainer) && 
			range.startOffset == range.endOffset);
	};

	// This is a shared function used to delete, extract and clone the range
	// contents.
	// V2
	var execContentsAction = function(range, action, docFrag){
		range.optimizeBookmark();
		
		var startNode = range.startContainer;
		var endNode = range.endContainer;
		
		var startOffset = range.startOffset;
		var endOffset = range.endOffset;
		
		var removeStartNode;
		var removeEndNode;
		
		// For text containers, we must simply split the node and point to the
		// second part. The removal will be handled by the rest of the code .
		if (endNode.$text) endNode = endNode.split(endOffset);
		else {
			// If the end container has children and the offset is pointing
			// to a child, then we should start from it.
			if (endNode.length() > 0){
				// If the offset points after the last node.
				if (endOffset >= endNode.length()){
					// Let's create a temporary node and mark it for removal.
					endNode = range.document.createText('').appendTo(endNode);
					removeEndNode = true;
				} else endNode = endNode.child(endOffset);
			}
		}

		// For text containers, we must simply split the node. The removal will
		// be handled by the rest of the code .
		if (startNode.$text){
			startNode.split(startOffset);
			
			// In cases the end node is the same as the start node, the above
			// splitting will also split the end, so me must move the end to
			// the second part of the split.
			if (startNode.equals(endNode)) endNode = startNode.next();
		} else {
			// If the start container has children and the offset is pointing
			// to a child, then we should start from its previous sibling.

			// If the offset points to the first node, we don't have a
			// sibling, so let's use the first one, but mark it for removal.
			if (!startOffset){
				// Let's create a temporary node and mark it for removal.
				startNode = range.document.createText('').injectBefore(startNode.first());
				removeStartNode = true;
			} else if (startOffset >= startNode.length()){
				// Let's create a temporary node and mark it for removal.
				startNode = range.document.createText('').appendTo(startNode);
				removeStartNode = true;
			} else startNode = startNode.child(startOffset).prev();
		}

		// Get the parent nodes tree for the start and end boundaries.
		var startParents = startNode.parents();
		var endParents = endNode.parents();
		
		// Compare them, to find the top most siblings.
		var i, topStart, topEnd;
		
		for (i = 0; i < startParents.length; i++){
			topStart = startParents[i];
			topEnd = endParents[i];
			
			// The compared nodes will match until we find the top most
			// siblings (different nodes that have the same parent).
			// "i" will hold the index in the parents array for the top
			// most element.
			if (!topStart.equals(topEnd)) break;
		}

		var clone = docFrag, levelStartNode, levelClone, currentNode, currentSibling;
		
		// Remove all successive sibling nodes for every node in the
		// startParents tree.
		for (var j = i; j < startParents.length; j++){
			levelStartNode = startParents[j];
			
			// For Extract and Clone, we must clone this level.
			if (clone && !levelStartNode.equals(startNode)) levelClone = levelStartNode.clone().appendTo(clone);
			
			currentNode = levelStartNode.next();
			
			while (currentNode){
				// Stop processing when the current node matches a node in the
				// endParents tree or if it is the endNode.
				if (currentNode.equals(endParents[j]) || currentNode.equals(endNode)) break;
				
				// Cache the next sibling.
				currentSibling = currentNode.next();
				
				// If cloning, just clone it.
				if (action == 2)  clone.append(currentNode.clone(true));
				else {
					// Both Delete and Extract will remove the node.
					currentNode.dispose();
					
					// When Extracting, move the removed node to the docFrag.
					if (action == 1) clone.append(currentNode);
				}
				
				currentNode = currentSibling;
			}
			
			if (clone) clone = levelClone;
		}
		
		clone = docFrag;

		// Remove all previous sibling nodes for every node in the
		// endParents tree.
		for (var k = i; k < endParents.length; k++){
			levelStartNode = endParents[k];
			
			// For Extract and Clone, we must clone this level.
			if (action > 0 && !levelStartNode.equals(endNode)) levelClone = levelStartNode.clone().appendTo(clone);
			
			// The processing of siblings may have already been done by the parent.
			if (!startParents[k] || levelStartNode[0].parentNode != startParents[k][0].parentNode){
				currentNode = levelStartNode.prev();
				
				while (currentNode){
					// Stop processing when the current node matches a node in the
					// startParents tree or if it is the startNode.
					if (currentNode.equals(startParents[k]) || currentNode.equals(startNode)) break;
					
					// Cache the next sibling.
					currentSibling = currentNode.prev();
					
					// If cloning, just clone it.
					if (action == 2) clone[0].insertBefore(currentNode[0].cloneNode(true), clone[0].firstChild);
					else {
						// Both Delete and Extract will remove the node.
						currentNode.dispose();
						
						// When Extracting, mode the removed node to the docFrag.
						if (action == 1) clone[0].insertBefore(currentNode[0], clone[0].firstChild);
					}
					
					currentNode = currentSibling;
				}
			}
			
			if (clone) clone = levelClone;
		}

		if (action == 2) // 2 = Clone.
		{
			// No changes in the DOM should be done, so fix the split text (if any).
			
			var startTextNode = range.startContainer;
			if (startTextNode.$text){
				startTextNode[0].data += startTextNode[0].nextSibling.data;
				startTextNode[0].parentNode.removeChild(startTextNode[0].nextSibling);
			}
			
			var endTextNode = range.endContainer;
			if (endTextNode.$text && endTextNode[0].nextSibling){
				endTextNode[0].data += endTextNode[0].nextSibling.data;
				endTextNode[0].parentNode.removeChild(endTextNode[0].nextSibling);
			}
		} else {
			// Collapse the range.
			
			// If a node has been partially selected, collapse the range between
			// topStart and topEnd. Otherwise, simply collapse it to the start. (W3C specs).
			if (topStart && topEnd && (startNode[0].parentNode != topStart[0].parentNode || endNode[0].parentNode != topEnd[0].parentNode)){
				var endIndex = topEnd.index();
				
				// If the start node is to be removed, we must correct the
				// index to reflect the removal.
				if (removeStartNode && topEnd[0].parentNode == startNode[0].parentNode) endIndex--;
				
				range.setStart(topEnd.parent(), endIndex);
			}
			
			// Collapse it to the start.
			range.collapse(true);
		}

		// Cleanup any marked node.
		if (removeStartNode) startNode.dispose();

		if (removeEndNode && endNode[0].parentNode) endNode.dispose();
	};

	// Creates the appropriate node evaluator for the dom walker used inside
	// check(Start|End)OfBlock.
	function getCheckStartEndBlockEvalFunction(isStart){
		var skipBogus = false, 
			bookmarkEvaluator = DOM.walker.bookmark(true),
			nbspRegExp = /^[\t\r\n ]*(?:&nbsp;|\xa0)$/;;
		return function(node){
			// First ignore bookmark nodes.
			if (bookmarkEvaluator(node)) return true;
			
			if (node.$text){
				// Skip the block filler NBSP.
				if (env.ie && nbspRegExp.test(node.text()) && !skipBogus && !(isStart && node.next())) skipBogus = true;
				// If there's any visible text, then we're not at the start.
				else if (node.text().trim().length) return false;
			} else if (node.$element){
				// If there are non-empty inline elements (e.g. <img />), then we're not
				// at the start.
				if (!inlineChildReqElements[node.name()]){
					// If we're working at the end-of-block, forgive the first <br /> in non-IE
					// browsers.
					if (!env.ie && node.is('br') && !skipBogus && !(isStart && node.next())) skipBogus = true;
					else return false;
				}
			}
			return true;
		};
	}

	// Evaluator for Klass.DOM.element::checkBoundaryOfElement, reject any
	// text node and non-empty elements unless it's being bookmark text.
	function elementBoundaryEval(node){
		// Reject any text node unless it's being bookmark
		// OR it's spaces. (#3883)
		return !node.$text && node.name() in $dtd.$removeEmpty || !node.text().trim() || !!node.parent().data('kse-bookmark');
	}

	var whitespaceEval = new local.DOM.walker.whitespaces(), bookmarkEval = new local.DOM.walker.bookmark();

	function nonWhitespaceOrBookmarkEval(node){
		// Whitespaces and bookmark nodes are to be ignored.
		return !whitespaceEval(node) && !bookmarkEval(node);
	}

	/**
	 * Creates a Klass.DOM.range instance that can be used inside a specific
	 * DOM Document.
	 * @class Represents a delimited piece of content in a DOM Document.
	 * It is contiguous in the sense that it can be characterized as selecting all
	 * of the content between a pair of boundary-points.<br>
	 * <br>
	 * This class shares much of the W3C
	 * <a href="http://www.w3.org/TR/DOM-Level-2-Traversal-Range/ranges.html">Document Object Model Range</a>
	 * ideas and features, adding several range manipulation tools to it, but it's
	 * not intended to be compatible with it.
	 * @param {Klass.DOM.document} document The document into which the range
	 *		features will be available.
	 * @example
	 * // Create a range for the entire contents of the editor document body.
	 * var range = new Klass.DOM.range( editor.document );
	 * range.selectNodeContents( editor.document.body() );
	 * // Delete the contents.
	 * range.deleteContents();
	 */
	local.DOM.range = new Class({
	
		initialize: function(document){
			/**
			 * Node within which the range begins.
			 */
			this.startContainer = null;

			/**
			 * Offset within the starting node of the range.
			 * @type {Number}
			 */
			this.startOffset = null;

			/**
			 * Node within which the range ends.
			 */
			this.endContainer = null;

			/**
			 * Offset within the ending node of the range.
			 * @type {Number}
			 */
			this.endOffset = null;

			/**
			 * Indicates that this is a collapsed range. A collapsed range has it's
			 * start and end boudaries at the very same point so nothing is contained
			 * in it.
			 */
			this.collapsed = true;

			/**
			 * The document within which the range can be used.
			 */
			this.document = document;
		},
	
		clone: function(){
			var clone = new DOM.range(this.document);
			
			clone.startContainer = this.startContainer;
			clone.startOffset = this.startOffset;
			clone.endContainer = this.endContainer;
			clone.endOffset = this.endOffset;
			clone.collapsed = this.collapsed;
			
			return clone;
		},
		
		collapse: function(toStart){
			if (toStart){
				this.endContainer = this.startContainer;
				this.endOffset = this.startOffset;
			} else {
				this.startContainer = this.endContainer;
				this.startOffset = this.endOffset;
			}
			
			this.collapsed = true;
		},	
	
		/**
		 *  The content nodes of the range are cloned and added to a document fragment, which is returned.
		 *  <strong> Note: </strong> Text selection may lost after invoking this method. (caused by text node splitting).
		 */
		cloneContents: function(){
			var docFrag = new DOM.fragment(this.document);
			
			if (!this.collapsed) execContentsAction(this, 2, docFrag);
			
			return docFrag;
		},
		
		/**
		 * Deletes the content nodes of the range permanently from the DOM tree.
		 */
		deleteContents: function(){
			if (this.collapsed) return;
			
			execContentsAction(this, 0);
		},
		
		/**
		 * The content nodes of the range are cloned and added to a document fragment,
		 * meanwhile they're removed permanently from the DOM tree.
		 */
		extractContents: function(){
			var docFrag = new DOM.fragment(this.document);

			if (!this.collapsed) execContentsAction(this, 1, docFrag);
			
			return docFrag;
		},
		
		/**
		 * Creates a bookmark object, which can be later used to restore the
		 * range by using the moveToBookmark function.
		 * This is an "intrusive" way to create a bookmark. It includes <span> tags
		 * in the range boundaries. The advantage of it is that it is possible to
		 * handle DOM mutations when moving back to the bookmark.
		 * Attention: the inclusion of nodes in the DOM is a design choice and
		 * should not be changed as there are other points in the code that may be
		 * using those nodes to perform operations. See GetBookmarkNode.
		 * @param {Boolean} [serializable] Indicates that the bookmark nodes
		 *		must contain ids, which can be used to restore the range even
		 *		when these nodes suffer mutations (like a clonation or innerHTML
		 *		change).
		 * @returns {Object} And object representing a bookmark.
		 */
		createBookmark: function(serializable){
			var startNode, endNode;
			var baseId;
			var clone;
			var collapsed = this.collapsed;

			startNode = this.document.createElement('span');

			startNode.data('kse-bookmark', 1);
			startNode.style('display', 'none');
			
			// For IE, it must have something inside, otherwise it may be
			// removed during DOM operations.
			startNode.html('&nbsp;');
			
			if (serializable){
				baseId = 'kse-bm-' + utils.unique();
				startNode.setProperty('id', baseId + 'S');
			}
			
			// If collapsed, the endNode will not be created.
			if (!collapsed){
				endNode = startNode.clone();
				endNode.html('&nbsp;');
				
				if (serializable) endNode.setProperty('id', baseId + 'E');
				
				clone = this.clone();
				clone.collapse();
				clone.insertNode(endNode);
			}
			
			clone = this.clone();
			clone.collapse(true);
			clone.insertNode(startNode);

			// Update the range position.
			if (endNode){
				this.setStartAfter(startNode);
				this.setEndBefore(endNode);
			} else this.moveToPosition(startNode, $['POSITION_AFTER_END']);
			
			return {
				startNode: serializable ? baseId + 'S' : startNode,
				endNode: serializable ? baseId + 'E' : endNode,
				serializable: serializable,
				collapsed: collapsed
			};
		},	
	
		/**
		 * Creates a "non intrusive" and "mutation sensible" bookmark. This
		 * kind of bookmark should be used only when the DOM is supposed to
		 * remain stable after its creation.
		 * @param {Boolean} [normalized] Indicates that the bookmark must
		 *		normalized. When normalized, the successive text nodes are
		 *		considered a single node. To sucessful load a normalized
		 *		bookmark, the DOM tree must be also normalized before calling
		 *		moveToBookmark.
		 * @returns {Object} An object representing the bookmark.
		 */
		createBookmark2: function(normalized){
			var startContainer = this.startContainer, endContainer = this.endContainer;
			
			var startOffset = this.startOffset, endOffset = this.endOffset;
			
			var collapsed = this.collapsed;
			
			var child, previous;
			
			// If there is no range then get out of here.
			// It happens on initial load in Safari #962 and if the editor it's
			// hidden also in Firefox
			if (!startContainer || !endContainer) return {
				start: 0,
				end: 0
			};
			
			if (normalized){
				// Find out if the start is pointing to a text node that will
				// be normalized.
				if (startContainer.$element){
					child = startContainer.child(startOffset);
					
					// In this case, move the start information to that text
					// node.
					if (child && child.$text &&
					startOffset > 0 &&
					child.prev().$text){
						startContainer = child;
						startOffset = 0;
					}

					// Get the normalized offset.
					if (child && child.$element) startOffset = child.index(1);
				}
				
				// Normalize the start.
				while (startContainer.$text && (previous = startContainer.prev()) && previous.$text){
					startContainer = previous;
					startOffset += previous.length();
				}
				
				// Process the end only if not normalized.
				if (!collapsed){
					// Find out if the start is pointing to a text node that
					// will be normalized.
					if (endContainer.$element){
						child = endContainer.child(endOffset);
						
						// In this case, move the start information to that
						// text node.
						if (child && child.$text &&
						endOffset > 0 &&
						child.prev().$text){
							endContainer = child;
							endOffset = 0;
						}

						// Get the normalized offset.
						if (child && child.$element) endOffset = child.index(1);
					}
					
					// Normalize the end.
					while (endContainer.$text &&
					(previous = endContainer.prev()) &&
					previous.$text){
						endContainer = previous;
						endOffset += previous.length();
					}
				}
			}
			
			return {
				start: startContainer.getAddress(normalized),
				end: collapsed ? null : endContainer.getAddress(normalized),
				startOffset: startOffset,
				endOffset: endOffset,
				normalized: normalized,
				collapsed: collapsed,
				is2: true // It's a createBookmark2 bookmark.
			};
		},
		
		moveToBookmark: function(bookmark){
			// Created with createBookmark2().
			if (bookmark.is2){
				// Get the start information.
				var startContainer = this.document.getElementByAddress(bookmark.start, bookmark.normalized), 
					startOffset = bookmark.startOffset;

				// Get the end information.
				var endContainer = bookmark.end && this.document.getElementByAddress(bookmark.end, bookmark.normalized), 
					endOffset = bookmark.endOffset;
				
				// Set the start boundary.
				this.setStart(startContainer, startOffset);

				// Set the end boundary. If not available, collapse it.
				endContainer ? this.setEnd(endContainer, endOffset) : this.collapse(true);
			// Created with createBookmark().
			} else {
				var serializable = bookmark.serializable, 
					startNode = serializable ? this.document.get(bookmark.startNode) : bookmark.startNode, 
					endNode = serializable ? this.document.get(bookmark.endNode) : bookmark.endNode;

				// Set the range start at the bookmark start node position.
				this.setStartBefore(startNode);
				
				// Remove it, because it may interfere in the setEndBefore call.
				startNode.dispose();
				
				// Set the range end at the bookmark end node position, or simply
				// collapse it if it is not available.
				if (endNode){
					this.setEndBefore(endNode);
					endNode.dispose();
				} else this.collapse(true);
			}
		},
		
		getBoundaryNodes: function(){
			var startNode = this.startContainer, endNode = this.endContainer, startOffset = this.startOffset, endOffset = this.endOffset, childCount;
			
			if (startNode.$element){
				childCount = startNode.length();
				if (childCount > startOffset) startNode = startNode.child(startOffset);
				else if (childCount < 1) startNode = startNode.getPreviousSourceNode();
				else // startOffset > childCount but childCount is not 0
				{
					// Try to take the node just after the current position.
					startNode = startNode[0];
					while (startNode.lastChild) 
						startNode = startNode.lastChild;
					startNode = document.node(startNode);
					
					// Normally we should take the next node in DFS order. But it
					// is also possible that we've already reached the end of
					// document.
					startNode = startNode.getNextSourceNode() || startNode;
				}
			}
			if (endNode.$element){
				childCount = endNode.length();
				if (childCount > endOffset) endNode = endNode.child(endOffset).getPreviousSourceNode(true);
				else if (childCount < 1) endNode = endNode.getPreviousSourceNode();
				else // endOffset > childCount but childCount is not 0
				{
					// Try to take the node just before the current position.
					endNode = endNode[0];
					while (endNode.lastChild) 
						endNode = endNode.lastChild;
					endNode = document.node(endNode);
				}
			}
			
			// Sometimes the endNode will come right before startNode for collapsed
			// ranges. Fix it. (#3780)
			if (startNode.compareDocumentPosition(endNode) & $['POSITION_FOLLOWING']) startNode = endNode;
			
			return {
				startNode: startNode,
				endNode: endNode
			};
		},
		
		/**
		 * Find the node which fully contains the range.
		 * @param includeSelf
		 * @param {Boolean} ignoreTextNode Whether ignore Klass.Editor.constants.NODE_TEXT type.
		 */
		getCommonAncestor: function(includeSelf, ignoreTextNode){
			var start = this.startContainer, end = this.endContainer, ancestor;
			
			if (start.equals(end)){
				if (includeSelf && start.$element && this.startOffset == this.endOffset - 1) ancestor = start.child(this.startOffset);
				else ancestor = start;
			} else ancestor = start.getCommonAncestor(end);
			
			return ignoreTextNode && !ancestor.is ? ancestor.parent() : ancestor;
		},
		
		/**
		 * Transforms the startContainer and endContainer properties from text
		 * nodes to element nodes, whenever possible. This is actually possible
		 * if either of the boundary containers point to a text node, and its
		 * offset is set to zero, or after the last char in the node.
		 */
		optimize: function(){
			var container = this.startContainer;
			var offset = this.startOffset;
			
			if (!container.$element){
				if (!offset) this.setStartBefore(container);
				else if (offset >= container.length()) this.setStartAfter(container);
			}
			
			container = this.endContainer;
			offset = this.endOffset;
			
			if (!container.$element){
				if (!offset) this.setEndBefore(container);
				else if (offset >= container.length()) this.setEndAfter(container);
			}
		},
		
		/**
		 * Move the range out of bookmark nodes if they'd been the container.
		 */
		optimizeBookmark: function(){
			var startNode = this.startContainer, endNode = this.endContainer;
			
			if (startNode.is && startNode.is('span') && startNode.data('kse-bookmark')) 
				this.setStartAt(startNode, $['POSITION_BEFORE_START']);
			if (endNode && endNode.is && endNode.is('span') && endNode.data('kse-bookmark')) 
				this.setEndAt(endNode, $['POSITION_AFTER_END']);
		},

		trim: function(ignoreStart, ignoreEnd){
			var startContainer = this.startContainer, startOffset = this.startOffset, collapsed = this.collapsed;

			if ((!ignoreStart || collapsed) && startContainer && startContainer.$text){
				// If the offset is zero, we just insert the new node before
				// the start.
				if (!startOffset){
					startOffset = startContainer.index();
					startContainer = startContainer.parent();
				} else if (startOffset >= startContainer.length()){
					startOffset = startContainer.index() + 1;
					startContainer = startContainer.parent();
				} else {
					var nextText = startContainer.split(startOffset);
					
					startOffset = startContainer.index() + 1;
					startContainer = startContainer.parent();
					
					// Check all necessity of updating the end boundary.
					if (this.startContainer.equals(this.endContainer)) this.setEnd(nextText, this.endOffset - this.startOffset);
					else if (startContainer.equals(this.endContainer)) this.endOffset += 1;
				}

				this.setStart(startContainer, startOffset);
				
				if (collapsed){
					this.collapse(true);
					return;
				}
			}
			
			var endContainer = this.endContainer;
			var endOffset = this.endOffset;
			
			if (!(ignoreEnd || collapsed) && endContainer && endContainer.$text){
				// If the offset is zero, we just insert the new node before
				// the start.
				if (!endOffset){
					endOffset = endContainer.index();
					endContainer = endContainer.parent();
				} else if (endOffset >= endContainer.length()){
					endOffset = endContainer.index() + 1;
					endContainer = endContainer.parent();
				} else {
					endContainer.split(endOffset);
					
					endOffset = endContainer.index() + 1;
					endContainer = endContainer.parent();
				}
				
				this.setEnd(endContainer, endOffset);
			}
		},

		enlarge: function(unit){
			switch (unit){
				case $['ENLARGE_ELEMENT'] :
				
					if (this.collapsed) return;
					
					// Get the common ancestor.
					var commonAncestor = this.getCommonAncestor();
					
					var body = this.document.body();
					
					// For each boundary
					//		a. Depending on its position, find out the first node to be checked (a sibling) or, if not available, to be enlarge.
					//		b. Go ahead checking siblings and enlarging the boundary as much as possible until the common ancestor is not reached. After reaching the common ancestor, just save the enlargeable node to be used later.
					
					var startTop, endTop;
					
					var enlargeable, sibling, commonReached;
					
					// Indicates that the node can be added only if whitespace
					// is available before it.
					var needsWhiteSpace = false;
					var isWhiteSpace;
					var siblingText;
					
					// Process the start boundary.
					
					var container = this.startContainer;
					var offset = this.startOffset;
					
					if (container.$text){
						if (offset){
							// Check if there is any non-space text before the
							// offset. Otherwise, container is null.
							container = !container.substring(0, offset).trim().length && container;
							
							// If we found only whitespace in the node, it
							// means that we'll need more whitespace to be able
							// to expand. For example, <i> can be expanded in
							// "A <i> [B]</i>", but not in "A<i> [B]</i>".
							needsWhiteSpace = !!container;
						}
						
						if (container){
							if (!(sibling = container.prev())) enlargeable = container.parent();
						}
					} else {
						// If we have offset, get the node preceeding it as the
						// first sibling to be checked.
						if (offset) sibling = container.child(offset - 1) || container.last();
						
						// If there is no sibling, mark the container to be
						// enlarged.
						if (!sibling) enlargeable = container;
					}
					
					while (enlargeable || sibling){
						if (enlargeable && !sibling){
							// If we reached the common ancestor, mark the flag
							// for it.
							if (!commonReached && enlargeable.equals(commonAncestor)) commonReached = true;
							
							if (!body.contains(enlargeable)) break;
							
							// If we don't need space or this element breaks
							// the line, then enlarge it.
							if (!needsWhiteSpace || enlargeable.getComputedStyle('display') != 'inline'){
								needsWhiteSpace = false;
								
								// If the common ancestor has been reached,
								// we'll not enlarge it immediately, but just
								// mark it to be enlarged later if the end
								// boundary also enlarges it.
								if (commonReached) startTop = enlargeable;
								else this.setStartBefore(enlargeable);
							}
							
							sibling = enlargeable.prev();
						}
						
						// Check all sibling nodes preceeding the enlargeable
						// node. The node wil lbe enlarged only if none of them
						// blocks it.
						while (sibling){
							// This flag indicates that this node has
							// whitespaces at the end.
							isWhiteSpace = false;
							
							if (sibling.$text){
								siblingText = sibling.text();
								
								if (/[^\s\ufeff]/.test(siblingText)) sibling = null;
								
								isWhiteSpace = /[\s\ufeff]$/.test(siblingText);
							} else {
								// If this is a visible element.
								// We need to check for the bookmark attribute because IE insists on
								// rendering the display:none nodes we use for bookmarks. (#3363)
								if (sibling[0].offsetWidth > 0 && !sibling.data('kse-bookmark')){
									// We'll accept it only if we need
									// whitespace, and this is an inline
									// element with whitespace only.
									if (needsWhiteSpace && $dtd.$removeEmpty[sibling.name()]){
										// It must contains spaces and inline elements only.
										
										siblingText = sibling.text();
										
										if ((/[^\s\ufeff]/).test(siblingText)) sibling = null;
										else {
											var allChildren = sibling[0].all || sibling[0].getElementsByTagName('*');
											for (var i = 0, child; child = allChildren[i++];){
												if (!$dtd.$removeEmpty[child.nodeName.toLowerCase()]){
													sibling = null;
													break;
												}
											}
										}
										
										if (sibling) isWhiteSpace = !!siblingText.length;
									} else sibling = null;
								}
							}
							
							// A node with whitespaces has been found.
							if (isWhiteSpace){
								// Enlarge the last enlargeable node, if we
								// were waiting for spaces.
								if (needsWhiteSpace){
									if (commonReached) startTop = enlargeable;
									else if (enlargeable) this.setStartBefore(enlargeable);
								} else needsWhiteSpace = true;
							}
							
							if (sibling){
								var next = sibling.prev();
								
								if (!enlargeable && !next){
									// Set the sibling as enlargeable, so it's
									// parent will be get later outside this while.
									enlargeable = sibling;
									sibling = null;
									break;
								}
								
								sibling = next;
							} else {
								// If sibling has been set to null, then we
								// need to stop enlarging.
								enlargeable = null;
							}
						}
						
						if (enlargeable) enlargeable = enlargeable.parent();
					}
					
					// Process the end boundary. This is basically the same
					// code used for the start boundary, with small changes to
					// make it work in the oposite side (to the right). This
					// makes it difficult to reuse the code here. So, fixes to
					// the above code are likely to be replicated here.
					
					container = this.endContainer;
					offset = this.endOffset;
					
					// Reset the common variables.
					enlargeable = sibling = null;
					commonReached = needsWhiteSpace = false;
					
					if (container.$text){
						// Check if there is any non-space text after the
						// offset. Otherwise, container is null.
						container = !container.substring(offset).trim().length && container;
						
						// If we found only whitespace in the node, it
						// means that we'll need more whitespace to be able
						// to expand. For example, <i> can be expanded in
						// "A <i> [B]</i>", but not in "A<i> [B]</i>".
						needsWhiteSpace = !(container && container.length());
						
						if (container){
							if (!(sibling = container.next())) enlargeable = container.parent();
						}
					} else {
						// Get the node right after the boudary to be checked
						// first.
						sibling = container.child(offset);
						
						if (!sibling) enlargeable = container;
					}
					
					while (enlargeable || sibling){
						if (enlargeable && !sibling){
							if (!commonReached && enlargeable.equals(commonAncestor)) commonReached = true;
							
							if (!body.contains(enlargeable)) break;
							
							if (!needsWhiteSpace || enlargeable.getComputedStyle('display') != 'inline'){
								needsWhiteSpace = false;
								
								if (commonReached) endTop = enlargeable;
								else if (enlargeable) this.setEndAfter(enlargeable);
							}
							
							sibling = enlargeable.next();
						}
						
						while (sibling){
							isWhiteSpace = false;
							
							if (sibling.$text){
								siblingText = sibling.text();
								
								if (/[^\s\ufeff]/.test(siblingText)) sibling = null;
								
								isWhiteSpace = /^[\s\ufeff]/.test(siblingText);
							} else {
								// If this is a visible element.
								// We need to check for the bookmark attribute because IE insists on
								// rendering the display:none nodes we use for bookmarks. (#3363)
								if (sibling[0].offsetWidth > 0 && !sibling.data('kse-bookmark')){
									// We'll accept it only if we need
									// whitespace, and this is an inline
									// element with whitespace only.
									if (needsWhiteSpace && $dtd.$removeEmpty[sibling.name()]){
										// It must contains spaces and inline elements only.
										
										siblingText = sibling.text();
										
										if ((/[^\s\ufeff]/).test(siblingText)) sibling = null;
										else {
											allChildren = sibling[0].all || sibling[0].getElementsByTagName('*');
											for (i = 0; child = allChildren[i++];){
												if (!$dtd.$removeEmpty[child.nodeName.toLowerCase()]){
													sibling = null;
													break;
												}
											}
										}
										
										if (sibling) isWhiteSpace = !!siblingText.length;
									} else sibling = null;
								}
							}
							
							if (isWhiteSpace){
								if (needsWhiteSpace){
									if (commonReached) endTop = enlargeable;
									else this.setEndAfter(enlargeable);
								}
							}
							
							if (sibling){
								next = sibling.next();
								
								if (!enlargeable && !next){
									enlargeable = sibling;
									sibling = null;
									break;
								}
								
								sibling = next;
							} else {
								// If sibling has been set to null, then we
								// need to stop enlarging.
								enlargeable = null;
							}
						}
						
						if (enlargeable) enlargeable = enlargeable.parent();
					}
					
					// If the common ancestor can be enlarged by both boundaries, then include it also.
					if (startTop && endTop){
						commonAncestor = startTop.contains(endTop) ? endTop : startTop;
						
						this.setStartBefore(commonAncestor);
						this.setEndAfter(commonAncestor);
					}
					break;
				
				case $['ENLARGE_BLOCK_CONTENTS']:
				case $['ENLARGE_LIST_ITEM_CONTENTS']:
					// Enlarging the start boundary.
					var walkerRange = new DOM.range(this.document);

					body = this.document.body();

					walkerRange.setStartAt(body, $['POSITION_AFTER_START']);
					walkerRange.setEnd(this.startContainer, this.startOffset);
					
					var walker = new DOM.walker(walkerRange), blockBoundary, tailBr, 
						notBlockBoundary = DOM.walker.blockBoundary((unit == $['ENLARGE_LIST_ITEM_CONTENTS']) ? {br: 1} : null),
						// Record the encountered 'blockBoundary' for later use.
						boundaryGuard = function(node){
							var retval = notBlockBoundary(node);
							if (!retval) blockBoundary = node;
							return retval;
						},
						// Record the encounted 'tailBr' for later use.
						tailBrGuard = function(node){
							var retval = boundaryGuard(node);
							if (!retval && node.is && node.is('br')) tailBr = node;
							return retval;
						};

					walker.guard = boundaryGuard;

					enlargeable = walker.lastBackward();

					// It's the body which stop the enlarging if no block boundary found.
					blockBoundary = blockBoundary || body;

					// Start the range either after the end of found block (<p>...</p>[text)
					// or at the start of block (<p>[text...), by comparing the document position
					// with 'enlargeable' node.
					this.setStartAt(blockBoundary, !blockBoundary.is('br') && (!enlargeable && this.checkStartOfBlock() || 
						enlargeable && blockBoundary.contains(enlargeable)) ? 
						$['POSITION_AFTER_START'] : 
						$['POSITION_AFTER_END']);

					// Avoid enlarging the range further when end boundary spans right after the BR.
					if (unit === $['ENLARGE_LIST_ITEM_CONTENTS']){
						var cloneRange = this.clone();
						var whitespaces = DOM.walker.whitespaces(), bookmark = DOM.walker.bookmark();
						walker = new DOM.walker(cloneRange);
						walker.evaluator = function(node){
							return !whitespaces(node) && !bookmark(node);
						};
						var previous = walker.previous();
						if (previous && previous.$element && previous.is('br')) return;
					}

					// Enlarging the end boundary.
					walkerRange = this.clone();
					walkerRange.collapse();
					walkerRange.setEndAt(body, $['POSITION_BEFORE_END']);
					walker = new DOM.walker(walkerRange);

					// tailBrGuard only used for on range end.
					walker.guard = (unit === $['ENLARGE_LIST_ITEM_CONTENTS']) ? tailBrGuard : boundaryGuard;
					blockBoundary = null;
					// End the range right before the block boundary node.

					enlargeable = walker.lastForward();
					
					// It's the body which stop the enlarging if no block boundary found.
					blockBoundary = blockBoundary || body;

					// Close the range either before the found block start (text]<p>...</p>) or at the block end (...text]</p>)
					// by comparing the document position with 'enlargeable' node.
					this.setEndAt(blockBoundary, (!enlargeable && this.checkEndOfBlock() || 
						enlargeable && blockBoundary.contains(enlargeable)) ? 
						$['POSITION_BEFORE_END'] : 
						$['POSITION_BEFORE_START']);
					// We must include the <br> at the end of range if there's
					// one and we're expanding list item contents
					if (tailBr) this.setEndAfter(tailBr);
			}
		},

		/**
		 *  Descrease the range to make sure that boundaries
		 *  always anchor beside text nodes or innermost element.
		 * @param {Number} mode  ( $['SHRINK_ELEMENT'] | $['SHRINK_TEXT'] ) The shrinking mode.
		 * @param {Boolean} selectContents Whether result range anchors at the inner OR outer boundary of the node.
		 */
		shrink: function(mode, selectContents){
			// Unable to shrink a collapsed range.
			if (!this.collapsed){
				mode = mode || $['SHRINK_TEXT'];
				
				var walkerRange = this.clone();
				
				var startContainer = this.startContainer, endContainer = this.endContainer, startOffset = this.startOffset, endOffset = this.endOffset, collapsed = this.collapsed;
				
				// Whether the start/end boundary is moveable.
				var moveStart = 1, moveEnd = 1;
				
				if (startContainer && startContainer.$text){
					if (!startOffset) walkerRange.setStartBefore(startContainer);
					else if (startOffset >= startContainer.length()) walkerRange.setStartAfter(startContainer);
					else {
						// Enlarge the range properly to avoid walker making
						// DOM changes caused by triming the text nodes later.
						walkerRange.setStartBefore(startContainer);
						moveStart = 0;
					}
				}
				
				if (endContainer && endContainer.$text){
					if (!endOffset) walkerRange.setEndBefore(endContainer);
					else if (endOffset >= endContainer.length()) walkerRange.setEndAfter(endContainer);
					else {
						walkerRange.setEndAfter(endContainer);
						moveEnd = 0;
					}
				}
				
				var walker = new DOM.walker(walkerRange), isBookmark = DOM.walker.bookmark();
				
				walker.evaluator = function(node){
					return node.type ==
					(mode == $['SHRINK_ELEMENT'] ? $['NODE_ELEMENT'] : $['NODE_TEXT']);
				};
				
				var currentElement;
				walker.guard = function(node, movingOut){
					if (isBookmark(node)) return true;
					
					// Stop when we're shrink in element mode while encountering a text node.
					if (mode == $['SHRINK_ELEMENT'] && node.$text) return false;
					
					// Stop when we've already walked "through" an element.
					if (movingOut && node.equals(currentElement)) return false;
					
					if (!movingOut && node.$element) currentElement = node;
					
					return true;
				};
				
				if (moveStart){
					var textStart = walker[mode == $['SHRINK_ELEMENT'] ? 'lastForward' : 'next']();
					textStart && this.setStartAt(textStart, selectContents ? $['POSITION_AFTER_START'] : $['POSITION_BEFORE_START']);
				}
				
				if (moveEnd){
					walker.reset();
					var textEnd = walker[mode == $['SHRINK_ELEMENT'] ? 'lastBackward' : 'previous']();
					textEnd && this.setEndAt(textEnd, selectContents ? $['POSITION_BEFORE_END'] : $['POSITION_AFTER_END']);
				}
				
				return !!(moveStart || moveEnd);
			}
		},

		/**
		 * Inserts a node at the start of the range. The range will be expanded
		 * the contain the node.
		 */
		insertNode: function(node){
			this.optimizeBookmark();
			this.trim(false, true);

			var startContainer = this.startContainer;
			var startOffset = this.startOffset;

			var nextNode = startContainer.child(startOffset);

			if (nextNode) node.injectBefore(nextNode);
			else startContainer.append(node);

			// If the parent node of the current node does not exist, direct return.
			if (!node.parent()) return;

			// Check if we need to update the end boundary.
			if (node.parent().equals(this.endContainer)) this.endOffset++;
			
			// Expand the range to embrace the new node.
			this.setStartBefore(node);
		},
		
		moveToPosition: function(node, position){
			this.setStartAt(node, position);
			this.collapse(true);
		},
		
		selectNodeContents: function(node){
			this.setStart(node, 0);
			this.setEnd(node, node.length());
		},
		
		/**
		 * Sets the start position of a Range.
		 * @param {Klass.DOM.node} startNode The node to start the range.
		 * @param {Number} startOffset An integer greater than or equal to zero
		 *		representing the offset for the start of the range from the start
		 *		of startNode.
		 */
		setStart: function(startNode, startOffset){
			// W3C requires a check for the new position. If it is after the end
			// boundary, the range should be collapsed to the new start. It seams
			// we will not need this check for our use of this class so we can
			// ignore it for now.
			
			// Fixing invalid range start inside dtd empty elements.
			if (startNode.$element && $dtd.$empty[startNode.name()]) startOffset = startNode.index(), startNode = startNode.parent();
			
			this.startContainer = startNode;
			this.startOffset = startOffset;
			
			if (!this.endContainer){
				this.endContainer = startNode;
				this.endOffset = startOffset;
			}
			
			updateCollapsed(this);
		},

		/**
		 * Sets the end position of a Range.
		 * @param {Klass.DOM.node} endNode The node to end the range.
		 * @param {Number} endOffset An integer greater than or equal to zero
		 *		representing the offset for the end of the range from the start
		 *		of endNode.
		 */
		setEnd: function(endNode, endOffset){
			// W3C requires a check for the new position. If it is before the start
			// boundary, the range should be collapsed to the new end. It seams we
			// will not need this check for our use of this class so we can ignore
			// it for now.
			
			// Fixing invalid range end inside dtd empty elements.
			if (endNode.$element &&
			$dtd.$empty[endNode.name()]) endOffset = endNode.index() + 1, endNode = endNode.parent();
			
			this.endContainer = endNode;
			this.endOffset = endOffset;
			
			if (!this.startContainer){
				this.startContainer = endNode;
				this.startOffset = endOffset;
			}
			
			updateCollapsed(this);
		},
		
		setStartAfter: function(node){
			this.setStart(node.parent(), node.index() + 1);
		},
		
		setStartBefore: function(node){
			this.setStart(node.parent(), node.index());
		},
		
		setEndAfter: function(node){
			this.setEnd(node.parent(), node.index() + 1);
		},
		
		setEndBefore: function(node){
			this.setEnd(node.parent(), node.index());
		},

		setStartAt: function(node, position){
			switch (position){
				case $['POSITION_AFTER_START'] :
					this.setStart(node, 0);
					break;

				case $['POSITION_BEFORE_END'] :
					this.setStart(node, node.length());
					break;

				case $['POSITION_BEFORE_START'] :
					this.setStartBefore(node);
					break;

				case $['POSITION_AFTER_END'] :
					this.setStartAfter(node);
			}

			updateCollapsed(this);
		},

		setEndAt: function(node, position){
			switch (position){
				case $['POSITION_AFTER_START'] :
					this.setEnd(node, 0);
					break;

				case $['POSITION_BEFORE_END'] :
					this.setEnd(node, node.length());
					break;

				case $['POSITION_BEFORE_START'] :
					this.setEndBefore(node);
					break;

				case $['POSITION_AFTER_END'] :
					this.setEndAfter(node);
			}

			updateCollapsed(this);
		},

		fixBlock: function(isStart, blockTag){
			var bookmark = this.createBookmark(), fixedBlock = this.document.createElement(blockTag);

			this.collapse(isStart);

			this.enlarge($['ENLARGE_BLOCK_CONTENTS']);

			fixedBlock.append(this.extractContents()).trim();

			if (!env.ie) fixedBlock.appendBogus();

			this.insertNode(fixedBlock);

			this.moveToBookmark(bookmark);
	
			return fixedBlock;
		},
		
		splitBlock: function(blockTag){
			var startPath = new DOM.elementPath(this.startContainer), endPath = new DOM.elementPath(this.endContainer);
			
			var startBlockLimit = startPath.blockLimit, endBlockLimit = endPath.blockLimit;
			
			var startBlock = startPath.block, endBlock = endPath.block;
			
			var elementPath = null;
			// Do nothing if the boundaries are in different block limits.
			if (!startBlockLimit.equals(endBlockLimit)) return null;
			
			// Get or fix current blocks.
			if (blockTag != 'br'){
				if (!startBlock){
					startBlock = this.fixBlock(true, blockTag);
					endBlock = new DOM.elementPath(this.endContainer).block;
				}
				
				if (!endBlock) endBlock = this.fixBlock(false, blockTag);
			}
			
			// Get the range position.
			var isStartOfBlock = startBlock && this.checkStartOfBlock(), isEndOfBlock = endBlock && this.checkEndOfBlock();
			
			// Delete the current contents.
			// TODO: Why is 2.x doing CheckIsEmpty()?
			this.deleteContents();
			
			if (startBlock && startBlock.equals(endBlock)){
				if (isEndOfBlock){
					elementPath = new DOM.elementPath(this.startContainer);
					this.moveToPosition(endBlock, $['POSITION_AFTER_END']);
					endBlock = null;
				} else if (isStartOfBlock){
					elementPath = new DOM.elementPath(this.startContainer);
					this.moveToPosition(startBlock, $['POSITION_BEFORE_START']);
					startBlock = null;
				} else {
					endBlock = this.splitElement(startBlock);
					
					// In Gecko, the last child node must be a bogus <br>.
					// Note: bogus <br> added under <ul> or <ol> would cause
					// lists to be incorrectly rendered.
					if (!env.ie && !startBlock.is('ul', 'ol')) startBlock.appendBogus();
				}
			}
			
			return {
				previousBlock: startBlock,
				nextBlock: endBlock,
				wasStartOfBlock: isStartOfBlock,
				wasEndOfBlock: isEndOfBlock,
				elementPath: elementPath
			};
		},
		
		/**
		 * Branch the specified element from the collapsed range position and
		 * place the caret between the two result branches.
		 * Note: The range must be collapsed and been enclosed by this element.
		 * @param {Klass.DOM.element} element
		 * @return {Klass.DOM.element} Root element of the new branch after the split.
		 */
		splitElement: function(split){
			if (!this.collapsed) return null;
			
			// Extract the contents of the block from the selection point to the end
			// of its contents.
			this.setEndAt(split, $['POSITION_BEFORE_END']);
			var documentFragment = this.extractContents();
			
			// Duplicate the element after it.
			var clone = split.clone(false);
			
			// Place the extracted contents into the duplicated element.
			clone.append(documentFragment).injectAfter(split);

			this.moveToPosition(split, $['POSITION_AFTER_END']);
			return clone;
		},

		/**
		 * Check whether a range boundary is at the inner boundary of a given
		 * element.
		 * @param {Klass.DOM.element} element The target element to check.
		 * @param {Number} checkType The boundary to check for both the range
		 *		and the element. It can be $['START'] or $['END'].
		 * @returns {Boolean} "true" if the range boundary is at the inner
		 *		boundary of the element.
		 */
		checkBoundaryOfElement: function(element, checkType){
			var checkStart = (checkType == $['START']);
			
			// Create a copy of this range, so we can manipulate it for our checks.
			var walkerRange = this.clone();
			
			// Collapse the range at the proper size.
			walkerRange.collapse(checkStart);
			
			// Expand the range to element boundary.
			walkerRange[checkStart ? 'setStartAt' : 'setEndAt'](element, checkStart ? $['POSITION_AFTER_START'] : $['POSITION_BEFORE_END']);
			
			// Create the walker, which will check if we have anything useful
			// in the range.
			var walker = new DOM.walker(walkerRange);
			walker.evaluator = elementBoundaryEval;
			
			return walker[checkStart ? 'checkBackward' : 'checkForward']();
		},
		
		// Calls to this function may produce changes to the DOM. The range may
		// be updated to reflect such changes.
		checkStartOfBlock: function(){
			var startContainer = this.startContainer, startOffset = this.startOffset;
			
			// If the starting node is a text node, and non-empty before the offset,
			// then we're surely not at the start of block.
			if (startOffset && startContainer.$text){
				var textBefore = startContainer.substring(0, startOffset).ltrim();
				if (textBefore.length) return false;
			}
			
			// We need to grab the block element holding the start boundary, so
			// let's use an element path for it.
			var path = new DOM.elementPath(this.startContainer);
			
			// Creates a range starting at the block start until the range start.
			var walkerRange = this.clone();
			walkerRange.collapse(true);
			walkerRange.setStartAt(path.block || path.blockLimit, $['POSITION_AFTER_START']);
			
			var walker = new DOM.walker(walkerRange);
			walker.evaluator = getCheckStartEndBlockEvalFunction(true);
			
			return walker.checkBackward();
		},
		
		checkEndOfBlock: function(){
			var endContainer = this.endContainer, endOffset = this.endOffset;
			
			// If the ending node is a text node, and non-empty after the offset,
			// then we're surely not at the end of block.
			if (endContainer.$text){
				var textAfter = endContainer.substring(endOffset).rtrim();
				if (textAfter.length) return false;
			}
			
			// We need to grab the block element holding the start boundary, so
			// let's use an element path for it.
			var path = new DOM.elementPath(this.endContainer);
			
			// Creates a range starting at the block start until the range start.
			var walkerRange = this.clone();
			walkerRange.collapse(false);
			walkerRange.setEndAt(path.block || path.blockLimit, $['POSITION_BEFORE_END']);
			
			var walker = new DOM.walker(walkerRange);
			walker.evaluator = getCheckStartEndBlockEvalFunction(false);
			
			return walker.checkForward();
		},
		
		/**
		 * Check if elements at which the range boundaries anchor are read-only,
		 * with respect to "contenteditable" attribute.
		 */
		checkReadOnly: (function(){
			function checkNodesEditable(node, anotherEnd){
				while (node){
					if (node.$element){
						var contentEditable = node.getProperty('contentEditable');
						if (contentEditable == 'false' && !node.data('kse-editable')) return 0;
						else if (node.is('html') || contentEditable == 'true' && (node.contains(anotherEnd) || node.equals(anotherEnd))) break;
					}
					node = node.parent();
				}
				
				return 1;
			}
			
			return function(){
				var startNode = this.startContainer, endNode = this.endContainer;
				
				// Check if elements path at both boundaries are editable.
				return !(checkNodesEditable(startNode, endNode) && checkNodesEditable(endNode, startNode));
			};
		})(),

		/**
		 * Moves the range boundaries to the first/end editing point inside an
		 * element. For example, in an element tree like
		 * "&lt;p&gt;&lt;b&gt;&lt;i&gt;&lt;/i&gt;&lt;/b&gt; Text&lt;/p&gt;", the start editing point is
		 * "&lt;p&gt;&lt;b&gt;&lt;i&gt;^&lt;/i&gt;&lt;/b&gt; Text&lt;/p&gt;" (inside &lt;i&gt;).
		 * @param {Klass.DOM.element} el The element into which look for the
		 *		editing spot.
		 * @param {Boolean} isMoveToEnd Whether move to the end editable position.
		 */
		moveToElementEditablePosition: function(el, isMoveToEnd){
			var nbspRegExp = /^[\t\r\n ]*(?:&nbsp;|\xa0)$/;
			
			function nextDFS(node, childOnly){
				var next;
				if (node.$element && node.isEditable(false)) next = node[isMoveToEnd ? 'last' : 'first'](nonWhitespaceOrBookmarkEval);
				if (!childOnly && !next) next = node[isMoveToEnd ? 'prev' : 'next'](nonWhitespaceOrBookmarkEval);
				return next;
			}
			
			// Handle non-editable element e.g. HR.
			if (el.$element && !el.isEditable(false)){
				this.moveToPosition(el, isMoveToEnd ? $['POSITION_AFTER_END'] : $['POSITION_BEFORE_START']);
				return true;
			}
			
			var found = 0;
			
			while (el){
				// Stop immediately if we've found a text node.
				if (el.$text){
					// Put cursor before block filler.
					if (isMoveToEnd && this.checkEndOfBlock() && nbspRegExp.test(el.text())) this.moveToPosition(el, $['POSITION_BEFORE_START']);
					else this.moveToPosition(el, isMoveToEnd ? $['POSITION_AFTER_END'] : $['POSITION_BEFORE_START']);
					found = 1;
					break;
				}
				
				// If an editable element is found, move inside it, but not stop the searching.
				if (el.$element){
					if (el.isEditable()){
						this.moveToPosition(el, isMoveToEnd ? $['POSITION_BEFORE_END'] : $['POSITION_AFTER_START']);
						found = 1;
					// Put cursor before padding block br.
					} else if (isMoveToEnd && el.is('br') && this.checkEndOfBlock()) this.moveToPosition(el, $['POSITION_BEFORE_START']);
				}

				el = nextDFS(el, found);
			}
			
			return !!found;
		},
		
		/**
		 *@see {Klass.DOM.range.moveToElementEditablePosition}
		 */
		moveToElementEditStart: function(target){
			return this.moveToElementEditablePosition(target);
		},
		
		/**
		 *@see {Klass.DOM.range.moveToElementEditablePosition}
		 */
		moveToElementEditEnd: function(target){
			return this.moveToElementEditablePosition(target, true);
		},
		
		/**
		 * Get the single node enclosed within the range if there's one.
		 */
		getEnclosedNode: function(){
			var walkerRange = this.clone();
			
			// Optimize and analyze the range to avoid DOM destructive nature of walker. (#5780)
			walkerRange.optimize();
			if (!walkerRange.startContainer.$element || !walkerRange.endContainer.$element) return null;
			
			var walker = new DOM.walker(walkerRange), isNotBookmarks = DOM.walker.bookmark(true), isNotWhitespaces = DOM.walker.whitespaces(true), evaluator = function(node){
				return isNotWhitespaces(node) && isNotBookmarks(node);
			};
			walkerRange.evaluator = evaluator;
			var node = walker.next();
			walker.reset();
			return node && node.equals(walker.previous()) ? node : null;
		},
		
		getTouchedStartNode: function(){
			var container = this.startContainer;
			if (this.collapsed || !container.$element) return container;
			return container.child(this.startOffset) || container;
		},
		
		getTouchedEndNode: function(){
			var container = this.endContainer;
			if (this.collapsed || !container$element) return container;
			return container.child(this.endOffset - 1) || container;
		}

	});

})(Klass);