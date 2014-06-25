define( [ 'byda', 'zepto' ], function ( byda ) {

    function Animation( classFrom, classTo ) {
        var _classFrom = 'animated ' + classFrom;
        var _classTo = 'animated ' + classTo;

        var _action = function( from, to, next ) {
            $from = $(from);
            $to = $(to);
            $from.css('position', 'absolute');
            $from.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
                $to.removeClass(_classTo);
                next();
            });
            $from.after($to);
            $from.addClass(_classFrom);
            $to.addClass(_classTo);
        };

        return _action;
    }

    function BydaSlider( selector, list, captions ) {
        this.selector = selector;
        this.$el = document.querySelector( selector );
        this.list = list;
        this.captions = captions;
        this.pos = 0;

        this.bindEvents();
    }

    BydaSlider.prototype.bindEvents = function() {
        var me = this;
        this.$el.addEventListener('click', function() {
            console.time( 'slider' );
            me.pos = me.pos < me.list.length - 1 ? me.pos + 1 : 0;
            var options = {
                view: 'slider/' + me.list[me.pos],
                dom: me.$el,
                json: me.captions,
                transitions: {
                    'content': animations.fade
                }
            };
            byda( options , function( data ) {
                this.find('caption').set( data[ me.list[me.pos] ]);
                console.timeEnd( 'slider' );
            });
        });
    };

    BydaSlider.prototype.refresh = function() {
        this.$el = document.querySelector( this.selector );
    };

    $('.MiniNav li').on('click', function() {
        console.time( 'article' );
        byda({ view: 'article/' + $(this).data('section') }, function () {
            console.timeEnd( 'article' );
        });
    });

    var animations = {};

    animations.fall = Animation('slideOutLeft', 'fadeIn');
    animations.fade = Animation('slideOutRight', 'fadeIn');

    var slider1 = new BydaSlider( '#slider-1', [ 'index', 'content-1', 'content-2', 'content-3' ], 'views/slider/captions.json' );

    byda.init({
        imports: true,
        transitions: {
            "subtitle": animations.fall
        }
    });
} );