(function(local, undefined){

	/**
	 * Represents a list os Klass.DOM.range objects, which can be easily
	 * iterated sequentially.
	 * @constructor
	 * @param {Klass.DOM.range|Array} [ranges] The ranges contained on this list.
	 *		Note that, if an array of ranges is specified, the range sequence
	 *		should match its DOM order. This class will not help to sort them.
	 */
	local.DOM.ranges = function(ranges){
		if (ranges instanceof local.DOM.ranges) return ranges;
		
		if (!ranges) ranges = [];
		else if (ranges instanceof local.DOM.range) ranges = [ranges];
		
		return Object.append(ranges, mixins);
	};
	
	var mixins = {

		/**
		 * Creates an instance of the rangeList iterator, it should be used
		 * only when the ranges processing could be DOM intrusive, which
		 * means it may pollute and break other ranges in this list.
		 * Otherwise, it's enough to just iterate over this array in a for loop.
		 * @returns {Klass.DOM.rangesIterator}
		 */
		createIterator: function(){
			var rangeList = this, bookmark = local.DOM.walker.bookmark(), guard = function(node){
				return !(node.is && node.is('tr'));
			}, bookmarks = [], current;
			
			/**
			 * @lends Klass.DOM.rangesIterator.prototype
			 */
			return {
			
				/**
				 * Retrieves the next range in the list.
				 * @param {Boolean} mergeConsequent Whether join two adjacent ranges into single, e.g. consequent table cells.
				 */
				getNextRange: function(mergeConsequent){
					current = current == undefined ? 0 : current + 1;
					
					var range = rangeList[current];

					// Multiple ranges might be mangled by each other.
					if (range && rangeList.length > 1){
						// Bookmarking all other ranges on the first iteration,
						// the range correctness after it doesn't matter since we'll
						// restore them before the next iteration.
						if (!current){
							// Make sure bookmark correctness by reverse processing.
							for (var i = rangeList.length - 1; i >= 0; i--) 
								bookmarks.unshift(rangeList[i].createBookmark(true));
						}
						
						if (mergeConsequent){
							// Figure out how many ranges should be merged.
							var mergeCount = 0;
							while (rangeList[current + mergeCount + 1]){
								var doc = range.document, found = 0, 
									left = doc.get(bookmarks[mergeCount].endNode), 
									right = doc.get(bookmarks[mergeCount + 1].startNode), next;

								// Check subsequent range.
								while (1){
									next = left.getNextSourceNode(false);
									if (!right.equals(next)){
										// This could be yet another bookmark or
										// walking across block boundaries.
										if (bookmark(next) || (next.$element && next.isBlockBoundary())){
											left = next;
											continue;
										}
									} else found = 1;
									
									break;
								}
								
								if (!found) break;
								
								mergeCount++;
							}
						}
						
						range.moveToBookmark(bookmarks.shift());

						// Merge ranges finally after moving to bookmarks.
						while (mergeCount--){
							next = rangeList[++current];
							next.moveToBookmark(bookmarks.shift());
							range.setEnd(next.endContainer, next.endOffset);
						}
					}
					
					return range;
				}
			};
		},
		
		createBookmarks: function(serializable){
			var result = [], bookmark;
			for (var i = 0; i < this.length; i++){
				result.push(bookmark = this[i].createBookmark(serializable, true));
	
				// Updating the container & offset values for ranges
				// that have been touched.
				for (var j = i + 1; j < this.length; j++){
					this[j] = updateDirtyRange(bookmark, this[j]);
					this[j] = updateDirtyRange(bookmark, this[j], true);
				}
			}
			return result;
		},
		
		createBookmarks2: function(normalized){
			var bookmarks = [];
			
			for (var i = 0; i < this.length; i++) 
				bookmarks.push(this[i].createBookmark2(normalized));
			
			return bookmarks;
		},
		
		/**
		 * Move each range in the list to the position specified by a list of bookmarks.
		 * @param {Array} bookmarks The list of bookmarks, each one matching a range in the list.
		 */
		moveToBookmarks: function(bookmarks){
			for (var i = 0; i < this.length; i++) 
				this[i].moveToBookmark(bookmarks[i]);
		}

	};
	
	// Update the specified range which has been mangled by previous insertion of
	// range bookmark nodes.(#3256)
	function updateDirtyRange(bookmark, dirtyRange, checkEnd){
		var serializable = bookmark.serializable, 
			container = dirtyRange[checkEnd ? 'endContainer' : 'startContainer'], 
			offset = checkEnd ? 'endOffset' : 'startOffset';
		
		var bookmarkStart = serializable ? dirtyRange.document.get(bookmark.startNode) : bookmark.startNode;
		
		var bookmarkEnd = serializable ? dirtyRange.document.get(bookmark.endNode) : bookmark.endNode;
		
		if (container.equals(bookmarkStart.prev())){
			dirtyRange.startOffset = dirtyRange.startOffset - container.getLength() - bookmarkEnd.prev().getLength();
			container = bookmarkEnd.next();
		} else if (container.equals(bookmarkEnd.prev())){
			dirtyRange.startOffset = dirtyRange.startOffset - container.getLength();
			container = bookmarkEnd.next();
		}
		
		container.equals(bookmarkStart.parent()) && dirtyRange[offset]++;
		container.equals(bookmarkEnd.parent()) && dirtyRange[offset]++;
		
		// Update and return this range.
		dirtyRange[checkEnd ? 'endContainer' : 'startContainer'] = container;
		return dirtyRange;
	}

})(Klass);