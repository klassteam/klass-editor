
Klass.Editor.htmlParser.basicWriter = new Class({

	initialize: function(){
		this.output = [];
	},
	
	/**
	 * Writes the tag opening part for a opener tag.
	 * @param {String} tagName The element name for this tag.
	 * @param {Object} attributes The attributes defined for this tag. The
	 *		attributes could be used to inspect the tag.
	 * @example
	 */
	openTag: function(tagName, attributes){
		this.output.push('<', tagName);
	},
		
	/**
	 * Writes the tag closing part for a opener tag.
	 * @param {String} tagName The element name for this tag.
	 * @param {Boolean} isSelfClose Indicates that this is a self-closing tag,
	 *		like "br" or "img".
	 * @example
	 * // Writes "&gt;".
	 * writer.openTagClose( 'p', false );
	 * @example
	 * // Writes " /&gt;".
	 * writer.openTagClose( 'br', true );
	 */
	openTagClose: function(tagName, isSelfClose){
		this.output.push(isSelfClose ? ' />' : '>');
	},
		
	/**
	 * Writes an attribute. This function should be called after opening the
	 * tag with.
	 * @param {String} name The attribute name.
	 * @param {String} value The attribute value.
	 * @example
	 * // Writes ' class="MyClass"'.
	 * writer.attribute( 'class', 'MyClass' );
	 */
	attribute: function(name, value){
		// Browsers don't always escape special character in attribute values.
		if (typeof value === 'string') value = Klass.Editor.utils.escapeHTML(value);
		
		this.output.push(' ', name, '="', value, '"');
	},
		
	/**
	 * Writes a closer tag.
	 * @param {String} tagName The element name for this tag.
	 * @example
	 * // Writes "&lt;/p&gt;".
	 * writer.closeTag( 'p' );
	 */
	closeTag: function(tagName){
		this.output.push('</', tagName, '>');
	},
		
	/**
	 * Writes text.
	 * @param {String} text The text value
	 * @example
	 * // Writes "Hello Word".
	 * writer.text( 'Hello Word' );
	 */
	text: function(text){
		this.output.push(text);
	},
		
	/**
	 * Writes a comment.
	 * @param {String} comment The comment text.
	 * @example
	 * // Writes "&lt;!-- My comment --&gt;".
	 * writer.comment( ' My comment ' );
	 */
	comment: function(comment){
		this.output.push('<!--', comment, '-->');
	},
		
	/**
	 * Writes any kind of data to the ouput.
	 * @example
	 * writer.write( 'This is an &lt;b&gt;example&lt;/b&gt;.' );
	 */
	write: function(data){
		this.output.push(data);
	},
		
	/**
	 * Empties the current output buffer.
	 * @example
	 * writer.reset();
	 */
	reset: function(){
		this.output = [];
		this.indent = false;
	},
		
	/**
	 * Empties the current output buffer.
	 * @param {Boolean} reset Indicates that the {@link reset} function is to
	 *		be automatically called after retrieving the HTML.
	 * @returns {String} The HTML written to the writer so far.
	 * @example
	 * var html = writer.getHtml();
	 */
	getHtml: function(reset){
		var html = this.output.join('');

		if (reset) this.reset();
		
		return html;
	}

});