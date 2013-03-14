Klass.run(function(local){

	var editor = local.Editor;

	editor.manager.zIndex = {

		MAXIMIZE: 900,

		SELECT: 1200,

		COMBO: 1300,

		OVERLAY: 9999

	};

	editor.baseZIndex = function(index){
		index = typeof index === 'string' ? editor.manager.zIndex[index.toUpperCase()] : index;
		index = typeof index === 'number' ? index : 0;
		return (editor.config.baseFloatZIndex || 10000) + index;
	};

	editor.implement('baseZIndex', editor.baseZIndex);

});