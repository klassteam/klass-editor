
(function($E){

	/**
	 * Class used to write HTML data.
	 * @constructor
	 * @example
	 * var writer = new Klass.Editor.htmlWriter();
	 * writer.openTag( 'p' );
	 * writer.attribute( 'class', 'MyClass' );
	 * writer.openTagClose( 'p' );
	 * writer.text( 'Hello' );
	 * writer.closeTag( 'p' );
	 * alert( writer.getHtml() );  "&lt;p class="MyClass"&gt;Hello&lt;/p&gt;"
	 */
	$E.htmlWriter = new Class({
		
		Extends: $E.htmlParser.basicWriter,
		
		initialize: function(){
			// Call the parent contructor.
			this.parent();
			
			/**
			 * The characters to be used for each identation step.
			 * @type String
			 * @default "\t" (tab)
			 * @example
			 * // Use two spaces for indentation.
			 * editorInstance.dataProcessor.writer.indentationChars = '  ';
			 */
			this.indentationChars = '\t';
			
			/**
			 * The characters to be used to close "self-closing" elements, like "br" or
			 * "img".
			 * @type String
			 * @default " /&gt;"
			 * @example
			 * // Use HTML4 notation for self-closing elements.
			 * editorInstance.dataProcessor.writer.selfClosingEnd = '>';
			 */
			this.selfClosingEnd = ' />';
			
			/**
			 * The characters to be used for line breaks.
			 * @type String
			 * @default "\n" (LF)
			 * @example
			 * // Use CRLF for line breaks.
			 * editorInstance.dataProcessor.writer.lineBreakChars = '\r\n';
			 */
			this.lineBreakChars = '\n';
			
			this.forceSimpleAmpersand = 0;
			
			this.sortAttributes = 1;
			
			this.indent = 0;
			this.indents = '';
			// Indicate preformatted block context status. (#5789)
			this.inPre = 0;
			this.rules = {};
			
			var dtd = $E.dtd;
			for (var e in Object.merge({}, dtd.$nonBodyContent, dtd.$block, dtd.$listItem, dtd.$tableContent)){
				this.setRules(e, {
					indent: 1,
					breakBeforeOpen: 1,
					breakAfterOpen: 1,
					breakBeforeClose: 1,
					breakAfterClose: 1
				});
			}
			
			this.setRules('br', {
				breakAfterOpen: 1
			});
			
			this.setRules('title', {
				indent: 0,
				breakAfterOpen: 0
			});
			
			this.setRules('style', {
				indent: 0,
				breakBeforeClose: 1
			});
			
			// Disable indentation on <pre>.
			this.setRules('pre', {
				indent: 0
			});
		},
		
		/**
		 * Writes the tag opening part for a opener tag.
		 * @param {String} tagName The element name for this tag.
		 * @param {Object} attributes The attributes defined for this tag. The
		 *		attributes could be used to inspect the tag.
		 * @example
		 */
		openTag: function(tagName, attributes){
			var rules = this.rules[tagName];
			
			if (this.indent) this.indentation();
			// Do not break if indenting.
			else if (rules && rules.breakBeforeOpen){
				this.lineBreak();
				this.indentation();
			}
			
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
			var rules = this.rules[tagName];
			
			if (!isSelfClose){
				this.output.push('>');
				if (rules && rules.indent) this.indents += this.indentationChars;
			} else this.output.push(this.selfClosingEnd);
			
			if (rules && rules.breakAfterOpen) this.lineBreak();
			tagName === 'pre' && (this.inPre = 1);
		},
			
		/**
		 * Writes an attribute. This function should be called after opening the
		 * tag with {@link openTagClose}.
		 * @param {String} name The attribute name.
		 * @param {String} value The attribute value.
		 * @example
		 * // Writes ' class="MyClass"'.
		 * writer.attribute( 'class', 'MyClass' );
		 */
		attribute: function(name, value){
			if (typeof attValue == 'string'){
				this.forceSimpleAmpersand && (value = value.replace(/&amp;/g, '&'));
				// Browsers don't always escape special character in attribute values. (#4683, #4719).
				value = $E.utils.escapeHTML(value);
			}
			
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
			var rules = this.rules[tagName];
			
			if (rules && rules.indent) this.indents = this.indents.substr(this.indentationChars.length);
			
			if (this.indent) this.indentation();
			// Do not break if indenting.
			else if (rules && rules.breakBeforeClose){
				this.lineBreak();
				this.indentation();
			}
			
			this.output.push('</', tagName, '>');
			tagName == 'pre' && (this.inPre = 0);
			
			if (rules && rules.breakAfterClose) this.lineBreak();
		},
			
		/**
		 * Writes text.
		 * @param {String} text The text value
		 * @example
		 * // Writes "Hello Word".
		 * writer.text( 'Hello Word' );
		 */
		text: function(text){
			if (this.indent){
				this.indentation();
				!this.inPre && (text = text.ltrim());
			}
			
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
			if (this.indent) this.indentation();
			
			this.output.push('<!--', comment, '-->');
		},
			
		/**
		 * Writes a line break. It uses the {@link #lineBreakChars} property for it.
		 * @example
		 * // Writes "\n" (e.g.).
		 * writer.lineBreak();
		 */
		lineBreak: function(){
			if (!this.inPre && this.output.length > 0) this.output.push(this.lineBreakChars);
			this.indent = 1;
		},
			
		/**
		 * Writes the current indentation chars. It uses the
		 * {@link #indentationChars} property, repeating it for the current
		 * indentation steps.
		 * @example
		 * // Writes "\t" (e.g.).
		 * writer.indentation();
		 */
		indentation: function(){
			if (!this.inPre) this.output.push(this.indents);
			this.indent = 0;
		},
			
		/**
		 * Sets formatting rules for a give element. The possible rules are:
		 * <ul>
		 *	<li><b>indent</b>: indent the element contents.</li>
		 *	<li><b>breakBeforeOpen</b>: break line before the opener tag for this element.</li>
		 *	<li><b>breakAfterOpen</b>: break line after the opener tag for this element.</li>
		 *	<li><b>breakBeforeClose</b>: break line before the closer tag for this element.</li>
		 *	<li><b>breakAfterClose</b>: break line after the closer tag for this element.</li>
		 * </ul>
		 *
		 * All rules default to "false". Each call to the function overrides
		 * already present rules, leaving the undefined untouched.
		 *
		 * By default, all elements available in the {@link Klass.Editor.dtd.$block},
		 * {@link Klass.Editor.dtd.$listItem} and {@link Klass.Editor.dtd.$tableContent}
		 * lists have all the above rules set to "true". Additionaly, the "br"
		 * element has the "breakAfterOpen" set to "true".
		 * @param {String} tagName The element name to which set the rules.
		 * @param {Object} rules An object containing the element rules.
		 * @example
		 * // Break line before and after "img" tags.
		 * writer.setRules( 'img',
		 *     {
		 *         breakBeforeOpen : true
		 *         breakAfterOpen : true
		 *     });
		 * @example
		 * // Reset the rules for the "h1" tag.
		 * writer.setRules( 'h1', {} );
		 */
		setRules: function(tagName, rules){
			var currentRules = this.rules[tagName];
			currentRules ? Object.append(currentRules, rules) : this.rules[tagName] = rules;
		}

	});

})(Klass.Editor);