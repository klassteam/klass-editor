
Klass.editor.ui.tripleButton = new Class({

	initialize: function(element, options){
		this.element = Klass(element);
	},

	addClass: function(className, element){
		element = element || this.element;
		element.addClass(className);
		return this;
	},

	removeClass: function(className, element){
		element = element || this.element;
		element.removeClass(className);
		return this;
	},

	setDisabled : function(disabled){
		return this[disabled ? 'disable' : 'enable']();
	},

	enable: function(){
		this.element.removeClass(this.options.disabledClass);
		this.disabled = false;
		this.fireEvent('enable');
		return this;
	},

	disable: function(){
		this.element.addClass(this.options.disabledClass);
		this.disabled = true;
		this.fireEvent('disable');
		return this;			
	},

	active: function(){

	},

	mouseout: function(){

	},

	mouseover: function(){

	},

	add: function(){

	},

	remove: function(){

	},

	updateState: function(){

	}

});