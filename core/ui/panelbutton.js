/**
 * @Panel Button
 * @constructor
 */

Klass.Editor.ui.panelButton = new Class({

	Extends: Klass.Editor.ui.component,
	
	initialize: function(editor, options){
		this.parent(editor, options);
		Object.merge(this, this.options);

		this.collapsed = true;

		this.modes = {wysiwyg: 1};

		this.bound = {
			click: function(event){
				event.stop();
				this.state !== Klass.Editor.$['TRISTATE_DISABLED'] && this.toggleCollapse();
			}.bind(this),
			mouseover: function(evt){
				if (!this.editor.ui.mixComponent) return;
				evt.stop();
				this.expand();
			}.bind(this)
		};

		this.render();
	},

	getPanel: function(){
		var floatPanel = this.container.retrieve('kse-floatpanel', null);
		if (!floatPanel) {
			floatPanel = new Klass.Editor.ui.panel(this.editor);
			this.container.store('kse-floatpanel', floatPanel);
		}
		floatPanel.addEvent('collapse', this.collapse.bind(this));
		this.panel = floatPanel;
		this.wrap = this.panel.element.first();
		return floatPanel;
	},

	initList: function(){
		if (this.list) return;

		var markup = this.editor.markup.palette;

		var lang = this.editor.lang.color;

		var listItems = this.listItems = {};

		var panel = this.getPanel();
		this.list = panel.element;

		var block = panel.addBlock(this.name, this.build());

		var elements = block.find('a');
		for (var i = 0, l = elements.length; i < l; i++){
			var element = elements[i], color = element.getProperty('kse-color') || '';
			if (color){
				element.removeProperty('kse-color');
				listItems[color] = element;
				this.addHandler(element, color);
			}
			element.addEvent('click', function(value){
				this.fireEvent('click', value);
				this.collapse();
			}.pass(color, this));
		}
	},

	render: function(){
		var html = ((typeof this.markup === 'string') ? this.markup : 
			this.markup.panelButton).substitute({label: this.label});

		var element = this.element = new Klass.DOM.element('span', {
			'class': this.prefixCls + 'button',
			title: this.title,
			html: html,
			styles: {
				position: 'relative'
			},
			events: this.bound
		});

		element.first().addClass(this.prefixCls + this.iconCls);

		this.editor.addEvent('mode', this.updateState.bind(this));
		// If this combo is sensitive to readOnly state, update it accordingly.
		!this.readOnly && this.editor.addEvent('readOnly', this.updateState.bind(this));

		this.fireEvent('render');
	},

	collapseCurrentList: function(){
		var currentList = this.container.retrieve('kse-richcombo', null);
		if (currentList && currentList !== this.list) currentList.collapse();
		this.container.store('kse-richcombo', this);
		return this;
	},
	
	show: function(){
		this.list.show();
		this.panel.position(this.element);
		this.panel.showBlock(this.name);
		this.panel.document.html().style('overflow', 'hidden');
		this.container.addEvent('mouseover', this.mix.bind(this));
		return this;
	},

	toggleState: function(){
		this.setState(Klass.Editor.$[this.collapsed ? 'TRISTATE_OFF' : 'TRISTATE_ON']);
	},

	updateState: function(){
		var editor = this.editor,
			state = Klass.Editor.$[this.modes[editor.mode] ? 'TRISTATE_OFF' : 'TRISTATE_DISABLED'];
		this.setState(editor.readOnly && !this.readOnly ? Klass.Editor.$['TRISTATE_DISABLED'] : state);
		this.setValue('');
	},

	setState: function(state){
		if (this.state === state) return;
		this.element.set('state', state);
		this.state = state;
	},

	toggleCollapse: function(){
		this[this.collapsed ? 'expand' : 'collapse']();
		return this;
	},
	
	collapse: function(){
		if (this.collapsed) return;
		this.fireEvent('beforeCollapse');
		this.collapsed = true;
		this.list.hide();
		this.removeClass();
		this.panel.document.html().style('overflow', 'auto');
		this.container.removeEvent('mouseover', this.mix.bind(this));
		this.editor.ui.mixComponent = false;
		this.fireEvent('collapse');
		this.toggleState();
		return this;
	},

	mix: function(ev){
		if (ev.getTarget().hasClass('kse-button')) this.collapse();
		return false;
	},
	
	expand: function(){
		if (!this.collapsed) return;
		if (!this.list) this.initList();
		this.fireEvent('beforeExpand');
		this.collapseCurrentList();
		this.collapsed = false;
		this.editor.ui.mixComponent = true;
		this.addClass();
		this.show();
		this.fireEvent('expand');
		this.toggleState();
		return this;
	},

	setValue: function(value){
		this.value = value || '';
		return this;
	},

	addClass: function(){
		this.wrap.addClass(this.wrapClass);
	},
	
	removeClass: function(){
		this.wrap.removeClass(this.wrapClass);
	},

	mark: function(name){
		var item = this.listItems[name];
		item && item.addClass('kse-selected');
		return this;
	},

	unmark: function(name){
		var items = this.listItems;
		var item = items[name];

		if (!item) for (var key in items){
			items[key].removeClass('kse-selected');
		} else item.removeClass('kse-selected');
		return this;
	}

});

Klass.Editor.ui.panelButton.handler = {

	create: function(definition){
		return new Klass.Editor.ui.panelButton(this.editor, definition);
	}

};

Klass.Editor.ui.prototype.addColorButton = function(name, definition){
	this.add(name, Klass.Editor.ui.PANELBUTTON, definition);
};