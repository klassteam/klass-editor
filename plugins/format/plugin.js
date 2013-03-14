
Klass.Editor.plugins.implement('format', function(editor){

	var config = editor.config.format, lang = editor.lang.format;

	var pluginName = 'format';
	
	// Gets the list of tags from the settings.
	var tags = config.tags.split(';');
	
	// Create style objects for all defined styles.
	var styles = {};
	for (var i = 0, l = tags.length; i < l; i++){
		var tag = tags[i];
		styles[tag] = new Klass.Editor.style(config[tag]);
		styles[tag].enterMode = editor.config.enterMode;
	}
	
	editor.ui.addRichCombo(pluginName, {
		name: pluginName,
		label: lang.label,
		title: lang.panelTitle,
		className: pluginName,
		panel: {
			//css: editor.skin.editor.css.concat(config.contentsCss),
			multiSelect: false,
			attributes: {
				'aria-label': lang.panelTitle
			}
		},
		
		init: function(){
			//this.startGroup(lang.panelTitle);
			
			for (var tag in styles){
				var label = lang['tag_' + tag];
				
				// Add the tag entry to the panel list.
				this.add(tag, '<' + tag + '>' + label + '</' + tag + '>', label);
			}
		},
		
		addHandler: function(element, value){
			if (editor.config.useLivePreview){
				element.addEvents({
					click: function(){
						this.stopEvent('mouseleave');
					},
					mouseleave: this.restore.bind(this, value),
					mouseenter: this.preview.bind(this, value)
				});
			}
		},

		preview: function(value){
			var currentValue = this.getValue();
			if (currentValue && currentValue !== value){
				editor.livePreview(true);
				styles[value].apply(editor.document);
			}
		},

		restore: function(value){
			var currentValue = this.getValue();
			if (currentValue && currentValue != value){
				styles[currentValue].apply(editor.document);
				editor.livePreview();
			}
		},

		onCollapse: function(){
			editor.livePreview();
		},

		onClick: function(value){
			var enabledLivePreview = editor.config.useLivePreview;
			enabledLivePreview && this.restore(value);

			editor.focus();
			editor.fireEvent('saveSnapshot');

			var style = styles[value],
				path = new Klass.DOM.elementPath(editor.getSelection().getStartElement());

			style[!enabledLivePreview && style.checkActive(path) ? 'remove' : 'apply'](editor.document);
			
			// Save the undo snapshot after all changes are affected. (#4899)
			setTimeout(function(){
				editor.fireEvent('saveSnapshot');
			}, 0);
		},
		
		onRender: function(){
			editor.addEvent('selectionChange', function(ev){
				var currentTag = this.getValue();
				
				var elementPath = ev.path;
				
				for (var tag in styles){
					if (styles[tag].checkActive(elementPath)){
						if (tag != currentTag) this.setValue(tag, lang['tag_' + tag]);
						return;
					}
				}
				
				// If no styles match, just empty it.
				this.setValue('');
			}.bind(this));
		}
	});

});


Klass.Editor.config.format = {

	/**
	 * A list of semi colon separated style names (by default tags) representing
	 * the style definition for each entry to be displayed in the Format combo in
	 * the toolbar. Each entry must have its relative definition configuration in a
	 * setting named "format_(tagName)". For example, the "p" entry has its
	 * definition taken from config.format_p.
	 * @type String
	 * @default 'p;h1;h2;h3;h4;h5;h6;pre;address;div'
	 * @example
	 * config.format_tags = 'p;h2;h3;pre'
	 */
	tags: 'p;h1;h2;h3;h4;h5;h6;pre;address;div',

	/**
	 * The style definition to be used to apply the "Normal" format.
	 * @type Object
	 */
	p: {element: 'p'},

	/**
	 * The style definition to be used to apply the "Normal (DIV)" format.
	 * @type Object
	 */
	div: {element: 'div'},

	/**
	 * The style definition to be used to apply the "Formatted" format.
	 * @type Object
	 */
	pre: {element: 'pre'},

	/**
	 * The style definition to be used to apply the "Address" format.
	 * @type Object
	 */
	address: {element: 'address'},

	/**
	 * The style definition to be used to apply the "Heading 1" format.
	 * @type Object
	 */
	h1: {element: 'h1'},

	/**
	 * The style definition to be used to apply the "Heading 1" format.
	 * @type Object
	 */
	h2: {element: 'h2'},

	/**
	 * The style definition to be used to apply the "Heading 1" format.
	 * @type Object
	 */
	h3: {element: 'h3'},

	/**
	 * The style definition to be used to apply the "Heading 1" format.
	 * @type Object
	 */
	h4: {element: 'h4'},

	/**
	 * The style definition to be used to apply the "Heading 1" format.
	 * @type Object
	 */
	h5: {element: 'h5'},

	/**
	 * The style definition to be used to apply the "Heading 1" format.
	 * @type Object
	 */
	h6: {element: 'h6'}

};