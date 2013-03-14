/**
 * @fileOverview Contains the first and essential part of the {@link Klass.Editor}
 *		object definition.
 */
Klass.run(function(K){

	if (K && !K.Editor){

		/**
		 * @name Klass.Editor
		 * @namespace This is the API entry point. The entire Klass Editor code runs under this object.
		 * @example
		 */
		K.Editor = new Class({
		
			Implements: [Class.Events, Class.Options]
		
		}).extend({
			
			/**
			 * A constant string unique for each release of Klass Editor. Its value
			 * is used, by default, to build the URL for all resources loaded
			 * by the editor code, guaranteeing clean cache results when
			 * upgrading.
			 * @type String
			 */
			timestamp: 'AEQ8LPV',

			/**
			 * Contains the Klass Editor version number.
			 * @type String
			 */
			version: '0.5.5',

			/**
			 * Contains the Klass Editor revision number.
			 * The revision number is incremented automatically, following each
			 * modification to the Klass Editor source code.
			 * @type String
			 */
			revision: '0',

			/**
			 * Indicates the API loading status. The following statuses are available:
			 *		<ul>
			 *			<li><b>unloaded</b>: the API is not yet loaded.</li>
			 *			<li><b>basic_loaded</b>: the basic API features are available.</li>
			 *			<li><b>basic_ready</b>: the basic API is ready to load the full core code.</li>
			 *			<li><b>loading</b>: the full API is being loaded.</li>
			 *			<li><b>loaded</b>: the API can be fully used.</li>
			 *		</ul>
			 * @type String
			 */
			status: 'unloaded',

			/**
			 * Private object used to hold core stuff. It should not be used outside of
			 * the API code as properties defined here may change at any time
			 * without notice.
			 * @private
			 */
			storage: {},

			/**
			 * Contains the full URL for the Klass Editor installation directory.
			 * @type String
			 */
			basePath: (function(){
				var path, expression, scripts = document.getElementsByTagName('script');

				for (var i = 0, l = scripts.length; i < l; i++){
					var match = scripts[i].src.match(/(^|.*[\\\/])editor(?:_basic)?(?:_source)?.js(?:\?.*)?$/i);
					if (match && (path = match[1])) break;
				}
				
				if (path && path.indexOf('://') == -1){
					expression = (path.indexOf('/') === 0) ? /^.*?:\/\/[^\/]*/ : /^[^\?]*\/(?:)/;
					path = location.href.match(expression) + path;
				}
				
				return path;
			})(),

			/**
			 * Gets the full URL for Klass Editor resources. By default, URLs
			 * returned by this function contain a querystring parameter ("t")
			 * set to the {@link Klass.Editor.timestamp} value.<br />
			 * <br />
			 * This global variable must be set <strong>before</strong> the editor script
			 * loading. If the custom implementation returns nothing (==null), the
			 * default implementation is used.
			 * @param {String} resource The resource whose full URL we want to get.
			 *		It may be a full, absolute, or relative URL.
			 * @returns {String} The full URL.
			 */
			getUrl: function(resource){
				// If this is not a full or absolute path.
				if (resource.indexOf('://') == -1 && resource.indexOf('/') !== 0) resource = this.basePath + resource;
				
				// Add the timestamp, except for directories.
				if (this.timestamp && resource.charAt(resource.length - 1) != '/' && !(/[&?]t=/).test(resource))
					resource += (resource.indexOf('?') >= 0 ? '&' : '?') + 't=' + this.timestamp;
				
				return resource;
			}

		});

	}

});