(function($E, undefined){

	function filterName(name, filters){
		for (var i = 0; name && i < filters.length; i++){
			var filter = filters[i];
			name = name.replace(filter[0], filter[1]);
		}
		return name;
	}
	
	function addItemsToList(list, items, priority){
		if (typeof items === 'function') items = [items];
		
		var i, j, listLength = list.length, 
			itemsLength = items && items.length;
		
		if (itemsLength){
			// Find the index to insert the items at.
			for (i = 0; i < listLength && list[i].pri < priority; i++){ /*jsl:pass*/
			}
			
			// Add all new items to the list at the specific index.
			for (j = itemsLength - 1; j >= 0; j--){
				var item = items[j];
				if (item){
					item.pri = priority;
					list.splice(i, 0, item);
				}
			}
		}
	}
	
	function addNamedItems(hashTable, items, priority){
		if (items){
			for (var name in items){
				var current = hashTable[name];
				
				hashTable[name] = transformNamedItem(current, items[name], priority);
				
				if (!current) hashTable.$length++;
			}
		}
	}
	
	function transformNamedItem(current, item, priority){
		if (item){
			item.pri = priority;
			
			if (current){
				// If the current item is not an Array, transform it.
				if (!current.splice){
					current = current.pri > priority ? [item, current] : [current, item];
					current.filter = callItems;
				} else addItemsToList(current, item, priority);
				
				return current;
			} else {
				return item.filter = item;
			}
		}
	}
	
	// Invoke filters sequentially on the array, break the iteration
	// when it doesn't make sense to continue anymore.
	function callItems(currentEntry){
		var isNode = currentEntry.type || currentEntry instanceof $E.htmlParser.fragment;
		
		for (var i = 0, l = this.length; i < l; i++){
			// Backup the node info before filtering.
			if (isNode){
				var orgType = currentEntry.type, 
					orgName = currentEntry.name;
			}
			
			var item = this[i], result = item.apply(window, arguments);
			
			if (result === false) return result;
			
			// We're filtering node (element/fragment).
			if (isNode){
				// No further filtering if it's not anymore
				// fitable for the subsequent filters.
				if (result && (result.name != orgName || result.type != orgType)){ return result; }
			}   // Filtering value (nodeName/textValue/attrValue).
			else {
				// No further filtering if it's not
				// any more values.
				if (typeof result !== 'string') return result;
			}
			
			result != undefined && (currentEntry = result);
		}
		
		return currentEntry;
	}

	$E.htmlParser.filter = new Class({

		initialize: function(rules){
			this.elements = {
				$length: 0
			};

			this.attributes = {
				$length: 0
			};

			this.elementNames = [];
			this.attributeNames = [];
			
			if (rules) this.addRules(rules, 10);
		},
		
		addRules: function(rules, priority){
			if (typeof priority !== 'number') priority = 10;

			// Add the elementNames.
			addItemsToList(this.elementNames, rules.elementNames, priority);

			// Add the attributeNames.
			addItemsToList(this.attributeNames, rules.attributeNames, priority);
			
			// Add the elements.
			addNamedItems(this.elements, rules.elements, priority);
			
			// Add the attributes.
			addNamedItems(this.attributes, rules.attributes, priority);

			// Add the text.
			this.text = transformNamedItem(this.text, rules.text, priority) || this.text;
			
			// Add the comment.
			this.comment = transformNamedItem(this.comment, rules.comment, priority) || this.comment;
			
			// Add root fragment.
			this.root = transformNamedItem(this.root, rules.root, priority) || this.root;
		},
			
		onElementName: function(name){
			return filterName(name, this.elementNames);
		},
			
		onAttributeName: function(name){
			return filterName(name, this.attributeNames);
		},
			
		onText: function(text){
			var textFilter = this.text;
			return textFilter ? textFilter.filter(text) : text;
		},
			
		onComment: function(commentText, comment){
			var textFilter = this.comment;
			return textFilter ? textFilter.filter(commentText, comment) : commentText;
		},
		
		onFragment: function(element){
			var rootFilter = this.root;
			return rootFilter ? rootFilter.filter(element) : element;
		},
			
		onElement: function(element){
			// We must apply filters set to the specific element name as
			// well as those set to the generic $ name. So, add both to an
			// array and process them in a small loop.
			var filters = [this.elements['^'], this.elements[element.name], this.elements.$], filter, ret;
			
			for (var i = 0; i < 3; i++){
				filter = filters[i];
				if (filter){
					ret = filter.filter(element, this);
					
					if (ret === false) return null;
					
					if (ret && ret != element) return this.onNode(ret);
					
					// The non-root element has been dismissed by one of the filters.
					if (element.parent && !element.name) break;
				}
			}
			
			return element;
		},
			
		onNode: function(node){
			var type = node.type;
			
			return type === $E.$['NODE_ELEMENT'] ? this.onElement(node) : 
				type === $E.$['NODE_TEXT'] ? new $E.htmlParser.text(this.onText(node.value)) : 
				type === $E.$['NODE_COMMENT'] ? new $E.htmlParser.comment(this.onComment(node.value)) : null;
		},
			
		onAttribute: function(element, name, value){
			var filter = this.attributes[name];
			
			if (filter){
				var result = filter.filter(value, element, this);
				if (result === false) return false;
				if (result !== undefined) return result;
			}
			
			return value;
		}

	});

})(Klass.Editor);