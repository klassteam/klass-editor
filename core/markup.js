Klass.Editor.markup = {

	mainContainer: '<div id="{baseCls}{uid}" class="{baseCls}"><div></div></div>',

	iframeContainer: '<iframe frameborder="0" allowtransparency="true" tabindex="{tabIndex}" src="{src}" style="width:100%; height:100%;"></iframe>',

	iframeContent: '<!DOCTYPE html><html dir="{direction}"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><title>{title}</title>{contentsCss}<style type="text/css">{baseCss}{externalCss}</style>{baseHead}{externalHead}</head><body>{content}</body></html><script type="text/javascript" id="kse-script" data-rte-temp="1">{script}</script>',

	button: '<span class="kse-icon"></span><span class="kse-label">{title}</span>',

	select: '<span class="kse-label kse-inline">{label}</span><span class="kse-handle"><span class="kse-arrow"></span></span>',

	panelBlock: '<div class="kse-panel-block" tabIndex="-1"><ul></ul></div>',

	comboPanel: '<div class="kse-richcombo"></div>',

	comboPanelContent: '<!DOCTYPE html><html dir="{direction}"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><title>{title}</title>{contentsCss}<style type="text/css">{baseCss} {externalCss}</style>{baseHead}{externalHead}</head><body class="kse-panel-frame"></body></html>',

	resize: '<div class="x-rte-resize"><div class="x-rte-resize-larger" title="{larger}">{larger}</div><div class="x-rte-resize-smaller" title="{smaller}">{smaller}</div></div>',

	dialog: '<div class="kse-skin kse-dialog {browserCSSClass}"><div class="kse-dialog-title">{title}</div><div class="kse-dialog-close" title="{close}">{close}</div><div class="kse-dialog-main"><div class="kse-dialog-tabs"></div><div class="kse-dialog-tips"><div class="kse-tip kse-error"></div></div><div class="kse-dialog-contents">{contents}</div><div class="kse-dialog-buttons"></div></div></div>',
	
	richCombo: {
		item: '<span class="x-rte-richcombo-selected"></span>{preview}<span class="x-rte-richcombo-snapshot"></span>'
	},

	color: {
		button: '<span class="kse-icon"></span><span class="kse-label">{label}</span><span class="kse-buttonarrow"></span><div class="kse-colorbar"></div>',
		block: '',
		panel: ''
	},

	palette: {
		wrap: '<div class="kse-palette"><div class="kse-palette-inherit"><a class="kse-palette-color-auto" href="javascript:void(0);" hidefocus="true"><table class="kse-palette-table" width="100%" cellspacing="0" cellpadding="0"><tbody><tr><td class="kse-palette-cell"><span class="kse-palette-restore"></span></td><td colspan="7">{autoInherit}</td></tr></tbody></table></a></div><div class="kse-palette-standard"><h4>{standardColors}</h4>{standardColorTable}</div><div class="kse-palette-theme"><h4>{themeColors}</h4>{themesTable}</div><div class="kse-palette-themes">{themeColorsTable}</div><div class="kse-palette-more" style="display:{enableMore};"><a class="kse-palette-color-more" href="javascript:void(0);" kse-color="?">{moreColors}</a></div></div>',
		table: '<table class="kse-palette-table" cellspacing="0" cellpadding="0"><tbody class="kse-palette-body">{rows}</tbody></table>',
		row: '<tr class="kse-palette-row">{cells}</tr>',
		cell: '<td class="kse-palette-cell">{item}</td>',
		ul: '<ul class="kse-palette-ul">{lists}</ul>',
		li: '<li class="kse-palette-li">{items}</li>',
		item: '<a class="kse-palette-color" href="javascript:void(0);" hidefocus="true" kse-color="{color}"><span class="kse-palette-color" style="background-color:#{color};"></span></a>'
	}

};