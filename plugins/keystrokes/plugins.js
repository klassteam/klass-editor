(function(local){

	var cancel;
	
	var onKeyDown = function(event){
		var keyCombination = event.getKeystroke();
		var command = this.keystrokes[keyCombination];
		var editor = this._.editor;
		
		cancel = (editor.fire('key', {
			keyCode: keyCombination
		}) === true);
		
		if (!cancel) {
			if (command) {
				var data = {
					from: 'keystrokeHandler'
				};
				cancel = (editor.execCommand(command, data) !== false);
			}
			
			if (!cancel) {
				var handler = editor.specialKeys[keyCombination];
				cancel = (handler && handler(editor) === true);
				
				if (!cancel) cancel = !!this.blockedKeystrokes[keyCombination];
			}
		}
		
		if (cancel) event.preventDefault(true);
		
		return !cancel;
	};
	
	var onKeyPress = function(event){
		if (cancel){
			cancel = false;
			event.preventDefault(true);
		}
	};

	/**
	 * Controls keystrokes typing in an editor instance.
	 * @constructor
	 * @param The editor instance.
	 * @example
	 */
	local.Editor.keystrokeHandler = new Class({
		
		initialize: function(editor){
			if (editor.keystrokeHandler) return editor.keystrokeHandler;
			
			this.editor = editor;
			/**
			 * List of keystrokes associated to commands. Each entry points to the
			 * command to be executed.
			 * @type Object
			 * @example
			 */
			this.keystrokes = {};

			return this;
		},

		/**
		 * Attaches this keystroke handle to a DOM object. Keystrokes typed
		 ** over this object will get handled by this keystrokeHandler.
		 */
		attach: function(element){
			// For most browsers, it is enough to listen to the keydown event
			// only.
			element.addEvent('keydown', onKeyDown.bind(this));
			
			// Some browsers instead, don't cancel key events in the keydown, but in the
			// keypress. So we must do a longer trip in those cases.
			if (local.browser.opera || (local.browser.firefox && local.browser.Platform.mac)) element.addEvent('keypress', onKeyPress.bind(this));
		}

	});

	local.Editor.plugins.implement('keystrokes', function(editor){
		/**
		 * Controls keystrokes typing in this editor instance.
		 */
		editor.keystrokeHandler = new local.Editor.keystrokeHandler(editor);
		
		editor.specialKeys = {};

		var keystrokesConfig = editor.config.keystrokes;
		
		var keystrokes = editor.keystrokeHandler.keystrokes;
		
		for (var i = 0, l = keystrokesConfig.length; i < l; i++) 
			keystrokes[keystrokesConfig[i][0]] = keystrokesConfig[i][1];
	});

})(Klass);


/**
 * A list associating keystrokes to editor commands. Each element in the list
 * is an array where the first item is the keystroke, and the second is the
 * name of the command to be executed.
 * @type Array
 */
CKEDITOR.config.keystrokes = [

	[CKEDITOR.ALT + 121 /*F10*/, 'toolbarFocus'], 
	[CKEDITOR.ALT + 122 /*F11*/, 'elementsPathFocus'], 
	[CKEDITOR.SHIFT + 121 /*F10*/, 'contextMenu'], 
	[CKEDITOR.CTRL + CKEDITOR.SHIFT + 121 /*F10*/, 'contextMenu'], 
	[CKEDITOR.CTRL + 90 /*Z*/, 'undo'], 
	[CKEDITOR.CTRL + 89 /*Y*/, 'redo'], 
	[CKEDITOR.CTRL + CKEDITOR.SHIFT + 90 /*Z*/, 'redo'], 
	[CKEDITOR.CTRL + 76 /*L*/, 'link'], 
	[CKEDITOR.CTRL + 66 /*B*/, 'bold'], 
	[CKEDITOR.CTRL + 73 /*I*/, 'italic'], 
	[CKEDITOR.CTRL + 85 /*U*/, 'underline'], 
	[CKEDITOR.ALT + 109 /*-*/, 'toolbarCollapse'], 
	[CKEDITOR.ALT + 48 /*0*/, 'a11yHelp']
	
];
