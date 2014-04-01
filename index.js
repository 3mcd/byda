/*! Byda.js v0.0.1 || Eric McDaniel */
;(function() {

	'use strict';

	var _base, // Default base path.
		_frozen, // Stores a frozen flash.
		_globalComplete, // Stores a callback function called after Byda is complete.
		_imports = false, // Disable HTML5 imports by default.
		_suffix = 'load'; // Default data-attribute suffix.

	// Check to see if the browser supports HTML5 imports.
	var supportsImports = 'import' in document.createElement('link');

	// An empty callback function.
	var noop = function() {};

	/**
	 * Core Functions
	 */

	// Get the data attribute selector that is used across Byda.
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

		// If Byda was initialized with imports: true and the browser supports imports, use HTML5
		// imports.
		if (_imports && supportsImports) {

			// Create a new <link> element.
			var link = document.createElement('link');

			// Define an href variable that contains the link to the file/view being loaded.
			var href = _base ? _base + '/' + options.file : options.file;

			// Set the rel attribute of the link element to 'import' and the href to the href
			// variable.
			link.rel = 'import';
			link.href = href;

			// Detect a current link element with an identical href value.
			var current = document.querySelector('link[href="' + href + '"]');

			// If it exists, remove it from the DOM.
			if (current) current.remove();

			// When the link attribute is done loading, reference the import contents with
			// the options.import property and start a new request to catch any json requests
			// that were passed in the options.
			link.onload = function(e) {
				options.import = link.import;
				request(options);
			};

			// Error handler
			link.onerror = function(e) {
				failure(options);
			};

			// Append the newly created link element to the head of the document.
			document.head.appendChild(link);
		} else {
			// Start XHR with options.
			request(options);
		}
	}

	// Retrieve the contents of json files specified in options.json and the view specified in
	// options.file.
	function request(options) {
		var file = options.file, // The file (if any) that the XHR will attempt to GET.
			json, // Stores the title of a json request (if any).
			response; // Stores the raw responseText or JSON parsed responseText.

		// Handle .json files
		if (options.json) {
			// Get the title of the first request.
			json = Object.keys(options.json.req)[0];

			// If a title exists, set the file to the corresponding JSON request. If no title exists
			// and no file exists, complete Byda with the options.
			if (json) {
				file = options.json.req[json];
			} else if (!file) {
				// If an HTML import occured, call success() with the import as the response.
				return options.import ? success(options.import, options) : complete(options);
			}
		}

		// Abort if xhr exists and the readyState is less than 4 (complete).
		if (xhr && xhr.readyState < 4) {
			xhr.onreadystatechange = noop;
			xhr.abort();
		}

		// Create a new XMLHtttpRequest.
		var xhr = new XMLHttpRequest();

		// If a base path is specified, prepend it to the file path.
		file = _base ? _base + '/' + file : file;

		// Open the XHR.
		xhr.open('GET', file, true);
		xhr.setRequestHeader('X-BYDA', 'true');

		// Detect readystatechange.
		xhr.onreadystatechange = function() {
			// If the readyState is 4 (complete):
			if (xhr.readyState == 4) {
				// and the XHR status returns 200 (got the file) or the file string contains
				// "file:///" (important for mobile/PhoneGap applications)
				if (xhr.status == 200 || (xhr.status === 0 && file.indexOf('file:///') != -1)) {
					// If there is a json, parse the responseText as JSON.
					if (json) {
						response = JSON.parse(xhr.responseText);

						// If it is a single, default request, set the result to the response for
						// easy access upon completion. If there are multiple requests, add it to
						// the results object.
						if (json == 'default') {
							options.json.res = response;
						} else {
							options.json.res[json] = response;
						}

						// Delete the request.
						delete options.json.req[json];

						// Begin a new request with the remaining options.
						return request(options);
					} else {
						response = xhr.responseText;
						// Return the XHR result and options to the success function.
						return success(response, options);
					}
				// The file was not found.
				} else {
					// If the request was a JSON request:
					if (json) {
						// Delete the request.
						delete options.json.req[json];

						// Begin a new request with the remaining options.
						return request(options);
					}
					// Couldn't find the view file, so no content could be loaded.
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

		// Complete Byda with the options.
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
		if (options.callback) options.callback(byda.flash(), options.json ? options.json.res : null);
	}

	/**
	 * Object Constructors
	 */

	// A Change contains an index element and a corresponding element from a loaded file
	function Change(from, to) {
		this.from = from;
		this.to = to;
	}

	Change.prototype.reverse = function() {
		this.from = this.to;
		this.to = this.from;
		return this;
	};

	// Swap the innerHTML value of the index element to the innerHTML value of the loaded element
	// or the value of a simulated element if this.to is not a node.
	Change.prototype.swap = function() {
		if (!this.from || !this.to) return;
		this.from.innerHTML = this.to.nodeType ? this.to.innerHTML : this.to;
		return this;
	};

	// A Collection contains a list of Byda elements that can be manipulated with Flash#add, and a
	// value that can be get and set with Flash#get and Flash#set.
	function Collection(group) {
		this.list = group || [];
		this.value = this.list[0];
	}

	// A Flash contains a list of Byda elements that can be organized, compared against other
	// flashes.
	function Flash(options) {
		// If no options were passed, create a new empty options object.
		if (!options) options = {};

		// An array of changes to commit.
		this.changes = [];

		// A new object that contains the Flash collections that is either empty or contains a
		// simulated group of collections.
		this.collections = options.simulated || {};

		// Collect a flat list of the Byda elements by calling byda.get() with either an imported
		// DOM if one was passed or no DOM. In the case of no DOM, the byda.get() will use the
		// document.
		this.list = options.dom ? byda.get(options.dom) : byda.get();

		// Set the flash to frozen or not. If frozen is passed, the Byda elements will be cloned
		// when initialized; therefore, the collections will contained cloned elements and not
		// references to elements on the page.
		this.frozen = options.frozen || false;

		// If the Flash is not simulated, initialize it.
		if (!options.simulated) return this.init();
	}

	// Initialize the Flash.
	Flash.prototype.init = function() {
		// Organize the flash when it is constructed.
		this.organize();
		return this;
	};

	// Add an element to the flash's list or a specified collection in the flash.
	Flash.prototype.add = function() {
		if (arguments[0].nodeType) {
			this.list.push(arguments[0]);
		} else if ('string' == typeof arguments[0] && arguments[1].nodeType) {
			this.get(arguments[0]).list.push(arguments[1]);
		}
		return this;
	};

	// Get the value of a collection.
	Flash.prototype.get = function(collection) {
		return this.collections[collection].value;
	};

	// Set the value of a collection.
	Flash.prototype.set = function(name, value) {
		var _i, _len, collection = this.get(name);

		if (!collection) return;

		for (_i = 0, _len = collection.list.length; _i < _len; _i++) {
			collection.list[_i].innerHTML = value;
		}

		collection.value = value;

		return this;
	};

	// Map a simulated list of changes to the Flash with an object.
	Flash.prototype.map = function(object, options) {
		if (!options) options = {};

		if (options.commit !== false) options.commit = true;

		// Create a dummy collections object.
		var collections = {};

		// Fill in the collections object with simulated collections.
		for (var key in object) {
			if (!collections[key]) collections[key] = { list: [] };
			collections[key].list.push(object[key]);
		}

		options.simulated = collections;

		// Create a new Flash with the object set as the collection.
		var simulated = new Flash(options);

		// Compare the current Flash to the simulated Flash.
		this.compare(simulated);

		// Commit any changes that were generated.
		if (options.commit) this.commit();

		return this;
	};

	// Compare the contents of one flash against another and generate a list of Change objects
	Flash.prototype.compare = function(flash) {
		var _i, _len, change, fallback, to, source;

		// Return if the method was called without a flash.
		if (!flash) return;

		// Reset the changes object.
		this.changes = [];

		// Set the source elements equal to frozen elements or elements of the flash of interest.
		source = flash.collections;

		for (var collection in source) {
			// If this flash has that a group of elements with the current collection
			if (this.collections[collection]) {
				// Generate a fallback to either a frozen group of elements or the current
				// elements.
				fallback = _frozen ? _frozen.collections[collection] : this.collections[collection];

				// Set the 'to' variable to either the flash of interests group or the fallback
				to = flash.collections[collection] || fallback;

				// Loop over each element in the group and generate a Change, and push the change
				// object to this.changes.
				for (_i = 0, _len = to.list.length; _i < _len; _i++) {
					this.changes.push(new Change(this.collections[collection].list[_i], to.list[_i]));
				}
			}
		}

		return this;
	};

	// Organize a list of elements into groups by their Byda data-attribute value.
	Flash.prototype.organize = function(list) {
		var _i, _len, el, name;

		// Reset the elements object.
		this.collections = {};

		// If list of elements parameter wasn't provided, use the intrinsic list.
		if (!list) list = this.list;

		for (_i = 0, _len = list.length; _i < _len; _i++) {
			name = list[_i].getAttribute('data-' + _suffix);
			el = this.frozen ? list[_i].cloneNode(true) : list[_i];
			// Create a new collection if one does not exist with the name.
			if (!this.collections[name]) {
				this.collections[name] = new Collection();

				// Set value of the collection to the first element added to the collection.
				this.set(name, el.innerHTML);
			}
			this.add(name, el);
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

	// Initialize Byda with options.
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

		// Use HTML imports instead of XHR
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
		_frozen = byda.flash({frozen: true});
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