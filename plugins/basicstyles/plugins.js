// Basic Inline Styles.
(function($E){

	$E.plugins.implement('basicstyles', function(editor){
		var items = ['bold', 'italic', 'underline', 'strike', 'subscript', 'superscript'];

		var addButtonCommand = function(item, options){
			var style = new $E.style(options);

			var styleCommand = editor.addCommand(item, new $E.styleCommand(style));

			editor.attachStyleStateChange(style, function(state){
				styleCommand.set(state);
			});
		};

		items.each(function(item){
			addButtonCommand(item, editor.config.basicstyles[item]);
		});
	});
	

	$E.config.basicstyles = {

		/**
		 * The style definition to be used to apply the bold style in the text.
		 * @type Object
		 */
		bold: {element: 'strong', overrides: 'b', shortcut: 'b'},

		/**
		 * The style definition to be used to apply the italic style in the text.
		 * @type Object
		 */
		italic: {element: 'em', overrides: 'i', shortcut: 'i'},

		/**
		 * The style definition to be used to apply the underline style in the text.
		 * @type Object
		 */
		underline: {element: 'u', shortcut: 'u'},

		/**
		 * The style definition to be used to apply the strike style in the text.
		 * @type Object
		 */
		strike: {element: 'strike', shortcut: 'd'},

		/**
		 * The style definition to be used to apply the subscript style in the text.
		 * @type Object
		 */
		subscript: {element: 'sub', removed:'sup', shortcut: 'alt+='},

		/**
		 * The style definition to be used to apply the superscript style in the text.
		 * @type Object
		 */
		superscript: {element: 'sup', removed:'sub', shortcut: 'alt+shift++'}

	};

})(Klass.Editor);