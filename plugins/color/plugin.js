Klass.Editor.plugins.implement('color', function(editor){
	
	var lang = editor.lang.color, markup = editor.markup.palette;
	var config = editor.config.color;

	var addButton = function(name, type, title){
		var styles = {};
		editor.ui.addColorButton(name, {
			name: name,
			label: title,
			title: title,
			markup: editor.markup.color.button,
			iconCls: 'icon-' + name,
			className: 'color',

			build: function(){
				var obj = Object.append({
					standardColorTable: standardColors(),
					standardColors: lang.standard,
					themeColors: lang.theme,
					autoInherit: lang.auto,
					moreColors: lang.more,
					enableMore: config.enableMore ? '' : 'none'
				}, themeColors());
				return markup.wrap.substitute(obj);
			},

			addHandler: function(element, color){
				if (editor.config.useLivePreview){
					element.addEvents({
						click: function(){
							this.stopEvent('mouseleave');
						},
						mouseleave: this.restore.bind(this, color),
						mouseenter: this.preview.bind(this, color)
					});
				}
			},

			execute: function(color, ignoreEmptyRange){
				var modifiers, style = config[type + 'style'];

				if (!styles['inherit']) styles['inherit'] = new Klass.Editor.style(style, {color: 'inherit'});
				styles['inherit'].remove(editor.document, ignoreEmptyRange);

				if (color && typeof color === 'string' && color !== '?'){
					style.childRule = function(element){
						return type === 'back' ? 
							// It's better to apply background color as the innermost style.
							// Except for "unstylable elements".
							isUnstylable(element) :
							// Fore color style must be applied inside links instead of around it.
							element.name() !== 'a' || isUnstylable(element);
					};
					modifiers = color.charAt(0) === '#' ? '' : '#';
					color = modifiers + color.replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3');
					if (!styles[color]) styles[color] = new Klass.Editor.style(style, {color: color});
					styles[color].apply(editor.document, ignoreEmptyRange);
				}
			},

			preview: function(color){
				if (this.value != color){
					editor.livePreview(true);
					this.execute(color, true);
				}
			},

			restore: function(color){
				var document = editor.document;
				if (this.value != color){
					if (styles[this.value]) styles[this.value].apply(document, true);
					else styles['inherit'] && styles['inherit'].remove(document, true);
					editor.livePreview();
				}
			},

			onRender: function(){
				this.colorHolderElement = this.getElement('.kse-colorbar');
			},

			onExpand: function(){
				var rsharp = /^#/,
					rduplicate = /(.)\1+(.)\2+(.)\3+/,
					selection = editor.getSelection(), 
					element = selection && selection.getStartElement(), 
					color = element && element.getComputedStyle(type === 'back' ? 'background-color' : 'color') || 'transparent';

				var name, colors = {'transparent': 1};

				color = color.indexOf('rgb') !== -1 ? color.rgbToHex() : color;

				if (element) this.unmark();
				if (!color || colors[color]){
					this.setValue('');
					return;
				}

				color = color.toUpperCase();

				name = color.replace(rsharp, '').replace(rduplicate, '$1$2$3');

				this.setValue(color);

				this.listItems[name] && this.mark(name);	
			},

			onCollapse: function(){
				editor.livePreview();
			},

			onClick: function(color){
				color = color.toUpperCase();

				editor.config.useLivePreview && this.restore(color);

				/* Open the color picker dialog. */
				if (color === '?'){
					var self = this, applyColorStyle = arguments.callee;
					var dialogEvents = {
						show: function(){
							this.colorPicker && this.colorPicker.setColor(self.value);
						},
						close: function(){
							this.removeEvents(dialogEvents);
						},
						complete: applyColorStyle.bind(self)
					};
					editor.openDialog('color', function(){
						this.addEvents(dialogEvents);
					});
					return;
				}

				editor.focus();
				editor.fireEvent('saveSnapshot');

				this.execute(color);
				updateColorBar(this.colorHolderElement, color);
				editor.fireEvent('saveSnapshot');
			}

		});
	};

	function isUnstylable(element){
		return (element.getProperty('contentEditable') == 'false') || element.getProperty('data-kse-nostyle');
	}

	var row = markup.row, cell = markup.cell;

	function standardColors(){
		var colors = config.standardColors.split(',');
		var rows = [], cells = [];
		for (var i = 0, l = colors.length; i < l; i++){
			cells.push(cell.replace(/{item}/, markup.item).replace(/{color}/g, colors[i]));
			if (i && ((i + 1) % 10 === 0)){
				rows.push(row.replace(/{cells}/, cells.join('')));
				cells.length = 0;
			}
		}
		return markup.table.replace(/{rows}/, rows.join(''));
	}

	function themeColors(){
		var colors = config.themeColors, table = markup.table;
		var themeCells = [], colorRows = [], colorCells = [];
		for (var i = 0, l = colors.length; i < l; i++){
			for (var j = 0, k = colors[i].length; j < k; j++){
				if (j === 0){
					themeCells.push(cell.replace(/{item}/, markup.item).replace(/{color}/g, colors[i][0]));
					continue;
				}
				colorCells.push(markup.item.replace(/{color}/g, colors[i][j]));
				if (j === k - 1){
					colorRows.push(markup.li.replace(/{items}/, colorCells.join('')));
					colorCells.length = 0;
				}
			}
		}

		var results = {};
		var themeRow = row.replace(/{cells}/, themeCells.join(''));
		results.themeColorsTable = markup.ul.replace(/{lists}/, colorRows.join(''));
		results.themesTable = table.replace(/{rows}/, themeRow);
		return results;
	}

	function updateColorBar(element, color){
		if (element){
			if (String(color) === 'null') color = null;
			color = color && color.contains ? color.contains('#') ? color : '#' + color : null;
			element[color ? 'style' : 'removeStyle']('background-color', color);
		}
	}

	addButton('textcolor', 'fore', lang.textColor);
	addButton('bgcolor', 'back', lang.bgColor);

});

