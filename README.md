#byda.js
###v0.0.1

byda is a small (~4kb minified) library that allows you to insert Ajax content
into HTML documents in a data-attribute specific manner. It works great with
pushState but doesn't include any pushState functionality, routing or history
functionality, nor is it a full-featured templating system. This means you can
integrate it with your own desired routing, templating, or pushState
implementation without being bound to any specific API.

The library supplies a very thin set of features for localStorage. You can also
listen for changes by way of the 'byda' event that emits when your content
changes to sync data with outside databases or caches.

### Concept

Byda will create an object (flash) that contains organizations of elements on
the page arranged by data-attribute (stores) that can then be compared against
other flashes to generate lists of changes to perform. Byda's core functions
will be exposed as a basic content-swapping/templating library, but the APIs of
`Flash` and `Store` are also exposed to provide more flexibility to authors.

######Notes

* A flash is just a wrapper for the stores at the moment the flash is generated.

* A flash exposes methods that let you do bulk actions on the stores it contains.

* Stores have a value and a list. This value is set across elements within the
store. Calling `store.set(value)` will set the innerHTML (or value for inputs)
of all of the elements in the list to the specified string.


##Basic Example

####index.html
```html
...
	<!-- CSS, JS -->
	<script src="byda.js"></script>
</head>
<body>
	<div class="Header">
		<h3 class="Header-title" data-load="title">Byda Example</h3>
		<div class="Header-nav" data-load="navigation">
			<!-- Navigation loaded here -->
		</div>
	</div>
	<div class="Main">
		<div class="Main-content" data-load="content">
			<!-- Content loaded here -->
		</div>
	</div>
	<script>
		byda({view:'home'});
	</script>
</body>
...
```

####views/home.html
```html
<a data-load="navigation">
	<ul class="Navigation">
		<li>
			<a href="/home" class="selected">Home</a>
			<a href="/page/1">Page 1</a>
			<a href="/page/2">Page 2</a>
		</li>
	</ul>
</a>

<a data-load="content">
	<h3>Home</h3>
	<p>Paragraph content.</p>
</a>
```

