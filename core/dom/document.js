Klass.DOM.document = function(document){
	if (document && document.$document) return document;
	this.window = document.parentWindow || document.defaultView;
	this.$document = true;
	this[0] = document;
	this.uid = Klass.uidOf(document);
	if (!document.html || document.html !== document.documentElement) document.html = document.documentElement;
	if (!document.head) document.head = document.getElementsByTagName('head')[0];
};

Klass.DOM.document.prototype = new Klass.DOM;

Klass.DOM.document.implement({

	getWindow: function(){
		return new Klass.DOM.window(this.window);
	},

	getDocument: function(){
		return this[0];
	},

	html: function(){
		return this.createElement(this[0].html);
	},

	body: function(){
		return this.createElement(this[0].body);
	},

	head: function(){
		return this.createElement(this[0].head);
	},

	createText: function(text, context){
		return new Klass.DOM.text(text, context || this);
	},

	createElement: function(tag, props, context){
		return new Klass.DOM.element(tag, props, context || this);
	},

	getElementByAddress: function(address, normalized){
		var element = this[0].html;

		for (var i = 0, l = address.length; element && i < l; i++){
			var target = address[i];
			
			if (!normalized){
				element = element.childNodes[target];
				continue;
			}
			
			var currentIndex = -1;
			
			for (var j = 0, k = element.childNodes.length; j < k; j++){
				var candidate = element.childNodes[j];
				
				if (normalized === true && candidate.nodeType === 3 && candidate.previousSibling && 
					candidate.previousSibling.nodeType === 3) continue;
				
				currentIndex++;
				
				if (currentIndex == target){
					element = candidate;
					break;
				}
			}
		}
		
		return element ? document.node(element) : null;
	},

	get: function(id){
		var element = this[0].getElementById(id);
		return element ? new Klass.DOM.element(element) : null;
	},

	createStyleSheet: function(url){
		if (!this[0].createStyleSheet){
			var link = this.createElement('link', {
				href: url,
				type: 'text/css',
				rel: 'stylesheet'
			});
			this.head().append(link);
		} else this[0].createStyleSheet(url);
	},

	createStyleText: function(text){
		if (!this[0].createStyleSheet){
			var style = this.createElement('style').append(this.createText(text));
			this.head().append(style);
		} else {
			var styleSheet = this[0].createStyleSheet('');
			styleSheet.cssText = text;
		}
	},

	focus: function(){
		this.getWindow().focus();
	},

	write: function(html){
		// Don't leave any history log in IE. (#5657)
		this[0].open('text/html', 'replace');

		// Support for custom document.domain in IE.
		Klass.Editor.utils.isCustomDomain() && (this[0].domain = document.domain);

		this[0].write(html);
		this[0].close();
	}

});