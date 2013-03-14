
// TODO
// 由于FF下使用position会导致编辑器焦点丢失
// 并无法被恢复
// 后期需要考虑加入保存selection的操作
// 以便在hack焦点时可以准确定位到先前的选区位置
// 另：
// 由于考虑到后期的应用场景中可以会存在滚动条
// 故而还需要考虑加入对scrollTo的相应操作

Klass.run(function(local){

	var constructor = local.Editor;

	function isFormElement(element){
		return element && element.$element && element.name() === 'form';
	}

	function protectFormStyles(element){
		if (!isFormElement(element)) return [];

		var hijackRecord = [], hijackNames = ['style', 'className'];
		for (var i = 0, l = hijackNames.length; i < l; i++) {
			var name = hijackNames[i];
			var node = element[0].elements.namedItem(name);
			if (node) {
				var hijackNode = new local.DOM.element(node);
				hijackRecord.push([hijackNode, hijackNode.nextSibling]);
				hijackNode.dispose();
			}
		}
		
		return hijackRecord;
	}

	function restoreFormStyles(element, hijackRecord){
		if (!isFormElement(element)) return;
		
		if (hijackRecord.length > 0) {
			for (var i = hijackRecord.length - 1; i >= 0; i--) {
				var node = hijackRecord[i][0];
				var sibling = hijackRecord[i][1];
				if (sibling) node.injectBefore(sibling);
				else node.appendTo(element);
			}
		}
	}

	function saveStyles(element, inside){
		var data = protectFormStyles(element),
			result = {};
		
		var node = element[0];

		if (!inside) {
			result['class'] = node.className || '';
			node.className = '';
		}
		
		result.inline = node.style.cssText || '';
		// Reset any external styles that might interfere.
		if (!inside) node.style.cssText = 'position: static; overflow: visible';
		
		restoreFormStyles(data);
		return result;
	}

	function restoreStyles(element, savedStyles){
		var data = protectFormStyles(element);
		if ('class' in savedStyles) element.setProperty('class', savedStyles['class']);
		if ('inline' in savedStyles) element.setProperty('style', savedStyles.inline);
		restoreFormStyles(data);
	}

	function refreshCursor(editor){
		if (editor.mode === 'wysiwyg' && !editor.readOnly){
			var body = editor.document.body();
			body.setProperty('contentEditable', false);
			body.setProperty('contentEditable', true);
		}

		if (editor.focusManager.hasFocus) editor.focus();
	}

	function scrollIntoView(win, scrolls){
		win = win[0] || win;
		scrolls = scrolls || {x: 0, y: 0};

		var x = scrolls.x, y = scrolls.y;

		local.env.ie ? setTimeout(function(){
			win.scrollTo(x, y);
		}, 0) : win.scrollTo(x, y);
	}

	constructor.plugins.implement({

		maximize: function(editor){
		
			var lang = editor.lang;
			
			var container = editor.container, contents = editor.bwrap;
			
			var document = container.getDocument(), window = document.getWindow();

			var documentElement = document.html();
			
			var offset, uiElement;

			var storedKey = 'maximize-saved-styles';

			// Saved selection and scroll position for the editing area.
			var savedSelection, savedScroll, restoreScroll;

			// Retain state after mode switches.
			var currentState = constructor.$['TRISTATE_OFF'];

			function getOffsets(){
				var size = container.getSize(), width = size.x, height = contents.height(), styles = {
					w: container.style('width').toInt(),
					h: contents.style('height').toInt()
				};
				offset = {
					x: width - styles.w,
					y: size.y - height - (height - styles.h)
				};
				return offset;
			}
			
			function resizeHandler(){
				var size = window.getSize();
				container.style('width', size.x - offset.x);
				contents.style('height', size.y - offset.y);
			}
			
			function posHandler(){
				if (!offset) getOffsets();
				container.styles({
					position: 'absolute',
					top: 0,
					left: 0,
					zIndex: editor.baseZIndex('MAXIMIZE')
				});
				resizeHandler();
			}
			
			function reflow(){
				// Save the scroll bar position.
				savedScroll = window.getScroll();
				restoreScroll = null;

				var currentNode = container;
				while (currentNode = currentNode.parent()){
					currentNode.store(storedKey, saveStyles(currentNode));
					currentNode.style('z-index', editor.baseZIndex('MAXIMIZE'));
				}

				contents.store(storedKey, saveStyles(contents, true));
				container.store(storedKey, saveStyles(container, true));

				documentElement.styles({
					width: 0,
					height: 0,
					overflow: local.env.webkit ? '' : 'hidden'
				});

				!local.env.firefox && documentElement.style('position', 'fixed');
			}
			
			function restore(){
				[contents, container].each(function(element){
					restoreStyles(element, element.retrieve(storedKey));
					element.eliminate(storedKey);
				});

				var currentNode = container;
				while (currentNode = currentNode.parent()){
					restoreStyles(currentNode, currentNode.retrieve(storedKey));
					currentNode.eliminate(storedKey);
				}

				// Restore the window scroll position.
				// Fixing Firefox BUG:
				// Restore editor can not be forced to focus.
				scrollIntoView(window, savedScroll);

				// Webkit requires a re-layout on editor chrome.
				if (local.env.webkit){
					container.style('display', 'inline');
					setTimeout(function(){
						container.style('display', 'block');
					}, 0);
				}

				uiElement.first().removeClass('kse-icon-restore');
				uiElement.last().text(lang.maximize);
				uiElement.setProperty('title', lang.maximize);
				
				window.removeEvent('resize', resizeHandler);

				restoreScroll = true;
			}
			
			function maximize(){
				reflow();
				posHandler();
				
				uiElement.first().addClass('kse-icon-restore');
				uiElement.last().text(lang.restore);
				uiElement.setProperty('title', lang.restore);
				
				window.addEvent('resize', resizeHandler);

				// Fixing positioning editor chrome in Firefox break design mode.
				local.env.firefox && refreshCursor(editor);
			}
			
			editor.addCommand('maximize', {
				readOnly: 1,
				canUndo: false,
				editorFocus: false,
				execute: function(){
					var selection;

					// Save current selection and scroll position in editing area.
					if (editor.mode === 'wysiwyg'){
						selection = editor.getSelection();
						savedSelection = selection && selection.getRanges();
					}

					if (!uiElement) uiElement = this.element;

					if (this.state === constructor.$['TRISTATE_ON']) restore();
					else if (this.state === constructor.$['TRISTATE_OFF']) maximize();

					this.toggle();

					// Restore selection and scroll position in editing area.
					if (editor.mode === 'wysiwyg'){
						if (savedSelection){
							// Fixing positioning editor chrome in Firefox break design mode.
							local.env.firefox && refreshCursor(editor);

							selection = editor.getSelection();
							selection.selectRanges(savedSelection);

							var startElement = selection.getStartElement();
							startElement && startElement.scrollIntoView(true);
						}
						scrollIntoView(window, restoreScroll ? savedScroll : null);
					}

					savedSelection = null;
					currentState = this.state;
				}
			});

			// Restore the command state after mode change, unless it has been changed to disabled.
			editor.addEvent('mode', function(){
				var command = this.getCommand('maximize');
				command.state !== constructor.$['TRISTATE_DISABLED'] && command.set(currentState);
			});

		}
		
	});

});