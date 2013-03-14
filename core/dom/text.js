Klass.DOM.text = function(text, context){
	if (text && text.$text) return text;
	context = (context && context[0]) || document;
	if (typeof text === 'string'){
		text = context.createTextNode(text);
	}
	this[0] = text;
	this.$text = true;
	this.type = this.nodeType('text');
},

Klass.DOM.text.prototype = new Klass.DOM.node;

Klass.DOM.text.implement({

	text: function(text){
		if (text === undefined) return this[0].nodeValue;
		this[0].nodeValue = text;
	},

	length: function(){
		return this[0].nodeValue.length;
	},

	split: function(offset){
		var document = this.getDocument(), result;
		if (Klass.env.ie && offset == this.length()){
			return document.createText('').injectAfter(this);
		}

		result = new Klass.DOM.text(this[0].splitText(offset, document));

		if (Klass.env.mode){
			var workaround = new Klass.DOM.text('', document);
			workaround.injectAfter(result).dispose();
		}

		return result;
	},

	substring: function(index, length){
		var nodeValue = this.text();
		return (typeof length !== 'number') ? nodeValue.substr(index) : nodeValue.substring(index, length);
	}

});