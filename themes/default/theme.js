(function(local){

	local.Editor.themes = function(){

		var browserCSSClass = 'kse-browser-' + local.env.browser;

		return {

			build: function(){


			},

			dialog: function(editor, definitions){
				var markup = editor.markup.dialog;

				if (typeof definitions === 'object'){
					definitions.browserCSSClass = browserCSSClass;
					markup = markup.substitute(definitions);
				}

				var element = local.DOM.create(markup);

				var title = element.child(0);
				var close = element.child(1);
				var main = element.child(2);

				title.unselectable();
				close.unselectable();

				return {
					element: element,
					title: title,
					close: close,
					parts: {
						tabs: main.child(0),
						tips: main.child([1, 0]),
						contents: main.child(2),
						buttons: main.child(3)
					}
				};
				
			}

		};

	};

})(Klass);