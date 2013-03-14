
/**
 * A lightweight representation of an HTML comment.
 * @constructor
 * @example
 */
Klass.Editor.htmlParser.comment = new Class({
	
	initialize: function(value){
		/**
		 * The comment text.
		 * @type String
		 */
		this.value = value;

		/**
		 * The node type. This is a constant value set to {@link Klass.Editor.constants.NODE_COMMENT}.
		 * @type Number
		 */
		this.type = Klass.Editor.$['NODE_COMMENT'];

		/**
		 * Indicate the node type.
		 * @type Boolean
		 */
		this.$comment = 1;
		
		/** @private */
		this.isBlockLike = false;
	},
	
	/**
	 * Writes the HTML representation of this comment to a Klass.Editor.htmlWriter.
	 * @param {Klass.Editor.htmlWriter} writer The writer to which write the HTML.
	 * @example
	 */
	writeHtml: function(writer, filter){
		var comment = this.value;
		
		if (filter){
			if (!(comment = filter.onComment(comment, this))) return;
			
			if (typeof comment !== 'string'){
				comment.parent = this.parent;
				comment.writeHtml(writer, filter);
				return;
			}
		}
		
		writer.comment(comment);
	}

});