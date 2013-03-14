/**
 * @Rich Combo box
 * @constructor
 */

/**
 * TODO 点击激活下拉表单的混入操作部分待完善
 */

Klass.Editor.ui.richCombo = new Class({

	Extends: Klass.Editor.ui.component,

	options: {
		maxHeight: 328
	},
	
	initialize: function(editor, options){
		this.parent(editor, options);
		Object.merge(this, options);

		//this.name = name;

		//var item = editor.getCommand(name) || name;
		
		//this.markup = editor.markup;
		//this.editor = editor;
			
		//this.config = item.config || editor.config[name];
		//this.title = item.label || editor.lang[name] || '';
		//this.item = item;
		
		this.collapsed = true;

		this.modes = {wysiwyg: 1};

		this.bound = {
			click: function(evt){
				evt.stop();
				this.state !== Klass.Editor.$['TRISTATE_DISABLED'] && this.toggleCollapse();
			}.bind(this),
			mouseover: function(evt){
				if (!editor.ui.mixComponent) return;
				evt.stop();
				this.expand();
			}.bind(this)
		};

		this.render();
	},

	add: function(name, value){
		this.items[name] = value || name;
	},
	
	render: function(){
		var label = this.title;
		var html = this.markup.select.substitute({
			label: label
		});
		
		var className = this.prefixCls + 'select';
		
		this.element = new Klass.DOM.element('span', {
			'html': html,
			'title': label,
			'class': className,
			'events': this.bound
		});

		this.labelElement = this.element.find('.kse-label', 1);

		this.editor.addEvent('mode', this.updateState.bind(this));
		// If this combo is sensitive to readOnly state, update it accordingly.
		!this.readOnly && this.editor.addEvent('readOnly', this.updateState.bind(this));

		this.fireEvent('render');
	},
	
	getValue: function(){
		return this.value || '';
	},

	setValue: function(value, text){
		text = text || value;
		this.value = value;
		this.labelElement.html(text || this.label);
		this.labelElement[text ? 'removeClass' : 'addClass']('kse-inline');
	},

	getPanel: function(){
		var floatPanel = this.container.retrieve('kse-floatpanel', null);
		if (!floatPanel) {
			floatPanel = new Klass.Editor.ui.panel(this.editor, {
				onRender: this.resize.bind(this)
			});
			this.container.store('kse-floatpanel', floatPanel);
		}
		floatPanel.addEvent('collapse', this.collapse.bind(this));
		this.panel = floatPanel;
		this.wrap = this.panel.element.first();
		return floatPanel;
	},
	
	initList: function(){
		if (this.list) return;

		if (this.init) this.init();

		var listItems = {};

		var elements = [], item = this.item;

		var panel = this.getPanel();
		this.list = panel.element;
		
		var block = panel.addBlock(this.name);
		
		var document = panel.document;

		Object.each(this.items, function(itemValue, item){
			//var styles = options.styles || {};
			//var value = options.value;

			//if (value) {
			//	for (var s in options.styles) 
			//		options.styles[s] = value;
			//}
			
			var element = document.createElement('li', {
				title: item,
				html: itemValue,
				'class': 'kse-list-item',
				events: {
					click: function(value){
						this.fireEvent('click', value);
						this.collapse();
					}.pass(item, this)
				}
			});

			this.addHandler && this.addHandler(element, item);

			//if (typeof itemValue === 'string') {
			//	var content = document.createElement(options.element, {
			//		text: options.name,
			//		styles: styles
			//	}).append(element);
			//	if (options.attributes) content.setProperties(options.attributes);
			//}
			//else element.set('text', options.name);
	
			//element = element.$;
			
			//this.editor.unselectable(element);
			
			/* Todo ls */
			//if (Browser.Engine.trident4) element.hover('x-editor-over');
			
			elements.push(element);
			listItems[item] = element;
		}, this);
		
		block.find('ul', 1).adopt(elements);

		this.listItems = listItems;
		this.listBlock = block;
	},

	resize: function(){
		// IE BUG: 
		// The script execution order effects may result in the listBlock is undefined.
		// By IE iframe special load mechanism affect.
		if (!this.listBlock) return;

		var height = this.listBlock.height();
		var maxHeight = this.options.maxHeight || height;
		this.wrap.style('height', Math.min(height, maxHeight));
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
		this.container.addEvent('mouseover', this.mix.bind(this));
		this.resize();
		return this;
	},

	toggleState: function(){
		this.setState(Klass.Editor.$[this.collapsed ? 'TRISTATE_OFF' : 'TRISTATE_ON']);
		this.unmark().mark(this.getValue());
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

	addClass: function(){
		this.wrap.addClass(this.wrapClass);
		this.element.style('z-index', this.editor.baseZIndex('COMBO'));
	},

	removeClass: function(){
		this.wrap.removeClass(this.wrapClass);
		this.wrap.style('height', null);
		this.element.style('z-index', null);
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
	},

	activate: function(){
	
	}
	
});

Klass.Editor.ui.richCombo.handler = {

	create: function(definition){
		return new Klass.Editor.ui.richCombo(this.editor, definition);
	}

};

Klass.Editor.ui.prototype.addRichCombo = function(name, definition){
	this.add(name, Klass.Editor.ui.RICHCOMBO, definition);
};