Klass.Editor.config.color = {

	/**
	 * Whether to enable the "More Colors..." button in the color selectors.
	 * @default true
	 * @type Boolean
	 * @example
	 * config.color.enableMore = false;
	 */
	enableMore: true,

	standardColors: 'C00000,F00,FFC000,FF0,92D050,00B050,00B0F0,0070C0,002060,7030A0',
	
	themeColors: [
		['FFF', 'F2F2F2', 'D8D8D8', 'BFBFBF', 'A5A5A5', '7F7F7F'],
		['000', '767676', '595959', '3F3F3F', '262626', '0C0C0C'],
		['EEECE1', 'DDD9C3', 'C4BD97', '938953', '494429', '1D1B10'],
		['4F81BD', 'DBE5F1', 'B8CCE4', '95B3D7', '366092', '244061'],
		['C0504D', 'F2DCDB', 'E5B9B7', 'D99694', '953734', '632423'],
		['9BBB59', 'EBF1DD', 'D7E3BC', 'C3D69B', '76923C', '4F6128'],
		['8064A2', 'E5E0EC', 'CCC1D9', 'B2A2C7', '5F497A', '3F3151'],
		['C149BA', 'E6B6E3', 'DA92D6', 'C75CC1', '742C70', '4D1D4A'],
		['4BACC6', 'DBEEF3', 'B7DDE8', '92CDDC', '31859B', '205867'],
		['F79646', 'FDEADA', 'FBD5B5', 'FAC08F', 'E36C09', '974806']
	],

	/**
	 * Holds the style definition to be used to apply the text background color.
	 * @type Object
	 */
	backstyle: {
		element: 'span',
		styles: {'background-color' : '#(color)'}
	},

	/**
	 * Holds the style definition to be used to apply the text foreground color.
	 * @type Object
	 */
	forestyle: {
		element: 'span',
		styles: {'color' : '#(color)'},
		overrides: [{element: 'font', attributes: {'color': null}}]
	}

};