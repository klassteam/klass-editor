(function($E){

	/**
	 * A lightweight representation of HTML text.
	 * @constructor
	 * @example
	 */
	$E.htmlParser.cdata = new Class({
		
		initialize: function(value){
			/**
			 * The CDATA value.
			 * @type String
			 */
			this.value = value;

			/**
			 * CDATA has the same type as {@link Klass.Editor.htmlParser.text} This is
			 * a constant value set to {@link Klass.Editor.constants.NODE_TEXT}.
			 * @type Number
			 */
			this.type = $E.$['NODE_TEXT'];

			/**
			 * Indicate the node type.
			 * @type Boolean
			 */
			this.$text = 1;
		},
		
		/**
		 * Writes write the CDATA with no special manipulations.
		 * @param {Klass.Editor.htmlWriter} writer The writer to which write the HTML.
		 */
		writeHtml: function(writer){
			writer.write(this.value);
		}

	});

})(Klass.Editor);