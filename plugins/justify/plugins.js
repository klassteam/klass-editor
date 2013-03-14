/**
 * @file Justify commands.
 */
Klass.run(function(local){

	var $E = local.Editor;

	var $ = $E.constants;

	function getState(editor, path){
		var firstBlock = path.block || path.blockLimit;
		
		if (!firstBlock || firstBlock.is('body')) return $['TRISTATE_OFF'];
		
		return (getAlignment(firstBlock, editor.config.useComputedState) == this.value) ? $['TRISTATE_ON'] : $['TRISTATE_OFF'];
	}
	
	function getAlignment(element, useComputedState){
		var align;
		if (!useComputedState){
			while (!element.hasAttribute || !(element.hasAttribute('align') || element.style('text-align'))) {
				var parent = element.parent();
				if (!parent) break;
				element = parent;
			}
			align = element.style('text-align') || element.getProperty('align') || '';
		} else align = element.getComputedStyle('text-align');

		align && (align = align.replace(/-moz-|-webkit-|start|auto/i, ''));
		
		!align && useComputedState && (align = element.getComputedStyle('direction') == 'rtl' ? 'right' : 'left');
		
		return align;
	}
	
	function onSelectionChange(evt){
		var command = evt.editor.getCommand(this.name);
		command.state = getState.call(this, evt.editor, evt.path);
		command.fireEvent('state');
	}

	var justifyCommand = new Class({
	
		initialize: function(editor, name, value){
			this.name = name;
			this.value = value;
			this.editor = editor;

			var classes = editor.config.justifyClasses;
			if (classes){
				switch (value){
					case 'left':
						this.cls = classes[0];
						break;
					case 'center':
						this.cls = classes[1];
						break;
					case 'right':
						this.cls = classes[2];
						break;
					case 'justify':
						this.cls = classes[3];
						break;
				}
				
				this.clsRegex = new RegExp('(?:^|\\s+)(?:' + classes.join('|') + ')(?=$|\\s)');
			}
		},

		execute: function(){
			var editor = this.editor,
				selection = editor.getSelection(), 
				enterMode = editor.config.enterMode;
			
			if (!selection) return;
			
			var bookmarks = selection.createBookmarks(), 
				ranges = selection.getRanges(true);

			var cls = this.cls, iterator, block;
			
			var useComputedState = editor.config.useComputedState;
			
			for (var i = ranges.length - 1; i >= 0; i--){
				iterator = ranges[i].createIterator();
				iterator.enlargeBr = enterMode != $['ENTER_BR'];
				
				while ((block = iterator.getNextParagraph())){
					block.removeProperty('align');
					block.removeStyle('text-align');
					
					// Remove any of the alignment classes from the className.
					var className = cls && (block[0].className = block[0].className.replace(this.clsRegex, '').ltrim());

					var apply = (this.state == $['TRISTATE_OFF']) && (!useComputedState || (getAlignment(block, true) != this.value));

					if (cls){
						// Append the desired class name.
						if (apply) block.addClass(cls);
						else if (!className) block.removeProperty('class');
					} else if (apply) block.style('text-align', this.value);
				}
				
			}
			
			editor.focus();
			editor.forceNextSelectionCheck();
			selection.selectBookmarks(bookmarks);
		}

	});
	
	/*function onDirChanged(e){
		var editor = e.editor;
		
		var range = new local.DOM.range(editor.document);
		range.setStartBefore(e.data.node);
		range.setEndAfter(e.data.node);
		
		var walker = new local.DOM.walker(range), node;
		
		while ((node = walker.next())) {
			if (node.$element) {
				// A child with the defined dir is to be ignored.
				if (!node.equals(e.data.node) && node.getDirection()) {
					range.setStartAfter(node);
					walker = new local.DOM.walker(range);
					continue;
				}
				
				// Switch the alignment.
				var classes = editor.config.justifyClasses;
				if (classes) {
					// The left align class.
					if (node.hasClass(classes[0])) {
						node.removeClass(classes[0]);
						node.addClass(classes[2]);
					}     // The right align class.
					else if (node.hasClass(classes[2])) {
						node.removeClass(classes[2]);
						node.addClass(classes[0]);
					}
				}
				
				// Always switch CSS margins.
				var style = 'text-align';
				var align = node.getStyle(style);
				
				if (align == 'left') node.style(style, 'right');
				else if (align == 'right') node.style(style, 'left');
			}
		}
	}*/
	
	
	var pluginName = 'justify';

	$E.plugins.implement(pluginName, function(editor){

		var lang = editor.lang.justify,
			config = editor.config.justify;

		var addCommand = function(item){
			var name = pluginName + item;
			var value = item === 'block' ? 'justify' : item;

			// Register commands.
			var command = editor.addCommand(name, new justifyCommand(editor, name, value));
			command.label = lang[item];
			command.shortcut = config[value].shortcut || null;

			// Register the state changing handlers.
			editor.addEvent('selectionChange', onSelectionChange.bind(command));
		};

		['left', 'center', 'right', 'block'].each(addCommand);
		
		//editor.on('dirChanged', onDirChanged);

	});

	$E.config.justify = {

		/**
		 * The justify definition to be used to apply the justify left style in the text.
		 * @type Object
		 */
		left: {shortcut: 'l'},

		/**
		 * The justify definition to be used to apply the justify center style in the text.
		 * @type Object
		 */
		center: {shortcut: 'e'},

		/**
		 * The justify definition to be used to apply the justify right style in the text.
		 * @type Object
		 */
		right: {shortcut: 'r'},

		/**
		 * The justify definition to be used to apply the justify block style in the text.
		 * @type Object
		 */
		justify: {shortcut: 'j'}
	
	};

});