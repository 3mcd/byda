var load = byda;

/**
 * Utilities
 */

var Util = function() {};

Util.list = function(data, wrapper, container, fn) {
    var list = [];

    $.each(data, function(key, val) {
        list.push(fn(key,val));
    });

    $( "<div/>", {
        "class": wrapper,
        html: list.join("")
    }).appendTo(container);
};

/**
 * Initialize
 */

var SimCache = function() {};

SimCache.prototype.clear = function() {
    for (var key in this) {
        delete this[key];
    }
};

var simCache = new SimCache();

byda.init({
    base: '/examples',
    imports: false, // Set this to true to enable HTML imports
    freeze: true,
    local: localStorage,
    cache: simCache,
    complete: function(flash, options) {
        var path = options.ctx.path;
        $('.Navigation > li > a').each(function() {
            if (this.getAttribute('href') == path) $(this).addClass('is-active');
            else $(this).removeClass('is-active');
        });
    }
});

/**
 * Routes
 */

$(window).on('byda', function(e) {
    console.log(e.detail.name + ' => ' + e.detail.value);
});

page('/', function(ctx) {
    byda({
        view:'home.byda',
        ctx: ctx
    }, function(flash) {
        var store = flash.find('counter');
        store.set();
        $('#counterBtn').on('click', function() {
            store.set(function(value) {
                if (!value) value = 0;
                value++;
                return value;
            }, { cache: true });
        });
    });
});

page('/page/:id', function(ctx) {
    var id = ctx.params.id;
    var notes = 'notes' + id;
    byda({
        ctx: ctx,
        view: 'list.byda'
    }, function(flash) {
        flash.find('heading').set('Page ' + ctx.params.id);
        $('.Card').append('<textarea id="notepad" data-load="' + notes + '"></textarea>');
        flash.update();
        var store = flash.find(notes);
        store.set();
        $('#notepad').on('input propertychange', function() {
            store.set($(this).val(), { cache: true });
        });
    });
});

page('/settings', function(ctx) {
    byda({
        ctx: ctx,
        view: 'settings.byda'
    }, function(flash) {
        var store = flash.find('username');
        store.set();
        $('#name').bind('input propertychange', function() {
            store.set($(this).val(), { cache: true });
        });
    });
});

page('/periodic-table/:row/:num', function(ctx) {
    var row = ctx.params.row;
    var num = ctx.params.num;
    byda({
        ctx: ctx,
        view: 'chemical.byda',
        json: [
            { name: 'periodic', file: 'includes/periodic-table.json' },
        ]
    }, function(flash, data) {
        var element = isNaN(row) ? data.periodic[row][num] : data.periodic.table[row].elements[num];
        var notes = element.name + '-notes';
        flash.map(element, { commit: true });

        $('.Notes').append('<textarea id="notepad" data-load="' + notes + '"></textarea>');
        var newFlash = byda.flash();
        var store = newFlash.find(notes);
        store.set();
        $('#notepad').on('input propertychange', function() {
            store.set($(this).val(), { cache: true });
        });

    });
});

page('/periodic-table', function(ctx) {
    byda({
        ctx: ctx,
        view: 'list.byda',
        json: [
            {name: 'periodic', file: 'includes/periodic-table.json'}
        ]
    }, function(flash, data) {
        flash.find('heading').set('Periodic Table');
        flash.find('description').set('A list of all elements on the periodic table, each with a small set of data.');
        $.each(data.periodic.table, function(row, value) {
            $('.Card').append('<div class="TableView TableView-divider">Row ' + row + '</div>');
            Util.list(value.elements, 'TableView', '.Card', function(key, element) {
                return '<div class="TableView-cell"><a href="/periodic-table/'+ row + '/' + key +'">' + element.name + '</a></div>';
            });
        });

        $('.Card').append('<div class="TableView TableView-divider">Actinoids</div>');
        Util.list(data.periodic.actinoids, 'TableView', '.Card', function(key, element) {
            return '<div class="TableView-cell"><a href="/periodic-table/actinoids/' + key +'">' + element.name + '</a></div>';
        });

        $('.Card').append('<div class="TableView TableView-divider">Lanthanoids</div>');
        Util.list(data.periodic.lanthanoids, 'TableView', '.Card', function(key, element) {
            return '<div class="TableView-cell"><a href="/periodic-table/lanthanoids/' + key +'">' + element.name + '</a></div>';
        });
    });
});


page('/failure', function(ctx) {
    load('nonsense');
});

page();

page('/');