#byda.js
------

byda is a small (~4kb minified) library that allows you to insert Ajax content into HTML documents in a
data-attribute specific manner. It works great with pushState but doesn't include any pushState
functionality, routing or history functionality, nor is it a full-featured templating system. This means
you can integrate it with your own desired routing, templating, or pushState implementation without being
bound to any specific API.

The library supplies a very thin set of features for localStorage. You can also listen for changes by way
of the 'byda' event that emits when your content changes to sync data with outside databases or caches.

##Basic Example
------

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

When the index page or the '/home' path (if you're using routing, for example) is accessed, byda will load in HTML wrapped in data-load tags from the file specified. The HTML in the index page's data-load tags will be replaced with the new content.

##Callbacks
------

You can pass a callback to the `byda()` function as the second parameter. The function will be executed with two parameters: `flash` and `data`.

###flash

The first parameter of the callback will be passed a Flash object that contains important info about the newly loaded content. This object includes a 'collections' object that contains elements organized by their data-attribute value. Each organization is called a collection.

```javascript
byda('path/to/file.html', function(flash) {
	// Access the title collection (which contains one element)
	console.log(flash.collections.title.innerHTML); // 'Byda Example'
});
```

###data

`data` is an object that contains any json you want to load when calling `byda()`.

```javascript
function calendar(flash, data) {
	var activities = data.activities;

	$.each(days, function(index, value) {
		flash.collections.calendar.append(index + ': ' + activities[index]);
	});
}

byda({
	view: 'calendar',
	json: {'activites' : 'includes/json/activities.json'},
	callback: calendar
});
```

Combining byda with pushState is a good idea. Page.js is a micro-router that lets us utilize pushState routing for our app:

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
------

###byda(options, callback)
Load data into your document by data attributes through XHR or HTML5 imports (if the browser supports it and byda was initialized with the 'imports' option = true).

| Option        | typeof        | Description 																			 	|
| ------------- |:-------------:| :---------------------------------------------------------------------------------------- |
| complete     	| function 		| Callback function that is run after byda is complete. Passed back flash and json data.	|
| file	     	| string 		| Path to a file to use as the basis for swapping the content of byda elements.				|
| json      	| string      	| The path to a .json file to load alongside the HTML.										|
| view	 		| string      	| Shorthand for 'file':'views/' + (path) + '.html'. 										|

###byda.base
Set the base path for XHR and HTML5 imports.

```javascript
byda.base('/path/to/base');
```

###byda.init
You can of course initialize byda with options:

```javascript
byda({
	base: '/examples',
	data: 'foo', // will now look for elements with the attribute called 'data-foo'
	freeze: true,
	localCache: localStorage
});
```

| Option        | typeof        | Description 																			 	|
| ------------- |:-------------:| :---------------------------------------------------------------------------------------- |
| base      	| string 		| Apply a base path to all of the ajax requests you perform with byda.						|
| cache 		| object      	| Synchronize byda collections with an object.												|
| complete     	| function 		| A global complete function that will call after every byda request or import.				|
| data      	| string      	| Specify a custom data attribute prefix to use. The default is data-load. 					|
| freeze 		| boolean      	| Store copies of the index.html byda elements in a variable to serve as a fallback if no corresponding element is specified in a view file. |
| imports* 		| boolean      	| Use HTML5 imports instead of XHR (experimental)											|
| localCache 	| object      	| Synchronize byda collections with a local cache such as localStorage to make your data persist. |

######Notes
*Byda will fallback to XHR if the clients browser does not support HTML5 imports.

###byda.flash(options)
Returns a `Flash` object:

| Option        | typeof        | Description 																			 	|
| ------------- |:-------------:| :---------------------------------------------------------------------------------------- |
| dom	      	| string      	| A string of custom HTML to use as the DOM when generating list of byda elements Flash#list. Optional. |
| frozen		| boolean		| Perform cloneNode() on the byda elements before pushing them to the Flash#list.			|

Example (with caching):

```javascript
page('/notepad/:id', function(ctx) {
	// Set the notepad variable to the id prefixed with 'notepad-'. This is our notepad
	// collection name.
	var notepad = 'notepad-' + ctx.params.id;
	byda({view: 'notepad'}, function(flash) {
		// Append the notepad to the page.
		$('.Notes').append('<textarea id="notepad" data-load="' + notes + '"></textarea>');
		// Create a new flash with the updated DOM. Could also call flash.update() and
		// just use the flash that was passed back
        newFlash = byda.flash();
        // Set the notepad collection to the cached collection value.
        newFlash.set(notes);
        // When the input value changes, set the notepad collection value to the textarea
        // value.
        $('#notepad').on('input propertychange', function() {
            newFlash.set(notes, $(this).val());
        });
	});

});
```

####Flash API

| Flash# 						        | typeof        | Description 																			 	|
| ------------------------------------- |:-------------:| :---------------------------------------------------------------------------------------- |
| add(element / collection, element) 	| function		| Add an element to the flash list or a collection.											|
| changes      							| array 		| Contains a list of all changes generated by Flash#compare. 								|
| commit      							| function      | Perform the changes. 																		|
| compare(flash) 						| function      | Compare flash with another flash to generate an array of changes stored in Flash#changes. |
| elements      						| object      	| An organization of byda elements on the page. 											|
| get(collection)     					| function		| Get the value of a collection. Defaults to null.											|
| list 									| array      	| Contains a list of all byda elements on the page. Generated when the Flash is created. 	|
| map(object)     						| function		| Map a simple data structure object against the Flash and compare/commit the changes. 		|
| organize      						| function 		| Organize all elements from Flash#list or an array specified in the first parameter. 		|
| set(collection, value)	     		| function		| Update the value of a collection.	If a value is not passed, the collection will be set with a cached value if one exists. |
| update					    		| function		| Refresh the flash with a new list of byda elements and organize them into	collections 	|

###byda.freeze
Store copies of the index.html byda elements in a variable to serve as a fallback if no corresponding element is specified in a view file.

###byda.get
Returns an array of all byda elements on the page.