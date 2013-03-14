/**
 * @file Paste as plain text plugin
 */
(function(window, $E){

	var pluginName = 'pastetext';

	// The pastetext command.
	var pasteTextCommand =  function(editor){
		var clipboardText = Function.attempt(function(){
			var clipboardText = window.clipboardData.getData('Text');
			if (!clipboardText) throw 0;
			return clipboardText;
		});

		var forcePasteUseDialog = editor.config.forcePasteUseDialog;

		// Clipboard access privilege is not granted.
		if ((forcePasteUseDialog && forcePasteUseDialog.cantains(pluginName)) || !clipboardText){
			editor.openDialog(pluginName);
			return false;
		}

		editor.fireEvent('paste', {
			'text': clipboardText
		});
		
		return true;
	};

	// Register the plugin.
	$E.plugins.implement(pluginName, function(editor){

		var command = editor.addCommand(pluginName, {
			execute: pasteTextCommand,
			label: editor.lang.pasteText
		});
		
		//CKEDITOR.dialog.add(commandName, $E.getUrl(this.path + 'dialogs/pastetext.js'));
		
		if (editor.config.forcePasteAsPlainText){
			// Intercept the default pasting process.
			editor.addEvent('beforeCommandExec', function(evt){
				var mode = evt.commandData;
				// Do NOT overwrite if HTML format is explicitly requested.
				if (evt.name === 'paste' && mode !== 'html') editor.execCommand(pluginName);
			});
			
			editor.addEvent('beforePaste', function(data){
				data.mode = 'text';
			});
		}
		
		editor.addEvent('pasteState', function(state){
			editor.getCommand(pluginName).set(state);
		});

	});
	
})(window, Klass.Editor);


/**
 * Whether to force all pasting operations to insert on plain text into the
 * editor, loosing any formatting information possibly available in the source
 * text.
 * <strong>Note:</strong> paste from word is not affected by this configuration.
 * @name CKEDITOR.config.forcePasteAsPlainText
 * @type Boolean
 * @default false
 * @example
 * config.forcePasteAsPlainText = true;
 */