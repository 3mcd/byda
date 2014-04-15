/**
 * Byda public API test suite
 */
describe("Byda public API", function() {
    var dummy,
        source,
        store,
        testStr;

    var base = window.location.href.split('/').slice(0, window.location.href.split('/').indexOf('_SpecRunner.html')).join('/');

    beforeEach(function() {
        testStr = document.querySelector('#setup').innerHTML;

        dummy = byda.flash({
            dom: '<div data-load="content">' + testStr + '</div>'
        });

        source = byda.flash();

        dummyStore = dummy.find('content');
        sourceStore = source.find('content');

        source.generate(dummy);
    });

    it("byda() should be referenced in window.byda", function() {
        expect(typeof window.byda).toBe('function');
    });

    it("byda() should return undefined", function() {
        expect(byda()).toBeUndefined();
    });

    it("byda.flash() should generate a Flash given a DOM string", function() {
        expect(typeof dummy).toBe('object');
        expect(dummy.constructor.name).toBe('Flash');
    });

    it("Flash.prototype.find should return a store or undefined", function() {
        expect(dummy.find('fail')).toBeUndefined();

        expect(dummyStore.constructor.name).toBe('Store');
        expect(dummyStore.list.length).toEqual(1);
        expect(dummyStore.list[0].nodeType).toBeTruthy();
    });

    it("Flash.prototype.generate should create a change", function() {
        expect(typeof dummyStore.to).toBeDefined();
    });

    it("Store.prototype.get should return an unaltered innerHTML value or undefined", function() {
        expect(sourceStore.get()).toEqual(document.querySelector('#content').innerHTML);
    });

    it("Flash.prototype.run should swap content of store elements and the store value", function() {
        source.run();
        expect(sourceStore.get()).toEqual(testStr);
        expect(document.querySelector('#content').innerHTML).toEqual(testStr);
    });
});