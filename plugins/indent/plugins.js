/**
 * @file Increse and decrease indent commands.
 */
(function(local){

	var $E = local.Editor;

	var $ = $E.constants;

	var listNodeNames = {
		ol: 1,
		ul: 1
	};
	
	var isNotWhitespaces = local.DOM.walker.whitespaces(true), isNotBookmark = local.DOM.walker.bookmark(false, true);
	
	function onSelectionChange(evt){
		var editor = evt.editor;
		
		var path = evt.path, list = path && path.contains(listNodeNames);
		
		if (list) return this.set($['TRISTATE_OFF']);
		
		if (!this.useIndentClasses && this.name == 'indent') return this.set($['TRISTATE_OFF']);
		
		var firstBlock = path.block || path.blockLimit;
		if (!firstBlock) return this.set($['TRISTATE_DISABLED']);
		
		if (this.useIndentClasses){
			var indentClass = firstBlock[0].className.match(this.clsRegex), indentStep = 0;
			if (indentClass){
				indentClass = indentClass[1];
				indentStep = this.clsMap[indentClass];
			}
			if ((this.name == 'outdent' && !indentStep) || (this.name == 'indent' && indentStep == editor.config.indentClasses.length)) 
				return this.set($['TRISTATE_DISABLED']);
			return this.set($['TRISTATE_OFF']);
		} else {
			var indent = parseInt(firstBlock.style(getIndentCssProperty(firstBlock)), 10);
			if (isNaN(indent)) indent = 0;
			if (indent <= 0) return this.set($['TRISTATE_DISABLED']);
			return this.set($['TRISTATE_OFF']);
		}
	}
	
	// Returns the CSS property to be used for identing a given element.
	function getIndentCssProperty(element, dir){
		return (dir || element.getComputedStyle('direction')) == 'ltr' ? 'margin-left' : 'margin-right';
	}
	
	function isListItem(node){
		return node.is && node.is('li');
	}

	var indentCommand = new Class({
	
		initialize: function(editor, name){
			var indentCls = editor.config.indentClasses, 
				length = indentCls && indentCls.length;

			this.name = name;
			this.useIndentClasses = !!length;
			if (this.useIndentClasses){
				this.clsMap = {};
				this.clsRegex = new RegExp('(?:^|\\s+)(' + indentCls.join('|') + ')(?=$|\\s)');
				for (var i = 0; i < length; i++) this.clsMap[indentCls[i]] = i + 1;
			}
			
			this.startDisabled = name == 'outdent';
		},

		execute: function(editor){
			var self = this, storage = {};
			
			function indentList(listNode){
				// Our starting and ending points of the range might be inside some blocks under a list item...
				// So before playing with the iterator, we need to expand the block to include the list items.
				var startContainer = range.startContainer, endContainer = range.endContainer;
				while (startContainer && !startContainer.parent().equals(listNode)) 
					startContainer = startContainer.parent();
				while (endContainer && !endContainer.parent().equals(listNode)) 
					endContainer = endContainer.parent();
				
				if (!startContainer || !endContainer) return;
				
				// Now we can iterate over the individual items on the same tree depth.
				var block = startContainer, itemsToMove = [], stopFlag = false;
				while (!stopFlag){
					if (block.equals(endContainer)) stopFlag = true;
					itemsToMove.push(block);
					block = block.next();
				}
				if (itemsToMove.length < 1) return;
				
				// Do indent or outdent operations on the array model of the list, not the
				// list's DOM tree itself. The array model demands that it knows as much as
				// possible about the surrounding lists, we need to feed it the further
				// ancestor node that is still a list.
				var listParents = listNode.parents(true);
				for (var i = 0, l = listParents.length; i < l; i++){
					if (listParents[i].name && listNodeNames[listParents[i].name()]){
						listNode = listParents[i];
						break;
					}
				}
				var indentOffset = self.name == 'indent' ? 1 : -1, startItem = itemsToMove[0], lastItem = itemsToMove[itemsToMove.length - 1];
				
				// Convert the list DOM tree into a one dimensional array.
				var listArray = $E.plugins.list.listToArray(listNode, storage);
				
				// Apply indenting or outdenting on the array.
				var baseIndent = listArray[lastItem.retrieve('listarray_index')].indent;
				for (i = startItem.retrieve('listarray_index'); i <= lastItem.retrieve('listarray_index'); i++){
					listArray[i].indent += indentOffset;
					// Make sure the newly created sublist get a brand-new element of the same type. (#5372)
					var listRoot = listArray[i].parent;
					listArray[i].parent = new local.DOM.element(listRoot.name(), null, listRoot.getDocument());
				}
				
				for (i = lastItem.retrieve('listarray_index') + 1; i < listArray.length && listArray[i].indent > baseIndent; i++) 
					listArray[i].indent += indentOffset;
				
				// Convert the array back to a DOM forest (yes we might have a few subtrees now).
				// And replace the old list with the new forest.
				var newList = $E.plugins.list.arrayToList(listArray, storage, null, editor.config.enterMode, listNode.getDirection());
				
				// Avoid nested <li> after outdent even they're visually same,
				// recording them for later refactoring.(#3982)
				if (self.name == 'outdent'){
					var parentLiElement;
					if ((parentLiElement = listNode.parent()) && parentLiElement.is('li')){
						var children = newList.listNode.children(), pendingLis = [], length = children.length, child;
						
						for (i = length - 1; i >= 0; i--){
							if ((child = children[i]) && child.is && child.is('li')) pendingLis.push(child);
						}
					}
				}
				
				if (newList) newList.listNode.replaces(listNode);
				
				// Move the nested <li> to be appeared after the parent.
				if (pendingLis && pendingLis.length){
					for (i = 0, l = pendingLis.length; i < l; i++){
						var li = pendingLis[i], followingList = li;
						
						// Nest preceding <ul>/<ol> inside current <li> if any.
						while ((followingList = followingList.next()) && followingList.is && followingList.name() in listNodeNames){
							// IE requires a filler NBSP for nested list inside empty list item,
							// otherwise the list item will be inaccessiable. (#4476)
							if (local.env.ie && !li.first(function(node){
								return isNotWhitespaces(node) && isNotBookmark(node);
							})) li.append(range.document.createText('\u00a0'));
							
							li.append(followingList);
						}
						
						li.injectAfter(parentLiElement);
					}
				}
			}
			
			function indentBlock(){
				var iterator = range.createIterator(), enterMode = editor.config.enterMode, block;
				iterator.enforceRealBlocks = true;
				iterator.enlargeBr = enterMode != $['ENTER_BR'];
				while ((block = iterator.getNextParagraph())) 
					indentElement(block);
			}
			
			function indentElement(element, dir){
				if (element.retrieve('indent_processed')) return false;
				
				if (self.useIndentClasses){
					// Transform current class name to indent step index.
					var indentClass = element[0].className.match(self.clsRegex), indentStep = 0;
					if (indentClass){
						indentClass = indentClass[1];
						indentStep = self.clsMap[indentClass];
					}
					
					// Operate on indent step index, transform indent step index back to class
					// name.
					if (self.name == 'outdent') indentStep--;
					else indentStep++;
					
					if (indentStep < 0) return false;
					
					indentStep = Math.min(indentStep, editor.config.indentClasses.length);
					indentStep = Math.max(indentStep, 0);
					element[0].className = element[0].className.replace(self.clsRegex, '').ltrim();
					if (indentStep > 0) element.addClass(editor.config.indentClasses[indentStep - 1]);
				} else {
					var indentCssProperty = getIndentCssProperty(element, dir), currentOffset = parseInt(element.style(indentCssProperty), 10);
					if (isNaN(currentOffset)) currentOffset = 0;
					var indentOffset = editor.config.indentOffset || 40;
					currentOffset += (self.name == 'indent' ? 1 : -1) * indentOffset;
					
					if (currentOffset < 0) return false;
					
					currentOffset = Math.max(currentOffset, 0);
					currentOffset = Math.ceil(currentOffset / indentOffset) * indentOffset;
					element.style(indentCssProperty, currentOffset ? currentOffset + (editor.config.indentUnit || 'px') : '');
					if (element.getProperty('style') === '') element.removeProperty('style');
				}
				
				local.DOM.element.setMarker(storage, element, 'indent_processed', 1);
				return true;
			}
			
			var selection = editor.getSelection(), 
				bookmarks = selection.createBookmarks(1), 
				ranges = selection && selection.getRanges(1), range;
			
			var iterator = ranges.createIterator();
			while ((range = iterator.getNextRange())){
				var rangeRoot = range.getCommonAncestor(), nearestListBlock = rangeRoot;
				
				while (nearestListBlock && !(nearestListBlock.$element && listNodeNames[nearestListBlock.name()])) 
					nearestListBlock = nearestListBlock.parent();
				
				// Avoid having selection enclose the entire list.
				if (!nearestListBlock){
					var selectedNode = range.getEnclosedNode();
					if (selectedNode && selectedNode.$element && selectedNode.name() in listNodeNames){
						range.setStartAt(selectedNode, $['POSITION_AFTER_START']);
						range.setEndAt(selectedNode, $['POSITION_BEFORE_END']);
						nearestListBlock = selectedNode;
					}
				}
				
				// Avoid selection anchors under list root.
				if (nearestListBlock && range.startContainer.$element && range.startContainer.name() in listNodeNames){
					var walker = new local.DOM.walker(range);
					walker.evaluator = isListItem;
					range.startContainer = walker.next();
				}
				
				if (nearestListBlock && range.endContainer.$element && range.endContainer.name() in listNodeNames){
					walker = new local.DOM.walker(range);
					walker.evaluator = isListItem;
					range.endContainer = walker.previous();
				}
				
				if (nearestListBlock){
					var firstListItem = nearestListBlock.first(isListItem), 
						hasMultipleItems = !!firstListItem.next(isListItem), rangeStart = range.startContainer, 
						indentWholeList = firstListItem.equals(rangeStart) || firstListItem.contains(rangeStart);
					
					// Indent the entire list if cursor is inside the first list item. (#3893)
					// Only do that for indenting or when using indent classes or when there is something to outdent. (#6141)
					if (!(indentWholeList && (self.name == 'indent' || self.useIndentClasses || 
						parseInt(nearestListBlock.style(getIndentCssProperty(nearestListBlock)), 10)) && 
						indentElement(nearestListBlock, !hasMultipleItems && firstListItem.getDirection()))) indentList(nearestListBlock);
				} else indentBlock();
			}
			
			// Clean up the markers.
			local.DOM.element.clearMarkers(storage);
			
			editor.focus();
			editor.forceNextSelectionCheck();
			selection.selectBookmarks(bookmarks);
		}

	});
	
	$E.plugins.implement('indent', function(editor){

		var addCommand = function(item){
			// Register commands.
			var command = editor.addCommand(item, new indentCommand(editor, item));

			// Register the state changing handlers.
			editor.addEvent('selectionChange', onSelectionChange.bind(command));
		};

		['indent', 'outdent'].each(addCommand);

		
		// [IE6/7] Raw lists are using margin instead of padding for visual indentation in wysiwyg mode. (#3893)
		/*if (local.env.ie6 || local.env.ie67){
			editor.addCss("ul,ol" +
			"{" +
			"	margin-left: 0px;" +
			"	padding-left: 40px;" +
			"}");
		}
		
		// Register dirChanged listener.
		editor.on('dirChanged', function(e){
			var range = new local.DOM.range(editor.document);
			range.setStartBefore(e.data.node);
			range.setEndAfter(e.data.node);
			
			var walker = new local.DOM.walker(range), node;
			
			while ((node = walker.next())){
				if (node.$element){
					// A child with the defined dir is to be ignored.
					if (!node.equals(e.data.node) && node.getDirection()){
						range.setStartAfter(node);
						walker = new local.DOM.walker(range);
						continue;
					}
					
					// Switch alignment classes.
					var classes = editor.config.indentClasses;
					if (classes){
						var suffix = (e.data.dir == 'ltr') ? ['_rtl', ''] : ['', '_rtl'];
						for (var i = 0, l = classes.length; i < l; i++){
							if (node.hasClass(classes[i] + suffix[0])){
								node.removeClass(classes[i] + suffix[0]);
								node.addClass(classes[i] + suffix[1]);
							}
						}
					}
					
					// Switch the margins.
					var marginLeft = node.style('margin-right'), marginRight = node.style('margin-left');
					
					node.style('margin-left', marginLeft || null);
					node.style('margin-right', marginRight || null);
				}
			}
		});*/

	});

})(Klass);

/**
 * Size of each indentation step
 * @name Klass.Editor.config.indentOffset
 * @type Number
 * @default 40
 * @example
 * config.indentOffset = 4;
 */

 /**
 * Unit for the indentation style
 * @name Klass.Editor.config.indentUnit
 * @type String
 * @default 'px'
 * @example
 * config.indentUnit = 'em';
 */

 /**
 * List of classes to use for indenting the contents. If it's null, no classes will be used
 * and instead the {@link #indentUnit} and {@link #indentOffset} properties will be used.
 * @name Klass.Editor.config.indentClasses
 * @type Array
 * default null
 * @example
 * // Use the classes 'Indent1', 'Indent2', 'Indent3'
 * config.indentClasses = ['Indent1', 'Indent2', 'Indent3'];
 */