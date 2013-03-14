(function($E){

	var spacesRegex = /[\t\r\n ]{2,}|[\t\r\n]/g;
	
	/**
	 * A lightweight representation of HTML text.
	 * @constructor
	 * @example
	 */
	$E.htmlParser.text = new Class({
		
		initialize: function(value){
			/**
			 * The text value.
			 * @type String
			 */
			this.value = value;

			/**
			 * The node type. This is a constant value set to {@link Klass.Editor.constant.NODE_TEXT}.
			 * @type Number
			 */
			this.type = $E.$['NODE_TEXT'];

			/**
			 * Indicate the node type.
			 * @type Boolean
			 */
			this.$text = 1;
			
			/** @private */
			this.isBlockLike = false;
		},
		
		/**
		 * Writes the HTML representation of this text to a Klass.Editor.htmlWriter.
		 * @param {Klass.Editor.htmlWriter} writer The writer to which write the HTML.
		 * @example
		 */
		writeHtml: function(writer, filter){
			var text = this.value;
			
			if (filter && !(text = filter.onText(text, this))) return;
			
			writer.text(text);
		}

	});

})(Klass.Editor);