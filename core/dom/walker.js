(function(local){

	var $dtd = local.Editor.dtd;

	function iterate(rtl, breakOnFalse){
		// Return null if we have reached the end.
		if (this.storage.end) return null;

		var node, range = this.range, guard, 
			userGuard = this.guard, type = this.type, 
			getSourceNodeFn = (rtl ? 'getPreviousSourceNode' : 'getNextSourceNode');

		// This is the first call. Initialize it.
		if (!this.storage.start){
			this.storage.start = 1;
			
			// Trim text nodes and optmize the range boundaries. DOM changes
			// may happen at this point.
			range.trim();
			
			// A collapsed range must return null at first call.
			if (range.collapsed){
				this.end();
				return null;
			}
		}
		
		// Create the LTR guard function, if necessary.
		if (!rtl && !this.storage.guardLTR){
			// Gets the node that stops the walker when going LTR.
			var limitLTR = range.endContainer, blockerLTR = limitLTR.child(range.endOffset);

			this.storage.guardLTR = function(node, movingOut){
				return ((!movingOut || !limitLTR.equals(node)) && 
					(!blockerLTR || !node.equals(blockerLTR)) && 
					(!node.$element || !movingOut || node.name() != 'body'));
			};
		}
		
		// Create the RTL guard function, if necessary.
		if (rtl && !this.storage.guardRTL){
			// Gets the node that stops the walker when going LTR.
			var limitRTL = range.startContainer, blockerRTL = (range.startOffset > 0) && limitRTL.child(range.startOffset - 1);

			this.storage.guardRTL = function(node, movingOut){
				return ((!movingOut || !limitRTL.equals(node)) && 
					(!blockerRTL || !node.equals(blockerRTL)) && 
					(!node.$element || !movingOut || node.name() != 'body'));
			};
		}
		
		// Define which guard function to use.
		var stopGuard = rtl ? this.storage.guardRTL : this.storage.guardLTR;
		
		// Make the user defined guard function participate in the process,
		// otherwise simply use the boundary guard.
		if (userGuard){
			guard = function(node, movingOut){
				if (stopGuard(node, movingOut) === false) return false;
				
				return userGuard(node, movingOut);
			};
		} else guard = stopGuard;

		if (!this.current){
			// Get the first node to be returned.
			if (rtl){
				node = range.endContainer;

				if (range.endOffset > 0){
					node = node.child(range.endOffset - 1);
					if (guard(node) === false) node = null;
				} else node = (guard(node, true) === false) ? null : node.getPreviousSourceNode(true, type, guard);
			} else {
				node = range.startContainer;
				node = node.child(range.startOffset);
				if (node){
					if (guard(node) === false) node = null;
				} else node = (guard(range.startContainer, true) === false) ? null : range.startContainer.getNextSourceNode(true, type, guard);
			}
		} else node = this.current[getSourceNodeFn](false, type, guard);

		while (node && !this.storage.end){
			this.current = node;

			if (!this.evaluator || this.evaluator(node) !== false){
				if (!breakOnFalse) return node;
			} else if (breakOnFalse && this.evaluator) return false;
			
			node = node[getSourceNodeFn](false, type, guard);
		}
		
		this.end();
		return this.current = null;
	}
	
	function iterateToLast(rtl){
		var node, last = null;

		while ((node = iterate.call(this, rtl))) 
			last = node;

		return last;
	}

	local.DOM.walker = new Class({
	
		initialize: function(range){
			this.range = range;
			this.storage = {};
		},

		/**
		 * Stop walking. No more nodes are retrieved if this function gets called.
		 */
		end: function(){
			this.storage.end = 1;
		},
		
		/**
		 * Retrieves the next node (at right).
		 * @returns {Klass.DOM.node} The next node or null if no more
		 *		nodes are available.
		 */
		next: function(){
			return iterate.call(this);
		},
		
		/**
		 * Retrieves the previous node (at left).
		 * @returns {Klass.DOM.node} The previous node or null if no more
		 *		nodes are available.
		 */
		previous: function(){
			return iterate.call(this, 1);
		},
		
		/**
		 * Check all nodes at right, executing the evaluation fuction.
		 * @returns {Boolean} "false" if the evaluator function returned
		 *		"false" for any of the matched nodes. Otherwise "true".
		 */
		checkForward: function(){
			return iterate.call(this, 0, 1) !== false;
		},
		
		/**
		 * Check all nodes at left, executing the evaluation fuction.
		 * @returns {Boolean} "false" if the evaluator function returned
		 *		"false" for any of the matched nodes. Otherwise "true".
		 */
		checkBackward: function(){
			return iterate.call(this, 1, 1) !== false;
		},
		
		/**
		 * Executes a full walk forward (to the right), until no more nodes
		 * are available, returning the last valid node.
		 * @returns {Klass.DOM.node} The last node at the right or null
		 *		if no valid nodes are available.
		 */
		lastForward: function(){
			return iterateToLast.call(this);
		},
		
		/**
		 * Executes a full walk backwards (to the left), until no more nodes
		 * are available, returning the last valid node.
		 * @returns {Klass.DOM.node} The last node at the left or null
		 *		if no valid nodes are available.
		 */
		lastBackward: function(){
			return iterateToLast.call(this, 1);
		},
		
		reset: function(){
			delete this.current;
			this.storage = {};
		}
	
	});

	/*
	 * Anything whose display computed style is block, list-item, table,
	 * table-row-group, table-header-group, table-footer-group, table-row,
	 * table-column-group, table-column, table-cell, table-caption, or whose node
	 * name is hr, br (when enterMode is br only) is a block boundary.
	 */
	var blockBoundaryDisplayMatch = {
		'block': 1,
		'list-item': 1,
		'table': 1,
		'table-row-group': 1,
		'table-header-group': 1,
		'table-footer-group': 1,
		'table-row': 1,
		'table-column-group': 1,
		'table-column': 1,
		'table-cell': 1,
		'table-caption': 1
	};

	local.DOM.walker.extend({
	
		blockBoundary: function(customNodeNames){
			return function(node, type){
				return !(node.$element && node.isBlockBoundary(customNodeNames));
			};
		},

		listItemBoundary: function(){
			return this.blockBoundary({
				br: 1
			});
		},

		/**
		 * Whether the to-be-evaluated node is a bookmark node OR bookmark node
		 * inner contents.
		 * @param {Boolean} contentOnly Whether only test againt the text content of
		 * bookmark node instead of the element itself(default).
		 * @param {Boolean} isReject Whether should return 'false' for the bookmark
		 * node instead of 'true'(default).
		 */
		bookmark: function(contentOnly, isReject){
			function isBookmarkNode(node){
				return (node && node.is && node.is('span') && node.data('kse-bookmark'));
			}
			
			return function(node){
				var isBookmark, parent;
				// Is bookmark inner text node?
				isBookmark = (node && !node.name && (parent = node.parent()) && isBookmarkNode(parent));
				// Is bookmark node?
				isBookmark = contentOnly ? isBookmark : isBookmark || isBookmarkNode(node);
				return !!(isReject ^ isBookmark);
			};
		}, 

		/**
		 * Whether the node is a text node containing only whitespaces characters.
		 * @param isReject
		 */
		whitespaces: function(isReject){
			return function(node){
				var isWhitespace = node && node.$text && !node.text().trim();
				return !!(isReject ^ isWhitespace);
			};
		},
		
		/**
		 * Whether the node is invisible in wysiwyg mode.
		 * @param isReject
		 */
		invisible: function(isReject){
			var whitespace = local.DOM.walker.whitespaces();
			return function(node){
				// Nodes that take no spaces in wysiwyg:
				// 1. White-spaces but not including NBSP;
				// 2. Empty inline elements, e.g. <b></b> we're checking here
				// 'offsetHeight' instead of 'offsetWidth' for properly excluding
				// all sorts of empty paragraph, e.g. <br />.
				var isInvisible = whitespace(node) || node.is && !node[0].offsetHeight;
				return !!(isReject ^ isInvisible);
			};
		},

		nodeType: function(type, isReject){
			return function(node){
				return !!(isReject ^ (node.type == type));
			};
		},

		bogus: function(isReject){
			function nonEmpty(node){
				return !isWhitespaces(node) && !isBookmark(node);
			}
			
			return function(node){
				var isBogus = !local.env.ie ? node.is && node.is('br') : node.text && tailNbspRegex.test(node.text());

				if (isBogus){
					var parent = node.parent(), next = node.next(nonEmpty);
					isBogus = parent.isBlockBoundary() && (!next || next.$element && next.isBlockBoundary());
				}
				
				return !!(isReject ^ isBogus);
			};
		}

	});
	
	var tailNbspRegex = /^[\t\r\n ]*(?:&nbsp;|\xa0)$/, 
		isWhitespaces = local.DOM.walker.whitespaces(), 
		isBookmark = local.DOM.walker.bookmark(), 
		toSkip = function(node){
			return isBookmark(node) || isWhitespaces(node) || 
				node.$element && node.name() in $dtd.$inline && !(node.name() in $dtd.$empty);
		};
	
	local.DOM.element.implement({
	
		isBlockBoundary: function(customNodeNames){
			var nodeNameMatches = Object.append($dtd.$block, customNodeNames || {}),
				styleFloat = this.getComputedStyle('float') || 'none';

			// Don't consider floated formatting as block boundary, fall back to dtd check in that case. (#6297)
			return styleFloat === 'none' && blockBoundaryDisplayMatch[this.getComputedStyle('display')] || nodeNameMatches[this.name()];
		},	

		// Check if there's a filler node at the end of an element, and return it.
		getBogus: function(){
			// Bogus are not always at the end, e.g. <p><a>text<br /></a></p>.
			var tail = this;
			do {
				tail = tail.getPreviousSourceNode();
			} while (toSkip(tail));

			if (tail && (!local.env.ie ? tail.is && tail.is('br') : tail.text && tailNbspRegex.test(tail.text()))){
				return tail;
			}
			return false;
		}

	});

})(Klass);