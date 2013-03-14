/**
 * @fileOverview Defines the {@link Klass.Editor.dtd} object, which holds the DTD
 *		mapping for XHTML 1.0 Transitional. This file was automatically
 *		generated from the file: xhtml1-transitional.dtd.
 */

Klass.Editor.dtd = (function(){

	var $merge = Object.merge,

		A = {fieldset: 1, isindex: 1},
		B = {button: 1, input: 1, label: 1, select: 1, textarea: 1},
		C = $merge({a: 1}, B),
		D = $merge({iframe: 1}, C),
		E = {
			address: 1,
			article: 1,
			aside: 1,
			audio: 1,
			blockquote: 1,
			center: 1,
			command: 1,
			datagrid: 1,
			datalist: 1,
			details: 1,
			dl: 1,
			dialog: 1,
			dir: 1,
			div: 1,
			figure: 1,
			footer: 1,
			h1: 1,
			h2: 1,
			h3: 1,
			h4: 1,
			h5: 1,
			h6: 1,
			hr: 1,
			header: 1,
			hgroup: 1,
			keygen: 1,
			mark: 1,
			meter: 1,
			menu: 1,
			nav: 1,
			noframes: 1,
			noscript: 1,
			ol: 1,
			output: 1,
			pre: 1,
			progress: 1,
			section: 1,
			table: 1,
			time: 1,
			ul: 1,
			video: 1
		},
		F = {del: 1, ins: 1, script: 1, style: 1},
		G = $merge({
			abbr: 1,
			acronym: 1,
			b: 1,
			bdo: 1,
			br: 1,
			cite: 1,
			code: 1,
			dfn: 1,
			em: 1,
			i: 1,
			kbd: 1,
			q: 1,
			s: 1,
			samp: 1,
			span: 1,
			strike: 1,
			strong: 1,
			tt: 1,
			u: 1,
			'var': 1,
			wbr: 1,
			'#': 1
		}, F),
		H = $merge({applet: 1, basefont: 1, big: 1, font: 1, img: 1, map: 1, mark: 1, object: 1, small: 1, sub: 1, sup: 1}, G),
		I = $merge({p: 1}, H),
		J = $merge({iframe: 1}, H, B),
		K = {
			a: 1,
			abbr: 1,
			acronym: 1,
			address: 1,
			applet: 1,
			article: 1,
			aside: 1,
			audio: 1,
			b: 1,
			basefont: 1,
			bdo: 1,
			big: 1,
			blockquote: 1,
			br: 1,
			button: 1,
			center: 1,
			cite: 1,
			code: 1,
			command: 1,
			datagrid: 1,
			datalist: 1,
			del: 1,
			details: 1,
			dfn: 1,
			dialog: 1,
			dir: 1,
			div: 1,
			dl: 1,
			em: 1,
			fieldset: 1,
			figure: 1,
			font: 1,
			footer: 1,
			form: 1,
			h1: 1,
			h2: 1,
			h3: 1,
			h4: 1,
			h5: 1,
			h6: 1,
			hr: 1,
			header: 1,
			hgroup: 1,
			i: 1,
			iframe: 1,
			input: 1,
			ins: 1,
			img: 1,
			isindex: 1,
			kbd: 1,
			keygen: 1,
			label: 1,
			map: 1,
			mark: 1,
			menu: 1,
			meter: 1,
			nav: 1,
			noframes: 1,
			noscript: 1,
			object: 1,
			ol: 1,
			output: 1,
			p: 1,
			pre: 1,
			progress: 1,
			q: 1,
			s: 1,
			samp: 1,
			script: 1,
			select: 1,
			section: 1,
			small: 1,
			span: 1,
			strike: 1,
			strong: 1,
			sub: 1,
			sup: 1,
			table: 1,
			textarea: 1,
			time: 1,
			tt: 1,
			u: 1,
			ul: 1,
			'var': 1,
			video: 1,
			'#': 1
		},
		L = $merge({a: 1}, J),
		M = {tr: 1},
		N = {'#': 1},
		O = $merge({param: 1}, K),
		P = $merge({form: 1}, A, D, E, I),
		Q = {li: 1},
		R = {style: 1, script: 1},
		S = {base: 1, link: 1, meta: 1, title: 1},
		T = $merge(S, R),
		U = {head: 1, body: 1},
		V = {html: 1};

	var block = {
		address: 1,
		aside: 1,
		article: 1,
		audio: 1,
		blockquote: 1,
		center: 1,
		command: 1,
		datagrid: 1,
		datalist: 1,
		details: 1,
		dialog: 1,
		dir: 1,
		div: 1,
		dl: 1,
		fieldset: 1,
		figure: 1,
		footer: 1,
		form: 1,
		h1: 1,
		h2: 1,
		h3: 1,
		h4: 1,
		h5: 1,
		h6: 1,
		hr: 1,
		header: 1,
		hgroup: 1,
		isindex: 1,
		keygen: 1,
		menu: 1,
		meter: 1,
		nav: 1,
		noframes: 1,
		ol: 1,
		output: 1,
		p: 1,
		pre: 1,
		progress: 1,
		section: 1,
		table: 1,
		time: 1,
		ul: 1,
		video: 1
	};
	
	return /** @lends Klass.Editor.dtd */ {
	
		// The "$" items have been added manually.
		
		/**
		 * List of block elements, like "p" or "div".
		 * @type Object
		 * @example
		 */
		$block: block,
		
		/**
		 * List of block limit elements.
		 * @type Object
		 * @example
		 */
		$blockLimit: {
			article: 1,
			aside: 1,
			audio: 1,
			body: 1,
			caption: 1,
			command: 1,
			datagrid: 1,
			datalist: 1,
			details: 1,
			dialog: 1,
			div: 1,
			figure: 1,
			footer: 1,
			form: 1,
			header: 1,
			hgroup: 1,
			keygen: 1,
			menu: 1,
			meter: 1,
			nav: 1,
			output: 1,
			progress: 1,
			section: 1,
			td: 1,
			th: 1,
			time: 1,
			video: 1
		},
		
		/**
		 * List of elements that can be children at &lt;body&gt;.
		 */
		$body: $merge({script: 1, style: 1}, block),

		$cdata: {script: 1, style: 1},

		/**
		 *  List of block tags with each one a singleton element lives in the corresponding structure for description.
		 */
		$captionBlock: {
			caption: 1,
			legend: 1
		},

		/**
		 * List of empty (self-closing) elements, like "br" or "img".
		 * @type Object
		 * @example
		 */
		$empty: {
			area: 1,
			base: 1,
			br: 1,
			col: 1,
			hr: 1,
			img: 1,
			input: 1,
			link: 1,
			meta: 1,
			param: 1,
			wbr: 1
		},

		/**
		 * List of inline (&lt;span&gt; like) elements.
		 */
		$inline: L, // Just like span.
		
		/**
		 * List of list item elements, like "li" or "dd".
		 * @type Object
		 * @example
		 */
		$listItem: {
			dd: 1,
			dt: 1,
			li: 1
		},
		
		/**
		 * List of list root elements.
		 * @type Object
		 * @example
		 */
		$list: {
			ul: 1,
			ol: 1,
			dl: 1
		},

		// List of elements living outside body.
		$nonBodyContent: $merge(V, U, S),			

		/**
		 * Elements that accept text nodes, but are not possible to edit into
		 * the browser.
		 * @type Object
		 * @example
		 */
		$nonEditable: {
			applet: 1,
			audio: 1,
			button: 1,
			embed: 1,
			iframe: 1,
			map: 1,
			object: 1,
			option: 1,
			script: 1,
			textarea: 1,
			param: 1,
			video: 1
		},
		
		/**
		 * List of elements that can be ignored if empty, like "b" or "span".
		 * @type Object
		 * @example
		 */
		$removeEmpty: {
			abbr: 1,
			acronym: 1,
			address: 1,
			b: 1,
			bdo: 1,
			big: 1,
			cite: 1,
			code: 1,
			del: 1,
			dfn: 1,
			em: 1,
			font: 1,
			i: 1,
			ins: 1,
			kbd: 1,
			label: 1,
			mark: 1,
			q: 1,
			s: 1,
			samp: 1,
			small: 1,
			span: 1,
			strike: 1,
			strong: 1,
			sub: 1,
			sup: 1,
			tt: 1,
			u: 1,
			'var': 1
		},
		
		/**
		 * List of elements that have tabindex set to zero by default.
		 * @type Object
		 * @example
		 */
		$tabIndex: {
			a: 1,
			area: 1,
			button: 1,
			input: 1,
			object: 1,
			select: 1,
			textarea: 1
		},
		
		/**
		 * List of elements used inside the "table" element, like "tbody" or "td".
		 * @type Object
		 * @example
		 */
		$tableContent: {
			caption: 1,
			col: 1,
			colgroup: 1,
			tbody: 1,
			td: 1,
			tfoot: 1,
			th: 1,
			thead: 1,
			tr: 1
		},

		a: J,
		abbr: L,
		acronym: L,
		address: $merge(D, I),
		applet: O,
		area: {},
		article: P,
		aside: P,
		audio: O,	
		b: L,
		base: {},
		basefont: {},
		bdo: L,
		big: L,
		blockquote: P,
		body: P,
		br: {},
		button: $merge(E, I),
		caption: L,
		center: P,
		cite: L,
		code: L,
		col: {},
		colgroup: {col: 1},
		command: L,
		datagrid: O,
		datalist: O,
		dd: P,
		del: L,
		details: O,
		dfn: L,
		dialog: P,
		dir: Q,
		div: P,
		dl: {dd: 1, dt: 1},
		dt: L,
		em: L,
		fieldset: $merge({legend: 1}, K),
		figure: P,
		font: L,
		footer: P,
		form: $merge(A, D, E, I),
		h1: L,
		h2: L,
		h3: L,
		h4: L,
		h5: L,
		h6: L,
		head: T,
		header: P,
		hgroup: P,
		hr: {},
		html: U,
		i: L,
		iframe: P,
		img: {},
		input: {},
		ins: L,
		isindex: {},
		kbd: L,
		keygen: L,
		label: L,
		legend: L,
		li: P,
		link: {},
		map: $merge({area: 1, form: 1, p: 1}, A, E, F),
		mark: L,
		menu: L,
		meta: {},
		meter: L,
		nav: P,
		noframes: P,
		noscript: P,
		object: O,
		ol: Q,
		optgroup: {option: 1},
		option: N,
		output: L,
		p: L,
		param: {},
		pre: $merge(C, G),
		progress: O,
		q: L,
		s: L,
		samp: L,
		script: N,
		section: P,
		select: {optgroup: 1, option: 1},
		small: L,
		span: L,
		strike: L,
		strong: L,
		style: N,
		sub: L,
		sup: L,
		table: {
			caption: 1,
			col: 1,
			colgroup: 1,
			tbody: 1,
			tfoot: 1,
			thead: 1,
			tr: 1
		},
		tbody: M,
		td: P,
		textarea: N,
		tfoot: M,
		th: P,
		thead: M,
		time: L,
		title: N,
		tr: {td: 1, th: 1},
		tt: L,
		u: L,
		ul: Q,
		'var': L,
		video: O,
		wbr: L
	};

})();