When the index page or the '/home' path (if you're using routing, for example)
is accessed, byda will load in HTML wrapped in data-load tags from the file
specified. The HTML in the index page's data-load tags will be replaced with
the new content.

##Callbacks

You can pass a callback to the `byda()` function as the second parameter. The
function will be executed with two parameters: `flash` and `data`.

###flash

The first parameter of the callback will be passed a Flash object that contains
important info about the newly loaded content. This object includes a 'stores'
object that contains elements organized by their data-attribute value. Each
organization is called a store.

```javascript
byda('path/to/file.html', function(flash) {
	// Access the title store (which contains one element)
	console.log(flash.find('title').get()); // 'Byda Example'
});
```

###data

`data` is an object that contains any JSON you want to load with your view.

```javascript
function calendar(flash, data) {
	var activities = data.activities;

	$.each(days, function(index, value) {
		$('#calendar').append(index + ': ' + activities[index]);
	});
}

byda({
	view: 'calendar',
	json: {'activites' : 'includes/json/activities.json'},
	callback: calendar
});
```

##pushState

Combining byda with pushState is a good idea. Page.js is a micro-router that
lets us utilize pushState routing for our app:

```javascript
page('/', function(ctx) {
	byda({view:'home'});
});

page('/calendar/:day', function(ctx) {
	var day = ctx.params.day;
	byda(/* options */, function(collections, data) {
		console.log(data.activities[day]);
	});
});

page();
```

You can now navigate through your ajax loads with the browser history.

##Public API

###byda(options, callback)
Load data into your document by data attributes through XHR or HTML5 imports
(if the browser supports it and byda was initialized with the 'imports' option =
true).

| Option   | typeof   | Description                                                                      |
|----------|----------|----------------------------------------------------------------------------------|
| complete | function | Function that is called after byda is complete. Passed back flash and JSON data. |
| file     | string   | Path to a file to use as the basis for swapping the content of byda elements.    |
| json     | string   | The path to a .json file to load alongside the view.                             |
| view     | string   | Shorthand for `{ file: 'views/' + path + '.html' }`                              |

###byda.base
Set the base path for XHR and HTML5 imports.

```javascript
byda.base('/path/to/base');
```

###byda.init
You can of course initialize byda with options:

```javascript
byda.init({
	base: '/examples',
	data: 'foo', // will now look for elements with the attribute called 'data-foo'
	freeze: true,
	localCache: localStorage
});
```

| Option     | typeof   | Description                                                                                                                              |
|------------|----------|------------------------------------------------------------------------------------------------------------------------------------------|
| base       | string   | Prepend a base path to all of the requests and imports you perform with byda.                                                            |
| cache      | object   | Synchronize byda stores with an object.                                                                                                  |
| complete   | function | A global complete function that will call after byda is finished.                                                                        |
| data       | string   | Specify a custom data attribute prefix to use. The default is data-load.                                                                 |
| freeze     | boolean  | Store copies of the template byda elements in a variable to serve as a fallback if no corresponding element is found in a view or cache. |
| imports    | boolean  | Use HTML5 imports instead of XHR                                                                                                         |
| localCache | object   | Synchronize byda stores with a local cache such as localStorage to make your data persist.                                               |

######Notes
* Byda will fallback to XHR if the clients browser does not support HTML5 imports.

###byda.flash(options)
Returns a `Flash` object:

| Option | typeof  | Description                                                          |
|--------|---------|----------------------------------------------------------------------|
| dom    | string  | A string to be parsed as HTML when generating list of byda elements. |
| frozen | boolean | Clone elements before before pushing them to the list.               |

Example (with caching):

```javascript
page('/notepad/:id', function(ctx) {
	// Set the notepad variable to the id prefixed with 'notepad-'. This is our notepad
	// store name.
	var notepad = 'notepad-' + ctx.params.id;
	byda({view: 'notepad'}, function(flash) {
		// Append the notepad to the page.
		$('.Notes').append('<textarea id="notepad" data-load="' + notes + '"></textarea>');
		// Create a new flash with the updated DOM. Could also call flash.update() and
		// just use the flash that was passed back
        var newFlash = byda.flash();
        var store = newFlash.find(notes);
        // Set the notepad collection to the cached collection value.
        store.set();
        // When the input value changes, set the notFepad collection value to the textarea
        // value.
        $('#notepad').on('input propertychange', function() {
            store.set(notes, $(this).val());
        });
	});

});
```

###byda.freeze
Reference copies of the index.html byda elements to serve as a fallback if no
corresponding element is served in a view file.

###byda.get
Returns an array of all byda elements on the page.


####Flash API

| Property | typeof   | Parameters          | Description                                                                                           |
|----------|----------|---------------------|-------------------------------------------------------------------------------------------------------|
| add      | function | collection, element | Add an element to a store.                                                                            |
| find     | function | name                | Return a store by name.                                                                               |
| generate | function | flash               | Compare to another flash and push the changes to the stores.                                          |
| list     | array    |                     | An unorganized list of all byda elements on the page.                                                 |
| map      | object   |                     | Compare a simple data structure against the Flash and commit the changes.                             |
| organize | function |                     | Organize all elements from this.list or an array specified as the first parameter.                    |
| run      | function |                     | Commit the changes of each store after they have been generated.                                      |
| stores   | object   |                     | Contains organizations of byda elements (stores) that exist on the page when the flash was generated. |
| update   | function |                     | Refresh the flash with a new list and organize the list into stores.                                  |

####Store API

| Store | typeof   | Parameters     | Description                         |
|-------|----------|----------------|-------------------------------------|
| get   | function |                | Return the value of the collection. |
| set   | function | value, options | Set the value of the collection.    |
