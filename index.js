/*! Byda.js 1.2.3 || Eric McDaniel */
;( function( window, document ) {

    'use strict';

    /**
     * Variables
     */

    var _active,
        _base, // Default base path.
        _animation = {},
        _localCache,
        _cache,
        _imports,
        _suffix = 'load', // Default data-attribute suffix.
        _supportsImports = 'import' in document.createElement( 'link' );

    /**
     * Helpers
     */

    // An empty callback function.
    function noop() {}

    var _globalComplete = noop; // Stores a callback function called after Byda is complete.

    // Get any elements with the data attribute generated by getBydaSelector().
    function getBydaElements( dom ) {
        dom = 'string' == typeof dom ? new DOMParser()
            .parseFromString( dom, 'text/html' ) : document;
        if ( isNode( dom ) ) return dom.querySelectorAll( getBydaSelector() );
    }

    // Get the data attribute selector that is used across Byda.
    function getBydaSelector() {
        return '[data-' + _suffix + ']';
    }

    function getCached( name ) {
        return _localCache ? _localCache[ 'byda-' + name ] :
               _cache ? _cache[ name ] : '';
    }

    function setCached( name, value ) {
        if ( _localCache ) _localCache[ 'byda-' + name ] = value;
        if ( _cache ) _cache.byda[ name ] = value;
    }

    function isNode( obj ) {
        return 'object' == typeof obj && !! obj.nodeType;
    }

    /**
     * Core Functions
     */

    // Parse options and begin XHR
    function byda( options, callback ) {
        if ( !options || _active ) return;
        // If a string is passed as the options paramter, assume it is a path to a file
        if ( 'string' == typeof options ) options = {
            file: options
        };
        // options.view is shorthand for 'views/{name}.html'.
        if ( options.view ) options.file = 'views/' + options.view + '.html';
        // If a callback is passed as the second parameter, add or overwrite options.callback.
        options.callback = callback || noop;
        // If options.json exists, create an object with the request (string or array), and an empty
        // results object.
        options.json = {
            req: 'string' == typeof options.json ? [ {
                name: 'default',
                file: options.json
            } ] : options.json || [],
            res: {}
        };
        // If Byda was initialized with imports: true and the browser supports imports, use HTML5
        // imports.
        if ( _imports && _supportsImports ) {
            // Create a new <link> element.
            var link = document.createElement( 'link' );
            // Define an href variable that contains the link to the file/view being loaded.
            var href = options.file;
            if ( _base ) href = _base + '/' + href;
            // Set the rel attribute of the link element to 'import' and the href to the href
            // variable.
            link.rel = 'import';
            link.href = href;
            // Detect a current link element with an identical href value.
            var current = document.querySelector( 'link[href="' + href + '"]' );
            // If it exists, remove it from the DOM.
            if ( current ) current.remove();
            // When the link attribute is done loading, reference the import contents with
            // the options.imp property and start a new request to catch any json requests
            // that were passed in the options.
            link.onload = function( e ) {
                options.imp = link['import'];
                _request( options );
            };
            // Error handler
            link.onerror = function( e ) {
                _failure( options );
            };
            // Append the newly created link element to the head of the document.
            document.head.appendChild( link );
        } else {
            // Start XHR with options.
            _request( options );
        }
    }

    // Retrieve the contents of json files specified in options.json and the view specified in
    // options.file.
    function _request( options ) {
        var json = options.json.req[ 0 ], // Stores the JSON request (if any).
            response; // Stores the raw responseText or JSON parsed responseText.
        var file = json ? json.file : options.file;
        if ( !file ) return options.imp ? _success( options.imp, options ) : _complete( options );
        // Abort if xhr exists and the readyState is less than 4 (complete).
        if ( xhr && xhr.readyState < 4 ) {
            xhr.onreadystatechange = noop;
            xhr.abort();
        }
        // Create a new XMLHtttpRequest.
        var xhr = new XMLHttpRequest();
        // If a base path is specified, prepend it to the file path.
        file = _base ? _base + '/' + file : file;
        // Open the XHR.
        xhr.open( 'GET', file, true );
        xhr.setRequestHeader( 'X-BYDA', 'true' );
        // Detect readystatechange.
        xhr.onreadystatechange = function() {
            // If the readyState is 4 (complete):
            if ( xhr.readyState == 4 ) {
                if ( json ) options.json.req.splice( 0, 1 );
                // and the XHR status returns 200 (got the file) or the file string contains
                // "file:///" (important for mobile/PhoneGap applications)
                if ( xhr.status == 200 || ( xhr.status === 0 && file.indexOf( 'file:///' ) != -1 ) ) {
                    // If there is a json, parse the responseText as JSON.
                    var text = xhr.responseText;
                    if ( !json ) return _success( text, options );
                    response = JSON.parse( text );
                    // If it is a single, default request, set the result to the response for
                    // easy access upon completion. If there are multiple requests, add it to
                    // the results object.
                    if ( json.name == 'default' ) options.json.res = response;
                    else options.json.res[ json.name ] = response;
                    // Begin a new request with the remaining options.
                    _request( options );
                    // The file was not found.
                } else {
                    // If the request was a JSON request:
                    if ( json ) _request( options );
                    // Couldn't find the view file, so no content could be loaded.
                    _failure( options );
                }
            }
        };
        // Send the XHR
        xhr.send();
    }

    // XHR succeeded and we can begin swapping content
    function _success( response, options ) {
        byda.flash()
            .generate( byda.flash( {
                dom: response
            } ) )
            .run( function() {
                _active = true;
                options.callback( byda.flash(), options.json.res );
            }, function() {
                _active = false;
                _globalComplete( options );
            } );
    }

    function _failure( options ) {
        throw new Error( 'Could not get: ' + options.file );
    }

    /**
     * Object Constructors
     */

    // A Store contains a list of Byda elements that can be manipulated with Flash#add, and a
    // value that can be get and set with Flash#get and Flash#set.
    function Store( name, value ) {
        this.name = name;
        this.list = [];
        this.changes = [];
        this.value = value || getCached( name );
    }

    Store.prototype.emit = function() {
        var e;
        var options = {
            detail: {
                name: this.name,
                value: this.value
            },
            bubbles: true,
            cancelable: true
        };
        if ( 'function' == typeof CustomEvent ) {
            e = new CustomEvent( 'byda', options );
        } else if ( document.createEvent ) {
            e = document.createEvent( 'CustomEvent' );
            e.initCustomEvent( 'byda', options.bubbles, options.cancelable, options.detail );
        }
        window.dispatchEvent( e );
    };

    Store.prototype.set = function( value, options ) {
        var _i, cache, node;
        if ( 'function' == typeof value ) value = value( this.value );
        else if ( 'object' == typeof value ) value = value[ this.name ];
        if ( !value ) value = getCached( this.name ) || '';
        for ( _i = this.list.length - 1; _i >= 0; _i-- ) {
            node = this.list[ _i ];
            if ( node.hasAttribute( 'value' ) ) node.value = value;
            else node.innerHTML = value;
        }
        this.value = value;
        if ( options && options.cache ) setCached( this.name, this.value );
        this.emit();
        return this;
    };

    Store.prototype.get = function() {
        return this.value;
    };

    Store.prototype.compare = function( store ) {
        this.to = store.list[ 0 ];
        return this;
    };

    Store.prototype.commit = function( done ) {
        var that = this;

        function complete() {
            if (value) that.set( value );
            done( that.name );
        }
        if ( !this.to ) return complete();
        var _i, buff,
            value = isNode( this.to ) ? this.to.value || this.to.innerHTML : this.to,
            list = this.list,
            name = this.name;
        if ( !value ) value = getCached( this.name ) || '';
        if ( 'function' == typeof _animation[ this.name ] ) {
            for ( _i = list.length - 1; _i >= 0; _i-- ) {
                buff = list[ _i ].cloneNode( true );
                buff.innerHTML = value;
                _animation[ name ]( list[ _i ], buff, complete );
            }
        } else {
            complete();
        }
    };

    // A Flash contains a list of Byda elements that can be organized, compared against other
    // flashes.
    function Flash( options ) {
        // If no options were passed, create a new empty options object.
        if ( !options ) options = {};
        this.dom = options.dom;
        // Collect a flat list of the Byda elements by calling byda.get() with either an imported
        // DOM if one was passed or no DOM. In the case of no DOM, the byda.get() will use the
        // document.
        this.list = this.dom ? getBydaElements( this.dom ) : getBydaElements();
        // Set the flash to frozen or not. If frozen is passed, the Byda elements will be cloned
        // when initialized; therefore, the collections will contained cloned elements and not
        // references to elements on the page.
        this.frozen = options.frozen;
        // Organize the list into stores.
        this.organize();
    }

    Flash.prototype.update = function() {
        return this.organize( getBydaElements( this.dom || null) );
    };

    Flash.prototype.count = function() {
        var _i = 0;
        for (var store in this.stores) _i++;
        return _i;
    };

    // Find and return a store.
    Flash.prototype.find = function( name ) {
        return this.stores[ name ];
    };

    // Map a simulated list of changes to the Flash with an object.
    Flash.prototype.map = function( object, options ) {
        var store;
        for ( var key in object ) {
            store = this.stores[ key ];
            if ( store ) store.set( object[ key ] );
        }
        return this;
    };

    // Compare the flash's stores to another and load lists of changes objects
    // into the source collections.
    Flash.prototype.generate = function( flash ) {
        var store;
        for ( var name in this.stores ) {
            store = flash.stores[ name ];
            if ( store ) this.stores[ name ].compare( store );
        }
        return this;
    };

    // Organize a list of elements into groups by their Byda data-attribute value.
    Flash.prototype.organize = function( list ) {
        var _i, node, name;
        // Reset the elements object.
        this.stores = {};
        // If list of elements parameter wasn't provided, use the intrinsic list.
        if ( list ) this.list = list;
        for ( _i = this.list.length - 1; _i >= 0; _i-- ) {
            node = this.list[ _i ];
            name = node.getAttribute( 'data-' + _suffix );
            if ( this.frozen ) node = node.cloneNode( true );
            // Create a new store if one does not exist with the name.
            if ( !this.stores[ name ] ) {
                this.stores[ name ] = new Store( name, node.value || node.innerHTML );
            }
            this.stores[ name ].list.push( node );
        }
        return this;
    };

    // Call the commit method on each change in the flashes list of changes.
    Flash.prototype.run = function( start, finish ) {
        var that = this,
            finished = [];

        function done( name ) {
            finished.push( name );
            if ( that.count() == finished.length ) return finish && finish();
        }
        for ( var store in this.stores ) this.stores[ store ].commit( done );
        return start && start();
    };

    /**
     * Exposed Functions
     */

    // Initialize Byda with options.
    byda.init = function( options ) {
        // Return if no options parameter was passed.
        if ( !options ) return;
        // The options 'data' and 'suffix' are valid to specify a data attribute suffix.
        _suffix = 'string' == typeof options ? options : options.suffix = options.data || _suffix;
        if (options.animation) _animation = options.animation;
        // Cache Options (Experimental)
        _localCache = options.local;
        _cache = options.cache;
        if ( _cache && !_cache.byda ) _cache.byda = {};
        // Use HTML imports instead of XHR
        _imports = options.imports;
        // Set the base variable to a file path string.
        _base = options.base;
        // Set the global complete callback to the options.complete function.
        _globalComplete = options.complete || noop;
    };

    // Set the base path to a specified string.
    byda.base = function( string ) {
        _base = string || _base;
        return _base;
    };

    // Return a new Flash object.
    byda.flash = function( options ) {
        return new Flash( options );
    };

    /**
     * Expose Byda
     */

    window.byda = byda;

} )( window, document );