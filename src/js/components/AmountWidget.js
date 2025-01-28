import {settings, select} from '../settings.js';
import BaseWidget from './BaseWidget.js';

class AmountWidget extends BaseWidget {
  constructor(element) {
    super(element, settings.amountWidget.defaultValue);
    const thisWidget = this;
    thisWidget.getElements(element);
    thisWidget.correctValue = settings.amountWidget.defaultValue;
    thisWidget.setValue(thisWidget.dom.input.value);

    thisWidget.initActions();
  }

  getElements(){
    const thisWidget = this;
    
    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
    thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);
  }

  parseValue(value) {
    return parseInt(value);
  }

  isValid(value) {
    return !isNaN(value)
      && value >= settings.amountWidget.defaultMin
      && value <= settings.amountWidget.defaultMax;
  }

  renderValue() {
    const thisWidget = this;
    thisWidget.dom.input.value = thisWidget.correctValue;
  }  

  initActions() {
    const thisWidget = this;
    thisWidget.dom.input.addEventListener('change', function() {
      thisWidget.value = thisWidget.dom.input.value;
    });
    thisWidget.dom.linkDecrease.addEventListener('click', function(e) {
      e.preventDefault();
      thisWidget.setValue(thisWidget.dom.input.value - 1);
    });  
    thisWidget.dom.linkIncrease.addEventListener('click', function(e) {
      e.preventDefault();
      thisWidget.setValue(parseInt(thisWidget.dom.input.value) + 1);
    });
  }

  announce() {
    const thisWidget = this;
    const event = new CustomEvent('updated', {
      bubbles:true
    });
    thisWidget.dom.wrapper.dispatchEvent(event);
  }
}

export default AmountWidget;
