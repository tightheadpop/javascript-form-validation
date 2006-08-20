/*********************************************************************
Validation javascript framework, version 4.0.0

Copyright (c) 1997-2006 Matthew A. Frank

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


This script now depends on Prototype, another javascript library.

	http://prototype.conio.net/

*********************************************************************/
Object.extend(Object, {
	isDefined: function(thing) {
		return typeof thing !== 'undefined';
	},
	hasValue: function(thing) {
		return Object.isDefined(thing) && thing !== null;
	},
	$get: function(thing, propertyName) {
		var returnValue;
		returnValue = thing[propertyName];
		if(!Object.isDefined(returnValue) && thing.getAttribute)
			returnValue=thing.getAttribute(propertyName);

		if($V(returnValue) && returnValue.isString && returnValue.startsWith('@'))
			returnValue = Function.create("return (" + returnValue.replace(/^@/, String.Empty) + ")").apply(thing, []);
		return returnValue;
	},
	$set: function(thing, propertyName, value) {
		thing[propertyName] = value;
	}
});
var $V = Object.hasValue;

Function.Null = function() {};
Function.create = function(value) {
	if($V(value)) {
		if(value.isFunction)
			return value;
		else
			return new Function(value);
	} else {
		return Function.Null;
	}
};
Object.extend(Function.prototype, {
	then: function(that) {
		var me = this;
		return function() { me.apply(this, arguments); Function.create(that).apply(this, arguments); };
	},
	after: function(two) {
		var one = this;
		return Function.create(two).then(one);
	},
	forEach: function() {
		$A(arguments).forEach(this);
	},
	isFunction: true
});
Object.extend(String, {
	Empty: "",
	format: function() {
		var tokens = $A(arguments);
		var result = tokens.shift();
		tokens.each(function(token, index) {
			result = result.replace(new RegExp("\\{" + index + "\\}", "g"), token);
		});
		return result;
	}
});
Object.extend(String.prototype, {
	trim: function() {
		return this.replace(/^\s+|\s+$/g, String.Empty);
	},
	startsWith: function(prefix) {
		return new RegExp("^" + prefix).test(this);
	},
	endsWith: function(suffix) {
		return new RegExp(suffix + "$").test(this);
	},
	contains: function (substring$) {
		return this.indexOf(substring$) > -1;
	},
	containsIgnoreCase: function (substring$) {
		return this.toUpperCase().indexOf(substring$.toUpperCase()) > -1;
	},
	equalsIgnoreCase: function(that) {
		if ($V(that) && that.isString)
			return this.toLowerCase() == that.toLowerCase();
		return false;
	},
	format: function() {
		return String.format.apply({}, [this].concat($A(arguments)));
	},
	isString: true
});
RegExp.prototype.isRegExp = true;
Object.extend(Number.prototype, {
	isEven: function() { return Math.abs(this % 2) === 0; },
	isOdd: function() { return Math.abs(this % 2) === 1; }
});
Number.format = function(i) {
	//TODO validation constants
	if (!$V(i))
		return null;
	var end = (/\./.test(i = i.toString()))?"\\.":'$';
	var re = new RegExp("(\\d)(\\d{3})(,|" + end + ")");
	if (re.test(i))
		i = Number.format(i.replace(re, "$1,$2$3"));
	return i;
};
// the following methods are part of the 1.5 spec
if(![].forEach)
Array.prototype.forEach = function (callback, thisObject) {
	for (var i = 0; i < this.length; i++)
		callback.apply(thisObject || {}, [this[i]]);
};
if(![].map)
Array.prototype.map = function (callback, thisObject) {
	var result = [];
	this.forEach(function(i) {
		result.push(callback.apply(thisObject || {}, [i]));
	});
	return result;
};
if(![].filter)
Array.prototype.filter = function (callback, thisObject) {
	var result = [];
	this.forEach( function(i) {
		if (callback.apply(thisObject || {}, [i]))
			result.push(i);
	});
	return result;
};
if (![].some)
Array.prototype.some = function(callback, thisObject) {
	for (var i = 0; i < this.length; i++)
		if (!!callback.apply(thisObject || {}, [this[i]]))
			return true;
	return false;
};
if (![].every)
Array.prototype.every = function(callback, thisObject) {
	for (var i = 0; i < this.length; i++)
		if (!callback.apply(thisObject || {}, [this[i]]))
			return false;
	return true;
};
Object.extend(Array.prototype, {
	equals: function (otherArray) {
		otherArray = $A(otherArray);
		if (this.length === otherArray.length) {
			for(var i = 0; i < this.length; i++) {
				//doesn't handle embedded arrays
				if (this[i] != otherArray[i])
					return false;
			}
			return true;
		}
		return false;
	},
	choose: function () {
		for (var i = 0; i < this.length; i++)
			if ($V(this[i])) return this[i];
		return null;
	},
	notEmpty: function() {
		return this.first() !== null;
	},
	poke: function(property, value) {
		this.forEach(function(item){ item[property] = value; });
	},
	contains: function (item) {
		return this.some(function(each) { return each == item; });
	},
	excludes: function (item) {
		return !this.contains(item);
	},
	lastIndexOf: function(object) {
		for(var i=this.length-1; i>=0; i--)
			if (object == this[i]) return i;
		return -1;
	},
	distinct: function() {
		var result = [];
		for(var i=0; i<this.length; i++)
			if (result.excludes(this[i])) result.push(this[i]);
		return result;
	},
	union: function(other) {
		return this.concat(other).distinct();
	},
	intersection: function(other) {
		return this.filter(other.contains, other).distinct();
	},
	minus: function(other) {
		return this.filter(other.excludes, other).distinct();
	},
	symmetricDifference: function(other) {
		return this.union(other).minus(this.intersection(other));
	}
});
Object.extend(Element, {
	getElementsByTagNames: function(element) {
		var result = [];
		var tagNames = $A(arguments).slice(1);
		
		var elements;
		for (var i = 0; i < tagNames.length; i++) {
			elements = element.getElementsByTagName(tagNames[i]);
			for (var j = 0; j < elements.length; j++)
				result.push(elements[j]);
		}
		return result;
	},
	getContainerByTagName: function(element, tagName) {
		for(var parent = $(element).parentNode; parent && !tagName.equalsIgnoreCase(parent.tagName); parent = parent.parentNode){}
		return parent;
	},
	getProperty: function(element, propertyName){
		var result = Object.$get($(element), propertyName);
		if ($V(result) && result.isFunction)
			result = result.apply(element, [element]);
		return result;
	},
	getHandler: function(element, handlerName) {
		return Function.create(Object.$get($(element), handlerName));
	},
	propertyOn: function(/* attribute list */){
		var isOn, attribute, length = arguments.length;
		for(var i=0;i<length;i++){
			attribute = arguments[i];
			if(typeof attribute=='string')
				attribute = attribute.toLowerCase();
			isOn = $V(attribute) &&
				   attribute!='false' &&
				   attribute!='off' &&
				   attribute!='no' &&
			       attribute!=false &&
			       attribute!=String.Empty;
			if(isOn) break;
		}
		return !!isOn;
	},
	_identityCounter: 0,
	idFor: function (element) {
		if (!element.id)
			element.id = 'v_ctl' + this._identityCounter++;
		return element.id;
	}
});
var $P = Element.getProperty;
/******************************************/
Object.extend(Form, {
	restore: function(form, reset){
		form = $(form);
		form.isValid = true;
		Validation.Err.clearMessages(form);
		for(var i = 0;i < form.elements.length; i++){
			Form.Element.restore(form.elements[i]);
			if(reset)form.elements[i].onreset();
		}
	},
	isValid: function(form,event){
		var i,iElements,orderBy,position;
		var element,elementList = $A(form.elements);
		Form.restore(form);
		if(form.onbeforevalidate()==false)
			return false;
		//TODO validation constants
		orderBy = $P(form, 'ORDERED-VALIDATION');
		if($ON(orderBy)){
			orderBy = /^tabindex$/i.test(orderBy)?'tabIndex':'VALIDATION-ORDER';
			elementList = [];
			for(i=0,iElements=form.elements.length;i<iElements;i++){
				element=form.elements[i];
				position = parseInt($P(element, orderBy));
				if($ON(position) && !isNaN(position))
					elementList=elementList.slice(0,position).concat(element,elementList.slice(position));
				else
					elementList[elementList.length]=element;
			}
		}
		for(i=0,iElements=elementList.length;i<iElements;i++)
			if (!Form.Element.validate(elementList[i], event))
				form.isValid = false;
		if(form.onaftervalidate()==false)
			return false;
		return form.isValid;
	},
	markRequired: function(form){
		$A(form.elements).forEach(Form.Element.markRequired);
	},
	validate: function(form, oEvent){
		form.isValid = Form.isValid(form, oEvent);
		Validation.Err.displayMessages(form);
		return form.isValid;
	},
	validateAndSubmit: function(form) {
		form = $(form);
		//TODO pass event for mozilla
		if(form.onsubmit()!==false)
			form.submit();
	},
	resetValidation: function(form){
		Form.restore(form, true);
		Validation.Err.renderSummary(form);
	}

});

