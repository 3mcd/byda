describe("byda", function() {
  it("should be referenced in window.byda", function() {
    expect(typeof window.byda).toBe('function');
  });

  it("byda() should return undefined", function() {
    expect(byda()).toBeUndefined();
  });
});

describe("ajax", function() {
    var testStr = "<div>This is dummy content.</div>";
    var dummy, source, store;
    it("byda.flash should generate a Flash given a DOM string", function() {
        dummy = byda.flash({
            dom: '<div data-load="content">' + testStr + '</div>'
        });
        expect(typeof dummy).toBe('object');
        expect(dummy.constructor.name).toBe('Flash');
    });

    it("Flash.prototype.find should return a store or undefined", function() {
        store = dummy.find('fail');

        expect(store).toBeUndefined();

        store = dummy.find('content');

        expect(store.constructor.name).toBe('Store');
        expect(store.list.length).toEqual(1);
        expect(store.list[0].nodeType).toBeTruthy();
    });

    it("Store.prototype.get should return an exact innerHTML string value or undefined", function() {
        var str = 'Initial content';
        var $content = document.querySelector('#content');
        expect(store.get()).toEqual(str);
        expect($content.innerHTML).toEqual(str);
    });

    it("Flash.prototype.run should swap the content of elements within stores, as well as the store value", function() {
        var $content = document.querySelector('#content');

        source.run();

        expect(store.get()).toEqual(testStr);
        expect($content.innerHTML).toEqual(testStr);
    });
});