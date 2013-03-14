/**待完善*/

Klass.Editor.ui.panel = new Class({

	Extends: Klass.Editor.ui.component,
	
	options: {
		/**
		 css: [],
		 */
		css: ['skins/default/richcombo.css', 'skins/default/palette.css'],
		baseCls: 'kse-editor'
	},
	
	initialize: function(editor, options){
		this.parent(editor, options);
		this.blocks = {};
		this.css = [];
		this.uid = Klass.Editor.utils.unique();

		var container = Klass.dom.getOffsetParent(editor.container[0]);
		if (container && container.tagName !== 'HTML') this.container = document.node(container);

		for (var i = 0, l = this.options.css.length; i < l; i++) {
			this.css.push(Klass.Editor.getUrl(this.options.css[i]));
		}
		this.render();
	},
	
	render: function(){
		var markup = this.markup;
		var container = this.container;
		
		var element = this.element = new Klass.DOM.element('div', {
			'class': 'kse-panel',
			'html': markup.comboPanel,
			'styles': {
				zIndex: this.editor.baseZIndex('SELECT')
			}
		}).appendTo(container);

		var iframe = new Klass.DOM.element('iframe', {
			id: 'kse_panel_iframe_' + this.uid,
			src: 'javascript:void(' +
			/*(function(){' +
			 'document.open();' +
			 'document.domain=\'' + document.domain + '\';' +
			 'document.close();' +
			 '})()*/
			'0)',
			frameborder: 0
		}).appendTo(document.node(element[0].firstChild));

		var contents = markup.comboPanelContent.substitute({
			baseCss: '*{margin: 0; padding: 0;}',
			externalCss: 'ul, ol{list-style-type: none}',
			direction: Klass.Editor.config.contentsDirection,
			baseHead: Klass.Editor.utils.buildStyleHtml(this.css)
		});
		this.document = Klass.Editor.utils.initIFrameDocument(iframe, contents);
		
		container = this.document.body().unselectable();

		// Don't use display or visibility style because we need to
		// calculate the rendering layout later and focus the element.
		container.style('opacity', 0);

		container.addEvent('mousedown', function(){
			return false;
		});

		var focused = Klass.env.ie ? iframe : new Klass.DOM.window(iframe[0].contentWindow);

		focused.addEvent('blur', this.fireEvent.bind(this, 'collapse'), true);

		var onLoad = function(){
			container.style('opacity', 1);
			this.fireEvent('render');
		}.bind(this);

		if (window.frames[iframe[0].id]) onLoad();
		else iframe.addListener('load', onLoad);

		this.iframe = iframe;
		this.container = container;
	},

	mixBlock: function(){

	},

	position: function(relative){
		this.toElement().position({
			relativeTo: relative || this.container,
			position: 'bottomLeft'
		});
	},
	
	createBlock: function(markup){
		return this.container.insertFirst(markup || this.markup.panelBlock);
	},
	
	showBlock: function(name){
		var childs = this.container.children();
		for (var i = 0, l = childs.length; i < l; i++) childs[i].hide();
		this.currentBlock = this.blocks[name].show();
		setTimeout(this.focus.bind(this), 0);
	},

	focus: function(){
		this.iframe[0].contentWindow.focus();
	},

	addBlock: function(name, markup){
		var block = this.blocks[name];

		block = block ? block : this.createBlock(markup);
		
		this.blocks[name] = block;
		return block;
	}
	
});