Object.extend(Form.Element, {
	markInvalid: function(element){
		Element.addClassName($(element), Validation.invalidClassName);
	},
	restore: function(element){
		element = $(element);
		element.__validated = false;
		element.isValid = true;
		Validation.Err.unregisterMessage(element);
		Element.removeClassName(element, Validation.invalidClassName);
	},
	markRequired: function(element){
		if($ON($P(element, 'REQUIRED')))
			Element.addClassName(element, 'required');
		else
			Element.removeClassName(element, 'required');
	},
	isValid: function(element, event){
		// Do not validate label or fieldset elements
		if(!Object.isDefined(element.type)||element.__validated||$ON($P(element, 'disabled'))||$ON($P(element, 'readOnly')))
			return true;
		if(['button','submit','reset'].contains(element.type))
			return true;
		element.__validated = true;
		if(element.onbeforevalidate()==false)
			return false;
		var iLength,vAnd,or,oRegexp,iMin,iMax,format,sMask,date,minDate,maxDate,bFirst;
		iMin = $P(element, 'MIN');
		iMax = $P(element, 'MAX');
		var pass=true;
		if(element.value && !/file|select/.test(element.type))
			element.value = element.value.trim();
		var sValue = $F(element);
		var bSigned = $P(element, 'SIGNED');
		
		// REQUIRED
		if(Validation.isRequired(element) && !(sValue && sValue.first ? sValue.first() : sValue)){
			Validation.Err.raise(element, "Please enter a value", 'REQUIRED', event);
	 		return false;
		}
		// FLOAT, NUMBER
		if(((bFirst=$ON($P(element, 'FLOAT')))||$ON($P(element, 'NUMBER'))) && sValue){
			if(!Validation.isFloat(sValue, bSigned))
				pass=false;
			else if(iMin==parseFloat(iMin) && parseFloat(sValue.replace(/,/g, String.Empty)) < parseFloat(iMin))
				pass=false;
			else if(iMax==parseFloat(iMax) && parseFloat(sValue.replace(/,/g, String.Empty)) > parseFloat(iMax))
				pass=false;
			if(!pass){
				Validation.Err.raise(element, "Please enter a "+(bSigned?String.Empty:"positive ")+"number"+this.minMaxRange(Number.format(iMin),Number.format(iMax)),bFirst?'FLOAT':'NUMBER',event);
				return false;
			}
		}
		// AMOUNT, CURRENCY
		else if (((bFirst=$ON($P(element, 'AMOUNT')))||$ON($P(element, 'CURRENCY'))) && sValue){
			if(!Validation.isCurrency(sValue, bSigned))
				pass=false;
			else if(iMin==parseFloat(iMin) && parseFloat(sValue.replace(/[\$,]/g,String.Empty).replace(/^\(\$(.*)\)$/,"-$1"))<parseFloat(iMin))
				pass=false;
			else if(iMax==parseFloat(iMax) && parseFloat(sValue.replace(/[\$,]/g,String.Empty).replace(/^\(\$(.*)\)$/,"-$1"))>parseFloat(iMax))
				pass=false;
			if(!pass){
				Validation.Err.raise(element, "Please enter a "+(bSigned?String.Empty:"positive ")+"dollar amount"+this.minMaxRange(Number.format(iMin),Number.format(iMax)),bFirst?'AMOUNT':'CURRENCY',event);
				return false;
			}
		}
		// INTEGER
		else if ($ON($P(element, 'INTEGER')) && sValue){
			if (!Validation.isInteger(sValue, bSigned))
				pass=false;
			else if(iMin==parseInt(iMin) && parseInt(sValue.replace(/,/g,String.Empty))<parseInt(iMin))
				pass=false;
			else if(iMax==parseInt(iMax) && parseInt(sValue.replace(/,/g,String.Empty))>parseInt(iMax))
				pass=false;
			if(!pass){
				Validation.Err.raise(element, "Please enter a "+(bSigned?"n ":"positive ")+"integer"+this.minMaxRange(Number.format(iMin),Number.format(iMax)),'INTEGER',event);
				return false;
			}
		}
		// DATE, DATETIME
		else if(((bFirst=$ON((format=$P(element, 'DATE'))))||$ON((format=$P(element, 'DATETIME'))))&&sValue){
			// Set default date format
			if(format == String.Empty || typeof format != 'string')
				format = this.defaultDateFormat;
			minDate = this.toDateString(iMin, format);
			maxDate = this.toDateString(iMax, format);
			date = this.toDateString(sValue, format);
			if(!Object.isDefined(date))
				pass = false;
			else if($ON(iMin) && Object.isDefined(minDate) && date < minDate)
				pass = false;
			else if($ON(iMax) && Object.isDefined(maxDate) && date > maxDate)
				pass = false;
			if(!pass){
				Validation.Err.raise(element,"Please enter a "+this.dateOrTime(format)+" value"+this.minMaxRange(iMin,iMax)+" in the proper format: "+format.replace(/ap/i,'AM/PM').toUpperCase(),bFirst?'DATE':'DATETIME',event);
				return false;
			}
		}
		// PHONE
		else if($ON($P(element, 'PHONE'))&&sValue){
			var sPhone=sValue.replace(/\D/g,String.Empty);
			var iDigits=sPhone.length;
			if(!(iDigits==10||iDigits==11&&/^1/.test(sPhone))){
				Validation.Err.raise(element,"Please enter a valid phone number",'PHONE',event);
				return false;
			}
		}
		// EMAIL
		else if($ON($P(element, 'EMAIL'))&&sValue){
			if(!/^[\w_-]+(\.[\w_-]+)*@[\w_-]+(\.[\w_-]+)*\.[a-z]{2,4}$/i.test(sValue)){
				Validation.Err.raise(element,"Please enter a valid email address", 'EMAIL', event);
				return false;
			}
		}
		// ZIP Code
		else if ($ON($P(element, 'ZIP')) && sValue){
			if (!/^\d{5}(-?\d{4})?$/.test(sValue)){
				Validation.Err.raise(element, "Please enter a valid ZIP code", 'ZIP', event);
				return false;
			}
		}
		// REGEXP
		if ($ON(oRegexp=$P(element, 'REGEXP')) && sValue){
			if (!oRegExp.isRegExp)
				oRegexp = new RegExp(oRegexp, 'i');
			if (!oRegexp.test(sValue)){
				Validation.Err.raise(element, "Please enter a valid value", 'REGEXP', event);
				return false;
			}
		}
		// MAXLENGTH
		if (sValue&&(iLength=$P(element, 'maxLength'))&&!/\D/.test(iLength)&&sValue.length>iLength){
			Validation.Err.raise(element,"Please enter a value having no more than " + Number.format(iLength) + " characters", 'MAXLENGTH',event);
			return false;
		}
		for(var i=0;Validation._validationFunctions[i];i++){
			if(Validation._validationFunctions[i](element, sValue)==false)
				return false;
		}
		// AND
		if ($ON(vAnd = $P(element, 'AND')) && !sValue){
			if(typeof vAnd == 'string') vAnd = vAnd.toString().split(/,/);
			for(var oNewElement,i=0,iFields=vAnd.length; i<iFields; i++){
				if((oNewElement=(typeof vAnd[i].form=='object')?vAnd[i]:element.form.elements[vAnd[i].trim()])){
					if(!!$F(oNewElement)){
						Validation.Err.raise(element, "Please enter a value", 'AND',event);
						return false;
					}
				}
			}
		}
		// OR
		if ((or = $P(element, 'OR')) && !sValue){
			var fields,message;
			if(or.constructor==Array||or.constructor==String)
				fields = or;
			else
				fields = or['fields'];
			if(!!fields){
				if(fields.constructor!=Array)
					fields=fields.toString().split(/,/);
				for(var oNewElement,i=0,iFields=fields.length,bValue; !bValue&&i<iFields; i++){
					oNewElement=(fields[i].form)?fields[i]:element.form.elements[fields[i].trim()];
					if(oNewElement) bValue = !!$F(oNewElement);
				}
				if(!bValue){
					Validation.Err.raise(element, message ? message : "Please enter a value", 'OR', event);
					return false;
				}
			}
		}
		if(element.onvalidate()==false)
			return false;
		if(element.onaftervalidate()==false)
			return false;

		return true;
	},
	validate: function(element, oEvent){
		element = $(element);
		element.isValid = Form.Element.isValid(element, oEvent);
		return element.isValid;
	}

});

