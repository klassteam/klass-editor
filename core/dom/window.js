Klass.DOM.window = function(window){
	if (window && window[0] == window) return window;
	if (window.document){
		this[0] = window;
		this.uid = Klass.uidOf(window);
	} else return window;
};

Klass.DOM.window.prototype = new Klass.DOM;

Klass.DOM.window.implement({

	getWindow: function(){
		return this[0];
	},

	getDocument: function(){
		return this[0].document;
	},

	focus: function(){
		if (Klass.env.webkit && this[0].parent)
			this[0].parent.focus();
		this[0].focus();
	}

});