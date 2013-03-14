(function(local){

	var env = local.env;

	var $ = local.Editor.constants;
	
	local.Editor.plugins.enterkey = {

		enterBlock: function(editor, mode, range, forceMode){
			// Get the range for the current selection.
			range = range || getRange(editor);
			
			// We may not have valid ranges to work on, like when inside a
			// contenteditable=false element.
			if (!range) return;

			var doc = range.document;
			
			// Exit the list when we're inside an empty list item block. (#5376)
			if (range.checkStartOfBlock() && range.checkEndOfBlock()){
				var path = new local.DOM.elementPath(range.startContainer), block = path.block;
				
				if (block && (block.is('li') || block.parent().is('li'))){
					editor.execCommand('outdent');
					return;
				}
			}
			
			// Determine the block element to be used.
			var blockTag = (mode == $['ENTER_DIV'] ? 'div' : 'p');
			
			// Split the range.
			var splitInfo = range.splitBlock(blockTag);
			
			if (!splitInfo) return;
			
			// Get the current blocks.
			var previousBlock = splitInfo.previousBlock, 
				nextBlock = splitInfo.nextBlock;
			
			var isStartOfBlock = splitInfo.wasStartOfBlock, 
				isEndOfBlock = splitInfo.wasEndOfBlock;
			
			var node;
			
			// If this is a block under a list item, split it as well. (#1647)
			if (nextBlock){
				node = nextBlock.parent();
				if (node.is('li')){
					nextBlock.breakParent(node);
					nextBlock.move(nextBlock.next(), 1);
				}
			} else if (previousBlock && (node = previousBlock.parent()) && node.is('li')){
				previousBlock.breakParent(node);
				range.moveToElementEditStart(previousBlock.next());
				previousBlock.move(previousBlock.prev());
			}
			
			// If we have both the previous and next blocks, it means that the
			// boundaries were on separated blocks, or none of them where on the
			// block limits (start/end).
			if (!isStartOfBlock && !isEndOfBlock){
				// If the next block is an <li> with another list tree as the first
				// child, we'll need to append a filler (<br>/NBSP) or the list item
				// wouldn't be editable. (#1420)
				if (nextBlock.is('li') && (node = nextBlock.first(local.DOM.walker.invisible(true))) && node.is && 
					node.is('ul', 'ol')) (env.ie ? doc.createText('\xa0') : doc.createElement('br')).injectBefore(node);
				
				// Move the selection to the end block.
				if (nextBlock) range.moveToElementEditStart(nextBlock);
			} else {
				var newBlock, newBlockDir;

				if (previousBlock){
					// Do not enter this block if it's a header tag, or we are in
					// a Shift+Enter (#77). Create a new block element instead
					// (later in the code).
					if (previousBlock.is('li') || !headerTagRegex.test(previousBlock.name())){
						// Otherwise, duplicate the previous block.
						newBlock = previousBlock.clone();
					}
				} else if (nextBlock) newBlock = nextBlock.clone();

				if (!newBlock){
					newBlock = doc.createElement(blockTag);
					if (previousBlock && (newBlockDir = previousBlock.getDirection())) newBlock.setProperty('dir', newBlockDir);
				}    // Force the enter block unless we're talking of a list item.
				else if (forceMode && !newBlock.is('li')) newBlock.rename(blockTag);
				
				// Recreate the inline elements tree, which was available
				// before hitting enter, so the same styles will be available in
				// the new block.
				var elementPath = splitInfo.elementPath;
				if (elementPath){
					for (var i = 0, l = elementPath.elements.length; i < l; i++){
						var element = elementPath.elements[i];
						
						if (element.equals(elementPath.block) || element.equals(elementPath.blockLimit)) break;
						
						if (local.Editor.dtd.$removeEmpty[element.name()]){
							element = element.clone();
							newBlock.moveChildren(element).append(element);
						}
					}
				}

				if (!env.ie) newBlock.appendBogus();
				
				range.insertNode(newBlock);
				
				// This is tricky, but to make the new block visible correctly
				// we must select it.
				// The previousBlock check has been included because it may be
				// empty if we have fixed a block-less space (like ENTER into an
				// empty table cell).
				if (env.ie && isStartOfBlock && (!isEndOfBlock || !previousBlock.length())){
					// Move the selection to the new block.
					range.moveToElementEditStart(isEndOfBlock ? previousBlock : newBlock);
					range.select();
				}
				
				// Move the selection to the new block.
				range.moveToElementEditStart(isStartOfBlock && !isEndOfBlock ? nextBlock : newBlock);
			}
			
			if (!env.ie){
				if (nextBlock){
					// If we have split the block, adds a temporary span at the
					// range position and scroll relatively to it.
					var tmpNode = doc.createElement('span');
					
					// We need some content for Safari.
					tmpNode.html('&nbsp;');

					range.insertNode(tmpNode);
					tmpNode.scrollIntoView();
					range.deleteContents();
				} else {
					// We may use the above scroll logic for the new block case
					// too, but it gives some weird result with Opera.
					newBlock.scrollIntoView();
				}
			}
			
			range.select();
		},
		
		enterBr: function(editor, mode, range, forceMode){
			// Get the range for the current selection.
			range = range || getRange(editor);
			
			// We may not have valid ranges to work on, like when inside a
			// contenteditable=false element.
			if (!range) return;
			
			var doc = range.document;
			
			// Determine the block element to be used.
			var blockTag = (mode == $['ENTER_DIV'] ? 'div' : 'p');
			
			var isEndOfBlock = range.checkEndOfBlock();
			
			var elementPath = new local.DOM.elementPath(editor.getSelection().getStartElement());
			
			var startBlock = elementPath.block, startBlockTag = startBlock && elementPath.block.name();
			
			var isPre = false;
			
			if (!forceMode && startBlockTag == 'li'){
				enterBlock(editor, mode, range, forceMode);
				return;
			}
			
			// If we are at the end of a header block.
			if (!forceMode && isEndOfBlock && headerTagRegex.test(startBlockTag)){
				var newBlock, newBlockDir;
				
				if ((newBlockDir = startBlock.getDirection())){
					newBlock = doc.createElement('div', {
						dir: newBlockDir
					}).injectAfter(startBlock);
					range.setStart(newBlock, 0);
				} else {
					// Insert a <br> after the current paragraph.
					doc.createElement('br').injectAfter(startBlock);
					
					// A text node is required by Gecko only to make the cursor blink.
					if (env.firefox) doc.createText('').injectAfter(startBlock);
					
					// IE has different behaviors regarding position.
					range.setStartAt(startBlock.next(), env.ie ? $['POSITION_BEFORE_START'] : $['POSITION_AFTER_START']);
				}
			} else {
				var lineBreak;
				
				isPre = (startBlockTag == 'pre');
				
				// Gecko prefers <br> as line-break inside <pre> (#4711).
				if (isPre && !env.firefox) lineBreak = doc.createText(env.ie ? '\r' : '\n');
				else lineBreak = doc.createElement('br');
				
				range.deleteContents();
				range.insertNode(lineBreak);
				
				// A text node is required by Gecko only to make the cursor blink.
				// We need some text inside of it, so the bogus <br> is properly
				// created.
				if (!env.ie) doc.createText('\ufeff').injectAfter(lineBreak);
				
				// If we are at the end of a block, we must be sure the bogus node is available in that block.
				if (isEndOfBlock && !env.ie) lineBreak.parent().appendBogus();
				
				// Now we can remove the text node contents, so the caret doesn't
				// stop on it.
				if (!env.ie) lineBreak.next()[0].nodeValue = '';
				// IE has different behavior regarding position.
				if (env.ie) range.setStartAt(lineBreak, $['POSITION_AFTER_END']);
				else range.setStartAt(lineBreak.next(), $['POSITION_AFTER_START']);
				
				// Scroll into view, for non IE.
				if (!env.ie){
					var dummy = null;
					
					// BR is not positioned in Opera and Webkit.
					if (!env.firefox){
						// We need have some contents for Webkit to position it
						// under parent node.
						dummy = doc.createElement('span').html('&nbsp;');
					} else dummy = doc.createElement('br');
					
					dummy.injectBefore(lineBreak.next());
					dummy.scrollIntoView();
					dummy.dispose();
				}
			}
			
			// This collapse guarantees the cursor will be blinking.
			range.collapse(true);
			
			range.select(isPre);
		}
	};
	
	var plugin = local.Editor.plugins.enterkey, enterBr = plugin.enterBr, enterBlock = plugin.enterBlock, headerTagRegex = /^h[1-6]$/;
	
	function shiftEnter(editor){
		// Only effective within document.
		if (editor.mode != 'wysiwyg') return false;

		// On SHIFT+ENTER:
		// 1. We want to enforce the mode to be respected, instead
		// of cloning the current block.
		// 2. Always perform a block break when inside <pre>.
		if (editor.getSelection().getStartElement().hasAscendant('pre', true)){
			setTimeout(function(){
				enterBlock(editor, editor.config.enterMode, null, true);
			}, 0);
			return true;
		} else return enter(editor, editor.config.shiftEnterMode, 1);
	}
	
	function enter(editor, mode, forceMode){
		forceMode = editor.config.forceEnterMode || forceMode;

		// Only effective within document.
		if (editor.mode != 'wysiwyg') return false;
		
		if (!mode) mode = editor.config.enterMode;

		// Use setTimout so the keys get cancelled immediatelly.
		setTimeout(function(){
			editor.fireEvent('saveSnapshot'); // Save undo step.
			if (mode == $['ENTER_BR'] || editor.getSelection().getStartElement().hasAscendant('pre', 1)) enterBr(editor, mode, null, forceMode);
			else enterBlock(editor, mode, null, forceMode);
		}, 0);
		
		return true;
	}
	
	function getRange(editor){
		// Get the selection ranges.
		var ranges = editor.getSelection().getRanges(true);
		
		// Delete the contents of all ranges except the first one.
		for (var i = ranges.length - 1; i > 0; i--){
			ranges[i].deleteContents();
		}
		
		// Return the first range.
		return ranges[0];
	}

	local.Editor.plugins.implement({
	
		keyenter: function(editor){
			var specialKeys = editor.specialKeys = editor.specialKeys || {};
			var handler = function(ev){
				(ev.shift ? shiftEnter : enter)(editor);
				return false;
			};

			specialKeys['enter'] = handler;
		}
	
	});

})(Klass);