var Validation = {
	markRequiredInterval: 100,
	summaryIntroduction: 'Please correct the following errors:',
	summaryClassName: 'validation-summary',
	showPopup: false,
	showSummary: true,
	validateOnChange: true,
	currencySymbol: '$',
	decimalCharacter: '.',
	thousandsSeparator: ',',
	defaultDateFormat: 'M/D/YYYY',
	invalidClassName: 'invalid',

	_validationFunctions: [],
	isInitialFocusSet: false,
	
	pad: function(value, width){
		width = width || 2;
		var returnValue=value.toString();
		for(var i=width-returnValue.length;i>0;i--)
			returnValue='0'+returnValue;
		return returnValue;
	},
	minMaxRange: function(min,max){
		if ($ON(min)) min = String.Empty + min;
		if ($ON(max)) max = String.Empty + max;
		if (!!min && !!max) return " between " + min + " and " + max;
		else if (!!min) return " greater than or equal to " + min;
		else if (!!max) return " less than or equal to " + max;
		else return String.Empty;
	},
	dateOrTime: function(format){
		var date = false, time = false;
		date = format.search(/mm?/i)>-1 || format.search(/dd?/i)>-1 || format.search(/yyyy/i)>-1;
		time = format.search(/hh?/i)>-1 || format.search(/nn/i)>-1 || format.search(/ss/i)>-1 || format.search(/ap/i)>-1;
		return (date?"date":String.Empty)+(time?"time":String.Empty);
	},
	toDateString: function(date, dateFormat){
		var i, regex, index=[];
		var day, month, year, hour, minute, second, ampm;
		// Determine order of datetime tokens
		with(dateFormat){
			index[search(/dd?/i)]='day';
			index[search(/mm?/i)]='month';
			index[search(/yyyy/i)]='year';
			index[search(/hh?/i)]='hour';
			index[search(/nn/i)]='minute';
			index[search(/ss/i)]='second';
			index[search(/ap/i)]='ampm';

			// timing of replaces is quite important!
			regex=dateFormat.replace(/(\$|\^|\*|\(|\)|\+|\.|\?|\\|\{|\}|\||\[|\])/g,"\\$1");
			// only allow one pass for day and month
			if(search(/dd/i)>-1)
				regex=regex.replace(/dd/i,"(0[1-9]|[1-2]\\d|3[0-1])");
			else
				regex=regex.replace(/d/i,"(0?[1-9]|[1-2]\\d|3[0-1])");
			if(search(/mm/i)>-1)
				regex=regex.replace(/mm/i,"(0[1-9]|1[0-2])");
			else
				regex=regex.replace(/m/i,"(0?[1-9]|1[0-2])");
			regex=regex.replace(/nn/i,"([0-5]\\d)")
				.replace(/ss/i,"([0-5]\\d)")
				.replace(/yyyy/i,"(\\d{4})")
				.replace(/\s+/g,"\\s*");
			if(search(/hh24/i)>-1)
				regex=regex.replace(/hh24/i,"([0-1]\\d|2[0-3])");
			else if(search(/h24/i)>-1)
				regex=regex.replace(/h24/i,"([0-1]?\\d|2[0-3])");
			else if(search(/hh/i)>-1)
				regex=regex.replace(/hh/i,"(0\\d|1[0-2])").replace(/ap/i,"([ap]m?)");
			else
				regex=regex.replace(/h/i,"(0?\\d|1[0-2])").replace(/ap/i,"([ap]m?)");
		}
		if(!new RegExp("^"+regex+"$",'i').test(date))
			return;
		year=month=day=hour=minute=second=0,ampm=String.Empty;
		for(var key=0,i=0;key<index.length;key++)
			if(index[key]) eval(index[key]+"=RegExp.$"+(++i));
		if(hour<12&&/^pm?$/i.test(ampm))
			hour = parseInt(hour)+12;
		else if(hour==12&&/^am?$/i.test(ampm))
			hour=0;
		if(year==0) year=1;
		if(month==0) month=1;
		if(day==0) day=1;
		if(month==2 && day>((year%4==0&&year%100!=0||year%400==0)?29:28) || day>((month-1)%7+1)%2+30)
			return;
		return String.Empty+this.pad(year,4)+this.pad(month)+this.pad(day)+this.pad(hour)+this.pad(minute)+this.pad(second);
	},
	isRequired: function(element){
		return $ON($P(element, 'REQUIRED'));
	},
	isFloat: function(value, signed){
		return new RegExp("^"+($ON(signed)?"-?":String.Empty)+"(\\d*(,?\\d{3})*\\.?\\d+|\\d+(,?\\d{3})*\\.?\\d*)$").test(value);
	},
	isInteger: function(value, signed){
		//TODO validation constants
		return new RegExp("^"+($ON(signed)?"-?":String.Empty)+"(\\d{1,3})(,?\\d{3})*$").test(value);
	},
	isCurrency: function(value, signed){
		var reMain = "((\\d{1,3})(,?\\d{3})*(\\.\\d{2})?|((\\d{1,3})(,?\\d{3})*)?\\.\\d{2})";
		return new RegExp("^("+
			              "("+ ($ON(signed)?"(\\$?\\-?|\\-?\\$?)":"\\$?")+reMain +")"+
			              ($ON(signed)?"|(\\(\\$?"+reMain+"\\))":String.Empty)
			              +")$").test(value)	
	},
	add: function(code) {
		//evaluate the function in private scope to Validation; enables use of private functions
		eval("code="+code.toString());
		this._validationFunctions.push(Function.create(code));
	},
	setup: function(){
		for(var i=0,form; i < document.forms.length; i++){
			form=document.forms[i];
			if(!form._setup){
				form.isValid = true;
				form._onsubmit_ = Element.getHandler(form, 'onsubmit');
				form._onreset_ = Element.getHandler(form, 'onreset');
				form.onbeforevalidate = Element.getHandler(form, 'onbeforevalidate');
				form.onaftervalidate = Element.getHandler(form, 'onaftervalidate');
				form.onautosubmit = Element.getHandler(form, 'onautosubmit');
				form.onsubmit = function(oEvent){ //NN passed event
					if(!Form.validate(this, oEvent || window.event)) return false;
					if (this._onsubmit_(oEvent)==false)
						return false;
					return true;
				};
				Event.observe(form, 'reset', Form.resetValidation.bind({}, form));
				form._setup = true;
			}
			for(var j=0,element; j < form.elements.length; j++){
				element = form.elements[j];
				if(!element._setup){
					var initialFocus;
					if(!this.isInitialFocusSet && $ON((initialFocus=$P(element, 'INITIAL-FOCUS')))){
						element.focus();
						if(/^select$/i.test(initialFocus)) element.select();
						this.isInitialFocusSet = true;
					}
					element._onkeypress_ = Element.getHandler(element, 'onkeypress');
					element._onchange_ = Element.getHandler(element, 'onchange');
					element.validateFocus = function() {
						Element.getHandler(element, 'onvalidatefocus')();
						if (this.focus) this.focus();
						if (this.select) this.select();
					};
					element.isValid = true;
					element.onbeforevalidate = Element.getHandler(element, 'onbeforevalidate');
					element.onvalidate = Element.getHandler(element, 'onvalidate');
					element.onaftervalidate = Element.getHandler(element, 'onaftervalidate');
					element.onautosubmit = Element.getHandler(element, 'onautosubmit');
					element.onreset = Element.getHandler(element, 'onreset');
					if(Object.isDefined(element.type)){
						element.onkeypress = function(oEvent){ //NN passes event object
var keyEnter = 13, keyNewLine = 10, keyTab = 9, keyBackspace = 8, keyNull = 0, keyDelete = 0, keyEscape = 27;
							if(this._onkeypress_(oEvent)==false) return false;
							var filter = $P(this, 'FILTER');
							if ($ON(filter)){
								if (!filter.isRegExp)
									filter = new RegExp(filter);
								oEvent = oEvent || window.event;
								
								var keyCode = keyNull;
								if ($V(oEvent.charCode))
									keyCode = oEvent.charCode;
								else
									keyCode = oEvent.keyCode;

								if(![keyNull, keyTab, keyEnter, keyNewLine, keyBackspace, keyDelete, keyEscape].contains(keyCode)
										&& !filter.test(String.fromCharCode(keyCode)))
									return false;
							}
							return true;
						};
					}
					if(!['radio','checkbox'].contains(element.type)){
						element.onchange = function(oEvent){
							oEvent = oEvent || window.event;
							Form.Element.restore(this);
							if(Validation.validateOnChange)
								if(!Form.Element.validate(this, oEvent)) {
									return;
								}
							if(this._onchange_(oEvent)===false)
								return false;
							var autoSubmit = $P(this, 'AUTO-SUBMIT');
							if($ON(autoSubmit) && this.onautosubmit()!==false && this.form.onautosubmit()!==false)
								this.form.submit();
						};
					}
					element._setup = true;
				}
			}
			Form.markRequired(form);
			setInterval(Form.markRequired.bind({},form), Validation.markRequiredInterval);
		}
	}
};
var $ON = Element.propertyOn;
Validation.Err = {
	raise: function(element, message, stem, event){
		if(event == null || typeof event != 'object')
			event = { type: 'sham' };
		if(event.type != 'change'){
	 		var displayName = $P(element, 'DISPLAY-NAME');
			message = [
				(stem ? $P(element, stem.toUpperCase()+'-MESSAGE') : null),
				$P(element, 'MESSAGE'),
				message].choose();
			var extendedMessage = message.replace(/\.$/, String.Empty)
				+ (!!displayName ? " in the " + displayName + " field." : ".");
			this.registerMessage(element, extendedMessage);
		}
		Form.Element.markInvalid(element, message);
	},
	displayMessages: function (form) {
		if (Validation.showPopup)
			this.displayPopup(form);
		if (Validation.showSummary)
			this.renderSummary(form);
	},
	displayPopup: function (form) {
		if (!this.hasMessages(form)) return;
		var message = Validation.summaryIntroduction;
		var map = this.getIndexMap(form);
		var fieldMessages = this.getMessageMap(form);
		for(var i = 0; i < map.length; i++)
			message += "\n  - " + fieldMessages[map[i]];
		window.alert(message);
	},
	renderSummary: function (form) {
		var summary = this.getValidationSummary(form);
		if (!summary) return;
		Element.hide(summary);
		var elementId, list, listItem, link;
		var map = this.getIndexMap(form);
		var fieldMessages;
		if (this.hasMessages(form)) {
			fieldMessages = this.getMessageMap(form);
			Element.update(summary, String.Empty);
			summary.appendChild(document.createTextNode(Validation.summaryIntroduction));
			list = document.createElement('UL');
			summary.appendChild(list);
			for(var i = 0; i < map.length; i++) {
				elementId = map[i];
				listItem = document.createElement('LI');
				link = document.createElement('A');
				link.setAttribute('href', "javascript:$('"+elementId+"').validateFocus();");
				link.appendChild(document.createTextNode(fieldMessages[elementId]));
				listItem.appendChild(link);
				list.appendChild(listItem);
			}
			Element.show(summary);
			Element.scrollTo(summary);
		}
	},
	hasMessages: function (form) {
		return this.getIndexMap(form).length > 0;
	},
	messageMap: [],
	indexMap: [],
	getMessageMap: function (form) {
		var id = Element.idFor(form);
		if (!this.messageMap[id])
			this.messageMap[id] = [];
		return this.messageMap[id];
	},
	getIndexMap: function (form) {
		var id = Element.idFor(form);
		if (!this.indexMap[id])
			this.indexMap[id] = [];
		return this.indexMap[id]
	},
	registerMessage: function (element, message) {
		var id = Element.idFor(element);
		this.getMessageMap(element.form)[id] = message;
		this.getIndexMap(element.form).push(id);
	},
	getValidationSummary: function (form) {
		var divs = form.getElementsByTagName('DIV');
		for (var i = 0; i < divs.length; i++) {
			if (Element.hasClassName(divs[i], Validation.summaryClassName))
				return divs[i];
		}
		return null;
	},
	unregisterMessage: function (element) {
		var elementId = Element.idFor(element);
		delete this.getMessageMap(element.form)[elementId];
		delete this.getIndexMap(element.form)[elementId];
		this.indexMap = this.indexMap.compact();
	},
	clearMessages: function (form) {
		var id = Element.idFor(form);
		this.messageMap[id] = [];
		this.indexMap[id] = [];
	}
};

if(!!window.RegExp 
	&& !!String.Empty.replace 
	&& "ab".replace(/a/, String.Empty)=="b" 
	&& !!document.forms 
	&& !( navigator.appVersion.contains('Mac') && navigator.appVersion.contains('MSIE') )
) {
	Event.observe(window, 'load', Validation.setup);
}
