/**
 * @module config
 */

Klass.Editor.config = {

	/**
	 * Whether the replaced element (usually a textarea) is to be updated
	 * automatically when posting the form containing the editor.
	 * @type Boolean
	 * @default true
	 * @example
	 * config.autoUpdateElement = true;
	 */
	autoUpdateElement: true,

	/**
	 * Set whether the font, size and other features enable real-time preview.
	 * @type Boolean
	 * @default false
	 * @example
	 * config.enableLivePreview = true
	 */
	enableLivePreview: true,

	/**
	 * The CSS file(s) to be used to apply style to the contents. It should
	 * reflect the CSS used in the final pages where the contents are to be
	 * used.
	 * @type String|Array
	 * @default '&lt;Klass.Editor folder&gt;/contents.css'
	 * @example
	 * config.contentsCss = '/css/mysitestyles.css';
	 * config.contentsCss = ['/css/mysitestyles.css', '/css/anotherfile.css'];
	 */
	contentsCss : Klass.Editor.basePath + 'contents.css',

	/**
	 * The writting direction of the language used to write the editor
	 * contents. Allowed values are:
	 * <ul>
	 *     <li>'ui' - which indicate content direction will be the same with the user interface language direction;</li>
	 *     <li>'ltr' - for Left-To-Right language (like English);</li>
	 *     <li>'rtl' - for Right-To-Left languages (like Arabic).</li>
	 * </ul>
	 * @default 'ui'
	 * @type String
	 * @example
	 * config.contentsDirection = 'rtl';
	 */
	contentsDirection: 'ui',

	/**
	 * The user interface language localization to use. If empty, the editor
	 * automatically localize the editor to the user language, if supported,
	 * otherwise the {@link Klass.Editor.config.defaultLanguage} language is used.
	 * @type String
	 * @default '' (empty)
	 * @example
	 * config.language = 'en';
	 */
	language: '',

	/**
	 * The language to be used if {@link Klass.Editor.config.language} is left empty and it's not
	 * possible to localize the editor to the user language.
	 * @type String
	 * @default 'zh-cn'
	 * @example
	 * config.defaultLanguage = 'en';
	 */
	defaultLanguage: 'zh-cn',

	/**
	 * Sets the behavior for the ENTER key. It also dictates other behaviour
	 * rules in the editor, like whether the &lt;br&gt; element is to be used
	 * as a paragraph separator when indenting text.
	 * The allowed values are the following constants, and their relative
	 * behavior:
	 * <ul>
	 *     <li>{@link Klass.Editor.constants.ENTER_P} (1): new &lt;p&gt; paragraphs are created;</li>
	 *     <li>{@link Klass.Editor.constants.ENTER_BR} (2): lines are broken with &lt;br&gt; elements;</li>
	 *     <li>{@link Klass.Editor.constants.ENTER_DIV} (3): new &lt;div&gt; blocks are created.</li>
	 * </ul>
	 * <strong>Note</strong>: It's recommended to use the
	 * {@link Klass.Editor.constants.ENTER_P} value because of its semantic value and
	 * correctness. The editor is optimized for this value.
	 * @type Number
	 * @default {@link Klass.Editor.constants.ENTER_P}
	 * @example
	 * config.enterMode = Klass.Editor.constants.ENTER_BR;
	 */
	enterMode: Klass.Editor.$['ENTER_P'],

	/**
	 * Force the respect of {@link Klass.Editor.config.enterMode} as line break regardless of the context,
	 * E.g. If {@link Klass.Editor.config.enterMode} is set to {@link Klass.Editor.constants.ENTER_P},
	 * press enter key inside a 'div' will create a new paragraph with 'p' instead of 'div'.
	 * @type Boolean
	 * @default false
	 * @example
	 * config.forceEnterMode = true;
	 */
	forceEnterMode: false,

	/**
	 * Just like the {@link Klass.Editor.config.enterMode} setting, it defines the behavior for the SHIFT+ENTER key.
	 * The allowed values are the following constants, and their relative
	 * behavior:
	 * <ul>
	 *     <li>{@link Klass.Editor.constants.ENTER_P} (1): new &lt;p&gt; paragraphs are created;</li>
	 *     <li>{@link Klass.Editor.constants.ENTER_BR} (2): lines are broken with &lt;br&gt; elements;</li>
	 *     <li>{@link Klass.Editor.constants.ENTER_DIV} (3): new &lt;div&gt; blocks are created.</li>
	 * </ul>
	 * @type Number
	 * @default {@link Klass.Editor.constants.ENTER_BR}
	 * @example
	 * config.shiftEnterMode = Klass.Editor.constants.ENTER_P;
	 */
	shiftEnterMode: Klass.Editor.$['ENTER_BR'],

	/**
	 * Sets the doctype to be used when loading the editor content as HTML.
	 * @type String
	 * @default '&lt;!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"&gt;'
	 * @example
	 * config.docType = '&lt;!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN"&gt;';
	 */
	docType: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',

	/**
	 * Sets the "id" attribute to be used on the body element of the editing
	 * area. This can be useful when reusing the original CSS file you're using
	 * on your live website and you want to assing to the editor the same id
	 * you're using for the region that'll hold the contents. In this way,
	 * id specific CSS rules will be enabled.
	 * @type String
	 * @default '' (empty)
	 * @example
	 * config.bodyId = 'contents_id';
	 */
	bodyId: '',

	/**
	 * Sets the "class" attribute to be used on the body element of the editing
	 * area. This can be useful when reusing the original CSS file you're using
	 * on your live website and you want to assing to the editor the same class
	 * name you're using for the region that'll hold the contents. In this way,
	 * class specific CSS rules will be enabled.
	 * @type String
	 * @default '' (empty)
	 * @example
	 * config.bodyClass = 'contents';
	 */
	bodyClass: '',

	/**
	 * Indicates whether the contents to be edited are being inputted as a full
	 * HTML page. A full page includes the &lt;html&gt;, &lt;head&gt; and
	 * &lt;body&gt; tags. The final output will also reflect this setting,
	 * including the &lt;body&gt; contents only if this setting is disabled.
	 * @type Boolean
	 * @default false
	 * @example
	 * config.fullPage = true;
	 */
	fullPage: false,

	/**
	 * The height of editing area( content ), in relative or absolute, e.g. 30px, 5em.
	 * Note: Percentage unit is not supported yet. e.g. 30%.
	 * @type Number|String
	 * @default '200'
	 * @example
	 * config.height = 500;
	 * config.height = '25em';
	 * config.height = '300px';
	 */
	height: 300,

	/**
	 * Comma separated list of plugins to load and initialize for an editor
	 * instance. This should be rarely changed, using instead the
	 * {@link Klass.Editor.config.extraPlugins} and
	 * {@link Klass.Editor.config.removePlugins} for customizations.
	 * @type String
	 */
	plugins: 'about,basicstyles,clipboard,color,elementspath,entities,filebrowser,fileupload,format,font,horizontalrule,htmldataprocessor,indent,image,justify,keyenter,link,list,maximize,menu,mode,pastefromword,pastetext,preview,print,pseudos,removeformat,resize,selection,smiley,sourcearea,statusbar,styles,toolbar,undo,widget,wysiwygarea',

	/**
	 * The editor tabindex value.
	 * @type Number
	 * @default 0 (zero)
	 * @example
	 * config.tabIndex = 1;
	 */
	tabIndex: 0,

	/**
	 * The theme to be used to build the UI.
	 * @type String
	 * @default 'default'
	 * @see Klass.Editor.config.skin
	 * @example
	 * config.theme = 'default';
	 */
	theme: 'default',

	/**
	 * The skin to load. It may be the name of the skin folder inside the
	 * editor installation path, or the name and the path separated by a comma.
	 * @type String
	 * @default 'default'
	 * @example
	 * config.skin = 'v2';
	 * @example
	 * config.skin = 'myskin,/customstuff/myskin/';
	 */
	skin: 'default',

	/**
	 * The editor width in CSS size format or pixel integer.
	 * @type String|Number
	 * @default '' (empty)
	 * @example
	 * config.width = 850;
	 * config.width = '75%';
	 * config.width = '80em';
	 */
	width: '',

	/**
	 * The base Z-index for floating dialogs and popups.
	 * @type Number
	 * @default 10000
	 * @example
	 * config.baseFloatZIndex = 2000
	 */
	baseFloatZIndex: 10000,

	/**
	 * @type Boolean
	 * @default false
	 * @example
	 * config.autoFloatZIndex = true
	 */
	autoFloatZIndex: false,

	/**
	 * Indicates that some of the editor features, like alignment and text
	 * direction, should used the "computed value" of the feature to indicate it's
	 * on/off state, instead of using the "real value".<br />
	 * <br />
	 * If enabled, in a left to right written document, the "Left Justify"
	 * alignment button will show as active, even if the aligment style is not
	 * explicitly applied to the current paragraph in the editor.
	 * @type Boolean
	 * @default true
	 * @example
	 * config.useComputedState = false;
	 */
	useComputedState: true

};