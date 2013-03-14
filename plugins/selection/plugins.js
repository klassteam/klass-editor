(function(local){

	// #### checkSelectionChange : START

	// The selection change check basically saves the element parent tree of
	// the current node and check it on successive requests. If there is any
	// change on the tree, then the selectionChange event gets fired.
	function checkSelectionChange(){
		//try {
			// In IE, the "selectionchange" event may still get thrown when
			// releasing the WYSIWYG mode, so we need to check it first.
			var selection = this.getSelection();

			if (!selection || !selection.document.getWindow()[0]) return;

			var firstElement = selection.getStartElement();
			var currentPath = new local.DOM.elementPath(firstElement);

			if (!currentPath.compare(this.storage.selectionPreviousPath)){
				this.storage.selectionPreviousPath = currentPath;
				this.fireEvent('selectionChange', {
					editor: this,
					selection: selection,
					path: currentPath,
					element: firstElement
				});
			}
		//} catch (e){}
	}

	var checkSelectionChangeTimer, checkSelectionChangeTimeoutPending;

	function checkSelectionChangeTimeout(){
		// Firing the "OnSelectionChange" event on every key press started to
		// be too slow. This function guarantees that there will be at least
		// 200ms delay between selection checks.
		
		checkSelectionChangeTimeoutPending = true;
		
		if (checkSelectionChangeTimer) return;

		checkSelectionChangeTimeoutExec.call(this);
		
		checkSelectionChangeTimer = checkSelectionChangeTimeoutExec.delay(200, this);
	}

	function checkSelectionChangeTimeoutExec(){
		checkSelectionChangeTimer = null;

		if (checkSelectionChangeTimeoutPending){
			// Call this with a timeout so the browser properly moves the
			// selection after the mouseup. It happened that the selection was
			// being moved after the mouseup when clicking inside selected text
			// with Firefox.
			checkSelectionChange.delay(0, this);
			
			checkSelectionChangeTimeoutPending = false;
		}
	}

	// #### checkSelectionChange : END


	function getFillingChar(doc){
		return doc && doc.retrieve('kse-fillingChar');
	}

	// Checks if a filling char has been used, eventualy removing it (#1272).
	function checkFillingChar(doc){
		var fillingChar = getFillingChar(doc);
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

	var selectAllCommand = {
	
		modes: {
			wysiwyg: 1,
			source: 1
		},
		shortcut: 'a',
		readOnly: local.env.ie || local.env.webkit,
		execute: function(editor){
			switch (editor.mode){
				case 'wysiwyg':
					editor.document[0].execCommand('selectAll', false, null);
					// Force triggering selectionChange
					editor.forceNextSelectionCheck();
					editor.selectionChange();
					break;
				case 'source':
					// Select the contents of the textarea
					var textarea = editor.textarea[0];
					if (local.env.ie) textarea.createTextRange().execCommand('selectAll');
					else {
						textarea.selectionStart = 0;
						textarea.selectionEnd = textarea.value.length;
					}
					textarea.focus();
			}
		},
		canUndo: false
	
	};

	local.Editor.plugins.implement('selection', function(editor){

		// On WebKit only, we need a special "filling" char on some situations.
		// Here we set the events that should invalidate that char.
		if (local.env.webkit){

			var fillingCharBefore, resetSelection;

			function beforeData(){
				var doc = editor.document, fillingChar = getFillingChar(doc);
				
				if (fillingChar){
					// If cursor is right blinking by side of the filler node, save it for restoring,
					// as the following text substitution will blind it. (#7437)
					var selection = doc[0].defaultView.getSelection();
					if (selection.type === 'Caret' && selection.anchorNode == fillingChar[0]) resetSelection = 1;
					
					fillingCharBefore = fillingChar.text();
					fillingChar.text(fillingCharBefore.replace(/\u200B/g, ''));
				}
			}

			function afterData(){
				var doc = editor.document, fillingChar = getFillingChar(doc);
				
				if (fillingChar) {
					fillingChar.text(fillingCharBefore);
					
					if (resetSelection) {
						doc[0].defaultView.getSelection().setPosition(fillingChar[0], fillingChar.length());
						resetSelection = 0;
					}
				}
			}

			editor.addEvents({
				selectionChange: checkFillingChar.bind(null, editor.document),
				beforeSetMode: removeFillingChar.bind(null, editor.document),
				beforeUndoImage: beforeData,
				afterUndoImage: afterData,
				beforeGetData: beforeData,
				getData: afterData
			});
		}


		editor.addEvent('contentDOMReady', function(){

			var document = editor.document,
				html = document.html(),
				body = document.body();

			if (local.env.ie){
				var savedRange, saveEnabled, restoreEnabled = 1;

				function disableSave(){
					saveEnabled = 0;
				}
				
				function enabledSave(){
					saveEnabled = 1;
					saveSelection();
				}
				
				function saveSelection(test){
					if (saveEnabled){
						var document = editor.document,
							selection = document.getSelection(),
							nativeSelection = selection && selection.getSelection();

						if (test && nativeSelection && nativeSelection.type === 'None'){
							if (!document[0].queryCommandEnabled('InsertImage')){
								saveSelection.delay(50, this, true);
								return;
							}
						}

						var parent;
						if (nativeSelection && nativeSelection.type && nativeSelection.type !== 'Control' && 
							(parent = nativeSelection.createRange()) && 
							(parent = parent.parentElement()) && 
							(parent = parent.nodeName) && parent.toLowerCase() in {input: 1, textarea: 1}){
							return;
						}

						savedRange = nativeSelection && selection.getRanges()[0];
						checkSelectionChangeTimeout.call(editor);
					}
				}

				body.addEvents({
					focusin: function(evt){
						// If there are elements with layout they fire this event but
						// it must be ignored to allow edit its contents #4682
						if (evt && evt.target.nodeName !== 'BODY') return;

						// Give the priority to locked selection since it probably
						// reflects the actual situation, besides locked selection
						// could be interfered because of text nodes normalizing.
						var lockedSelection = document.retrieve('kse-locked-selection');
						if (lockedSelection){
							lockedSelection.unlock(1);
							lockedSelection.lock();
						} else if (savedRange && restoreEnabled){
							// If we have saved a range, restore it at this
							// point.

							// Well not break because of this.
							try {
								savedRange.select();
							} catch (e){}
							savedRange = null;
						}
					},
					beforedeactivate: function(evt){
						// Ignore this event if it's caused by focus switch between
						// internal editable control type elements, e.g. layouted paragraph. (#4682)
						if (evt.event.toElement) return;
						
						// Disable selections from being saved.
						saveEnabled = 0;
						restoreEnabled = 1;
					},
					keyup: enabledSave,
					keydown: disableSave,
					mousedown: disableSave,
					mouseup: function(evt){
						saveEnabled = 1;
						saveSelection.delay(0, null, true);
					},
					focus: enabledSave
				});

				html.addEvents({
					mouseup: function(){
						restoreEnabled = 1;
					},
					mousedown: function(){
						restoreEnabled = 0;
					}
				});

				// Fixing IE8 BUG:
				// When the boundary node is <img>, 
				// unable to move the editor focus to the end position.
				local.env.ie8 && html.addEvent('mouseup', function(){
					var selection = editor.getSelection(),
						range = selection.getRanges()[0],
						boundaryNodes = range.getBoundaryNodes(),
						startNode = boundaryNodes.startNode,
						endNode = boundaryNodes.endNode;

					if (startNode && startNode.$element && startNode.equals(endNode) && startNode.is('img')){
						range.moveToElementEditEnd(startNode);
						range.select();
					}
				});

				local.env.mode && html.addEvent('mouseup', function(ev){
					var target = ev.getTarget();

					// The event is not fired when clicking on the scrollbars,
					// so we can safely check the following to understand
					// whether the empty space following <body> has been clicked.
					if (target.is('html')){
						var selection = local.Editor.document[0].selection,
							range = selection.createRange();

						// The selection range is reported on host, but actually it should applies to the content doc.
						if (selection.type !== 'None' && range.parentElement().ownerDocument == document[0]) range.select();
					}
				});

				// [IE] Iframe will still keep the selection when blurred, if
				// focus is moved onto a non-editing host, e.g. link or button, but
				// it becomes a problem for the object type selection, since the resizer
				// handler attached on it will mark other part of the UI, especially
				// for the dialog.
				// [IE<8] Even worse For old IEs, the cursor will not vanish even if
				// the selection has been moved to another text input in some cases.
				//
				// Now the range restore is disabled, so we simply force IE to clean
				// up the selection before blur.
				editor.addEvent('blur', function(){
					// Error proof when the editor is not visible.
					try {
						document[0].selection.empty();
					} catch (e){}
				});
				
				document.addEvent('selectionchange', saveSelection);

			} else {
				document.addEvents({
					keyup: checkSelectionChangeTimeout.bind(editor),
					mouseup: checkSelectionChangeTimeout.bind(editor),
					selectionchange: checkSelectionChangeTimeout.bind(editor)
				});
			}

		});

		editor.addCommand('selectAll', selectAllCommand);

		/**
		 * Check if to fire the {@link Klass.Editor.editor#selectionChange} event
		 * for the current editor instance.
		 *
		 * @param {Boolean} checkNow Check immediately without any delay.
		 */
		editor.selectionChange = function(instantly){
			(instantly ? checkSelectionChange : checkSelectionChangeTimeout).call(this);
		};

		// IE9 might cease to work if there's an object selection inside the iframe (#7639).
		local.env.ie9 && editor.addEvent('destroy', function(){
			var selection = editor.getSelection();
			selection && selection.getSelection().clear();
		});

	});

})(Klass);