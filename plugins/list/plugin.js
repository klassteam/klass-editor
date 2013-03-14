/**
 * @file Insert and remove numbered and bulleted lists.
 */
(function(local){

	var listNodeNames = {ol: 1, ul: 1}, emptyTextRegex = /^[\n\r\t ]*$/;

	var DOM = local.DOM, 
		constructor = local.Editor, 
		dtd = constructor.dtd , 
		$ = constructor.constants;
	
	var whitespaces = DOM.walker.whitespaces(), 
		bookmarks = DOM.walker.bookmark(), 
		blockBogus = DOM.walker.bogus(),
		nonEmpty = function(node){
			return !(whitespaces(node) || bookmarks(node));
		};

	function cleanUpDirection(element){
		var dir, parent, parentDir;
		if ((dir = element.getDirection())){
			parent = element.parent();
			while (parent && !(parentDir = parent.getDirection())) 
				parent = parent.parent();
			
			if (dir == parentDir) element.removeProperty('dir');
		}
	}

	// Inheirt inline styles from another element.
	function inheirtInlineStyles(parent, el){
		var style = parent.getProperty('style');
		
		// Put parent styles before child styles.
		style && el.setProperty('style', style.replace(/([^;])$/, '$1;') + (el.getProperty('style') || ''));
	}

	var plugin = constructor.plugins.list = {
		/*
		 * Convert a DOM list tree into a data structure that is easier to
		 * manipulate. This operation should be non-intrusive in the sense that it
		 * does not change the DOM tree, with the exception that it may add some
		 * markers to the list item nodes when database is specified.
		 */
		listToArray: function(listNode, database, baseArray, baseIndentLevel, grandparentNode){
			if (!listNodeNames[listNode.name()]) return [];
			
			if (!baseIndentLevel) baseIndentLevel = 0;
			if (!baseArray) baseArray = [];
			
			// Iterate over all list items to and look for inner lists.
			for (var i = 0, l = listNode.length(); i < l; i++){
				var listItem = listNode.child(i);
				
				// Fixing malformed nested lists by moving it into a previous list item.
				if (listItem.$element && listItem.name() in dtd.$list) plugin.listToArray(listItem, database, baseArray, baseIndentLevel + 1);

				// It may be a text node or some funny stuff.
				if (listItem[0].nodeName.toLowerCase() !== 'li') continue;
				
				var itemObject = {
					'parent': listNode,
					indent: baseIndentLevel,
					element: listItem,
					contents: []
				};
				if (!grandparentNode){
					itemObject.grandparent = listNode.parent();
					if (itemObject.grandparent && itemObject.grandparent[0].nodeName.toLowerCase() === 'li') 
						itemObject.grandparent = itemObject.grandparent.parent();
				} else itemObject.grandparent = grandparentNode;
				
				if (database) DOM.element.setMarker(database, listItem, 'listarray_index', baseArray.length);
				baseArray.push(itemObject);
				
				for (var j = 0, n = listItem.length(), child; j < n; j++){
					child = listItem.child(j);
					if (child.$element && listNodeNames[child.name()])     // Note the recursion here, it pushes inner list items with
					// +1 indentation in the correct order.
					plugin.listToArray(child, database, baseArray, baseIndentLevel + 1, itemObject.grandparent);
					else itemObject.contents.push(child);
				}
			}
			return baseArray;
		},
		
		// Convert our internal representation of a list back to a DOM forest.
		arrayToList: function(listArray, database, baseIndex, paragraphMode, dir){
			if (!baseIndex) baseIndex = 0;
			if (!listArray || listArray.length < baseIndex + 1) return null;
			var i, doc = listArray[baseIndex].parent.getDocument(), 
				retval = new DOM.fragment(doc), 
				rootNode = null, 
				currentIndex = baseIndex, 
				indentLevel = Math.max(listArray[baseIndex].indent, 0), 
				currentListItem = null, 
				origDirection, block, 
				paragraphName = (paragraphMode == $['ENTER_P'] ? 'p' : 'div');
			while (1){
				var item = listArray[currentIndex], 
					itemGrandParent = item.grandparent;
				origDirection = item.element.getDirection(1);

				if (item.indent == indentLevel){
					if (!rootNode || listArray[currentIndex].parent.name() != rootNode.name()){
						rootNode = listArray[currentIndex].parent.clone(false, 1);
						dir && rootNode.setProperty('dir', dir);
						retval.append(rootNode);
					}
					currentListItem = item.element.clone(0, 1).appendTo(rootNode);
					if (origDirection != rootNode.getDirection(1)) 
						currentListItem.setProperty('dir', origDirection);
					for (i = 0; i < item.contents.length; i++) 
						currentListItem.append(item.contents[i].clone(1, 1));
					currentIndex++;
				} else if (item.indent == Math.max(indentLevel, 0) + 1){
					// Maintain original direction
					var currentDirection = listArray[currentIndex - 1].element.getDirection(1), 
						listData = plugin.arrayToList(listArray, null, currentIndex, paragraphMode, currentDirection != origDirection ? origDirection : null);
					
					// If the next block is an <li> with another list tree as the first
					// child, we'll need to append a filler (<br>/NBSP) or the list item
					// wouldn't be editable.
					if (!currentListItem.length() && local.env.ie && !(doc[0].documentMode > 7)) currentListItem.append(doc.createText('\xa0'));
					currentListItem.append(listData.listNode);
					currentIndex = listData.nextIndex;
				} else if (item.indent == -1 && !baseIndex && itemGrandParent){
					if (listNodeNames[itemGrandParent.name()]){
						currentListItem = item.element.clone(false, true);
						if (origDirection != itemGrandParent.getDirection(1)) currentListItem.setProperty('dir', origDirection);
					} else currentListItem = new DOM.fragment(doc);

					// Migrate all children to the new container,
					// apply the proper text direction.
					var loose = itemGrandParent.getDirection(1) != origDirection,
						li = item.element,
						classes = li.getProperty('class'),
						style = li.getProperty('style');

					var needsBlock = currentListItem.$fragment && (paragraphMode != $['ENTER_BR'] || loose || style || classes);

					var child, l = item.contents.length;
					for (i = 0; i < l; i++){
						child = item.contents[i];
						if (child.$element && child.isBlockBoundary()){
							// Apply direction on content blocks.
							if (loose && !child.getDirection()) child.setProperty('dir', origDirection);
							inheirtInlineStyles(li, child);
							classes && child.addClass(classes);
						} else if (needsBlock){
							// Establish new block to hold text direction and styles.
							if (!block){
								block = doc.createElement(paragraphName);
								loose && block.setProperty('dir', origDirection);
							}

							// Copy over styles to new block;
							style && block.setProperty('style', style);
							classes && block.setProperty('class', classes);

							block.append(child.clone(1, 1));
						}

						currentListItem.append(block || child.clone(1, 1));
					}
					
					if (currentListItem.$fragment && currentIndex != listArray.length - 1){
						var last = currentListItem.last();
						if (last && last.$element && last.getProperty('type') == '_moz'){
							last.dispose();
						}
						
						if (!(last = currentListItem.last(nonEmpty) && last.$element && last.name() in dtd.$block)){
							currentListItem.append(doc.createElement('br'));
						}
					}
					
					var currentListItemName = currentListItem[0].nodeName.toLowerCase();
					if (!local.env.ie && (currentListItemName === 'div' || currentListItemName === 'p')) currentListItem.appendBogus();
					retval.append(currentListItem);
					rootNode = null;
					currentIndex++;
				} else return null;

				block = null;
				
				if (listArray.length <= currentIndex || Math.max(listArray[currentIndex].indent, 0) < indentLevel) break;
			}
			
			// Clear marker attributes for the new list tree made of cloned nodes, if any.
			if (database){
				var currentNode = retval.first(),
					rootList = listArray[0].parent;
				while (currentNode){
					if (currentNode.$element){
						// Clear marker attributes for the new list tree made of cloned nodes, if any.
						DOM.element.clearMarker(database, currentNode);

						// Clear redundant direction attribute specified on list items.
						if (currentNode.name() in dtd.$listItem) cleanUpDirection(currentNode);
					}
					currentNode = currentNode.getNextSourceNode();
				}
			}
			
			return {
				listNode: retval,
				nextIndex: currentIndex
			};
		}
	};
	
	function onSelectionChange(evt){
		if (evt.editor.readOnly) return null;

		var path = evt.path, 
			blockLimit = path.blockLimit, 
			elements = path.elements, 
			element;

		// Grouping should only happen under blockLimit.(#3940).
		for (var i = 0, l = elements.length; i < l && (element = elements[i]) && !element.equals(blockLimit); i++){
			if (listNodeNames[elements[i].name()]){
				return this.set(this.type == elements[i].name() ? $['TRISTATE_ON'] : $['TRISTATE_OFF']);
			}
		}

		return this.set($['TRISTATE_OFF']);
	}
	
	function changeListType(editor, groupObj, database, listsCreated){
		// This case is easy...
		// 1. Convert the whole list into a one-dimensional array.
		// 2. Change the list type by modifying the array.
		// 3. Recreate the whole list by converting the array to a list.
		// 4. Replace the original list with the recreated list.
		var listArray = plugin.listToArray(groupObj.root, database), selectedListItems = [];
		
		for (var i = 0; i < groupObj.contents.length; i++){
			var itemNode = groupObj.contents[i];
			itemNode = itemNode.getAscendant('li', true);
			if (!itemNode || itemNode.retrieve('list_item_processed')) continue;
			selectedListItems.push(itemNode);
			DOM.element.setMarker(database, itemNode, 'list_item_processed', true);
		}
		
		var root = groupObj.root, 
			doc = root.getDocument(),
			listNode, 
			newListNode;
		
		for (i = 0; i < selectedListItems.length; i++){
			var listIndex = selectedListItems[i].retrieve('listarray_index');
			listNode = listArray[listIndex].parent;

			// Switch to new list node for this particular item.
			if (!listNode.is(this.type)){
				newListNode = doc.createElement(this.type);
				// Copy all attributes, except from 'start' and 'type'.
				listNode.copyAttributes(newListNode, {
					start: 1,
					type: 1
				});
				// The list-style-type property should be ignored.
				newListNode.removeStyle('list-style-type');
				listArray[listIndex].parent = newListNode;
			}
		}
		var newList = plugin.arrayToList(listArray, database, null, editor.config.enterMode);
		var child, length = newList.listNode.length();
		for (i = 0; i < length && (child = newList.listNode.child(i)); i++){
			if (child.name() == this.type) listsCreated.push(child);
		}
		newList.listNode.replaces(groupObj.root);
	}
	
	var headerTagRegex = /^h[1-6]$/;
	
	function createList(editor, groupObj, listsCreated){
		var contents = groupObj.contents, doc = groupObj.root.getDocument(), listContents = [];

		// It is possible to have the contents returned by DomRangeIterator to be the same as the root.
		// e.g. when we're running into table cells.
		// In such a case, enclose the childNodes of contents[0] into a <div>.
		if (contents.length == 1 && contents[0].equals(groupObj.root)){
			var divBlock = doc.createElement('div');
			contents[0].moveChildren && contents[0].moveChildren(divBlock);
			contents[0].append(divBlock);
			contents[0] = divBlock;
		}

		// Calculate the common parent node of all content blocks.
		var commonParent = groupObj.contents[0].parent();
		for (var i = 0; i < contents.length; i++) 
			commonParent = commonParent.getCommonAncestor(contents[i].parent());
		
		var useComputedState = editor.config.useComputedState, listDir, explicitDirection;
		
		useComputedState = useComputedState === undefined || useComputedState;
		
		// We want to insert things that are in the same tree level only, so calculate the contents again
		// by expanding the selected blocks to the same tree level.
		for (i = 0; i < contents.length; i++){
			var contentNode = contents[i], parentNode;
			while ((parentNode = contentNode.parent())){
				if (parentNode.equals(commonParent)){
					listContents.push(contentNode);
					
					// Determine the lists's direction.
					if (!explicitDirection && contentNode.getDirection()) explicitDirection = 1;
					
					var itemDir = contentNode.getDirection(useComputedState);
					
					if (listDir !== null){
						// If at least one LI have a different direction than current listDir, we can't have listDir.
						if (listDir && listDir != itemDir) listDir = null;
						else listDir = itemDir;
					}
					
					break;
				}
				contentNode = parentNode;
			}
		}
		
		if (listContents.length < 1) return;
		
		// Insert the list to the DOM tree.
		var insertAnchor = listContents[listContents.length - 1].next(), listNode = doc.createElement(this.type);
		
		listsCreated.push(listNode);
		
		var contentBlock, listItem;
		
		while (listContents.length){
			contentBlock = listContents.shift();
			listItem = doc.createElement('li');
			
			// Preserve preformat block and heading structure when converting to list item. (#5335) (#5271)
			if (contentBlock.is('pre') || headerTagRegex.test(contentBlock.name())) contentBlock.appendTo(listItem);
			else {
				contentBlock.copyAttributes(listItem);
				// Remove DIR attribute if it was merged into list root.
				if (listDir && contentBlock.getDirection()){
					contentBlock.removeStyle('direction');
					contentBlock.removeProperty('dir');
				}
				contentBlock.moveChildren(listItem);
				contentBlock.dispose();
			}
			
			listItem.appendTo(listNode);
		}
		
		// Apply list root dir only if it has been explicitly declared.
		if (listDir && explicitDirection) listNode.setProperty('dir', listDir);
		
		if (insertAnchor) listNode.injectBefore(insertAnchor);
		else listNode.appendTo(commonParent);
	}
	
	function removeList(editor, groupObj, database){
		// This is very much like the change list type operation.
		// Except that we're changing the selected items' indent to -1 in the list array.
		var listArray = plugin.listToArray(groupObj.root, database), selectedListItems = [];

		for (var i = 0, l = groupObj.contents.length; i < l; i++){
			var itemNode = groupObj.contents[i];
			itemNode = itemNode.getAscendant('li', true);
			if (!itemNode || itemNode.retrieve('list_item_processed')) continue;
			selectedListItems.push(itemNode);
			DOM.element.setMarker(database, itemNode, 'list_item_processed', true);
		}

		var lastListIndex = null;
		for (i = 0; i < selectedListItems.length; i++){
			var listIndex = selectedListItems[i].retrieve('listarray_index');
			listArray[listIndex].indent = -1;
			lastListIndex = listIndex;
		}
		
		// After cutting parts of the list out with indent=-1, we still have to maintain the array list
		// model's nextItem.indent <= currentItem.indent + 1 invariant. Otherwise the array model of the
		// list cannot be converted back to a real DOM list.
		for (i = lastListIndex + 1; i < listArray.length; i++){
			if (listArray[i].indent > listArray[i - 1].indent + 1){
				var indentOffset = listArray[i - 1].indent + 1 - listArray[i].indent;
				var oldIndent = listArray[i].indent;
				while (listArray[i] && listArray[i].indent >= oldIndent){
					listArray[i].indent += indentOffset;
					i++;
				}
				i--;
			}
		}

		var newList = plugin.arrayToList(listArray, database, null, editor.config.enterMode, groupObj.root.getProperty('dir'));

		// Compensate <br> before/after the list node if the surrounds are non-blocks.(#3836)
		var docFragment = newList.listNode, boundaryNode, siblingNode;
		function compensateBrs(isStart){
			if ((boundaryNode = docFragment[isStart ? 'first' : 'last']()) && 
				!(boundaryNode.is && boundaryNode.isBlockBoundary()) && 
				(siblingNode = groupObj.root[isStart ? 'prev' : 'next'](DOM.walker.whitespaces(true))) && 
				!(siblingNode.is && siblingNode.isBlockBoundary({br: 1}))) 
				editor.document.createElement('br')[isStart ? 'injectBefore' : 'injectAfter'](boundaryNode);
		}
		compensateBrs(true);
		compensateBrs();

		docFragment.replaces(groupObj.root);
	}

	var listCommand = new Class({

		initialize: function(name, type){
			this.name = name;
			this.type = type;
		},

		execute: function(editor){
			var config = editor.config, 
				document = editor.document, 
				selection = editor.getSelection(), 
				ranges = selection && selection.getRanges(true);
			
			// There should be at least one selected range.
			if (!ranges || ranges.length < 1) return;

			// Midas lists rule #1 says we can create a list even in an empty document.
			// But DOM iterator wouldn't run if the document is really empty.
			// So create a paragraph if the document is empty and we're going to create a list.
			if (this.state == $['TRISTATE_OFF']){
				var body = document.body();
				if (!body.first(nonEmpty)){
					config.enterMode == $['ENTER_BR'] ? body.appendBogus() : 
						ranges[0].fixBlock(1, config.enterMode == $['ENTER_P'] ? 'p' : 'div');
					selection.selectRanges(ranges);
				} else {
					var range = ranges.length == 1 && ranges[0], enclosedNode = range && range.getEnclosedNode();
					if (enclosedNode && enclosedNode.is && enclosedNode.is(this.type)) setState.call(this, editor, $['TRISTATE_ON']);
				}
			}

			var bookmarks = selection.createBookmarks(true);

			// Group the blocks up because there are many cases where multiple lists have to be created,
			// or multiple lists have to be cancelled.
			var listGroups = [], database = {}, rangeIterator = ranges.createIterator(), index = 0;
			
			while ((range = rangeIterator.getNextRange()) && ++index){
				var boundaryNodes = range.getBoundaryNodes(), startNode = boundaryNodes.startNode, endNode = boundaryNodes.endNode;
				
				if (startNode.is && startNode.is('td')) range.setStartAt(boundaryNodes.startNode, $['POSITION_AFTER_START']);
				
				if (endNode.is && endNode.is('td')) range.setEndAt(boundaryNodes.endNode, $['POSITION_BEFORE_END']);
				
				var iterator = range.createIterator(), block;

				iterator.forceBrBreak = (this.state == $['TRISTATE_OFF']);

				while ((block = iterator.getNextParagraph())){
					// Avoid duplicate blocks get processed across ranges.
					if (block.retrieve('list_block')) continue;
					else DOM.element.setMarker(database, block, 'list_block', 1);
					
					var path = new DOM.elementPath(block), 
						pathElements = path.elements, 
						pathElementsCount = pathElements.length, 
						listNode = null, 
						processedFlag = 0, 
						blockLimit = path.blockLimit, element;
					
					// First, try to group by a list ancestor.
					for (var i = pathElementsCount - 1; i >= 0 && (element = pathElements[i]); i--){
						if (listNodeNames[element.name()] && blockLimit.contains(element)){
							// If we've encountered a list inside a block limit
							// The last group object of the block limit element should
							// no longer be valid. Since paragraphs after the list
							// should belong to a different group of paragraphs before
							// the list.
							blockLimit.eliminate('list_group_object_' + index);
							
							var groupObj = element.retrieve('list_group_object');
							if (groupObj) groupObj.contents.push(block);
							else {
								groupObj = {root: element, contents: [block]};
								listGroups.push(groupObj);
								DOM.element.setMarker(database, element, 'list_group_object', groupObj);
							}
							processedFlag = 1;
							break;
						}
					}

					if (processedFlag) continue;
					
					// No list ancestor? Group by block limit, but don't mix contents from different ranges.
					var root = blockLimit;
					if (root.retrieve('list_group_object_' + index)) root.retrieve('list_group_object_' + index).contents.push(block);
					else {
						groupObj = {root: root, contents: [block]};
						DOM.element.setMarker(database, root, 'list_group_object_' + index, groupObj);
						listGroups.push(groupObj);
					}
				}
			}

			// Now we have two kinds of list groups, groups rooted at a list, and groups rooted at a block limit element.
			// We either have to build lists or remove lists, for removing a list does not makes sense when we are looking
			// at the group that's not rooted at lists. So we have three cases to handle.
			var listsCreated = [];
			while (listGroups.length > 0){
				groupObj = listGroups.shift();
				if (this.state == $['TRISTATE_OFF']){
					if (listNodeNames[groupObj.root.name()]) changeListType.call(this, editor, groupObj, database, listsCreated);
					else createList.call(this, editor, groupObj, listsCreated);
				} else if (this.state == $['TRISTATE_ON'] && listNodeNames[groupObj.root.name()]) removeList.call(this, editor, groupObj, database);
			}

			// For all new lists created, merge adjacent, same type lists.
			for (i = 0; i < listsCreated.length; i++) mergeListSiblings(listsCreated[i]);

			// Clean up, restore selection and update toolbar button states.
			DOM.element.clearMarkers(database);
			selection.selectBookmarks(bookmarks);
			editor.focus();
		}

	});

	var elementType = DOM.walker.nodeType($['NODE_ELEMENT']);

	// Merge child nodes with direction preserved.
	function mergeChildren(from, into, refNode, forward){
		var child, dir;
		while ((child = from[forward ? 'last' : 'first'](elementType))){
			if ((dir = child.getDirection(1)) !== into.getDirection(1)) child.setProperty('dir', dir);
			child.dispose();
			refNode ? child[forward ? 'injectBefore' : 'injectAfter'](refNode) : 
				into.append(child, forward);
		}
	}

	// Merge list adjacent, of same type lists.
	function mergeListSiblings(listNode){
		var mergeSibling;
		(mergeSibling = function(rtl){
			var sibling = listNode[rtl ? 'prev' : 'next'](nonEmpty);
			if (sibling && sibling.$element && sibling.is(listNode.name())) {
				// Move children order by merge direction.(#3820)
				mergeChildren(listNode, sibling, null, !rtl);
				
				listNode.dispose();
				listNode = sibling;
			}
		})();
		mergeSibling(1);
	}

	var tailNbspRegex = /[\t\r\n ]*(?:&nbsp;|\xa0)$/;
	
	function indexOfFirstChildElement(element, tagNameList){
		var child, children = element.children, length = children.length;
		
		for (var i = 0; i < length; i++){
			child = children[i];
			if (child.name && (child.name in tagNameList)) return i;
		}
		
		return length;
	}
	
	function getExtendNestedListFilter(isHtmlFilter){
		// An element filter function that corrects nested list start in an empty
		// list item for better displaying/outputting. (#3165)
		return function(listItem){
			var children = listItem.children, firstNestedListIndex = indexOfFirstChildElement(listItem, dtd.$list), 
				firstNestedList = children[firstNestedListIndex], nodeBefore = firstNestedList && firstNestedList.previous, tailNbspmatch;
			
			if (nodeBefore && (nodeBefore.name && nodeBefore.name == 'br' || nodeBefore.value && (tailNbspmatch = nodeBefore.value.match(tailNbspRegex)))){
				var fillerNode = nodeBefore;
				
				// Always use 'nbsp' as filler node if we found a nested list appear
				// in front of a list item.
				if (!(tailNbspmatch && tailNbspmatch.index) && fillerNode == children[0]) 
					children[0] = (isHtmlFilter || local.env.ie) ? new constructor.htmlParser.text('\xa0') : new constructor.htmlParser.element('br', {});
				// Otherwise the filler is not needed anymore.
				else if (fillerNode.name == 'br') children.splice(firstNestedListIndex - 1, 1);
				else fillerNode.value = fillerNode.value.replace(tailNbspRegex, '');
			}
			
		};
	}
	
	var defaultListDataFilterRules = {
		elements: {}
	};
	for (var i in dtd.$listItem) 
		defaultListDataFilterRules.elements[i] = getExtendNestedListFilter();
	
	var defaultListHtmlFilterRules = {
		elements: {}
	};
	for (i in dtd.$listItem) 
		defaultListHtmlFilterRules.elements[i] = getExtendNestedListFilter(true);

	// Check if node is block element that recieves text.
	function isTextBlock(node){
		return node.$element && (node.name() in dtd.$block || node.name() in dtd.$listItem) && dtd[node.name()]['#'];
	}

	// Merge the visual line content at the cursor range into the block.
	function joinNextLineToCursor(editor, cursor, nextCursor){
		editor.fireEvent('saveSnapshot');
		
		// Merge with previous block's content.
		nextCursor.enlarge($['ENLARGE_LIST_ITEM_CONTENTS']);
		var fragment = nextCursor.extractContents();
		
		cursor.trim(false, true);
		var bookmark = cursor.createBookmark();
		
		// Kill original bogus;
		var currentPath = new DOM.elementPath(cursor.startContainer);
		var currentLi = currentPath.lastElement.getAscendant('li', 1);
		
		var bogus = currentPath.block.getBogus();
		bogus && bogus.dispose();
		
		// Kill the tail br in extracted.
		var last = fragment.last();
		if (last && last.$element && last.is('br')) last.dispose();
		
		// Insert fragment at the range position.
		var nextNode = cursor.startContainer.child(cursor.startOffset);
		if (nextNode) fragment.insertBefore(nextNode);
		else cursor.startContainer.append(fragment);
		
		var nextPath = new DOM.elementPath(nextCursor.startContainer);
		var nextLi = nextCursor.startContainer.getAscendant('li', 1);
		
		// Move the sub list nested in the next list item.
		if (nextLi){
			var sublist = getSubList(nextLi);
			if (sublist){
				// If next line is in the sub list of the current list item.
				if (currentLi.contains(nextLi)){
					mergeChildren(sublist, nextLi.parent(), nextLi);
					sublist.dispose();
				// Migrate the sub list to current list item.
				} else currentLi.append(sublist);
			}
		}
		
		// Remove any remaining empty path blocks at next line after merging.
		while (nextCursor.checkStartOfBlock() && nextCursor.checkEndOfBlock()){
			nextPath = new DOM.elementPath(nextCursor.startContainer);
			var nextBlock = nextPath.block, parent;
			
			// Check if also to remove empty list.
			if (nextBlock.is('li')){
				parent = nextBlock.parent();
				if (nextBlock.equals(parent.last(nonEmpty)) &&
				nextBlock.equals(parent.first(nonEmpty))) nextBlock = parent;
			}
			
			nextCursor.moveToPosition(nextBlock, $['POSITION_BEFORE_START']);
			nextBlock.dispose();
		}
		
		// Check if need to further merge with the list resides after the merged block. (#9080)
		var walkerRng = nextCursor.clone(), body = editor.document.body();
		walkerRng.setEndAt(body, $['POSITION_BEFORE_END']);
		var walker = new DOM.walker(walkerRng);
		walker.evaluator = function(node){
			return nonEmpty(node) && !blockBogus(node);
		};
		var next = walker.next();
		if (next && next.$element && next.name() in dtd.$list) mergeListSiblings(next);
		
		cursor.moveToBookmark(bookmark);
		
		// Make fresh selection.
		cursor.select();
		
		editor.selectionChange(1);
		editor.fireEvent('saveSnapshot');
	}

	function getSubList(li){
		var last = li.last(nonEmpty);
		return last && last.$element && last.name() in listNodeNames ? last : null;
	}

	constructor.plugins.implement('list', function(editor){

		// Register commands.
		var numberedListCommand = editor.addCommand('numberedlist', new listCommand('numberedlist', 'ol')), 
			bulletedListCommand = editor.addCommand('bulletedlist', new listCommand('bulletedlist', 'ul'));
		
		// Register the state changing handlers.
		editor.addEvent('selectionChange', onSelectionChange.bind(numberedListCommand));
		editor.addEvent('selectionChange', onSelectionChange.bind(bulletedListCommand));

		// Handled backspace/del key to join list items.
		editor.addEvent('keystroke', function(ev){
			var keyCode = ev.code;
			
			// Backspace OR Delete.
			if (editor.mode === 'wysiwyg' && keyCode in {8: 1, 46: 1}){
				var selection = this.getSelection(), 
					range = selection.getRanges()[0];
				
				if (!range.collapsed) return;
				
				var isBackspace = keyCode === 8, 
					body = this.document.body(), 
					walker = new DOM.walker(range.clone());

				walker.evaluator = function(node){
					return nonEmpty(node) && !blockBogus(node);
				};
				
				var cursor = range.clone();
				
				if (isBackspace){
					var previous, joinWith;
					
					var path = new DOM.elementPath(range.startContainer);
					
					// Join a sub list's first line, with the previous visual line in parent.
					if ((previous = path.contains(listNodeNames)) && 
						range.checkBoundaryOfElement(previous, $['START']) && 
						(previous = previous.parent()) && previous.is('li') && (previous = getSubList(previous))){
						joinWith = previous;
						previous = previous.prev(nonEmpty);
						// Place cursor before the nested list.
						cursor.moveToPosition(previous && blockBogus(previous) ? previous : joinWith, $['POSITION_BEFORE_START']);
					// Join any line following a list, with the last visual line of the list.
					}  else {
						walker.range.setStartAt(body, $['POSITION_AFTER_START']);
						walker.range.setEnd(range.startContainer, range.startOffset);
						previous = walker.previous();
						
						if (previous && previous.$element && (previous.name() in listNodeNames || previous.is('li'))){
							if (!previous.is('li')){
								walker.range.selectNodeContents(previous);
								walker.reset();
								walker.evaluator = isTextBlock;
								previous = walker.previous();
							}
							
							joinWith = previous;
							// Place cursor at the end of previous block.
							cursor.moveToElementEditEnd(joinWith);
						}
					}
					
					if (joinWith) joinNextLineToCursor(editor, cursor, range);
				} else {
					var li = range.startContainer.getAscendant('li', 1);
					if (li){
						walker.range.setEndAt(body, $['POSITION_BEFORE_END']);
						
						var last = li.last(nonEmpty);
						var block = last && isTextBlock(last) ? last : li;
						
						// Indicate cursor at the visual end of an list item.
						var isAtEnd = 0;
						
						var next = walker.next();
						
						// When list item contains a sub list.
						if (next && next.$element && next.name() in listNodeNames && next.equals(last)){
							isAtEnd = 1;
							
							// Move to the first item in sub list.
							next = walker.next();
						// Right at the end of list item.
						} else if (range.checkBoundaryOfElement(block, $['END'])) isAtEnd = 1;
						
						if (isAtEnd && next){
							// Put cursor range there.
							var nextLine = range.clone();
							nextLine.moveToElementEditStart(next);
							
							joinNextLineToCursor(editor, cursor, nextLine);
						}
					}
				}
				
				// The backspace/del could potentially put cursor at a bad position,
				// being it handled or not, check immediately the selection to have it fixed.
				setTimeout(function(){
					editor.selectionChange(1);
				});
			}
		});

	});

})(Klass);