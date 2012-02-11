YUI.add('widget-buttons-test', function (Y) {

// TODOS:
//
// * Tests for `removeButton()`
// * More tests for `addButton()`
// * Test preventing `buttonsChange` to see if add/remove still changed the Array.
//

var Assert       = Y.Assert,
    ArrayAssert  = Y.ArrayAssert,
    ObjectAssert = Y.ObjectAssert,

    TestWidget, suite;

// -- Suite --------------------------------------------------------------------
TestWidget = Y.Base.create('testWidget', Y.Widget, [Y.WidgetStdMod, Y.WidgetButtons]);
suite      = new Y.Test.Suite('WidgetButtons');

// -- Lifecycle ----------------------------------------------------------------
suite.add(new Y.Test.Case({
    name: 'Lifecycle',

    _should: {
        error: {
            'Initialization should fail if `WidgetStdMod` has not been added': true,
            'Initialization should fail if `WidgetStdMod` has been added after `WidgetButtons`': true
        }
    },

    tearDown: function () {
        this.widget && this.widget.destroy();
        Y.one('#test').empty();
    },

    'Initialization should fail if `WidgetStdMod` has not been added': function () {
        var FailWidget = Y.Base.create('failWidget', Y.Widget, [Y.WidgetButtons]);
        this.widget = new FailWidget();
    },

    'Initialization should fail if `WidgetStdMod` has been added after `WidgetButtons`': function () {
        var FailWidget = Y.Base.create('failWidget', Y.Widget, [Y.WidgetButtons, Y.WidgetStdMod]);
        this.widget = new FailWidget();
    },

    '`buttons` should be accessible within a subclass initializer': function () {
        var called = 0,
            SubclassWidget;

        SubclassWidget = Y.Base.create('subclassWidget', Y.Widget, [Y.WidgetStdMod, Y.WidgetButtons], {
            initializer: function () {
                var headerButtons = this.get('buttons.header');

                ArrayAssert.isNotEmpty(headerButtons, '`headerButtons` was empty.');
                Assert.isInstanceOf(Y.Node, headerButtons[0], 'Button was not an `instanceOf` `Y.Node`.');

                called += 1;
            }
        });

        this.widget = new SubclassWidget({
            buttons: [
                {
                    label  : 'Foo',
                    section: 'header'
                }
            ]
        });

        Assert.areSame(1, called);
    },

    '`buttons` should be parsed from a `srcNode`': function () {
        var markup = '' +
            '<div>' +
                '<div class="yui3-widget-hd">' +
                    '<span class="yui3-widget-buttons">' +
                        '<button class="yui3-button" name="foo">Foo</button>' +
                    '</span>' +
                '</div>' +
            '</div>';

        Y.one('#test').append(markup);

        var fooButton = Y.one('#test button[name=foo]');

        this.widget = new TestWidget({
            srcNode: '#test div'
        });

        Assert.areSame(fooButton, this.widget.getButton('foo'), 'Button in markup was not used.');
    },

    '`buttons` parsed from a `srcNode` should be overridden by user-provided `buttons`': function () {
        var markup = '' +
            '<div>' +
                '<div class="yui3-widget-hd">' +
                    '<span class="yui3-widget-buttons">' +
                        '<button class="yui3-button" name="foo">Foo</button>' +
                    '</span>' +
                '</div>' +
            '</div>';

        Y.one('#test').append(markup);

        var fooButton = Y.one('#test button[name=foo]');

        this.widget = new TestWidget({
            srcNode: '#test div',
            render : true,
            buttons: [
                {name: 'bar', section: 'header'}
            ]
        });

        Assert.isFalse(Y.one('#test').contains(fooButton), 'Foo button was not removed.');
        Assert.areSame(Y.one('#test button'), this.widget.getButton('bar'), 'Bar button is rendered.');
        Assert.areSame(1, this.widget.get('buttons.header').length, 'Header contained more than 1 button.');
    },

    '`destory()` should remove all buttons': function () {
        var contentBox;

        this.widget = new TestWidget({
            buttons: [{label: 'foo'}]
        });

        contentBox = this.widget.get('contentBox');

        this.widget.render('#test');
        Assert.isFalse(contentBox.all('.yui3-button').isEmpty(), 'Widget did not have buttons.');

        this.widget.destroy();
        Assert.isTrue(contentBox.all('.yui3-button').isEmpty(), 'Widget still had buttons.');
    }
}));

// -- Attributes and Properties ------------------------------------------------
suite.add(new Y.Test.Case({
    name: 'Attributes and Properties',

    tearDown: function () {
        this.widget && this.widget.destroy();
        Y.one('#test').empty();
    },

    '`buttons` should be able to be specified as an Array of Objects': function () {
        this.widget = new TestWidget({
            buttons: [
                {label: 'foo', section: 'header'},
                {label: 'bar', section: 'footer'}
            ]
        });

        ArrayAssert.isNotEmpty(this.widget.get('buttons.header'), '`buttons.header` was empty.');
        ArrayAssert.isNotEmpty(this.widget.get('buttons.footer'), '`buttons.footer` was empty.');
    },

    '`buttons` should be able to be specified as an Object of Arrays of Objects': function () {
        this.widget = new TestWidget({
            buttons: {
                header: [{label: 'foo'}],
                footer: [{label: 'bar'}]
            }
        });

        ArrayAssert.isNotEmpty(this.widget.get('buttons.header'), '`buttons.header` was empty.');
        ArrayAssert.isNotEmpty(this.widget.get('buttons.footer'), '`buttons.footer` was empty.');
    },

    '`buttons` specified as an Object of section-Arrays should override a button specific section': function () {
        this.widget = new TestWidget({
            buttons: {
                header: [
                    {label: 'foo'},
                    {label: 'bar', section: 'footer'}
                ]
            }
        });

        Assert.areSame(2, this.widget.get('buttons.header').length, '`buttons.header` did not have 2 buttons.');
        Assert.isUndefined(this.widget.get('buttons.footer'), '`buttons.footer` was not `undefined`.');
    },

    '`buttons` specified without a section should default to the footer': function () {
        this.widget = new TestWidget({
            buttons: [
                {label: 'foo'},
                {label: 'bar'}
            ]
        });

        Assert.areSame(2, this.widget.get('buttons.footer').length, '`buttons.footer` did not have 2 buttons.');
    },

    '`buttons` should be able to be specified as an Array of Y.Nodes': function () {
        this.widget = new TestWidget({
            buttons: [
                Y.Node.create('<button>foo</button>'),
                Y.Node.create('<button>bar</button>')
            ]
        });

        var buttons = this.widget.get('buttons.footer');

        Assert.areSame(2, buttons.length, '`buttons.footer` did not have 2 buttons.');
        Assert.areSame('foo', buttons[0].get('text'), 'First button did not have the test "foo".');
        Assert.areSame('bar', buttons[1].get('text'), 'Second button did not have the test "bar".');
    },

    '`buttons` should be able to be specified as an Object of Arrays of Y.Nodes': function () {
        this.widget = new TestWidget({
            buttons: {
                header: [Y.Node.create('<button>foo</button>')],
                footer: [Y.Node.create('<button>bar</button>')]
            }
        });

        ArrayAssert.isNotEmpty(this.widget.get('buttons.header'), '`buttons.header` was empty.');
        ArrayAssert.isNotEmpty(this.widget.get('buttons.footer'), '`buttons.footer` was empty.');
    },

    '`buttons` should be able to be specified as a mixture of all possibile configurations': function () {
        var PanelWidget = Y.Base.create('panelWidget', Y.Widget, [Y.WidgetStdMod, Y.WidgetButtons], {
            BUTTONS: {
                foo: {
                    label  : 'Foo',
                    section: Y.WidgetStdMod.HEADER
                }
            }
        });

        this.widget = new PanelWidget({
            buttons: [
                {name: 'foo'},
                {name: 'bar', section: 'body', label: 'Bar'},
                Y.Node.create('<button name="baz">Baz</button>')
            ]
        });

        var foo     = this.widget.getButton('foo'),
            bar     = this.widget.getButton('bar'),
            baz     = this.widget.getButton('baz'),
            buttons = this.widget.get('buttons');

        Assert.areSame(foo, buttons.header[0], '`foo` was not the first header button.');
        Assert.areSame(bar, buttons.body[0], '`bar` was not the first body button.');
        Assert.areSame(baz, buttons.footer[0], '`baz` was no the first footer button.');
    },

    'Default `BUTTONS` should be usable by only providing their string name': function () {
        var PanelWidget = Y.Base.create('panelWidget', Y.Widget, [Y.WidgetStdMod, Y.WidgetButtons], {
            BUTTONS: {
                close: {
                    action: function () {
                        this.hide();
                    },

                    label  : 'Close',
                    section: Y.WidgetStdMod.HEADER
                },

                foo: {
                    label  : 'Foo',
                    section: Y.WidgetStdMod.HEADER
                }
            }
        });

        this.widget = new PanelWidget({
            render : '#test',
            buttons: {
                header: ['close'],
                footer: ['foo']
            }
        });

        ArrayAssert.isNotEmpty(this.widget.get('buttons.header'), 'Header buttons array was empty.');
        Assert.isNotNull(this.widget.getStdModNode('header').one('.yui3-button'), 'No button rendered in header.');

        ArrayAssert.isNotEmpty(this.widget.get('buttons.footer'), 'Footer buttons array was empty.');
        Assert.isNotNull(this.widget.getStdModNode('footer').one('.yui3-button'), 'No button rendered in footerButton.');
    },

    'User-provided `buttons` should override defaults': function () {
        var PanelWidget = Y.Base.create('panelWidget', Y.Widget, [Y.WidgetStdMod, Y.WidgetButtons], {
            BUTTONS: {
                close: {
                    action: function () {
                        this.hide();
                    },

                    label  : 'Close',
                    section: Y.WidgetStdMod.HEADER
                }
            }
        });

        var clicked = 0,
            widget1 = new PanelWidget({buttons: []}),
            widget2 = new PanelWidget({
                render : '#test',
                buttons: [
                    {
                        type  : 'close',
                        action: function () {
                            clicked += 1;
                        }
                    }
                ]
            });

        ObjectAssert.ownsNoKeys(widget1.get('buttons'), '`widget1` has buttons.');
        Assert.areSame('Close', widget2.get('buttons.header')[0].get('text'), '`widget2` does not have a "close" button in header.');

        widget2.get('contentBox').one('.yui3-button').simulate('click');
        Assert.areSame(1, clicked);

        widget1.destroy();
        widget2.destroy();
    },

    'A button configured with a `name` should be accessible by that `name`': function () {
        this.widget = new TestWidget({
            buttons: [{name: 'foo'}]
        });

        Assert.isNotUndefined(this.widget.getButton('foo'), '`foo` button was undefined.');
    },

    'Last button in should win when multiple `buttons` have the same `name`': function () {
        var buttons;

        this.widget = new TestWidget({
            render : '#test',
            buttons: [
                {name: 'foo', label: 'Foo'},
                {name: 'foo', label: 'Bar'}
            ]
        });

        buttons = this.widget.get('contentBox').all('.yui3-button');
        Assert.areSame(2, buttons.size(), 'Widget did not have 2 buttons.');

        Assert.areSame(buttons.item(1), this.widget.getButton('foo'), 'First button is not `foo`.');
        Assert.areSame('Bar', this.widget.getButton('foo').get('text'), '`foo` button does not have text "Foo".');
    },

    'A button configured with a `isDefault` should be the default button': function () {
        this.widget = new TestWidget({
            buttons: [{name: 'foo', isDefault: true}]
        });

        Assert.areSame(this.widget.getButton('foo'), this.widget.getDefaultButton(), '`foo` is not the default button.');
    },

    'Last button in should win when multiple `buttons` are `isDefault`': function () {
        this.widget = new TestWidget({
            buttons: [
                {name: 'foo', isDefault: true},
                {name: 'bar', isDefault: true}
            ]
        });

        Assert.areSame(2, this.widget.get('buttons.footer').length, 'Widget did not have 2 footer buttons.');
        Assert.areSame(this.widget.getButton('bar'), this.widget.getDefaultButton(), '`bar` is not the default button.');
    },

    '`isDefault` should only be considered when it is `true` or "true" (any case)': function () {
        this.widget = new TestWidget({
            buttons: [
                {name: 'foo', isDefault: true},
                {name: 'bar', isDefault: 'true'},
                {name: 'bar', isDefault: 'True'},
                {name: 'zee', isDefault: 'TRUE'},

                // The follow should evaluate to _not_ being the default;
                {isDefault: false, label: 'false'},
                {isDefault: 'false', label: '"false"'},
                {isDefault: 0, label: '0'},
                {isDefault: '', label: '""'},
                {isDefault: 'yes', label: 'yes'}
            ]
        });

        Assert.areSame(9, this.widget.get('buttons.footer').length, 'Widget did not have 9 footer buttons.');
        Assert.areSame(this.widget.getButton('zee'), this.widget.getDefaultButton(), '`zee` is not the default button.');
    },

    '`buttons` should be settable to a new value': function () {
        this.widget = new TestWidget({
            buttons: [{name: 'foo', label: 'Foo'}],
            render : '#test'
        });

        Assert.areSame(1, this.widget.get('buttons.footer').length, 'Did not have 1 footer button.');
        Assert.areSame(1, Y.all('#test button').size(), 'More than one button in the Widget.');

        this.widget.set('buttons', [{name: 'foo', label: 'Bar'}]);

        Assert.areSame(1, this.widget.get('buttons.footer').length, 'Did not have 1 footer button.');
        Assert.areSame(1, Y.all('#test button').size(), 'More than one button in the Widget.');
        Assert.areSame('Bar', this.widget.getButton('foo').get('text'), '`foo` button did not have the label "Bar".');
    },

    '`buttons` should be settable to the same value': function () {
        this.widget = new TestWidget({
            buttons: [{name: 'foo', label: 'Foo'}],
            render : '#test'
        });

        Assert.areSame(1, this.widget.get('buttons.footer').length, 'Did not have 1 footer button.');
        Assert.areSame(1, Y.all('#test button').size(), 'More than one button in the Widget.');

        this.widget.set('buttons', this.widget.get('buttons'));

        Assert.areSame(1, this.widget.get('buttons.footer').length, 'Did not have 1 footer button.');
        Assert.areSame(1, Y.all('#test button').size(), 'More than one button in the Widget.');
        Assert.areSame('Foo', this.widget.getButton('foo').get('text'), 'Foo button was not rendered.');
    }
}));

// -- Methods ------------------------------------------------------------------
suite.add(new Y.Test.Case({
    name: 'Methods',

    tearDown: function () {
        this.widget && this.widget.destroy();
        Y.one('#test').empty();
    },

    '`addButton()` should add and render a new button': function () {
        var called = 0,
            newButton;

        this.widget = new TestWidget({render: '#test'});

        Assert.isUndefined(this.widget.get('buttons.header'), 'Widget has button config in header.');
        Assert.areSame(0, this.widget.get('contentBox').all('.yui3-button').size(), 'Widget has button in header.');

        this.widget.addButton({
            value  : 'Foo',
            section: 'header',
            action : function () {
                called += 1;
            }
        });

        Assert.areSame(1, this.widget.get('buttons.header').length, 'Widget does not have 1 button config in header.');
        Assert.areSame(1, this.widget.getStdModNode('header').all('.yui3-button').size(), 'Widget does not have 1 button in header.');

        newButton = this.widget.getStdModNode('header').one('.yui3-button');
        newButton.simulate('click');

        Assert.areSame('Foo', newButton.get('text'), '`newButton` text was not "Foo".');
        Assert.areSame(1, called, '`newButton` action was not called.');

        this.widget.addButton({
            value  : 'Bar',
            section: 'footer',
            action : function () {
                called += 1;
            }
        });

        Assert.areSame(1, this.widget.get('buttons').footer.length, 'Widget does not have 1 button config in header.');
        Assert.areSame(1, this.widget.getStdModNode('footer').all('.yui3-button').size(), 'Widget does not have 1 button in footer.');

        newButton = this.widget.getStdModNode('footer').one('.yui3-button');
        newButton.simulate('click');

        Assert.areSame('Bar', newButton.get('text'), '`newButton` text was not "Bar".');
        Assert.areSame(2, called, '`newButton` action was not called.');
    },

    '`getButton()` should return a button by name': function () {
        var button;

        this.widget = new TestWidget({
            render : '#test',
            buttons: [
                {name: 'foo'}
            ]
        });

        button = this.widget.get('contentBox').one('.yui3-button');
        Assert.isNotNull(button, '`button` is `null`.');
        Assert.areSame(button, this.widget.getButton('foo'));
    },

    '`getButton()` should return a button by index and section': function () {
        var fooButton, barButton;

        this.widget = new TestWidget({
            render : '#test',
            buttons: {
                header: [{name: 'foo'}],
                footer: [{name: 'bar'}]
            }
        });

        fooButton = this.widget.getStdModNode('header').one('.yui3-button');
        barButton = this.widget.getStdModNode('footer').one('.yui3-button');

        Assert.isNotNull(fooButton, 'Did not find `fooButton`.');
        Assert.isNotNull(barButton, 'Did not find `barButton`.');

        Assert.areSame(fooButton, this.widget.getButton(0, 'header'));
        Assert.areSame(barButton, this.widget.getButton(0, 'footer'));
        Assert.areSame(barButton, this.widget.getButton(0));
    }
}));

// -- Rendering ----------------------------------------------------------------
suite.add(new Y.Test.Case({
    name: 'Rendering',

    tearDown: function () {
        this.widget && this.widget.destroy();
        Y.one('#test').empty();
    },

    '`buttons` should render their `value` as text': function () {
        var button;

        this.widget = new TestWidget({
            render : '#test',
            buttons: [
                {
                    value  : 'Foo',
                    section: 'header'
                }
            ]
        });

        button = this.widget.get('contentBox').one('.yui3-button');
        Assert.areSame('Foo', button.get('text'), '`button` text is not "Foo".');
    },

    '`buttons` should render their `label` as text': function () {
        var button;

        this.widget = new TestWidget({
            render : '#test',
            buttons: [
                {
                    label  : 'Foo',
                    section: 'header'
                }
            ]
        });

        button = this.widget.get('contentBox').one('.yui3-button');
        Assert.areSame('Foo', button.get('text'), '`button` text is not "Foo".');
    },

    '`buttons` should render in the correction section': function () {
        var headerButton, footerButton;

        this.widget = new TestWidget({
            render : '#test',
            buttons: [
                {
                    value  : 'Foo',
                    section: 'header'
                },
                {
                    value  : 'Bar',
                    section: 'footer'
                }
            ]
        });

        headerButton = this.widget.getStdModNode('header').one('.yui3-button');
        footerBotton = this.widget.getStdModNode('footer').one('.yui3-button');

        Assert.areSame('Foo', headerButton.get('text'), '`headerButton` text is not "Foo".');
        Assert.areSame('Bar', footerBotton.get('text'), '`footerButton` text is not "Bar".');
    },

    '`buttons` should move to the correct position': function () {
        var markup = '' +
            '<div>' +
                '<div class="yui3-widget-hd">' +
                    '<span class="yui3-widget-buttons">' +
                        '<button class="yui3-button" name="foo">Foo</button>' +
                        '<button class="yui3-button" name="bar">Bar</button>' +
                    '</span>' +
                '</div>' +
            '</div>';

        Y.one('#test').append(markup);

        var headerButtons = Y.one('#test .yui3-widget-hd .yui3-widget-buttons'),
            fooButton     = Y.one('#test button[name=foo]'),
            barButton     = Y.one('#test button[name=bar]');

        Assert.areSame(fooButton, headerButtons.get('firstChild'), '`foo` button is not the first header button.');

        this.widget = new TestWidget({
            srcNode: '#test div',
            render : true,
            buttons: {
                header: [
                    barButton,
                    {name: 'baz', label: 'Baz'},
                    fooButton
                ]
            }
        });

        Assert.isTrue(Y.one('#test').contains(fooButton), 'Foo button was removed.');
        Assert.isTrue(Y.one('#test').contains(barButton), 'Bar button was removed.');
        Assert.areNotSame(fooButton, headerButtons.get('firstChild'), '`foo` button is the first header button.');
        Assert.areSame(barButton, headerButtons.get('firstChild'), '`bar` button is the first header button.');
    },

    'Default button should be focused on `visibleChange`': function () {
        var visibleCalled = 0,
            focusCalled   = 0;

        this.widget = new TestWidget({
            visible: false,
            render : '#test',
            buttons: [
                {
                    name     : 'foo',
                    label    : 'Foo',
                    isDefault: true
                }
            ]
        });

        this.widget.after('visibleChange', function (e) {
            visibleCalled += 1;
        });

        this.widget.getButton('foo').on('focus', function (e) {
            focusCalled += 1;
        });

        this.widget.set('visible', true);

        Assert.areSame(1, visibleCalled, '`visibleChange` was not called only 1 time.');
        Assert.areSame(1, focusCalled, '`focus` was not called only 1 time.');
    }
}));

// -- Events -------------------------------------------------------------------
suite.add(new Y.Test.Case({
    name: 'Events',

    tearDown: function () {
        this.widget && this.widget.destroy();
        Y.one('#test').empty();
    },

    '`buttonsChange` should fire when setting new `buttons`': function () {
        var called = 0,
            buttons, button;

        this.widget = new TestWidget({
            render : '#test',
            buttons: {
                footer: [{value: 'Foo'}]
            }
        });

        this.widget.after('buttonsChange', function (e) {
            called += 1;
        });

        buttons = this.widget.get('buttons');
        button  = this.widget.getStdModNode('footer').one('.yui3-button');

        this.widget.set('buttons', [
            {
                value  : 'Bar',
                section: 'header'
            }
        ]);

        Assert.areSame(1, called, '`buttonsChange` did not fire.');

        Assert.areNotSame(buttons, this.widget.get('buttons'), '`buttons` was not re-created.');
        Assert.isNotNull(this.widget.getStdModNode('footer').one('.yui3-button'), 'Footer button was not removed.');

        Assert.areSame(1, this.widget.get('buttons.header').length, 'Widget header did not have a button.');
    },

    '`buttonsChange` should fire when calling `addButton()`': function () {
        var called = 0,
            button;

        this.widget = new TestWidget({
            render : '#test',
            buttons: {
                footer: [{value: 'Foo'}]
            }
        });

        this.widget.after('buttonsChange', function (e) {
            called += 1;

            Assert.areSame('add', e.src, '`buttonsChange src was not "add".');
            Assert.isNotUndefined(e.button, '`buttonsChange` button was not defined.');
            Assert.isNotUndefined(e.section, '`buttonsChange` section was not defined.');
            Assert.isNotUndefined(e.index, '`buttonsChange` index was not defined.');
        });

        button = this.widget.getStdModNode('footer').one('.yui3-button');

        this.widget.addButton({
            value  : 'Bar',
            section: 'header'
        });

        Assert.areSame(1, called, '`buttonsChange` did not fire.');
        Assert.areSame(button, this.widget.getStdModNode('footer').one('.yui3-button'), 'Footer button was re-created.');
        Assert.areSame(1, this.widget.get('buttons.header').length, 'Widget header did not have a button.');
    },

    '`buttonsChange` should fire when calling `removeButton()`': function () {
        var called = 0,
            button;

        this.widget = new TestWidget({
            render : '#test',
            buttons: {
                footer: [{name: 'foo', value: 'Foo'}]
            }
        });

        this.widget.after('buttonsChange', function (e) {
            called += 1;

            Assert.areSame('remove', e.src, '`buttonsChange src was not "remove".');
            Assert.isNotUndefined(e.button, '`buttonsChange` button was not defined.');
            Assert.isNotUndefined(e.section, '`buttonsChange` section was not defined.');
            Assert.isNotUndefined(e.index, '`buttonsChange` index was not defined.');
        });

        button = this.widget.getStdModNode('footer').one('.yui3-button');

        this.widget.removeButton(this.widget.getButton('foo'));

        Assert.areSame(1, called, '`buttonsChange` did not fire.');
        Assert.isUndefined(this.widget.get('buttons.header'), 'Button was not removed from `buttons`.');
        Assert.isFalse(this.widget.getStdModNode('footer').contains(button), 'Footer button wasnot removed.');
    }
}));

Y.Test.Runner.add(suite);

}, '@VERSION@', {
    requires: ['widget-buttons', 'test', 'node-event-simulate']
});
