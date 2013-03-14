
Klass.Editor.ui.component = new Class({

	Implements: [Class.Events, Class.Options],

	options: {
		/*
		onEnable: function(){},
		onDisable: function(){},

		onClick: function(){},

		onShow: function(){},
		onHide: function(){},
		onRender: function(){},
		onDestroy: function(){},

		onBeforeShow: function(){},
		onBeforeHide: function(){},
		onBeforeRender: function(){},
		onBeforeDestroy: function(){}
		*/
	},

	initialize: function(editor, options){
		this.setOptions(options);

		this.editor = editor;
		this.prefixCls = editor.prefixCls;

		this.markup = this.options.markup || editor.markup;
		delete this.options.markup;

		this.container = document.node(this.options.container || Klass.Editor.document.body());
		delete this.options.container;

		if (this.options.className){
			this.wrapClass = this.prefixCls + this.options.className + '-panel';
			delete this.options.className;
		}

		this.items = {};
	},

	/**
	 * Gets the root DOM element of the UI component.
	 * @returns {Klass.DOM.element} The &lt;span&gt; element containing this UI component.
	 * @example
	 * var dialogElement = dialogObj.toElement().first();
	 * dialogElement.style('padding', '5px');
	 */
	toElement: function(){
		return this.element;
	},

	getElement: function(selector, first){
		var element = this.toElement();
		return selector ? element.find(selector, first || 1) : element;
	}

});

Klass.Editor.ui.instances = {};