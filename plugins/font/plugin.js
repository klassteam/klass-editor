
Klass.Editor.plugins.implement('font', function(editor){

	var config = editor.config;

	var addRichCombo = function(plugin, config, entries){
		var lang = editor.lang[plugin];

		// Gets the list of fonts from the settings.
		var names = entries.split(';'), values = [];
		var attribute = plugin === 'font' ? 'family' : 'size';

		var styles = {};
		for (var i = 0, l = names.length; i < l; i++){
			var parts = names[i];
			if (parts){
				parts = parts.split('/');
				var vars = {}, name = names[i] = parts[0];
				vars[attribute] = values[i] = parts[1] || name;
				styles[name] = new Klass.Editor.style(config.style, vars);
				styles[name].styleDefinition.name = name;
			} else names.splice(i--, 1);
		}

		editor.ui.addRichCombo(plugin, {
			name: plugin,
			label: lang.label,
			title: lang.panelTitle,
			className: plugin,
			panel: {
				//css: editor.skin.editor.css.concat(config.contentsCss),
				multiSelect: false,
				attributes: {
					'aria-label': lang.panelTitle
				}
			},
			
			init: function(){
				//this.startGroup(lang.panelTitle);
				
				for (var i = 0; i < names.length; i++){
					var name = names[i];
					this.add(name, styles[name].buildPreview());
					// Add the tag entry to the panel list.
					//this.add(name, styles[name].buildPreview(), name);
				}
			},
			
			addHandler: function(element, value){
				if (editor.config.useLivePreview){
					element.addEvents({
						mouseleave: this.restore.bind(this, value),
						mouseenter: this.preview.bind(this, value)
					});
				}
			},

			preview: function(value){
				if (!this.collapsed && this.getValue() !== value){
					editor.livePreview(true);
					styles[value].apply(editor.document, true);
				}
			},

			restore: function(value){
				var currentValue = this.getValue();
				if (!this.collapsed && currentValue !== value){
					styles[currentValue || value][currentValue ? 'apply' : 'remove'](editor.document, true);
					editor.livePreview();
				}
			},

			onCollapse: function(){
				editor.livePreview();
			},

			onClick: function(value){
				editor.config.useLivePreview && this.restore(value);

				editor.focus();

				editor.fireEvent('saveSnapshot');

				var activated = this.getValue() === value, 
					style = styles[value];

				style[activated ? 'remove' : 'apply'](editor.document);

				editor.fireEvent('saveSnapshot');
			},
			
			onRender: function(){
				editor.addEvent('selectionChange', function(ev){
					var currentValue = this.getValue();

					var elementPath = ev.path, elements = elementPath.elements;

					// For each element into the elements path.
					for (var i = 0, element; i < elements.length; i++){
						element = elements[i];

						// Check if the element is removable by any of
						// the styles.
						for (var value in styles){
							if (styles[value].checkElementRemovable(element, true)){
								if (value != currentValue) this.setValue(value);
								return;
							}
						}
					}
					
					// If no styles match, just empty it.
					this.setValue('');
				}.bind(this));
			}
		});
	};
	
	addRichCombo('font', config.font, config.font.names);
	addRichCombo('fontsize', config.fontsize, config.fontsize.sizes);

});


 Klass.Editor.config.font = {

	/**
	 * The text to be displayed in the Font combo is none of the available values
	 * matches the current cursor position or text selection.
	 * @type String
	 * @example
	 * config.font.defaultLabel = 'Arial';
	 */
	defaultLabel: '',

	/**
	 * The list of fonts names to be displayed in the Font combo in the toolbar.
	 * Entries are separated by semi-colons (;), while it's possible to have more
	 * than one font for each entry, in the HTML way (separated by comma).
	 *
	 * A display name may be optionally defined by prefixing the entries with the
	 * name and the slash character. For example, "Arial/Arial, Helvetica, sans-serif"
	 * will be displayed as "Arial" in the list, but will be outputted as
	 * "Arial, Helvetica, sans-serif".
	 * @type String
	 * @example
	 * config.font.names =
	 *     'Arial/Arial, Helvetica, sans-serif;' +
	 *     'Times New Roman/Times New Roman, Times, serif;' +
	 *     'Verdana';
	 * @example
	 * config.font.names = 'Arial;Times New Roman;Verdana';
	 */
	names: 'Arial/Arial, Helvetica, sans-serif;' +
		'Comic Sans MS/Comic Sans MS, cursive;' +
		'Courier New/Courier New, Courier, monospace;' +
		'Georgia/Georgia, serif;' +
		'Lucida Sans Unicode/Lucida Sans Unicode, Lucida Grande, sans-serif;' +
		'Tahoma/Tahoma, Geneva, sans-serif;' +
		'Times New Roman/Times New Roman, Times, serif;' +
		'Trebuchet MS/Trebuchet MS, Helvetica, sans-serif;' +
		'Verdana/Verdana, Geneva, sans-serif',

	/**
	 * The style definition to be used to apply the font in the text.
	 * @type Object
	 */
	style: {
		element: 'span',
		styles: {'font-family': '#(family)'},
		overrides: [{element: 'font', attributes: {'face': null}}]
	}

 };

 Klass.Editor.config.fontsize = {

	/**
	 * The text to be displayed in the Font Size combo is none of the available
	 * values matches the current cursor position or text selection.
	 * @type String
	 * @example
	 * // If the default site font size is 12px, we may making it more explicit to the end user.
	 * config.fontsize.defaultLabel = '12px';
	 */
	defaultLabel: '',

	/**
	 * The list of fonts size to be displayed in the Font Size combo in the
	 * toolbar. Entries are separated by semi-colons (;).
	 *
	 * Any kind of "CSS like" size can be used, like "12px", "2.3em", "130%",
	 * "larger" or "x-small".
	 *
	 * A display name may be optionally defined by prefixing the entries with the
	 * name and the slash character. For example, "Bigger Font/14px" will be
	 * displayed as "Bigger Font" in the list, but will be outputted as "14px".
	 * @type String
	 * @default '8/8px;9/9px;10/10px;11/11px;12/12px;14/14px;16/16px;18/18px;20/20px;22/22px;24/24px;26/26px;28/28px;36/36px;48/48px;72/72px'
	 * @example
	 * config.fontsize.sizes = '16/16px;24/24px;48/48px;';
	 * @example
	 * config.fontsize.sizes = '12px;2.3em;130%;larger;x-small';
	 * @example
	 * config.fontsize.sizes = '12 Pixels/12px;Big/2.3em;30 Percent More/130%;Bigger/larger;Very Small/x-small';
	 */
	sizes: '8/8px;9/9px;10/10px;11/11px;12/12px;14/14px;16/16px;18/18px;20/20px;22/22px;24/24px;26/26px;28/28px;36/36px;48/48px;72/72px',

	/**
	 * The style definition to be used to apply the font size in the text.
	 * @type Object
	 */
	style: {
		element: 'span',
		styles: {'font-size': '#(size)'},
		overrides: [{element: 'font', attributes: {'size': null}}]
	}

 };