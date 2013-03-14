Klass.Editor.ui.tip = new Class({

	Extends: Klass.Editor.ui.component,

	options: {/**
		onTimeout: function(){},*/
		duration: 500,
		
	
	},

	initialize: function(element, options){
		var params = Array.link(arguments, {
			element: function(obj){
				return typeof obj === 'string' || obj.nodeType || obj[0].nodeType;
			},
			options: Klass.isObject
		})
		this.setOptions(params.options || {});
		this.container = document.node(this.options.container || document.body);
		if (params.element) this.element = document.node(params.element);
		this.render();
	},

	render: function(){
		if (!this.element) this.element = new Klass.DOM.createElement('div', {
			'class': 'kse-tip'
		}).append(this.container);

		this.element.hide();
		this.hidden = true;

		this.fireEvent('render');
	},

	timeout: function(){
		this.fireEvent('timeout');
	},

	toggle: function(text, type){
		var duration = this.options.duration;
		if (duration){
			//this.timer = this.timeout.delay(duration, this);
		}
		this.element.html(text);
		if (type) this.element.addClass('kse-' + type);
		this.show();
	},

	show: function(){
		if (!this.hidden) return this;
		this.fireEvent('beforeShow');
		this.element.show();
		this.fireEvent('show');
		this.hidden = false;
		return this;
	},

	hide: function(){
		if (this.hidden) return this;
		if (this.timer) delete this.timer;
		this.fireEvent('beforeHide');
		this.element.hide();
		this.fireEvent('hide');
		this.hidden = true;
		return this;
	}

});