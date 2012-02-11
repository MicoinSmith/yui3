var YArray  = Y.Array,
    YLang   = Y.Lang,
    YObject = Y.Object,

    getClassName = Y.ClassNameManager.getClassName,
    isArray      = YLang.isArray,
    isNumber     = YLang.isNumber,
    isString     = YLang.isString;

// TODOs:
//
// * Call into `Y.Node.button()`:
//   * Make sure to blacklist config first.
//   * Pass along `name` from config.
//   * Set `name` and `default` as Node data.
// * Move `BUTTONS.close` and related CSS to Panel.
// * Styling to add spacing between buttons?
//

function WidgetButtons() {
    // Require `Y.WidgetStdMod`.
    if (!this._stdModNode) {
        Y.error('WidgetStdMod must be added to the Widget before WidgetButtons.');
    }
}

WidgetButtons.ATTRS = {
    buttons: {
        value            : {},
        setter           : '_setButtons',
        cloneDefaultValue: 'shallow'
    }
};

WidgetButtons.CLASS_NAMES = {
    button : getClassName('button'),
    buttons: getClassName('widget', 'buttons')
};

WidgetButtons.HTML_PARSER = {
    buttons: function () {
        return this._parseButtons();
    }
};

WidgetButtons.prototype = {
    // -- Public Properties ----------------------------------------------------

    // TODO: Move this to Y.Panel.
    BUTTONS: {
        close: {
            action: function () {
                this.hide();
            },

            classNames: [
                getClassName('button', 'close')
            ],

            label  : 'Close',
            section: Y.WidgetStdMod.HEADER
        }
    },

    BUTTONS_TEMPLATE: '<span />',

    DEFAULT_BUTTONS_SECTION: Y.WidgetStdMod.FOOTER,

    // -- Protected Properties -------------------------------------------------

    // -- Lifecycle Methods ----------------------------------------------------

    initializer: function () {
        Y.after(this._bindUIButtons, this, 'bindUI');
        Y.after(this._syncUIButtons, this, 'syncUI');

        // Creates `name` -> `button` mapping and sets the `_defaultButton`.
        this._mapButtons(this.get('buttons'));
    },

    destructor: function () {
        delete this._buttonsMap;
        delete this._defaultButton;
    },

    // -- Public Methods -------------------------------------------------------

    addButton: function (button, section, index) {
        var buttons = this.get('buttons'),
            sectionButtons;

        if (!Y.instanceOf(button, Y.Node)) {
            button = this._mergeButtonConfig(button);
        }

        section || (section = button.section || this.DEFAULT_BUTTONS_SECTION);
        sectionButtons = buttons[section] || (buttons[section] = []);
        isNumber(index) || (index = sectionButtons.length);

        // Insert new button at the correct position.
        sectionButtons.splice(index, 0, button);

        this.set('buttons', buttons, {
            button : button,
            section: section,
            index  : index,
            src    : 'add'
        });

        return this;
    },

    getButton: function (name, section) {
        var buttons;

        // Supports `getButton(1, 'header')` signature.
        if (isNumber(name)) {
            buttons = this.get('buttons');
            section || (section = this.DEFAULT_BUTTONS_SECTION);
            return buttons[section] && buttons[section][name];
        }

        return this._buttonsMap[name];
    },

    getDefaultButton: function () {
        return this._defaultButton;
    },

    removeButton: function (button, section) {
        var buttons = this.get('buttons'),
            index;

        // Shortcut if `button` is already an index which is needed for slicing.
        if (isNumber(button)) {
            section || (section = this.DEFAULT_BUTTONS_SECTION);
            index  = button;
            button = buttons[section][index];
        } else {
            // Supports `button` being the String name.
            isString(button) && (button = this._buttonsMap[button]);

            // Determines the `section` and `index` at which the button exists.
            YObject.some(buttons, function (sectionButtons, currentSection) {
                index = YArray.indexOf(sectionButtons, button);

                if (index > -1) {
                    section = currentSection;
                    return true;
                }
            });
        }

        // Remove button from `section` Array.
        buttons[section].splice(index, 1);

        this.set('buttons', buttons, {
            button : button,
            section: section,
            index  : index,
            src    : 'remove'
        });

        return this;
    },

    // -- Protected Methods ----------------------------------------------------

    _bindUIButtons: function () {
        this.after('buttonsChange', Y.bind('_afterButtonsChange', this));
        this.after('visibleChange', Y.bind('_afterVisibleChangeButtons', this));
    },

    _createButton: function (config) {
        var classNames = YArray(config.classNames),
            context    = config.context || this,
            events     = config.events || 'click',
            label      = config.label || config.value,
            button;

        button = new Y.Button(Y.merge(config, {label: label})).getNode();
        button.setData('name', config.name);
        button.setData('default', this._getButtonDefault(config));

        YArray.each(classNames, button.addClass, button);

        // Supports all types of crazy configurations for event subscriptions.
        button.on(events, config.action, context);

        return button;
    },

    _getButtonContainer: function (section) {
        var buttonsClassName = WidgetButtons.CLASS_NAMES.buttons,
            sectionNode      = this.getStdModNode(section),
            container        = sectionNode && sectionNode.one('.' + buttonsClassName);

        // Create the `container` if it doesn't already exist.
        if (!container) {
            container = Y.Node.create(this.BUTTONS_TEMPLATE);
            container.addClass(buttonsClassName);
            this.setStdModContent(section, container, 'after');
        }

        return container;
    },

    _getButtonDefault: function (button) {
        var isDefault = Y.instanceOf(button, Y.Node) ?
                button.getData('default') : button.isDefault;

        if (isString(isDefault)) {
            return isDefault.toLowerCase() === 'true';
        }

        return !!isDefault;
    },

    _getButtonName: function (button) {
        var name;

        if (Y.instanceOf(button, Y.Node)) {
            name = button.getData('name') || button.get('name');
        } else {
            name = button && (button.name || button.type);
        }

        return name;
    },

    _mapButton: function (button) {
        var name      = this._getButtonName(button),
            isDefault = this._getButtonDefault(button);

        this._buttonsMap[name] = button;
        isDefault && (this._defaultButton = button);
    },

    _mapButtons: function (buttons) {
        this._buttonsMap    = {};
        this._defaultButton = null;

        YObject.each(buttons, function (sectionButtons) {
            YArray.each(sectionButtons, this._mapButton, this);
        }, this);
    },

    _mergeButtonConfig: function (config) {
        config = isString(config) ? {name: config} : Y.merge(config);

        var name      = this._getButtonName(config),
            defConfig = this.BUTTONS && this.BUTTONS[name];

        // Merge button `config` with defaults.
        if (defConfig) {
            Y.mix(config, defConfig, false, null, 0, true);
        }

        return config;
    },

    _parseButtons: function () {
        var buttonsConfig     = {},
            buttonClassName   = WidgetButtons.CLASS_NAMES.button,
            buttonsClassName  = WidgetButtons.CLASS_NAMES.buttons,
            buttonsSelector   = '.' + buttonsClassName + ' .' + buttonClassName,
            contentBox        = this.get('contentBox'),
            sections          = ['header', 'body', 'footer'],
            sectionClassNames = Y.WidgetStdMod.SECTION_CLASS_NAMES,
            i, len, section, sectionNode, buttons, sectionButtons;

        // Hoisted support function out of for-loop.
        function addButtonToSection(button) {
            sectionButtons.push(button);
        }

        for (i = 0, len = sections.length; i < len; i += 1) {
            section     = sections[i];
            sectionNode = contentBox.one('.' + sectionClassNames[section]);
            buttons     = sectionNode && sectionNode.all(buttonsSelector);

            if (!buttons || buttons.isEmpty()) { continue; }

            sectionButtons = [];
            buttons.each(addButtonToSection);

            buttonsConfig[section] = sectionButtons;
        }

        return buttonsConfig;
    },

    _setButtons: function (config) {
        var defSection = this.DEFAULT_BUTTONS_SECTION,
            buttons    = {};

        function processButtons(buttonConfigs, currentSection) {
            if (!isArray(buttonConfigs)) { return; }

            var i, len, button, buttonConfig, section;

            for (i = 0, len = buttonConfigs.length; i < len; i += 1) {
                button  = buttonConfigs[i];
                section = currentSection;

                if (!Y.instanceOf(button, Y.Node)) {
                    buttonConfig = this._mergeButtonConfig(button);
                    button       = this._createButton(buttonConfig);

                    section || (section = buttonConfig.section);
                }

                // Use provided `section` or fallback to the default section.
                section || (section = defSection);

                // Add button to the Array of buttons for the specified section.
                (buttons[section] || (buttons[section] = [])).push(button);
            }
        }

        // Handle `config` being either an Array or Object of Arrays.
        if (isArray(config)) {
            processButtons.call(this, config);
        } else {
            YObject.each(config, processButtons, this);
        }

        return buttons;
    },

    _syncUIButtons: function () {
        this._uiSetButtons(this.get('buttons'));
    },

    _uiInsertButton: function (button, section, index) {
        var buttonsClassName = WidgetButtons.CLASS_NAMES.button,
            buttonContainer  = this._getButtonContainer(section),
            sectionButtons   = buttonContainer.all('.' + buttonsClassName);

        // Inserts the button node at the correct index.
        buttonContainer.insertBefore(button, sectionButtons.item(index));
    },

    _uiRemoveButton: function (button) {
        button.remove(true);
    },

    _uiSetButtons: function (buttons) {
        var buttonClassName = WidgetButtons.CLASS_NAMES.button;

        YObject.each(buttons, function (sectionButtons, section) {
            var buttonContainer = this._getButtonContainer(section),
                buttonNodes     = buttonContainer.all('.' + buttonClassName),
                i, len, button, buttonIndex;

            for (i = 0, len = sectionButtons.length; i < len; i += 1) {
                button      = sectionButtons[i];
                buttonIndex = buttonNodes ? buttonNodes.indexOf(button) : -1;

                // Buttons already rendered in the Widget should remain there or
                // moved to their new index. New buttons will be added to the
                // current `buttonContainer`.
                if (buttonIndex > -1) {
                    // Remove button from existing buttons NodeList since its in
                    // the DOM already.
                    buttonNodes.splice(buttonIndex, 1);

                    // Check that the button is at the right position, if not,
                    // move it to its new position.
                    if (buttonIndex !== i) {
                        // Using `i + 1` because the button should be at index
                        // `i`; it's inserted before the node which comes after.
                        buttonContainer.insertBefore(button, i + 1);
                    }
                } else {
                    buttonContainer.appendChild(button);
                }
            }

            // Removes and destroys the old button nodes which are no longer
            // part of this Widget's `buttons`.
            buttonNodes.remove(true);
        }, this);
    },

    _unMapButton: function (button) {
        var map  = this._buttonsMap,
            name = this._getButtonName(button);

        // Only delete the map entry if the specified `button` is mapped to it.
        if (map[name] === button) {
            delete map[name];
        }

        // Clear the default button if its the specified `button`.
        this._defaultButton === button && (this._defaultButton = null);
    },

    // -- Protected Event Handlers ---------------------------------------------

    _afterButtonsChange: function (e) {
        var buttons = e.newVal,
            src     = e.src,
            button;

        // Special cases `addButton()` to only set and insert the new button.
        if (src === 'add') {
            button = buttons[e.section][e.index];

            this._mapButton(button);
            this._uiInsertButton(button, e.section, e.index);

            return;
        }

        // Special cases `removeButton()` to only remove the specified button.
        if (src === 'remove') {
            button = e.button;

            this._unMapButton(button);
            this._uiRemoveButton(button);

            return;
        }

        this._mapButtons(buttons);
        this._uiSetButtons(buttons);
    },

    _afterVisibleChangeButtons: function (e) {
        var defaultButton = this.getDefaultButton();

        if (defaultButton && e.newVal) {
            defaultButton.focus();
        }
    }
};

Y.WidgetButtons = WidgetButtons;
