import {select, templates, classNames} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product{
  constructor(id, data) {
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
  }  
  renderInMenu() {
    const thisProduct = this;
    const generatedHTML = templates.menuProduct(thisProduct.data);
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    const menuContainer = document.querySelector(select.containerOf.menu);
    menuContainer.appendChild(thisProduct.element);
  }

  getElements(){
    const thisProduct = this;
      
    thisProduct.dom = {};
    thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.dom.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
    thisProduct.dom.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.dom.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.dom.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAmountWidget() {
    const thisProduct = this;
    thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
    thisProduct.dom.amountWidgetElem.addEventListener('updated', function() {
      thisProduct.processOrder();
    });
  }
      
  initAccordion(){
    const thisProduct = this;

    thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {
      event.preventDefault();
      const activeProduct = document.querySelector('article.active');

      if (activeProduct && activeProduct != thisProduct.element) {
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      }
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
    });
    
  }

  initOrderForm() {
    const thisProduct = this;

    thisProduct.dom.form.addEventListener('submit', function(event) {
      event.preventDefault();
      thisProduct.processOrder();
    });

    for (let input of thisProduct.dom.formInputs) {
      input.addEventListener('change',function() {
        thisProduct.processOrder();
      });
    }

    thisProduct.dom.cartButton.addEventListener('click', function(event) {
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  processOrder() {
    const thisProduct = this;
    
    const formData = utils.serializeFormToObject(thisProduct.dom.form);
    
    let price = thisProduct.data.price;
    
    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];
    
      for(let optionId in param.options) {
        const option = param.options[optionId];
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        if(optionSelected) {
          if(!option.default == true) {
            price = price + option.price;
          }
        } else {
          if(option.default == true) {
            price = price - option.price;
          }
        }

        const optImage = thisProduct.dom.imageWrapper.querySelector(`.${paramId}-${optionId}`);
        if (optImage) {
          if (optionSelected) {
            optImage.classList.add('active');
          } else {
            optImage.classList.remove('active');
          }
        }
      }
        
    }
    price *= thisProduct.amountWidget.value;
    this.totalPrice = price;
    this.priceSingle = thisProduct.dom.priceElem.innerHTML;
    thisProduct.dom.priceElem.innerHTML = price;
  }

  addToCart() {
    const thisProduct = this;
    //app.cart.add(thisProduct.prepareCartProduct());

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    }
    );
    thisProduct.element.dispatchEvent(event);
  }

  prepareCartProduct() {
    const thisProduct = this;

    const productSummary = {
      id: thisProduct.id,
      name: thisProduct.data.name,
      amount:thisProduct.amountWidget.value,
      priceSingle:thisProduct.priceSingle,
      price: thisProduct.totalPrice,
      params:thisProduct.prepareCartProductParams()
    };
    return productSummary;
  }
 
  prepareCartProductParams() {
    const thisProduct = this;
    
    const formData = utils.serializeFormToObject(thisProduct.dom.form);
    const params = {};
    
    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];

      params[paramId] = {
        label: param.label,
        options: {}
      };
    
      for(let optionId in param.options) {
        //const option = param.options[optionId];
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        if(optionSelected) {
          params[paramId].options[optionId] = optionId;
        }
      }
    }
    return params;
  }

}

export default Product;