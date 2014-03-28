/*! Byda.js v0.0.1 || Eric McDaniel */
;(function() {

	var _globalComplete,
		_suffix = 'load',
		_base = window.location.origin,
		_imports = false,
		_frozen;

	var supportsImports = (function() {
		return 'import' in document.createElement('link');
	})();

	var noop = function() {};

	/**
	 * Core Functions
	 */

	function getSelector() {
		return '[data-' + _suffix + ']';
	}

	// Parse options and begin XHR
	function byda(options, callback) {
		// byda() is shorthand for byda.freeze();
		if (!options) return byda.freeze();

		// If a string is passed as the options paramter, assume it is a path to a file
		if ('string' == typeof options) options = { file: options };

		// options.view is shorthand for 'views/{name}.html'.
		if (options.view) options.file =  'views/' + options.view + '.html';

		// If a callback is passed as the second parameter, add or overwrite options.callback.
		if ('function' == typeof callback) options.callback = callback;

		// If options.json exists, create an object with the request (string or array), and an empty
		// results object.
		if (options.json) {
			options.json = 'string' == typeof options.json ? { 'default' : options.json } : options.json;
			options.json = { req: options.json, res: {} };
		}

		if (_imports && supportsImports) {

			var link = document.createElement('link');
			var href = _base ? _base + '/' + options.file : options.file;

			link.rel = 'import';
			link.href = href;

			var current = document.querySelector('link[href="' + href + '"]');

			if (current) current.remove();

			link.onload = function(e) {
				options.import = link.import;
				request(options);
			};

			link.onerror = function(e) {
				failure(options);
			};

			document.head.appendChild(link);
		} else {
			// Start XHR with options.
			request(options);
		}
	}

	// Retrieve the contents of json files specified in options.json and the view specified in options.file.
	function request(options) {
		var file = options.file, 
			jsonTitle,
			response;

		// Handle .json files
		if (options.json) {
			// Get the title of the first request.
			jsonTitle = Object.keys(options.json.req)[0];

			// If a title exists, set the file to the corresponding JSON request. If no title exists
			// and no file exists, complete byda with the options. 
			if (jsonTitle) {
				file = options.json.req[jsonTitle];	
			} else if (!file) {
				// If an HTML import occured, call success() with the import as the response.
				return options.import ? success(options.import, options) : complete(options);
			}
		}

		// Create a new XMLHttpRequest.
		if (xhr && xhr.readyState < 4) {
			xhr.onreadystatechange = noop;
			xhr.abort();
		}

		var xhr = new XMLHttpRequest();

		// If a base path is specified, prepend it to the file path.
		file = _base ? _base + '/' + file : file;

		xhr.open('GET', file, true);
		xhr.setRequestHeader('X-BYDA', 'true');

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if (xhr.status == 200 || (xhr.status === 0 && file.indexOf('file:///') != -1)) {
					// If there is a jsonTitle, parse the responseText as JSON
					if (jsonTitle) {
						response = JSON.parse(xhr.responseText);

						// If it is a single, default request, set the result to the response for
						// easy access upon completion. If there are multiple requests, add it to
						// the results object.
						if (jsonTitle == 'default') options.json.res = response;
						else options.json.res[jsonTitle] = response;

						// Delete the request.
						delete options.json.req[jsonTitle];

						// Begin a new request with the remaining options.
						return request(options);
					} else {
						response = xhr.responseText;
						// Return the XHR result and options to the success function
						return success(response, options);
					}
				} else {
					if (jsonTitle) {
						console.error('Cannot return "' + jsonTitle + '" data.','Could not get: ' + options.json.req[jsonTitle]);
						
						// Delete the request.
						delete options.json.req[jsonTitle];

						// Begin a new request with the remaining options.
						return request(options);
					}
					// Couldn't find the view file.
					return failure(options);
				}
			}
		};

		// Send the XHR
		xhr.send();
	}

	// XHR succeeded and we can begin swapping content
	function success(response, options) {
		// Make a flash of the index page.
		var flash = byda.flash();

		// Make a flash with the DOM from the XHR responseText.
		var next = byda.flash({ dom: response });

		// Compare the flash of the index page with the flash of the result DOM.
		flash.compare(next);

		// Swap all content from the elements of the index page with the flash of the result DOM.
		flash.commit();

		// Complete byda with the options.
		complete(options);
	}

	function failure(options) {
		throw new Error('Could not get: ' + options.file);
	}

	// Perform callback functions
	function complete(options) {
		// If a global complete callback was specified, call it with the options
		if ('function' == typeof _globalComplete) _globalComplete(options);

		// If a local complete callback was specified, call it with a flash of the updated elements
		// and any JSON results
		if (options.callback) options.callback(byda.flash({ condensed: true }), options.json ? options.json.res : null);
	}

	/**
	 * Object Constructors
	 */

	// A Change contains an index element and a corresponding element from a loaded file
	function Change(from, to) {
		this.from = from;
		this.to = to;
	}

	// Swap the innerHTML value of the index element to the innerHTML value of the loaded element
	Change.prototype.swap = function() {
		if (!this.from || !this.to) return;
		this.from.innerHTML = this.to.innerHTML;
	};

	// A Flash contains a list of byda elements that can be organized, compared against other 
	// flashes, and condensed.
	function Flash(options) {
		if (!options) options = {};
		this.changes = [];
		this.elements = {};
		this.list = options.dom ? byda.get(options.dom) : byda.get();
		this.frozen = options.frozen || false;
		this.condensed = options.condensed || false;

		return this.init();
	}

	Flash.prototype.init = function() {
		this.organize();
		if (this.condensed) return this.condense();
	};

	// Compress the flash to contain only a condensed organization of byda elements
	Flash.prototype.condense = function() {
		var collection,
			condensed = {};

		function collect(group) {
			var _collection = group;

			_collection.set = function(value) {
				if (_collection.nodeType) {
					_collection.innerHTML = value;
				} else {
					for (_i = 0, _len = _collection.length; _i < _len; _i++) {
						_collection[_i].innerHTML = value;
					}
				}

				return _collection;
			};

			return _collection;
		}

		for (var name in this.elements) {
			collection = this.elements[name];
			condensed[name] = collect(this.elements[name].length === 1 ? this.elements[name][0] : this.elements[name]);
		}

		return condensed;
	};

	// Compare the contents of one flash against another and generate a list of Change objects
	Flash.prototype.compare = function(flash) {
		var _i, _len, change, fallback, to, source;

		// Return if the method was called without a flash or if either flash is condensed.
		if (!flash || flash.condensed || this.condensed) return;

		// Set the source elements equal to frozen elements or elements of the flash of interest.
		source = _frozen ? _frozen.elements : flash.elements;

		for (var name in source) {
			// If this flash has that a group of elements with the current name  
			if (this.elements[name]) {
				// Generate a fallback to either a frozen group of elements or the current 
				// elements.
				fallback = _frozen ? _frozen.elements[name] : this.elements[name];

				// Set the 'to' variable to either the flash of interests group or the fallback
				to = flash.elements[name] || fallback;
				// Loop over each element in the group and generate a Change, and push the change
				// object to this.changes.
				for (_i = 0, _len = to.length; _i < _len; _i++) {
					change = new Change(this.elements[name][_i], to[_i]);
					this.changes.push(change);
				}
			}
		}

		// Give the flash of interest a list of changes as well
		flash.changes = this.changes;

		return this;
	};

	// Organize a list of byda elements into groups by byda data value.
	Flash.prototype.organize = function(list) {
		var _i, _len, el, name;

		// Reset the elements object.
		this.elements = {};

		// If list of elements parameter wasn't provided, use the intrinsic list
		if (!list) list = this.list;

		for (_i = 0, _len = list.length; _i < _len; _i++) {
			el = this.frozen ? list[_i].cloneNode(true) : list[_i];
			name = list[_i].getAttribute('data-' + _suffix);
			if (!this.elements[name]) this.elements[name] = [];
			this.elements[name].push(el);
		}

		return this;
	};

	// Call the swap method on each change in the flashes list of changes.
	Flash.prototype.commit = function() {
		var _i, _len;
		for (_i = 0, _len = this.changes.length; _i < _len; _i++) {
			this.changes[_i].swap();
		}
	};

	/**
	 * Exposed Functions
	 */

	// Initialize byda with options.
	byda.init = function(options) {
		// Return if no options parameter was passed.
		if (!options) return;

		// If the options parameter is a string, assume it is a data attribute suffix. 
		if ('string' == typeof options) { 
			_suffix = options; 
			return;
		}

		// The options 'data' and 'suffix' are valid to specify a data attribute suffix.
		if (options.data) _suffix = options.data;
		if (options.suffix) _suffix = options.suffix;

		if (options.imports) _imports = options.imports;

		// Set the base variable to a file path string.
		if (options.base) _base = options.base;

		// Set the global complete callback to the options.complete function.
		if ('function' == typeof options.complete) _globalComplete = options.complete;

		// Make a flash and store it in the variable _frozen to use as default innerHTML values
		if (options.freeze) this.freeze();
	};

	// Set the base path to a specified string.
	byda.base = function(string) {
		if (string) _base = string;
		return _base;
	};

	// Get any elements with the data attribute generated by getSelector().
	byda.get = function(dom) {
		if (!dom) dom = document;
		if ('string' == typeof dom) dom = new DOMParser().parseFromString(dom, 'text/html');
		if (dom.nodeType) return dom.querySelectorAll(getSelector());
	};

	// Return a new Flash object.
	byda.flash = function(options) {
		return new Flash(options);
	};

	// Make a flash and clone / organize the nodes into the _frozen object. These elements are used
	// as default innerHTML values if there is no matching element between the index and loaded 
	// file.
	byda.freeze = function(options) {
		var data,
			temp = [];

		_frozen = byda.flash({frozen: true});

		console.log(getSelector() + ' elements are now frozen.');

		return _frozen;
	};

	/**
	 * Expose Byda
	 */

	if ('undefined' == typeof module) {
		if (!window.load) window.load = byda;
		if (!window.byda) window.byda = byda;
	} else {
		module.exports = byda;
	}

})();