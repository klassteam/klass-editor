(function(document, local){

	local.DOM.fragment = function(context){
		context = (context && context[0]) || document;
		this[0] = context.createDocumentFragment();
		this.type = this.nodeType('DOCUMENT_FRAGMENT');
		this.$fragment = true;
	};

	local.DOM.fragment.prototype = new local.DOM;

	local.DOM.fragment.prototype.insertAfterNode = function(node){
		node = node[0];
		node.parentNode.insertBefore(this[0], node.nextSibling);
	};

	var properties = {
		'append': 1,
		'appendTo': 1,
		'appendBogus': 1,
		'moveChildren': 1,
		'first': 1,
		'last': 1,
		'inject': 1,
		'injectBefore': 1,
		'replaces': 1,
		'trim': 1,
		'ltrim': 1,
		'rtrim': 1,
		'getDocument': 1,
		'child': 1,
		'children': 1,
		'length': 1
	};

	var implements1 = function(){
		if (!properties) return;
		var object = local.DOM.fragment;
		var proto = local.DOM.element.prototype;
		for (var property in properties){
			if (property in proto)
				object.implement(property, proto[property]);
		}
	};

	implements1();

})(document, Klass);