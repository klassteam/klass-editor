Klass.DOM = function(selector){
	if (selector) this[0] = selector;
};

Klass.DOM.prototype = {

	equals: function(object){
		return object && object[0] === this[0];
	},

	nodeType: function(type){
		var nodeType = ('node_' + type).toUpperCase();
		return Klass.Editor.constants[nodeType];
	}

};

Klass.DOM.extend({

	create: function(selector, context){
		var element = new Klass.DOM.element('div', null, context);
		return element.html(selector).first().dispose();
	},

	createElement: function(selector, props, context){
		return new Klass.DOM.element(selector, props, context);
	}

});


Object.append(document, {

	get: function(selector){
		if (typeof selector === 'string'){
			selector = this.getElementById(selector);
			return this.node(selector);
		}
	}, 

	node: function(node){
		if (node == null) return null;
		if (node.$type || !node.nodeName) return node;
		return new Klass.DOM.node(node);
	}

});