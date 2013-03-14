/**
 * Klass Rich Text Editor v0.5
 * http://kseditor.com
 * 
 * Copyright 2011 - 2012, Alex Tseng
 * Licensed under the MIT-style license.
 * http://kseditor.com/license
 */


/**
 * @fileOverview The default editing block plugin, which holds the editing area
 *		and source view.
 */

Klass.run(function(local){

	var constructor = local.Editor;

	// This is a semaphore used to avoid recursive calls between
	// the following data handling functions.
	var isHandlingData;
	
	constructor.plugins.implement('mode', function(editor){
		if (!editor.config.editingBlock) return;

		editor.addEvents({

			uiReady: function(){
				this.setMode(this.config.startupMode);
			},

			beforeGetData: function(){
				if (!isHandlingData && this.mode){
					isHandlingData = true;
					this.updateData(this.getMode().getData(this));
					isHandlingData = false;
				}
			},

			syncData: function(data){
				if (!isHandlingData){
					function setData(){
						isHandlingData = true;
						editor.getMode().loadData(data || editor.getData());
						isHandlingData = false;
					}
					
					if (this.mode) setData();
					else this.addEvent('mode', function(){
						if (this.mode){
							setData();
							this.removeEvent('mode', arguments.callee);
						}
					});
				}
			},

			getSnapshot: function(data){
				if (this.mode) data.snapshot = this.getMode().getSnapshotData();
			},

			loadSnapshot: function(snapshot){
				if (this.mode) this.getMode().loadSnapshotData(snapshot);
			},
		
			// For the first "mode" call, we'll also fire the "instanceReady"
			// event.
			mode: function(){
				// Do that once only.
				this.removeEvent('mode', arguments.callee);
				
				// Redirect the focus into editor for webkit. (#5713)
				local.env.webkit && this.container.addEvent('focus', function(){
					editor.focus();
				});
				
				if (this.config.startupFocus) this.focus();
				
				// Fire instanceReady for both the editor and Klass.Editor, but
				// defer this until the whole execution has completed
				// to guarantee the editor is fully responsible.
				setTimeout(function(){
					editor.fireEvent('instanceReady');
					editor.removeEvents('instanceReady');
					//Klass.Editor.fireEvent('instanceReady', null, editor);
				}, 0);
			},

			destroy: function(){
				if (this.mode) this.storage.modes[this.mode].unload();
			}

		});

	});

	constructor.implement({
	
		/**
		 * The current editing mode. An editing mode is basically a viewport for
		 * editing or content viewing. By default the possible values for this
		 * property are "wysiwyg" and "source".
		 * @type String
		 * @example
		 * alert( Klass.Editor.instances.editor1.mode );  // "wysiwyg" (e.g.)
		 */
		mode: '',

		/**
		 * Registers an editing mode. This function is to be used mainly by plugins.
		 * @param {String} mode The mode name.
		 * @param {Object} def The mode editor definition.
		 * @example
		 */
		addMode: function(mode, def){
			(this.storage.modes || (this.storage.modes = {}))[mode] = def;
		},

		/**
		 * Gets the current or any of the objects that represent the editing
		 * area modes. The two most common editing modes are "wysiwyg" and "source".
		 * @param {String} [mode] The mode to be retrieved. If not specified, the
		 *		current one is returned.
		 */
		getMode: function(mode){
			return this.storage.modes && this.storage.modes[mode || this.mode];
		},

		/**
		 * Sets the current editing mode in this editor instance.
		 * @param {String} mode A registered mode name.
		 * @example
		 * // Switch to "source" view.
		 * Klass.Editor.instances.editor1.setMode('source');
		 */
		setMode: function(mode){
			this.fireEvent('beforeSetMode');

			var data, container = this.bwrap, 
				isDirty = this.checkRecord();

			// Unload the previous mode.
			if (this.mode){
				if (mode === this.mode) return;
				
				this.fireEvent('beforeModeUnload');
				
				var currentMode = this.getMode();
				data = currentMode.getData(this);
				currentMode.unload();
				this.mode = '';
			}
			
			container.html('');
			
			// Load required mode.
			var def = this.getMode(mode);
			if (!def) throw '[Klass.Editor.editor.setMode] Unknown mode "' + mode + '".';
			
			if (!isDirty){
				this.addEvent('mode', function(){
					this.resetRecord();
					this.removeEvent('mode', arguments.callee);
				});
			}
			
			def.load(container, typeof data !== 'string' ? this.getData() : data);
		},

		/**
		 * Moves the selection focus to the editing are space in the editor.
		 */
		focus: function(){
			this.forceNextSelectionCheck();
			var mode = this.getMode();
			if (mode) mode.focus();
		}
	
	});
	
	/**
	 * The mode to load at the editor startup. It depends on the plugins
	 * loaded. By default, the "wysiwyg" and "source" modes are available.
	 * @type String
	 * @default 'wysiwyg'
	 * @example
	 * config.startupMode = 'source';
	 */
	constructor.config.startupMode = 'wysiwyg';

	/**
	 * Sets whether the editor should have the focus when the page loads.
	 * @name Klass.Editor.config.startupFocus
	 * @type Boolean
	 * @default false
	 * @example
	 * config.startupFocus = true;
	 */	

	/**
	 * Whether to render or not the editing block area in the editor interface.
	 * @type Boolean
	 * @default true
	 * @example
	 * config.editingBlock = false;
	 */
	constructor.config.editingBlock = true;
	
});

/**
 * Fired when a Klass.Editor instance is created, fully initialized and ready for interaction.
 * @name Klass.Editor#instanceReady
 * @event
 * @param {Klass.Editor.editor} editor The editor instance that has been created.
 */

/**
 * Fired when the Klass.Editor instance is created, fully initialized and ready for interaction.
 * @name Klass.Editor.editor#instanceReady
 * @event
 */

/**
 * Fired before changing the editing mode. See also Klass.Editor.editor#beforeSetMode and Klass.Editor.editor#mode
 * @name Klass.Editor.editor#beforeModeUnload
 * @event
 */

/**
 * Fired before the editor mode is set. See also Klass.Editor.editor#mode and Klass.Editor.editor#beforeModeUnload
 * @name Klass.Editor.editor#beforeSetMode
 * @event
 * @param {String} newMode The name of the mode which is about to be set.
 */

/**
 * Fired after setting the editing mode. See also Klass.Editor.editor#beforeSetMode and Klass.Editor.editor#beforeModeUnload
 * @name Klass.Editor.editor#mode
 * @event
 * @param {String} previousMode The previous mode of the editor.
 */