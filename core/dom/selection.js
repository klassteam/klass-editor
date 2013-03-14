(function(window, local, undefined){

	var editor = local.Editor;

	var env = local.env;

	var $ = editor.constants;

	var document = window.document;

	var styleObjectElements = {
		img: 1,
		hr: 1,
		li: 1,
		table: 1,
		tr: 1,
		td: 1,
		th: 1,
		embed: 1,
		object: 1,
		ol: 1,
		ul: 1,
		a: 1,
		input: 1,
		form: 1,
		select: 1,
		textarea: 1,
		button: 1,
		fieldset: 1,
		thead: 1,
		tfoot: 1
	};

	function rangeRequiresFix(range){
		function isInlineCt(node){
			return node && node.$element && node.name() in editor.dtd.$removeEmpty;
		}
		
		function singletonBlock(node){
			var body = range.document.body();
			return !node.is('body') && body.length() == 1;
		}
		
		var start = range.startContainer, 
			offset = range.startOffset;
		
		if (start.$text) return false;
		
		// 1. Empty inline element. <span>^</span>
		// 2. Adjoin to inline element. <p><strong>text</strong>^</p>
		// 3. The only empty block in document. <body><p>^</p></body> (#7222)
		return !start.html().trim() ? isInlineCt(start) || singletonBlock(start) : 
			isInlineCt(start.child(offset - 1)) || isInlineCt(start.child(offset));
	}

	function createFillingChar(doc){
		removeFillingChar(doc);
		
		var fillingChar = doc.createText('\u200B');
		doc.store('kse-fillingChar', fillingChar);
		
		return fillingChar;
	}

	function getFillingChar(doc){
		return doc && doc.retrieve('kse-fillingChar');
	}

	// Checks if a filling char has been used, eventualy removing it (#1272).
	function checkFillingChar(doc){
		var fillingChar = doc && getFillingChar(doc);
		if (fillingChar){
			// Use this flag to avoid removing the filling char right after
			// creating it.
			if (fillingChar.retrieve('ready')) removeFillingChar(doc);
			else fillingChar.store('ready', 1);
		}
	}

	function removeFillingChar(doc){
		var fillingChar = getFillingChar(doc);
		if (fillingChar && doc.eliminate('kse-fillingChar')){
			var bookmarks, selection = doc.getSelection().getSelection(),
				range = selection && selection.type !== 'None' && selection.getRangeAt(0); 

			// Text selection position might get mangled by
			// subsequent dom modification, save it now for restoring.
			if (fillingChar.length() > 1 && range && range.intersectsNode(fillingChar[0])){
				bookmarks = [selection.anchorOffset, selection.focusOffset];

				// Anticipate the offset change brought by the removed char.
				var startAffected = selection.anchorNode == fillingChar[0] && selection.anchorOffset > 0,
					endAffected = selection.focusNode == fillingChar[0] && selection.focusOffset > 0;
				startAffected && bookmarks[0]--;
				endAffected && bookmarks[1]--;

				// Revert the bookmark order on reverse selection.
				isReversedSelection(selection) && bookmarks.unshift(bookmarks.pop());
			}

			// We can't simply remove the filling node because the user
			// will actually enlarge it when typing, so we just remove the
			// invisible char from it.
			fillingChar.text(fillingChar.text().replace(/\u200B/g, ''));

			// Restore the bookmark.
			if (bookmarks){
				var rng = selection.getRangeAt(0);
				rng.setStart(rng.startContainer, bookmarks[0]);
				rng.setEnd(rng.startContainer, bookmarks[1]);
				selection.removeAllRanges();
				selection.addRange(rng);
			}
		}
	}

	function isReversedSelection(selection){
		if (!selection.isCollapsed) {
			var range = selection.getRangeAt(0);
			// Potentially alter an reversed selection range.
			range.setStart(selection.anchorNode, selection.anchorOffset);
			range.setEnd(selection.focusNode, selection.focusOffset);
			return range.collapsed;
		}
	}

	/**
	 * Gets the current selection from the editing area when in WYSIWYG mode.
	 * @returns {Klass.DOM.selection} A selection object or null if not on
	 *		WYSIWYG mode or no selection is available.
	 */
	editor.implement({
		
		getSelection: function(){
			return this.document && this.document.getSelection();
		},
	
		forceNextSelectionCheck: function(){
			delete this.storage.selectionPreviousPath;
		}

	});
	
	/**
	 * Gets the current selection from the document.
	 * @returns {Klass.DOM.selection} A selection object.
	 */
	local.DOM.document.implement('getSelection', function(){
		var selection = new local.DOM.selection(this);
		return (!selection || selection.isInvalid) ? null : selection;
	});
	
	/**
	 * Manipulates the selection in a DOM document.
	 * @constructor
	 * @example
	 */
	local.DOM.selection = new Class({
		
		initialize: function(document){
			var lockedSelection = document.retrieve('kse-locked-selection');
			
			if (lockedSelection) return lockedSelection;
			
			this.document = document;
			this.isLocked = 0;
			this.storage = {};
			
			/**
			 * IE BUG: The selection's document may be a different document than the
			 * editor document. Return null if that's the case.
			 */
			if (env.ie){
				var range = this.getSelection().createRange();
				if (!range || (range.item && range.item(0).ownerDocument != this.document[0]) || 
					(range.parentElement && range.parentElement().ownerDocument != this.document[0])){
					this.isInvalid = true;
				}
			}
		},
	
		/**
		 * Gets the native selection object from the browser.
		 * @function
		 * @returns {Object} The native selection object.
		 */
		getSelection: function(){
			 if (this.storage.selection) return this.storage.selection;
			 if (env.ie) return this.storage.selection = this.document[0].selection;
			 return this.storage.selection = this.document.window.getSelection();
		},

		getRange: function(){
			var selection = this.getSelection();
			if (!selection) return null;
			return (selection.rangeCount > 0) ? selection.getRangeAt(0) : selection.createRange();
		},

		getNode: function(){
			var range = this.getRange();
			
			if (!env.ie){
				var element = null;
				
				if (range){
					element = range.commonAncestorContainer;
					
					// Handle selection a image or other control like element such as anchors
					if (!range.collapsed && range.startContainer == range.endContainer && (range.startOffset - range.endOffset < 2) 
						&& range.startContainer.hasChildNodes()) element = range.startContainer.childNodes[range.startOffset];
					
					while (local.type(element) !== 'element') element = element.parentNode;
				}
				
				return document.node(element);
			}
			
			return document.node(range.item ? range.item(0) : range.parentElement());
		},
		
		/**
		 * Gets the type of the current selection. The following values are
		 * @function
		 * @returns {Number} One of the following constant values
		 */
		getType: function(){
			var storage = this.storage; 
			if (storage.type) return storage.type;

			var selection = this.getSelection(), type;

			if (env.ie){
				type = $['SELECTION_NONE'];
				try {
					var IEType = selection.type;
					if (IEType == 'Text') type = $['SELECTION_TEXT'];
					if (IEType == 'Control') type = $['SELECTION_ELEMENT'];
					// It is possible that we can still get a text range
					// object even when type == 'None' is returned by IE.
					// So we'd better check the object returned by
					// createRange() rather than by looking at the type.
					if (selection.createRange().parentElement) type = $['SELECTION_TEXT'];
				} catch (e){}
			} else {
				type = $['SELECTION_TEXT'];
				if (!selection) type = $['SELECTION_NONE'];
				if (selection.rangeCount == 1){
					// Check if the actual selection is a control (IMG,
					// TABLE, HR, etc...).
					var range = selection.getRangeAt(0), startContainer = range.startContainer;
					if (startContainer == range.endContainer && startContainer.nodeType === 1 && (range.endOffset - range.startOffset) == 1 && 
						styleObjectElements[startContainer.childNodes[range.startOffset].nodeName.toLowerCase()]) type = $['SELECTION_ELEMENT'];
				}
			}
			return storage.type = type;
		},
	
		getTextRange: function(){
			function getNodeIndex(node){
				return new local.DOM.node(node).index();
			}

			// Finds the container and offset for a specific boundary
			// of an IE range.
			var getBoundaryInformation = function(range, start){
				// Creates a collapsed range at the requested boundary.
				range = range.duplicate();
				range.collapse(start);
				
				// Gets the element that encloses the range entirely.
				var parent = range.parentElement();
				var siblings = parent.childNodes;
				
				var testRange;
				
				for (var i = 0, l = siblings.length; i < l; i++){
					var child = siblings[i];
					if (child.nodeType == 1){
						testRange = range.duplicate();
						
						testRange.moveToElementText(child);
						
						var comparisonStart = testRange.compareEndPoints('StartToStart', range), 
							comparisonEnd = testRange.compareEndPoints('EndToStart', range);
						
						testRange.collapse();
						
						if (comparisonStart > 0) break;
						// When selection stay at the side of certain self-closing elements, e.g. BR,
						// our comparison will never shows an equality. (#4824)
						else if (!comparisonStart || comparisonEnd == 1 && comparisonStart == -1) return {container: parent, offset: i};
						else if (!comparisonEnd) return {container: parent, offset: i + 1};
						
						testRange = null;
					}
				}
				
				if (!testRange){
					testRange = range.duplicate();
					testRange.moveToElementText(parent);
					testRange.collapse(false);
				}
				
				testRange.setEndPoint('StartToStart', range);
				// IE report line break as CRLF with range.text but
				// only LF with textnode.nodeValue, normalize them to avoid
				// breaking character counting logic below. (#3949)
				var distance = testRange.text.replace(/(\r\n|\r)/g, '\n').length;
				
				try {
					while (distance > 0) 
						distance -= siblings[--i].nodeValue.length;
				} catch (e){
					distance = 0;
				}
				
				return (distance === 0) ? {container: parent, offset: i} : {container: siblings[i], offset: -distance};
			};

			// IE doesn't have range support (in the W3C way), so we
			// need to do some magic to transform selections into
			// Klass.DOM.range instances.
			var selection = this.getSelection(),
				nativeRange = selection && selection.createRange(),
				type = this.getType(), range;

			if (!selection) return [];
			
			if (type === $['SELECTION_TEXT']){
				range = new local.DOM.range(this.document);

				var boundaryInfo = getBoundaryInformation(nativeRange, true);
				range.setStart(document.node(boundaryInfo.container), boundaryInfo.offset);
				
				boundaryInfo = getBoundaryInformation(nativeRange);
				range.setEnd(document.node(boundaryInfo.container), boundaryInfo.offset);

				// Correct an invalid IE range case on empty list item. (#5850)
				if (range.endContainer.compareDocumentPosition(range.startContainer) & $['POSITION_PRECEDING'] && 
					range.endOffset <= range.startContainer.index()) range.collapse();
				
				return [range];
			} else if (type == $['SELECTION_ELEMENT']){
				var retval = [];
				
				for (var i = 0, l = nativeRange.length; i < l; i++){
					var element = nativeRange.item(i), parentElement = element.parentNode, j = 0;
					
					range = new local.DOM.range(this.document);
					
					for (; j < parentElement.childNodes.length && parentElement.childNodes[j] != element; j++){ /*jsl:pass*/}
					
					range.setStart(document.node(parentElement), j);
					range.setEnd(document.node(parentElement), j + 1);
					retval.push(range);
				}
				
				return retval;
			}
			
			return [];
		},

		/**
		 * Retrieve the {@link Klass.DOM.range} instances that represent the current selection.
		 * Note: Some browsers returns multiple ranges even on a sequent selection, e.g. Firefox returns
		 * one range for each table cell when one or more table row is selected.
		 * @return {Array}
		 * @example
		 * var ranges = selection.getRanges();
		 * alert(ranges.length);
		 */
		getRanges: function(onlyEditables){
			var func = function(){
				if (local.env.ie) return this.getTextRange();
			
				// On browsers implementing the W3C range, we simply
				// tranform the native ranges in Klass.DOM.range
				// instances.
				var ranges = [], range, 
					selection = this.getSelection(),
					doc = this.document;
				
				if (!selection) return ranges;
				
				// On WebKit, it may happen that we'll have no selection
				// available. We normalize it here by replicating the
				// behavior of other browsers.
				if (!selection.rangeCount){
					range = new local.DOM.range(doc);
					range.moveToElementEditStart(doc.body());
					ranges.push(range);
				}
				
				for (var i = 0, l = selection.rangeCount; i < l; i++){
					var nativeRange = selection.getRangeAt(i);
					
					range = new local.DOM.range(doc);
					
					range.setStart(document.node(nativeRange.startContainer), nativeRange.startOffset);
					range.setEnd(document.node(nativeRange.endContainer), nativeRange.endOffset);
					ranges.push(range);
				}

				return ranges;
			};
			
			var cache = this.storage;
			if (cache.ranges && !onlyEditables) return cache.ranges;
			else if (!cache.ranges) cache.ranges = new local.DOM.ranges(func.call(this));

			// Split range into multiple by read-only nodes.
			if (onlyEditables){
				var ranges = cache.ranges;
				for (var i = 0; i < ranges.length; i++){
					var range = ranges[i];
					
					// Drop range spans inside one ready-only node.
					var parent = range.getCommonAncestor();
					if (parent.isReadOnly()) ranges.splice(i, 1);
					
					if (range.collapsed) continue;

					// Range may start inside a non-editable element,
					// replace the range start after it.
					if (range.startContainer.isReadOnly()){
						var current = range.startContainer;
						while (current){
							if (current.is('body') || !current.isReadOnly()) break;
							if (current.$element && current.getProperty('contentEditable') == 'false') range.setStartAfter(current);
							current = current.parent();
						}
					}

					var startContainer = range.startContainer, 
						endContainer = range.endContainer, 
						startOffset = range.startOffset, 
						endOffset = range.endOffset, 
						walkerRange = range.clone();
					
					// Enlarge range start/end with text node to avoid walker
					// being DOM destructive, it doesn't interfere our checking
					// of elements below as well.
					if (startContainer && startContainer.$text){
						if (startOffset >= startContainer.length()) walkerRange.setStartAfter(startContainer);
						else walkerRange.setStartBefore(startContainer);
					}
					
					if (endContainer && endContainer.$text){
						if (!endOffset) walkerRange.setEndBefore(endContainer);
						else walkerRange.setEndAfter(endContainer);
					}
					
					// Looking for non-editable element inside the range.
					var walker = new local.DOM.walker(walkerRange);
					walker.evaluator = function(node){
						if (node.$element && node.isReadOnly()){
							var newRange = range.clone();
							range.setEndBefore(node);
							
							// Drop collapsed range around read-only elements,
							// it make sure the range list empty when selecting
							// only non-editable elements.
							if (range.collapsed) ranges.splice(i--, 1);
							
							// Avoid creating invalid range.
							if (!(node.compareDocumentPosition(walkerRange.endContainer) & $['POSITION_CONTAINS'])){
								newRange.setStartAfter(node);
								if (!newRange.collapsed) ranges.splice(i + 1, 0, newRange);
							}
							
							return true;
						}
						
						return false;
					};
					
					walker.next();
				}
			}
			
			return cache.ranges;
		},
		
		/**
		 * Gets the DOM element in which the selection starts.
		 * @returns {Klass.DOM.element} The element at the beginning of the selection.
		 */
		getStartElement: function(){
			var cache = this.storage;
			if (cache.startElement !== undefined) return cache.startElement;
			
			var node;

			switch (this.getType()){
				case $['SELECTION_ELEMENT']:
					return this.getSelectedElement();
					
				case $['SELECTION_TEXT']:
					var range = this.getRanges()[0];
					
					if (range){
						if (!range.collapsed){
							range.optimize();
							// Decrease the range content to exclude particial
							// selected node on the start which doesn't have
							// visual impact. ( #3231 )
							while (1){
								var startContainer = range.startContainer, startOffset = range.startOffset;
								// Limit the fix only to non-block elements.(#3950)
								if (startOffset == startContainer.length() && !startContainer.isBlockBoundary()) range.setStartAfter(startContainer);
								else break;
							}
							
							node = range.startContainer;
							
							if (!node.$element) return node.parent();
							
							node = node.child(range.startOffset);
							
							if (!node || !node.$element) node = range.startContainer;
							else {
								var child = node.first();
								while (child && child.$element){
									node = child;
									child = child.first();
								}
							}
						} else {
							node = range.startContainer;
							if (!node.$element) node = node.parent();
						}
						
						node = node[0];
					}
			}
			
			return cache.startElement = (node ? new local.DOM.element(node) : null);
		},
		
		/**
		 * Gets the current selected element.
		 * @returns {Klass.DOM.element} The selected element. Null if no
		 *		selection is available or the selection type is not 3
		 */
		getSelectedElement: function(){
			var cache = this.storage;
			if (cache.selectedElement !== undefined) return cache.selectedElement;
			
			var self = this;
			
			var node = Function.attempt(function(){
				return self.getSelection().createRange().item(0);
			}, function(){
				// If a table or list is fully selected.
				var root, result, 
					range = self.getRanges()[0], 
					ancestor = range.getCommonAncestor(1, 1), 
					tags = {
						table: 1,
						ul: 1,
						ol: 1,
						dl: 1
					};
				
				for (var t in tags){
					if ((root = ancestor.getAscendant(t, 1))) break;
				}
				
				if (root) {
					// Enlarging the start boundary.
					var testRange = new local.DOM.range(this.document);
					testRange.setStartAt(root, $['POSITION_AFTER_START']);
					testRange.setEnd(range.startContainer, range.startOffset);
					
					var enlargeables = Object.merge(tags, editor.dtd.$listItem, editor.dtd.$tableContent), 
						walker = new local.DOM.walker(testRange),  
						// Check the range is at the inner boundary of the structural element.
						guard = function(walker, isEnd){
							return function(node, isWalkOut){
								if (node.$text && (!node.text().trim() || node.parent().data('kse-bookmark'))) return true;
								
								var tag;
								if (node.$element){
									tag = node.name();

									// Bypass bogus br at the end of block.
									if (tag == 'br' && isEnd && node.equals(node.parent().getBogus())) return true;
									
									if (isWalkOut && tag in enlargeables || tag in editor.dtd.$removeEmpty) return true;
								}
								
								walker.halted = 1;
								return false;
							};
						};
					
					walker.guard = guard(walker);
					
					if (walker.checkBackward() && !walker.halted){
						walker = new local.DOM.walker(testRange);
						testRange.setStart(range.endContainer, range.endOffset);
						testRange.setEndAt(root, $['POSITION_BEFORE_END']);
						walker.guard = guard(walker, 1);
						if (walker.checkForward() && !walker.halted) result = root[0];
					}
				}
				
				if (!result) throw 0;

				return result;
			}, function(){
				var range = self.getRanges()[0], enclosed, selected;
				// Check first any enclosed element, e.g. <ul>[<li><a href="#">item</a></li>]</ul>
				for (var i = 2; i && !((enclosed = range.getEnclosedNode()) && (enclosed.$element) && 
					styleObjectElements[enclosed.name()] && (selected = enclosed)); i--){
					// Then check any deep wrapped element, e.g. [<b><i><img /></i></b>]
					range.shrink($['SHRINK_ELEMENT']);
				}
				return selected[0];
			});
			
			return cache.selectedElement = (node ? new local.DOM.element(node) : null);
		},

		/**
		 * Retrieves the text contained within the range. An empty string is returned for non-text selection.
		 * @returns {String} A string of text within the current selection.
		 */
		getSelectedText: function(){
			var storage = this.storage;
			if (storage.selectedText !== undefined) return storage.selectedText;
			
			var text = '', selection = this.getSelection();
			if (this.getType() == $['SELECTION_TEXT']) text = env.ie ? selection.createRange().text : selection.toString();

			return (storage.selectedText = text);
		},

		lock: function(){
			// Call all cacheable function.
			this.getRanges();
			this.getStartElement();
			this.getSelectedElement();
			this.getSelectedText();
			
			// The native selection is not available when locked.
			this.storage.selection = {};
			
			this.isLocked = 1;
			
			// Save this selection inside the DOM document.
			this.document.store('kse-locked-selection', this);
		},
		
		unlock: function(restore){
			var document = this.document, lockedSelection = document.retrieve('kse-locked-selection');
			
			if (lockedSelection){
				document.store('kse-locked-selection', null);
				
				if (restore){
					var selectedElement = lockedSelection.getSelectedElement(), ranges = !selectedElement && lockedSelection.getRanges();
					
					this.isLocked = 0;
					this.reset();
					
					if (selectedElement) this.selectElement(selectedElement);
					else this.selectRanges(ranges);
				}
			}
			
			if (!lockedSelection || !restore){
				this.isLocked = 0;
				this.reset();
			}
		},
		
		reset: function(){
			this.storage = {};
		},
		
		/**
		 * Make the current selection of type {@link Klass.Editor.SELECTION_ELEMENT} by enclosing the specified element.
		 * @param element
		 */
		selectElement: function(element){
			var doc = this.document,
				range;

			if (this.isLocked){
				range = new local.DOM.range(doc);
				range.setStartBefore(element);
				range.setEndAfter(element);
				
				this.storage.selectedElement = element;
				this.storage.startElement = element;
				this.storage.ranges = new local.DOM.ranges(range);
				this.storage.type = $['SELECTION_ELEMENT'];
				
				return;
			}
			
			range = new local.DOM.range(element.getDocument());
			range.setStartBefore(element);
			range.setEndAfter(element);
			range.select();

			doc.fireEvent('selectionchange');

			this.reset();
		},
		
		/**
		 * Adding the specified ranges to document selection preceding
		 * by clearing up the original selection.
		 * @param {Klass.DOM.range} ranges
		 */
		selectRanges: function(ranges){
			if (this.isLocked){
				this.storage.selectedElement = null;
				this.storage.startElement = ranges[0] && ranges[0].getTouchedStartNode();
				this.storage.ranges = new local.DOM.ranges(ranges);
				this.storage.type = $['SELECTION_TEXT'];
				
				return;
			}

			if (env.ie){
				if (ranges.length > 1){
					// IE doesn't accept multiple ranges selection, so we join all into one.
					var last = ranges[ranges.length - 1];
					ranges[0].setEnd(last.endContainer, last.endOffset);
					ranges.length = 1;
				}
				
				if (ranges[0]) ranges[0].select();
				
				this.reset();
			} else {
				var selection = this.getSelection();

				if (!selection) return;

				if (ranges.length){
					selection.removeAllRanges();
					// Remove any existing filling char first.
					env.webkit && removeFillingChar(this.document);
				}

				for (var i = 0; i < ranges.length; i++){
					// Joining sequential ranges introduced by
					// readonly elements protection.
					if (i < ranges.length - 1){
						var left = ranges[i], right = ranges[i + 1], between = left.clone();
						between.setStart(left.endContainer, left.endOffset);
						between.setEnd(right.startContainer, right.startOffset);
						
						// Don't confused by Firefox adjancent multi-ranges
						// introduced by table cells selection.
						if (!between.collapsed){
							between.shrink($['NODE_ELEMENT'], true);

							var ancestor = between.getCommonAncestor(), 
								enclosed = between.getEnclosedNode();

							// The following cases has to be considered:
							// 1. <span contenteditable="false">[placeholder]</span>
							// 2. <input contenteditable="false"  type="radio"/> (#6621)
							if (ancestor.isReadOnly() || enclosed && enclosed.isReadOnly()){
								right.setStart(left.startContainer, left.startOffset);
								ranges.splice(i--, 1);
								continue;
							}
						}
					}
					
					var range = ranges[i];
					var nativeRange = this.document[0].createRange();
					var startContainer = range.startContainer;

					// In FF2, if we have a collapsed range, inside an empty
					// element, we must add something to it otherwise the caret
					// will not be visible.
					// In Opera instead, the selection will be moved out of the
					// element. (#4657)
					if (range.collapsed && env.opera && startContainer.$element && !startContainer.length()){
						startContainer.appendText('');
					}

					if (range.collapsed && env.webkit && rangeRequiresFix(range)){
						// Append a zero-width space so WebKit will not try to
						// move the selection by itself (#1272).
						var fillingChar = createFillingChar(this.document);
						range.insertNode(fillingChar);

						var next = fillingChar.next();

						// If the filling char is followed by a <br>, whithout
						// having something before it, it'll not blink.
						// Let's remove it in this case.
						if (next && !fillingChar.prev() && next.$element && next.name() === 'br'){
							removeFillingChar(this.document);
							range.moveToPosition(next, $['POSITION_BEFORE_START']);
						} else range.moveToPosition(fillingChar, $['POSITION_AFTER_END']);

					}

					nativeRange.setStart(startContainer[0], range.startOffset);

					try {
						nativeRange.setEnd(range.endContainer[0], range.endOffset);
					} catch (e){
						// There is a bug in Firefox implementation (it would be too easy
						// otherwise). The new start can't be after the end (W3C says it can).
						// So, let's create a new range and collapse it to the desired point.
						if (e.toString().indexOf('NS_ERROR_ILLEGAL_VALUE') >= 0){
							range.collapse(1);
							nativeRange.setEnd(range.endContainer[0], range.endOffset);
						} else throw e;
					}
					
					// Select the range.
					selection.addRange(nativeRange);
				}

				// Don't miss selection change event for non-IEs.
				this.document.fireEvent('selectionchange');
				this.reset();
			}
		},
		
		/**
		 *  Create bookmark for every single of this selection range (from #getRanges)
		 * by calling the {@link Klass.DOM.range.prototype.createBookmark} method,
		 * with extra cares to avoid interferon among those ranges. Same arguments are
		 * received as with the underlay range method.
		 */
		createBookmarks: function(serializable){
			return this.getRanges().createBookmarks(serializable);
		},
		
		/**
		 *  Create bookmark for every single of this selection range (from #getRanges)
		 * by calling the {@link Klass.DOM.range.prototype.createBookmark2} method,
		 * with extra cares to avoid interferon among those ranges. Same arguments are
		 * received as with the underlay range method.
		 */
		createBookmarks2: function(normalized){
			return this.getRanges().createBookmarks2(normalized);
		},
		
		/**
		 * Select the virtual ranges denote by the bookmarks by calling #selectRanges.
		 * @param bookmarks
		 */
		selectBookmarks: function(bookmarks){
			var ranges = [];
			for (var i = 0, l = bookmarks.length; i < l; i++){
				var range = new local.DOM.range(this.document);
				range.moveToBookmark(bookmarks[i]);
				ranges.push(range);
			}
			this.selectRanges(ranges);
			return this;
		},

		selectNode: function(node, collapse){
			var range = this.getRange();
			var selection = this.getSelection();
			
			if (range.moveToElementText){
				Function.attempt(function(){
					range.moveToElementText(node);
					range.select();
				});
			} else if (selection.addRange){
				collapse ? range.selectNodeContents(node) : range.selectNode(node);
				selection.removeAllRanges();
				selection.addRange(range);
			} else {
				selection.setBaseAndExtent(node, 0, node, 1);
			}
			
			return node;
		},
		
		/**
		 * Retrieve the common ancestor node of the first range and the last range.
		 */
		getCommonAncestor: function(){
			var ranges = this.getRanges(), startNode = ranges[0].startContainer, endNode = ranges[ranges.length - 1].endContainer;
			return startNode.getCommonAncestor(endNode);
		},
		
		/**
		 * Moving scroll bar to the current selection's start position.
		 */
		scrollIntoView: function(){
			// If we have split the block, adds a temporary span at the
			// range position and scroll relatively to it.
			var startElement = this.getStartElement();
			startElement.scrollIntoView();
		}

	});

	var notWhitespaces = local.DOM.walker.whitespaces(true), fillerTextRegex = /\ufeff|\u00a0/, nonCells = {
		table: 1,
		tbody: 1,
		tr: 1
	};
	
	local.DOM.range.implement('select', env.ie ? function(forceExpand){
		var doc = this.document;
		var body = doc[0].body;
		var collapsed = this.collapsed;
		var isStartMarkerAlone;
		var dummySpan;
		var range;
		
		// Try to make a object selection.
		var selected = this.getEnclosedNode();
		if (selected){
			try {
				range = body.createControlRange();
				range.addElement(selected[0]);
				range.select();
				return;
			} catch (e){}
		}

		// IE doesn't support selecting the entire table row/cell, move the selection into cells, e.g.
		// <table><tbody><tr>[<td>cell</b></td>... => <table><tbody><tr><td>[cell</td>...
		if (this.startContainer.$element && this.startContainer.name() in nonCells || 
			this.endContainer.$element && this.endContainer.name() in nonCells) this.shrink($['NODE_ELEMENT'], true);

		var bookmark = this.createBookmark();
		
		// Create marker tags for the start and end boundaries.
		var startNode = bookmark.startNode;
		
		var endNode;
		if (!collapsed) endNode = bookmark.endNode;
		
		// Create the main range which will be used for the selection.
		range = body.createTextRange();
		
		// Position the range at the start boundary.
		range.moveToElementText(startNode[0]);
		range.moveStart('character', 1);
		
		if (endNode){
			// Create a tool range for the end.
			var ieRangeEnd = body.createTextRange();

			// Position the tool range at the end.
			ieRangeEnd.moveToElementText(endNode[0]);
			
			// Move the end boundary of the main range to match the tool range.
			range.setEndPoint('EndToEnd', ieRangeEnd);
			range.moveEnd('character', -1);
		} else {
			// The isStartMarkerAlone logic comes from V2. It guarantees that the lines
			// will expand and that the cursor will be blinking on the right place.
			// Actually, we are using this flag just to avoid using this hack in all
			// situations, but just on those needed.
			var next = startNode.next(notWhitespaces);
			isStartMarkerAlone = (!(next && next.text && next.text().match(fillerTextRegex)) && 
				(forceExpand || !startNode.hasPrevious() || (startNode.prev().is && startNode.prev().is('br'))));
			
			// Append a temporary <span>&#65279;</span> before the selection.
			// This is needed to avoid IE destroying selections inside empty
			// inline elements, like <b></b> (#253).
			// It is also needed when placing the selection right after an inline
			// element to avoid the selection moving inside of it.
			dummySpan = doc.createElement('span', {html: '&#65279;'}).injectBefore(startNode);
			
			if (isStartMarkerAlone){
				// To expand empty blocks or line spaces after <br>, we need
				// instead to have any char, which will be later deleted using the
				// selection.
				// \ufeff = Zero Width No-Break Space (U+FEFF). (#1359)
				doc.createText('\ufeff').injectBefore(startNode);
			}
		}
		
		// Remove the markers (reset the position, because of the changes in the DOM tree).
		this.setStartBefore(startNode);
		startNode.dispose();
		
		if (collapsed){
			if (isStartMarkerAlone){
				// Move the selection start to include the temporary \ufeff.
				range.moveStart('character', -1);
				range.select();
				// Remove our temporary stuff.
				doc[0].selection.clear();
			} else range.select();
			
			this.moveToPosition(dummySpan, $['POSITION_BEFORE_START']);
			dummySpan.dispose();
		} else {
			this.setEndBefore(endNode);
			endNode.dispose();
			range.select();
		}
		doc.fireEvent('selectionchange');
	} : function(){
		this.document.getSelection().selectRanges([this]);
	});

})(window, Klass);