/**
 * @fileOverview Undo/Redo system for saving shapshot for document modification
 *		and other recordable changes.
 */
(function(local){

	var constructor = local.Editor;

	var $ = constructor.constants;

	var plugins = constructor.plugins;

	plugins.undo = {};

	// Attributes that browser may changing them when setting via innerHTML.
	var protectedAttributes = /\b(?:href|src|name)="[^"]*?"/gi;
	
	/**
	 * Undo snapshot which represents the current document status.
	 * @name Klass.Editor.plugins.undo.Image
	 * @param editor The editor instance on which the image is created.
	 */
	var Image = plugins.undo.Image = new Class({
		
		initialize: function(editor){
			editor.fireEvent('beforeUndoImage');

			var contents = editor.getSnapshot(), selection = contents && editor.getSelection();

			// In IE, we need to remove the expando attributes.
			local.env.ie && contents && (contents = contents.replace(/\s+data-kse-expando=".*?"/g, ''));
			
			this.editor = editor;
			this.contents = contents;
			this.bookmarks = selection && selection.createBookmarks2(true);

			editor.fireEvent('afterUndoImage');
		},

		equals: function(snapshot, contentOnly){
			var currentContents = this.contents, snapshotContents = snapshot.contents;

			// For IE6/7 : Comparing only the protected attribute values but not the original ones.(#4522)
			if (local.env.ie6 || local.env.ie7){
				currentContents = currentContents.replace(protectedAttributes, '');
				snapshotContents = snapshotContents.replace(protectedAttributes, '');
			}

			if (currentContents != snapshotContents) return false;
			
			if (contentOnly) return true;
			
			var currentBookmarks = this.bookmarks, snapshotBookmarks = snapshot.bookmarks;
			
			if (currentBookmarks || snapshotBookmarks){
				if (!currentBookmarks || !snapshotBookmarks || currentBookmarks.length !== snapshotBookmarks.length) return false;
				
				for (var i = 0, l = currentBookmarks.length; i < l; i++){
					var currentBookmark = currentBookmarks[i], snapshotBookmark = snapshotBookmarks[i];
					
					if (currentBookmark.startOffset != snapshotBookmark.startOffset || 
						currentBookmark.endOffset != snapshotBookmark.endOffset || 
						!constructor.utils.arrayCompare(currentBookmark.start, snapshotBookmark.start) || 
						!constructor.utils.arrayCompare(currentBookmark.end, snapshotBookmark.end)) return false;
				}
			}
			
			return true;
		}

	});

	// Backspace, Delete
	var editingKeyCodes = {8: 1, 46: 1};

	// Shift, Ctrl, Alt
	var modifierKeyCodes = {16: 1, 17: 1, 18: 1};

	// Arrows: L, T, R, B
	var navigationKeyCodes = {37: 1, 38: 1, 39: 1, 40: 1};
	
	/**
	 * @constructor Main logic for Redo/Undo feature.
	 */
	var UndoManager = new Class({

		Extends: Class.Events,

		initialize: function(editor){
			this.editor = editor;
			// Reset the undo stack.
			this.reset();
		},
	
		/**
		 * Process undo system regard keystrikes.
		 */
		type: function(event){
			var keystroke = event.code, 
				isModifierKey = keystroke in modifierKeyCodes, 
				isEditingKey = keystroke in editingKeyCodes, 
				wasEditingKey = this.lastKeystroke in editingKeyCodes, 
				sameAsLastEditingKey = isEditingKey && keystroke == this.lastKeystroke,
				// Keystrokes which navigation through contents.
				isReset = keystroke in navigationKeyCodes, 
				wasReset = this.lastKeystroke in navigationKeyCodes,

				// Keystrokes which just introduce new contents.
				isContent = (!isEditingKey && !isReset),

				// Create undo snap for every different modifier key.
				modifierSnapshot = (isEditingKey && !sameAsLastEditingKey),
				// Create undo snap on the following cases:
				// 1. Just start to type .
				// 2. Typing some content after a modifier.
				// 3. Typing some content after make a visible selection.
				startedTyping = !(isModifierKey || this.typing) || (isContent && (wasEditingKey || wasReset));

			if (startedTyping || modifierSnapshot){
				var beforeTypeImage = new Image(this.editor),
					beforeTypeCount = this.snapshots.length;

				// Use setTimeout, so we give the necessary time to the
				// browser to insert the character into the DOM.
				(function(){
					var currentSnapshot = this.editor.getSnapshot();

					// In IE, we need to remove the expando attributes.
					if (local.env.ie) currentSnapshot = currentSnapshot.replace(/\s+data-kse-expando=".*?"/g, '');

					if (beforeTypeImage.contents != currentSnapshot && beforeTypeCount == this.snapshots.length){
						// It's safe to now indicate typing state.
						this.typing = true;
						
						// This's a special save, with specified snapshot
						// and without auto 'fireChange'.
						if (!this.save(false, beforeTypeImage, false))
							// Drop future snapshots.
							this.snapshots.splice(this.index + 1, this.snapshots.length - this.index - 1);
						
						this.hasUndo = true;
						this.hasRedo = false;
						
						this.typesCount = 1;
						this.modifiersCount = 1;
						
						this.fireEvent('change');
					}
				}).delay(0, this);
			}
			
			this.lastKeystroke = keystroke;
			
			// Create undo snap after typed too much (over 25 times).
			if (isEditingKey){
				this.typesCount = 0;
				this.modifiersCount++;
				
				if (this.modifiersCount > 25){
					this.save(false, null, false);
					this.modifiersCount = 1;
				}
			} else if (!isReset){
				this.modifiersCount = 0;
				this.typesCount++;
				
				if (this.typesCount > 25){
					this.save(false, null, false);
					this.typesCount = 1;
				}
			}
			
		},
		
		// Reset the undo stack.
		reset: function(){
			/**
			 * Remember last pressed key.
			 */
			this.lastKeystroke = 0;
			
			/**
			 * Stack for all the undo and redo snapshots, they're always created/removed
			 * in consistency.
			 */
			this.snapshots = [];
			
			/**
			 * Current snapshot history index.
			 */
			this.index = -1;
			
			this.limit = this.editor.config.undoStackSize || 20;
			
			this.currentImage = null;
			
			this.hasUndo = false;
			this.hasRedo = false;
			
			this.resetType();
		},
		
		/**
		 * Reset all states about typing.
		 * @see  UndoManager.type
		 */
		resetType: function(){
			this.typing = false;
			delete this.lastKeystroke;
			this.typesCount = 0;
			this.modifiersCount = 0;
		},

		fireChange: function(){
			this.hasUndo = !!this.getNextImage(true);
			this.hasRedo = !!this.getNextImage(false);

			// Reset typing
			this.resetType();
			this.fireEvent('change');
		},
		
		/**
		 * Save a snapshot of document image for later retrieve.
		 */
		save: function(onContentOnly, image, autoFireChange){
			var snapshots = this.snapshots;

			// Get a content image.
			if (!image) image = new Image(this.editor);

			// Do nothing if it was not possible to retrieve an image.
			if (image.contents === false) return false;

			// Check if this is a duplicate. In such case, do nothing.
			if (this.currentImage && image.equals(this.currentImage, onContentOnly)) return false;

			// Drop future snapshots.
			snapshots.splice(this.index + 1, snapshots.length - this.index - 1);
			
			// If we have reached the limit, remove the oldest one.
			if (snapshots.length == this.limit) snapshots.shift();
			
			// Add the new image, updating the current index.
			this.index = snapshots.push(image) - 1;
			
			this.currentImage = image;
			
			if (autoFireChange !== false) this.fireChange();
			return true;
		},
		
		restoreImage: function(image){
			var editor = this.editor, selection;

			if (image.bookmarks){
				editor.focus();
				// Retrieve the selection beforehand.
				selection = editor.getSelection();
			}

			this.editor.loadSnapshot(image.contents);
			
			if (image.bookmarks){
				selection.selectBookmarks(image.bookmarks);
			} else if (local.env.ie){
				// IE BUG: If I don't set the selection to *somewhere* after setting
				// document contents, then IE would create an empty paragraph at the bottom
				// the next time the document is modified.
				var range = editor.document.body()[0].createTextRange();
				range.collapse(true);
				range.select();
			}
			
			this.index = image.index;
			
			// Update current image with the actual editor
			// content, since actualy content may differ from
			// the original snapshot due to dom change. (#4622)
			this.update();
			this.fireChange();
		},
		
		// Get the closest available image.
		getNextImage: function(isUndo){
			var snapshots = this.snapshots, currentImage = this.currentImage, image, i, l;

			if (currentImage){
				if (isUndo){
					for (i = this.index - 1; i >= 0; i--){
						image = snapshots[i];
						if (!currentImage.equals(image, true)){
							image.index = i;
							return image;
						}
					}
				} else {
					for (i = this.index + 1, l = snapshots.length; i < l; i++){
						image = snapshots[i];
						if (!currentImage.equals(image, true)){
							image.index = i;
							return image;
						}
					}
				}
			}
			
			return null;
		},
		
		/**
		 * Check the current redo state.
		 * @return {Boolean} Whether the document has previous state to
		 *		retrieve.
		 */
		redoable: function(){
			return this.enabled && this.hasRedo;
		},
		
		/**
		 * Check the current undo state.
		 * @return {Boolean} Whether the document has future state to restore.
		 */
		undoable: function(){
			return this.enabled && this.hasUndo;
		},
		
		/**
		 * Perform undo on current index.
		 */
		undo: function(){
			if (this.undoable()){
				this.save(true);

				var image = this.getNextImage(true);
				if (image) return this.restoreImage(image), true;
			}
			
			return false;
		},
		
		/**
		 * Perform redo on current index.
		 */
		redo: function(){
			if (this.redoable()){
				// Try to save. If no changes have been made, the redo stack
				// will not change, so it will still be redoable.
				this.save(true);
				
				// If instead we had changes, we can't redo anymore.
				if (this.redoable()){
					var image = this.getNextImage(false);
					if (image) return this.restoreImage(image), true;
				}
			}
			
			return false;
		},
		
		/**
		 * Update the last snapshot of the undo stack with the current editor content.
		 */
		update: function(){
			this.snapshots.splice(this.index, 1, (this.currentImage = new Image(this.editor)));
		}

	});

	plugins.implement('undo', function(editor){

		var undoManager = new UndoManager(editor);
		
		var undoCommand = editor.addCommand('undo', {
			execute: function(){
				if (undoManager.undo()){
					editor.selectionChange();
					this.fireEvent('afterUndo');
				}
			},
			config: {shortcut: 'z'},
			state: $['TRISTATE_DISABLED'],
			canUndo: false
		});

		var redoCommand = editor.addCommand('redo', {
			execute: function(){
				if (undoManager.redo()){
					editor.selectionChange();
					this.fireEvent('afterRedo');
				}
			},
			config: {shortcut: 'y'},
			state: $['TRISTATE_DISABLED'],
			canUndo: false
		});

		undoManager.addEvent('change', function(){
			undoCommand.set(undoManager.undoable() ? $['TRISTATE_OFF'] : $['TRISTATE_DISABLED']);
			redoCommand.set(undoManager.redoable() ? $['TRISTATE_OFF'] : $['TRISTATE_DISABLED']);
		});
		
		function recordCommand(command){
			// If the command hasn't been marked to not support undo.
			if (undoManager.enabled && command.canUndo !== false) undoManager.save();
		}
		
		editor.addEvents({
			// We'll save snapshots before and after executing a command.
			beforeCommandExec: recordCommand,
			afterCommandExec: recordCommand,
			// Save snapshots before doing custom changes.
			saveSnapshot: function(onContentOnly){
				undoManager.save(onContentOnly);
			},
			// Amend the top of undo stack (last undo image) with the current DOM changes.
			updateSnapshot: function(){
				undoManager.currentImage && undoManager.update();
			},
			// Registering keydown on every document recreation.
			contentDOMReady: function(){
				editor.document.addEvent('keydown', function(evt){
					if (!evt.control && !evt.meta) undoManager.type(evt);
				});
			},
			// Always save an undo snapshot - the previous mode might have
			// changed editor contents.
			beforeModeUnload: function(){
				editor.mode === 'wysiwyg' && undoManager.save(true);
			},
			// Make the undo manager available only in wysiwyg mode.
			mode: function(){
				undoManager.enabled = editor.mode === 'wysiwyg';
				undoManager.fireEvent('change');
			}
		});
		
		editor.resetUndo = function(){
			// Reset the undo stack.
			undoManager.reset();
			
			// Create the first image.
			editor.fireEvent('saveSnapshot');
		};
		
	});

})(Klass);

/**
 * The number of undo steps to be saved. The higher this setting value the more
 * memory is used for it.
 * @type Number
 * @default 20
 * @example
 * config.undoStackSize = 50;
 */