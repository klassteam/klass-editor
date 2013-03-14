/**
 * @fileOverview Contains the third and last part of the {@link Klass.Editor} object
 *		definition.
 */

(function(document, local){

	var $E = local.Editor;

	$E.extend({

		/**
		 * Holds references to all editor instances created. The name of the properties
		 * in this object correspond to instance names, and their values contains the
		 * {@link Klass.Editor} object representing them.
		 * @type {Object}
		 */
		instances: {},

		/**
		 * The document of the window holding the Klass Editor object.
		 * @type {Klass.DOM.document}
		 */
		document: new local.DOM.document(document),

		/**
		 * Adds an editor instance to the global {@link Klass.Editor} object. This function
		 * is available for internal use mainly.
		 * @param {Klass.Editor.prototype} editor The editor instance to be added.
		 */
		add: function(editor){
			this.instances[editor.name] = editor;

			editor.addEvents({
				blur: function(){
					if ($E.currentInstance === editor){
						$E.currentInstance = null;
					}
				},
				focus: function(){
					if ($E.currentInstance !== editor){
						$E.currentInstance = editor;
					}
				}
			});
		
		},

		get: function(name){
			return this.instances[name];
		},

		has: function(editor){
			return !!this.instances[editor.name];
		},
	
		create: function(selector, options){
			
		
		},

		/**
		 * Removes an editor instance from the global {@link Klass.Editor} object. This function
		 * is available for internal use only. External code must use {@link Klass.Editor.prototype.destroy}
		 * to avoid memory leaks.
		 * @param {Klass.Editor.prototype} editor The editor instance to be removed.
		 */
		destroy: function(editor){
			delete this.instances[editor.name];
		}
	
	})/*.extend(Events.prototype)*/;

})(document, Klass);