
/**
 * @fileOverview The "elementspath" plugin. It shows all elements in the DOM
 *		parent tree relative to the current selection in the editing area.
 */
Klass.Editor.plugins.implement({

	elementspath: function(editor){

		if (!editor.bbar) return;
		
		var container = null, 
			bbar = editor.bbar, 
			lang = editor.lang.elementspath, 
			onClickHanlder = Klass.Editor.utils.addFunction(onClick);

		function renderContainer(){
			container = Klass.DOM.createElement('div', {
				'class': 'kse-elements-path'
			}).prependTo(bbar);
		}

		function onClick(index){
			editor.focus();
			var element = editor.storage.elementsPath.list[index];
			if (element.is('body')){
				var range = new Klass.DOM.range(editor.document);
				range.selectNodeContents(element);
				range.select();
			} else editor.getSelection().selectElement(element);
			return false;
		}

		function emptyPath(){
			container && container.empty();
			delete this.storage.elementsPath.list;
		}

		editor.storage.elementsPath = {filters: []};
		
		editor.addEvent('selectionChange', function(){
		
			var elementList = this.storage.elementsPath.list = [],
				filters = this.storage.elementsPath.filters,
				selection = this.getSelection(), 
				element = selection.getStartElement(), 
				elements = [];

			if (!container) renderContainer();
			
			while (element){

				var ignore = false,
					name = element.data('kse-display-name') || element.data('kse-real-element-type') || element.name();

				for (var i = 0; i < filters.length; i++){
					var ret = filters[i](element, name);
					if (ret === false){
						ignore = true;
						break;
					}
					name = ret || name;
				}

				if (!ignore){
					var index = elementList.push(element) - 1;
					
					var el = Klass.DOM.createElement('a', {
						href: '#',
						text: name,
						title: lang.replace('%1', name),
						onclick: 'Klass.Editor.utils.callFunction(' + onClickHanlder + ',' + index + '); return false;'
					});
					
					elements.unshift(el);
				}

				if (name === 'body') break;

				element = element.parent();
			}

			container.empty().adopt(elements);

			this.fireEvent('updateElementsPath', container);

		});

		editor.addEvents({
			readOnly: emptyPath,
			contentDomUnload: emptyPath
		});
	}
	
});
