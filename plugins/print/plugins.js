
Klass.Editor.plugins.implement({

	print: function(editor){

		var env = Klass.env;

		var execute = function(){
			if (env.opera)
				return;
			else if (env.firefox)
				editor.window[0].print();
			else
				editor.document[0].execCommand('print');
		};

		editor.addCommand('print', {
			execute: execute,
			canUndo: false,
			shortcut: 'p',
			modes: {wysiwyg: !(env.opera)}
		});

	}

});