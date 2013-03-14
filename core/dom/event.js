(function(local){

	var dom = local.DOM,
		event = local.event;

	var F = function(name){
		return function(){
			var args = Array.from(arguments);
			return event[name].apply(this, [this[0]].concat(args));
		};
	};

	Array.forEach([
		'addEvent', 'addEvents', 'removeEvent', 'removeEvents',
		'stopEvent', 'pauseEvent', 'restartEvent', 'fireEvent'
	], function(name){
		[dom.window, dom.document, dom.element].invoke('implement', name, F(name));
	});

	/*[dom.window, dom.document, dom.element].invoke('implement', {

		addEvent: function(type, fn){
			var events = this.retrieve('events', {});
			if (!events[type]) events[type] = {keys: [], values: [], stop: false, pause: false};
			if (events[type].keys.contains(fn)) return this;
			events[type].keys.push(fn);
			var realType = type,
				custom = customEvents[type],
				condition = fn,
				self = this;
			if (custom){
				if (custom.onAdd) custom.onAdd.call(this, fn);
				if (custom.condition){
					condition = function(event){
						if (custom.condition.call(this, event)) return fn.call(this, event);
						return true;
					};
				}
				realType = custom.base || realType;
			}
			var defn = function(){
				return fn.call(self);
			};
			var nativeEvent = nativeEvents[realType];
			if (nativeEvent){
				if (nativeEvent == 2){
					defn = function(event){
						event = new local.DOMEvent(event, self.getWindow()[0]);
						if (events[type].pause) return false;
						if (events[type].stop) return events[type].stop = false;
						if (condition.call(self, event) === false) event.stop();
					};
				}
				this.addListener(realType, defn);
			}
			events[type].values.push(defn);
			return this;
		},

		removeEvent: function(type, fn){
			var events = this.retrieve('events');
			if (!events || !events[type]) return this;
			var list = events[type];
			var index = list.keys.indexOf(fn);
			if (index == -1) return this;
			var value = list.values[index];
			delete list.keys[index];
			delete list.values[index];
			var custom = customEvents[type];
			if (custom){
				if (custom.onRemove) custom.onRemove.call(this, fn);
				type = custom.base || type;
			}
			return (nativeEvents[type]) ? this.removeListener(type, value) : this;
		},

		stopEvent: function(type){
			var events = this.retrieve('events');
			if (events && events[type]) events[type].stop = true;
			return this;
		},

		pauseEvent: function(type){
			var events = this.retrieve('events');
			if (events && events[type]) events[type].pause = true;
			return this;
		},

		restartEvent: function(type){
			var events = this.retrieve('events');
			if (events && events[type]) events[type].pause = false;
			return this;
		},

		addEvents: function(events){
			for (var event in events) this.addEvent(event, events[event]);
			return this;
		},

		removeEvents: function(events){
			var type;
			if (local.type(events) == 'object'){
				for (type in events) this.removeEvent(type, events[type]);
				return this;
			}
			var attached = this.retrieve('events');
			if (!attached) return this;
			if (!events){
				for (type in attached) this.removeEvents(type);
				this.eliminate('events');
			} else if (attached[events]){
				attached[events].keys.each(function(fn){
					this.removeEvent(events, fn);
				}, this);
				delete attached[events];
			}
			return this;
		},

		fireEvent: function(type, args, delay){
			var events = this.retrieve('events');
			if (!events || !events[type]) return this;
			args = Array.from(args);

			events[type].keys.each(function(fn){
				if (events[type].pause) return false;
				if (delay) fn.delay(delay, this, args);
				else fn.apply(this, args);
			}, this);
			return this;
		},

		cloneEvents: function(from, type){
			from = document.id(from);
			var events = from.retrieve('events');
			if (!events) return this;
			if (!type){
				for (var eventType in events) this.cloneEvents(from, eventType);
			} else if (events[type]){
				events[type].keys.each(function(fn){
					this.addEvent(type, fn);
				}, this);
			}
			return this;
		}

	});

	var check = function(event){
		var related = event.relatedTarget;
		if (related == null) return true;
		if (!related) return false;
		return (related != this[0] && related.prefix != 'xul' && !this.$document && !this.contains(related));
	};

	var nativeEvents = {
		click: 2, dblclick: 2, mouseup: 2, mousedown: 2, contextmenu: 2, //mouse buttons
		mousewheel: 2, DOMMouseScroll: 2, //mouse wheel
		mouseover: 2, mouseout: 2, mousemove: 2, selectstart: 2, selectend: 2, //mouse movement
		keydown: 2, keypress: 2, keyup: 2, //keyboard
		orientationchange: 2, // mobile
		touchstart: 2, touchmove: 2, touchend: 2, touchcancel: 2, // touch
		gesturestart: 2, gesturechange: 2, gestureend: 2, // gesture
		focus: 2, blur: 2, change: 2, reset: 2, select: 2, submit: 2, //form elements
		focusin: 2, focusout: 2, beforedeactivate: 2, //form elements extend
		beforecut: 1, cut: 1, copy: 1, beforepaste: 2, paste: 2, //clipboard 
		load: 2, unload: 1, beforeunload: 2, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
		error: 1, abort: 1, scroll: 1 //misc
	};

	var customEvents = {

		mouseenter: {
			base: 'mouseover',
			condition: check
		},

		mouseleave: {
			base: 'mouseout',
			condition: check
		},

		mousewheel: {
			base: (local.env.firefox) ? 'DOMMouseScroll' : 'mousewheel'
		}

	};*/

	Object.append(event.nativeEvents, {
		beforedeactivate: 2, //form elements extend
		beforecut: 1, cut: 1, copy: 1, beforepaste: 2 //clipboard 
	});

	local.DOMEvent.implement({

		getTarget: function(){
			return this.target ? document.node(this.target) : null;
		}

	});

})(Klass);