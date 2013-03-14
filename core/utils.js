/**
 * @fileOverview Defines the {@link Klass.Editor.utils} object, which contains utility functions.
 */

(function(window, local){

	var document = window.document;

	var functions = [];

	/**
	 * Utility functions.
	 * @namespace
	 */
	local.Editor.utils = {

		/**
		 * Gets a unique number for this editor execution session. It returns
		 * progressive numbers starting at 1.
		 * @function
		 * @returns {Number} A unique number.
		 */
		unique: (function(){
			var uid = 0;
			return function(){
				return ++uid;
			};
		})(),

		isCustomDomain: function(){
			var domain = document.domain;
			var hostname = window.location.hostname;
			return local.env.ie && domain != hostname && domain != ('[' + hostname + ']'); // IPv6 IP support
		},
		
		/**
		 * TODO 待完善
		 */
		initIFrameDocument: function(iframe, contents){
			if ( !iframe ) return document;
			iframe = iframe[0] || iframe;
			var win = iframe.contentWindow || iframe.contentDocument;
			var doc = win.document;

			if ( contents ){
				doc.open();
				doc.write(contents);
				doc.close();
			}

			return new Klass.DOM.document(doc);
		},

		/**
		 * Build the HTML snippet of a set of &lt;style>/&lt;link>.
		 * @param styles {String|Array} Each of which are url (absolute) of a CSS file or
		 * a trunk of style text.
		 */
		buildStyleHtml: function(styles){
			styles = [].concat(styles);
			var style, result = [];
			for (var i = 0, l = styles.length; i < l; i++){
				style = styles[i];
				// Is CSS style text ?
				if (/@import|[{}]/.test(style)) result.push('<style>' + style + '</style>');
				else result.push('<link type="text/css" rel="stylesheet" href="' + style + '">');
			}
			return result.join('');
		},

		/**
		 * Replace special HTML characters in a string with their relative HTML
		 * entity values.
		 * @param {String} text The string to be encoded.
		 * @returns {String} The encode string.
		 */
		htmlEncode: function(text){
			var standard = function(text){
				var span = new local.DOM.createElement('span');
				return span.text(text).html();
			};
			
			var fix1 = (standard('\n').toLowerCase() == '<br>') ? function(text){
				// IE and Safari encode line-break into <br>
				return standard(text).replace(/<br>/gi, '\n');
			} : standard;
			
			var fix2 = (standard('>') == '>') ? function(text){
				// WebKit does't encode the ">" character, which makes sense, but
				// it's different than other browsers.
				return fix1(text).replace(/>/g, '&gt;');
			} : fix1;
			
			var fix3 = (standard('  ') == '&nbsp; ') ? function(text){
				// IE8 changes spaces (>= 2) to &nbsp;
				return fix2(text).replace(/&nbsp;/g, ' ');
			} : fix2;
			
			this.htmlEncode = fix3;
			
			return this.htmlEncode(text);
		},

		/**
		 * Replace special HTML characters in HTMLElement's attribute with their relative HTML entity values.
		 * @param {String} The attribute's value to be encoded.
		 * @returns {String} The encode value.
		 */
		escapeHTML: function(text){
			return text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		},

		/**
		 * Whether the object contains no properties of it's own.
 		 * @param object
		 */
		isEmpty: function(object){
			for (var i in object) if (object.hasOwnProperty(i)) return false;
			return true;
		},		

		/**
		 * Creates a function reference that can be called later using
		 * Klass.Editor.utils.callFunction. This approach is specially useful to
		 * make DOM attribute function calls to JavaScript defined functions.
		 * @param {Function} fn The function to be executed on call.
		 * @param {Object} [bind] The object to have the context on "fn" execution.
		 * @returns {Number} A unique reference to be used in conjuction with
		 *		Klass.Editor.utils.callFunction.
		 */
		addFunction: function(fn, bind){
			return functions.push(function(){
				return fn.apply(bind || this, arguments);
			}) - 1;
		},

		/**
		 * Removes the function reference created with {@see Klass.Editor.utils.addFunction}.
		 * @param {Number} fn The function reference created with
		 *		Klass.Editor.utils.addFunction.
		 */
		removeFunction: function(fn){
			functions[fn] = null;
		},

		/**
		 * Executes a function based on the reference created with
		 * Klass.Editor.utils.addFunction.
		 * @param {Number} fn The function reference created with
		 *		Klass.Editor.utils.addFunction.
		 * @param {[Any,[Any,...]} params Any number of parameters to be passed
		 *		to the executed function.
		 * @returns {Any} The return value of the function.
		 */
		callFunction: function(fn){
			fn = functions[fn];
			return fn && fn.apply(window, Array.prototype.slice.call(arguments, 1));
		},

		/**
		 * Compare the elements of two arrays.
		 * @param {Array} original An array to be compared.
		 * @param {Array} reference The other array to be compared.
		 * @returns {Boolean} "true" is the arrays have the same lenght and
		 *		their elements match.
		 */
		arrayCompare: function(original, reference){
			if (!original && !reference) return true;
			if (!original || !reference || original.length !== reference.length) return false;
			if (original && original.compare && reference) return original.compare(reference);
			return false;
		},

		/**
		 * Creates a deep copy of an object.
		 * Attention: there is no support for recursive references.
		 * @param {Object} object The object to be cloned.
		 * @returns {Object} The object clone.
		 */
		clone: function(object){
			var clone;
			
			// Array.
			if (object && (object instanceof Array)){
				clone = [];
				
				for (var i = 0, l = object.length; i < l; i++) 
					clone[i] = this.clone(object[i]);
				
				return clone;
			}
			
			// "Static" types.
			if (object === null || (typeof(object) !== 'object') || (object instanceof String) || 
				(object instanceof Number) || (object instanceof Boolean) || 
				(object instanceof Date) || (object instanceof RegExp)) return object;
			
			// Objects.
			clone = new object.constructor();
			
			for (var key in object){
				var property = object[key];
				clone[key] = this.clone(property);
			}
			
			return clone;
		},

		/**
		 * Convert the specified CSS length value to the calculated pixel length inside this page.
		 * <strong>Note:</strong> Percentage based value is left intact.
		 * @param {String} length CSS length value.
		 */
		convertToPx: (function(){
			var calculator;
	
			return function(length){
				if (!calculator){
					var document = local.Editor.document;
					calculator = local.DOM.create('<div style="position:absolute;left:-9999px;top:-9999px;margin:0px;padding:0px;border:0px;"></div>', document);
					document.body().append(calculator);
				}
				
				if (!(/%$/).test(length)){
					calculator.style('width', length);
					return calculator[0].clientWidth;
				}
				
				return length;
			};
		})(),

		isURL: (function(){
			var urlRegex = /^((?:http|https|ftp|news):\/\/)?(.*)$/;

			return function(str){
				return str && urlRegex.test(str);
			};
		})()

	};

})(window, Klass);

Array.implement({

	compare: function(array){
		if (!array.length) return false;
		for (var i = 0, l = array.length; i < l; i++){
			if (this[i] != array[i]) return false;
		}
		return true;
	}

});

String.implement({

	ltrim: function(){
		return this.replace(/^[ \t\n\r]+/g, '');
	},

	rtrim: function(){
		return this.replace(/[ \t\n\r]+$/g, '');
	}

});