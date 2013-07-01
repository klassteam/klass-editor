/**
 * @file Clipboard support
 */
(function(window, $K){

	var $E = $K.Editor, $ = $E.$;

	// Allow to peek clipboard content by redirecting the
	// pasting content into a temporary bin and grab the content of it.
	function getClipboardData(evt, mode, callback){
		var doc = this.document;
		
		// Avoid recursions on 'paste' event or consequent paste too fast. (#5730)
		if (doc.get('kse_pastebin')) return;
		
		// If the browser supports it, get the data directly
		if (mode === 'text' && evt && evt.event.clipboardData){
			// evt.event.clipboardData.types contains all the flavours in Mac's Safari, but not on windows.
			var plain = evt.event.clipboardData.getData('text/plain');
			if (plain){
				evt.preventDefault();
				callback(plain);
				return;
			}
		}
		
		var selection = this.getSelection(), 
			range = new $K.DOM.range(doc);
		
		// Create container to paste into
		var pastebin = new $K.DOM.element(mode === 'text' ? 'textarea' : $K.env.webkit ? 'body' : 'div', {
			id: 'kse_pastebin',
			styles: {
				position: 'absolute',
				// Position the bin exactly at the position of the selected element
				// to avoid any subsequent document scroll.
				top: selection.getStartElement().getOffsets().y + 'px',
				width: '1px',
				height: '1px',
				overflow: 'hidden'
			}
		}, doc);
		// Safari requires a filler node inside the div to have the content pasted into it. (#4882)
		$K.env.webkit && pastebin.append(doc.createText('\xa0'));
		doc.body().append(pastebin);
		
		// It's definitely a better user experience if we make the paste-bin pretty unnoticed
		// by pulling it off the screen.
		pastebin.style(this.config.contentsDirection == 'ltr' ? 'left' : 'right', '-1000px');
		
		var bookmarks = selection.createBookmarks();
		this.pauseEvent('selectionChange');

		// Turn off design mode temporarily before give focus to the paste bin.
		if (mode !== 'text'){
			range.setStartAt(pastebin, $['POSITION_AFTER_START']);
			range.setEndAt(pastebin, $['POSITION_BEFORE_END']);
			range.select(true);
		} else pastebin[0].focus();

		var editor = this;
		// Wait a while and grab the pasted contents
		window.setTimeout(function(){
			// Restore properly the document focus.
			doc.body().focus();

			editor.restartEvent('selectionChange');

			pastebin.dispose();
			selection.selectBookmarks(bookmarks);
			
			// Grab the HTML contents.
			// We need to look for a apple style wrapper on webkit it also adds
			// a div wrapper if you copy/paste the body of the editor.
			// Remove hidden div and restore selection.
			var bogusSpan;
			pastebin = ($K.env.webkit && (bogusSpan = pastebin.first()) && 
				(bogusSpan.is && bogusSpan.hasClass('Apple-style-span')) ? bogusSpan : pastebin);

			callback(pastebin[mode == 'text' ? 'value' : 'html']());
		}, 0);
	}
	
	// Cutting off control type element in IE standards breaks the selection entirely. (#4881)
	function fixCut(editor){
		if (!$K.env.ie) return;
		
		var control, selection = editor.getSelection();

		if ((selection.getType() == $['SELECTION_ELEMENT']) && (control = selection.getSelectedElement())){
			var range = selection.getRanges()[0];
			var dummy = editor.document.createText('').injectBefore(control);
			range.setStartBefore(dummy);
			range.setEndAfter(control);
			selection.selectRanges([range]);
			
			// Clear up the fix if the paste wasn't succeeded.
			setTimeout(function(){
				// Element still online?
				if (control.parent()){
					dummy.dispose();
					selection.selectElement(control);
				}
			}, 0);
		}
	}

	var depressBeforeEvent, 
		inReadOnly;
	function stateFromNamedCommand(command, editor){
		var result;

		if (inReadOnly && command in {Cut : 1, Paste: 1}) return $['TRISTATE_DISABLED'];

		if (command === 'Paste'){
			// IE Bug: queryCommandEnabled('paste') fires also 'beforepaste(copy/cut)',
			// guard to distinguish from the ordinary sources( either
			// keyboard paste or execCommand )
			$K.env.ie && (depressBeforeEvent = 1);

			try {
				// Always return true for Webkit (which always returns false).
				result = editor.document[0].queryCommandEnabled(command) || $K.env.webkit;
			} catch (e){}
			depressBeforeEvent = 0;
		} else {
			// Cut, Copy - check if the selection is not empty
			var selection = editor.getSelection(),
				ranges = selection && selection.getRanges();
			result = selection && !(ranges.length === 1 && ranges[0].collapsed);
		}

		return result ? $['TRISTATE_OFF'] : $['TRISTATE_DISABLED'];
	}

	function setStates(){
		if (this.mode !== 'wysiwyg') return;

		this.getCommand('cut').set(stateFromNamedCommand('Cut', this));
		this.getCommand('copy').set(stateFromNamedCommand('Copy', this));
		this.fireEvent('pasteState', stateFromNamedCommand('Paste', this));
	}

	// Tries to execute any of the paste, cut or copy commands in IE. Returns a
	// boolean indicating that the operation succeeded.
	var execIECommand = function(editor, command){
		var doc = editor.document, body = doc.body();
		
		var enabled = false;
		var execute = function(){
			enabled = true;
		};
		
		// The following seems to be the only reliable way to detect that
		// clipboard commands are enabled in IE. It will fire the
		// onpaste/oncut/oncopy events only if the security settings allowed
		// the command to execute.
		body.addEvent(command, execute);
		
		// IE6/7: document.execCommand has problem to paste into positioned element.
		($K.env.version > 7 ? doc[0] : doc[0].selection.createRange())['execCommand'](command);
		
		body.removeEvent(command, execute);
		
		return enabled;
	};

	// Attempts to execute the Cut and Copy operations.
	var attemptExecute = function(editor, type){
		if ($K.env.ie) return execIECommand(editor, type);

		try {
			// Other browsers throw an error if the command is disabled.
			return editor.document[0].execCommand(type, false, null);
		} catch (e){
			return false;
		}
	};
	
	// A class that represents one of the cut or copy commands.	
	var clipCommand = new Class({
	
		initialize: function(type){
			this.type = type;
			this.startDisabled = true;

			// We can't undo copy to clipboard.
			this.canUndo = this.type === 'cut';
		},

		execute: function(editor, data){
			this.type === 'cut' && fixCut(editor);

			var success = attemptExecute(editor, this.type);

			// Show cutError or copyError.
			if (!success) alert(editor.lang.clipboard[this.type + 'Error']);
			return success;
		}
	
	});
	
	// Paste command.
	var pasteCommand = {
		canUndo: false,
		
		execute: $K.env.ie ? function(editor){
			// Prevent IE from pasting at the begining of the document.
			editor.focus();
			
			if (editor.document.body().fireEvent('beforepaste') && !execIECommand(editor, 'paste')){
				editor.fireEvent('pasteDialog');
				return false;
			}
		} : function(editor){
			try {
				if (editor.document.body().fireEvent('beforepaste') && !editor.document[0].execCommand('Paste', false, null)){throw 0;}
			} catch (e){
				setTimeout(function(){
					editor.fireEvent('pasteDialog');
				}, 0);
				return false;
			}
		}

	};

	// Listens for some clipboard related keystrokes, so they get customized.
	var specialKeys = {

		v: function(ev){
			var env = $K.env;

			// 1. Opera just misses the "paste" event.
			// 2. Firefox's "paste" event comes too late to have the plain
			// text paste bin to work.
			if (env.opera || env.firefox) this.document.body().fireEvent('paste');
		},

		x: function(){
			// Save Undo snapshot.
			var editor = this;
			// Save before paste
			this.fireEvent('saveSnapshot');
			setTimeout(function(){
				// Save after paste
				editor.fireEvent('saveSnapshot');
			}, 0);
		}
	
	};
	
	// Register the plugin.
	$E.plugins.implement('clipboard', function(editor){

		editor.addEvents({

			paste: function(data){
				this.fireEvent('pasteFilter', data);

				if (data.skip) return;

				data['html'] && this.insertHTML(data['html']);
				data['text'] && this.insertText(data['text']);

				setTimeout(function(){
					editor.fireEvent('afterPaste');
				}, 0);
			},
		
			pasteDialog: function(){
				setTimeout(function(){
					// Open default paste dialog.
					editor.openDialog('paste');
				}, 0);
			},

			pasteState: function(state){
				this.getCommand('paste').set(state);
			},

			// For improved performance, we're checking the readOnly state on selectionChange instead of hooking a key event for that.
			selectionChange: function(evt){
				inReadOnly = evt.selection.getRanges()[0].checkReadOnly();
				setStates.call(this);
			},

			// We'll be catching all pasted content in one line, regardless of whether the
			// it's introduced by a document command execution (e.g. toolbar buttons) or
			// user paste behaviors. (e.g. Ctrl-V)
			contentDOMReady: function(){
				var body = this.document.body();

				Object.append(this.specialKeys, specialKeys);

				body.addEvent(!$K.env.ie ? 'paste' : 'beforepaste', function(ev){
					if (depressBeforeEvent) return;

					// Fire 'beforePaste' event so clipboard flavor get customized
					// by other plugins.
					var modeData = {mode: 'html'};

					editor.fireEvent('beforePaste', modeData);
					
					getClipboardData.call(editor, ev, modeData.mode, function(data){
						// The very last guard to make sure the
						// paste has successfully happened.
						if (!(data = data.replace(/<span[^>]+data-kse-bookmark[^<]*?<\/span>/ig, '').trim())) return;

						var dataTransfer = {};
						dataTransfer[modeData.mode] = data;
						editor.fireEvent('paste', dataTransfer);
					});
				});

				body.addEvents({
					// Dismiss the (wrong) 'beforepaste' event fired on context menu open.
					contextmenu: function(){
						depressBeforeEvent = 1;
						setTimeout(function(){
							depressBeforeEvent = 0;
						}, 10);
					},
				
					beforecut: function(){
						!depressBeforeEvent && fixCut(editor);
					},

					mouseup: function(){
						setStates.delay(0, editor);
					},
					
					keyup: setStates.bind(editor)
				});
			
			}

		});

		function addButtonCommand(item){
			var command = Object.append(item === 'paste' ? pasteCommand : new clipCommand(item), editor.config.clipboard[item]);

			editor.addCommand(item, command);
			
			// If the "menu" plugin is loaded, register the menu item.
			//if (editor.addMenuItems){
			//	editor.addMenuItem(commandName, {
			//		label: lang,
			//		command: commandName,
			//		group: 'clipboard',
			//		order: ctxMenuOrder
			//	});
			//}
		}

		['cut', 'copy', 'paste'].forEach(addButtonCommand);

		
		// If the "contextmenu" plugin is loaded, register the listeners.
		//if (editor.contextMenu){
		//	editor.contextMenu.addListener(function(element, selection){
		//		var readOnly = selection.getRanges()[0].checkReadOnly();
		//		return {
		//			cut: !readOnly && stateFromNamedCommand('Cut', editor),
		//			copy: stateFromNamedCommand('Copy', editor),
		//			paste: !readOnly && ($K.env.webkit ? $['TRISTATE_OFF'] : stateFromNamedCommand('Paste', editor))
		//		};
		//	});
		//}

	});


	$E.config.clipboard = {

		/**
		 * The clipboard definition to the cut.
		 * @type Object
		 */
		cut: {shortcut: 'x', specialKey: true},

		/**
		 * The clipboard definition to the copy.
		 * @type Object
		 */
		copy: {shortcut: 'c', specialKey: true},

		/**
		 * The clipboard definition to the paste.
		 * @type Object
		 */
		paste: {shortcut: 'v', specialKey: true}

	};

})(window, Klass);

/**
 * Definition of force in the dialog box to perform paste operation plugins
 * collection.
 * @name Klass.Editor.config.forcePasteUseDialog
 * @type Array
 * @default null
 * @example
 * config.forcePasteUseDialog = ['paste', 'pastetext'];
 */