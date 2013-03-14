Klass.Editor.$ = Klass.Editor.constants = {

	/**
	 * Used in conjuction with {@link Klass.editor.config.enterMode} and
	 * {@link Klass.editor.config.shiftEnterMode} to make the editor produce &lt;p&gt;
	 * tags when using the ENTER key.
	 * @constant
	 */
	ENTER_P: 1,

	/**
	 * Used in conjuction with {@link Klass.editor.config.enterMode} and
	 * {@link Klass.editor.config.shiftEnterMode} to make the editor produce &lt;br&gt;
	 * tags when using the ENTER key.
	 * @constant
	 */
	ENTER_BR: 2,

	/**
	 * Used in conjuction with {@link Klass.editor.config.enterMode} and
	 * {@link Klass.editor.config.shiftEnterMode} to make the editor produce &lt;div&gt;
	 * tags when using the ENTER key.
	 * @constant
	 */
	ENTER_DIV: 3,

	/**
	 * No element is linked to the editor instance.
	 * @constant
	 */
	ELEMENT_MODE_NONE: 0,

	/**
	 * The element is to be replaced by the editor instance.
	 * @constant
	 */
	ELEMENT_MODE_REPLACE: 1,

	/**
	 * The editor is to be created inside the element.
	 * @constant
	 */
	ELEMENT_MODE_APPENDTO: 2,

	/**
	 * Used to indicate the ON or ACTIVE state.
	 * @constant
	 */
	TRISTATE_ON: 1,

	/**
	 * Used to indicate the OFF or NON ACTIVE state.
	 * @constant
	 */
	TRISTATE_OFF: 2,

	/**
	 * Used to indicate DISABLED state.
	 * @constant
	 */
	TRISTATE_DISABLED: 0,

	/**
	 * No selection.
	 * @constant
	 */
	SELECTION_NONE: 1,

	/**
	 * Text or collapsed selection.
	 * @constant
	 */
	SELECTION_TEXT: 2,

	/**
	 * Element selection.
	 * @constant
	 */
	SELECTION_ELEMENT: 3,

	/**
	 * Element node type.
	 * @constant
	 */
	NODE_ELEMENT: 1,

	/**
	 * Text node type.
	 * @constant
	 */
	NODE_TEXT: 3,

	/**
	 * Comment node type.
	 * @constant
	 */
	NODE_COMMENT: 8,

	/**
	 * Document node type.
	 * @constant
	 */
	NODE_DOCUMENT: 9,

	NODE_DOCUMENT_FRAGMENT: 11,

	POSITION_IDENTICAL: 0,
	POSITION_DISCONNECTED: 1,
	POSITION_FOLLOWING: 2,
	POSITION_PRECEDING: 4,
	POSITION_IS_CONTAINED: 8,
	POSITION_CONTAINS: 16,

	POSITION_AFTER_START: 1,	// <element>^contents</element>		"^text"
	POSITION_BEFORE_END: 2,		// <element>contents^</element>		"text^"
	POSITION_BEFORE_START: 3,	// ^<element>contents</element>		^"text"
	POSITION_AFTER_END: 4,		// <element>contents</element>^		"text"

	ENLARGE_ELEMENT: 1,
	ENLARGE_BLOCK_CONTENTS: 2,
	ENLARGE_LIST_ITEM_CONTENTS: 3,

	// Check boundary types.
	// @see dom.range.prototype.checkBoundaryOfElement
	START: 1,
	END: 2,
	STARTEND: 3,

	// Shrink range types.
	// @see dom.range.prototype.shrink
	SHRINK_ELEMENT: 1,
	SHRINK_TEXT: 2,

	STYLE_BLOCK: 1,
	STYLE_INLINE: 2,
	STYLE_OBJECT: 3

};