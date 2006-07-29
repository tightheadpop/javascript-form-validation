Object.extend(Element, {
	enable: function (element) { $(element).disabled = false; },
	isEnabled: function(element) { return !Element.isDisabled(element); },
	disable: function (element) { $(element).disabled = true; },
	isDisabled: function(element) { return $(element).disabled; },
	makeInvisible: function(element) { $(element).style.visibility = 'hidden'; },
	makeVisible: function(element) { $(element).style.visibility = 'visible'; }
});

// extracted to prevent unexplained script error
function toggle(element) {
	Element.toggle($(element));
}

Object.extend(Validation, {
	validateAsPositiveInteger: function(displayName) {
		return function(element) {
			element.FILTER = Validation.Filter.Integer;
			element.INTEGER = true;
			element.MIN = 1;
			element['DISPLAY-NAME'] = displayName;
		}
	},
	
	validateAsPositiveNumber: function(displayName) {
		return function(element) {
			element.FILTER = Validation.Filter.Number;
			element.NUMBER = true;
			element.MIN = 1;
			element['DISPLAY-NAME'] = displayName;
		}
	},
	
	require: function(element) {
		element.REQUIRED = true;
	},
	
	computeDisplayName: function(element) {
		var name = element.name.split(".")[1];
		element['DISPLAY-NAME'] = name.replace(/^(.)/, name.charAt(0).toUpperCase()).replace(/([A-Z])/g, " $1").trim();
	},
	
	requireCheckBoxGroup: function(groupName, validationMessage, filter) {
		var requiredCheckBoxes = cssQuery('input[name=' + groupName + ']').filter(filter || Prototype.K);
		if (requiredCheckBoxes.isNotEmpty()) {
			requiredCheckBoxes[0].OR = requiredCheckBoxes.slice(1);
			requiredCheckBoxes[0]['OR-MESSAGE'] = validationMessage;
		}
	}
});

Validation.Filter = {};
Object.extend(Validation.Filter, {
	Integer: /[\d]/,
	Number: function(element){
		if($F(element).contains('.'))
			return /[\d]/;
		else
			return /[\d.]/;
	},
	FileName: /[^<>"?*;:\/\\]/
});

if (!Behavior) var Behavior = {};
Behavior.causesPostBack = function(element) {
	if ('INPUT'.equalsIgnoreCase(element.tagName)) {
		Event.observe(element, 'keypress', function(oEvent) {
			oEvent = oEvent || window.event;
			var keyCode = oEvent.which || oEvent.keyCode;
			if (keyCode == Event.KEY_RETURN)
				element.form.validateAndSubmit();
		});
	}
	else if ('A'.equalsIgnoreCase(element.tagName)) {
		element.onclick = function() {
			Element.getContainerByTagName(this, 'FORM').validateAndSubmit();
		}
	}
	else throw "unsupported postback for element " + [element.id, element.tagName];
}

Behavior.enableWhenRequiredFieldsAreProvided = function(button){
	button = $(button);
	new TimedEvent(Timer.Fast, function() {
		button.disabled = Form.getElements(button.form).filter(Validation.isRequired).filter(Element.isEnabled).some(Form.Element.hasNoInput); 
	});
};

Form.Element.hasInput = function(element) {
	return Form.Element.getValue(element).trim() != String.Empty;
};

Form.Element.hasNoInput = function(element) {
	return !Form.Element.hasInput(element);
};

var TimedEvent = function(frequency, callback) {
	window.setInterval(callback, frequency * 1000);
};

var Timer = {
	Fast: 0.100,
	Slow: 0.300
};

//SAILSFIX
Event.observe(window, 'load', function() {
	cssQuery('OPTION[value=_null_option_value_]').poke('value', String.Empty);
});