import {settings, select, classNames, templates} from '../settings.js';
import { utils } from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
  constructor(element) {
    const thisCart = this;

    thisCart.products = [];
    thisCart.getElements(element);
    thisCart.initActions();
  }

  getElements(element) {
    const thisCart = this;
    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice);
    thisCart.dom.totalPriceSummary = thisCart.dom.wrapper.querySelector(select.cart.totalPriceSummary);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);

  }

  initActions() {
    const thisCart = this;
    thisCart.dom.toggleTrigger.addEventListener('click', function() {
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });
    thisCart.dom.productList.addEventListener('updated', function() {
      thisCart.update();
    });

    thisCart.dom.productList.addEventListener('remove', function() {
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function(event) {
      event.preventDefault();
      thisCart.sendOrder();
    });


  }

  add(menuProduct) {
    const thisCart = this;
    const generatedHTML = templates.cartProduct(menuProduct);
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    const cartContainer = document.querySelector(select.cart.productList);
    cartContainer.appendChild(generatedDOM);
    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    thisCart.update();
  }

  update() {
    const thisCart = this;
    const deliveryFee = settings.cart.defaultDeliveryFee;
    let totalNumber = 0;
    let subtotalPrice = 0;

    for (let product of thisCart.products) {
      totalNumber = totalNumber + product.amount;
      subtotalPrice = subtotalPrice + product.price;
    }

    thisCart.totalPrice = subtotalPrice;
    if (totalNumber > 0) {
      thisCart.totalPrice = thisCart.totalPrice + deliveryFee;
    }

    thisCart.dom.totalNumber.innerHTML = totalNumber;
    thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
    thisCart.dom.totalPriceSummary.innerHTML = thisCart.totalPrice;
    thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
    thisCart.dom.deliveryFee.innerHTML = deliveryFee;

    thisCart.totalNumber = totalNumber;
    thisCart.subtotalPrice = subtotalPrice;
    thisCart.deliveryFee = deliveryFee;
  }

  remove(event) {
    const thisCart = this;
    event.dom.wrapper.remove();
    thisCart.products.splice(event.id, 1);
    thisCart.update();
  }

  sendOrder() {
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.orders;
    const payload = {
      address: thisCart.dom.address.value,
      phone: thisCart.dom.phone.value,
      totalPrice: thisCart.totalPrice,
      subtotalPrice: thisCart.subtotalPrice,
      totalNumber: thisCart.totalNumber,
      deliveryFee: thisCart.deliveryFee,
      products: []
    };
    for(let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }
      
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
      
    fetch(url, options)
      .then(function(rawResponse) {
        if(!rawResponse.ok) {
          throw new Error(`Error! Status: ${rawResponse.status}, URL: ${url}`);
        }
        return rawResponse.json();
      })
      .catch(error => {
        console.log(error);
      });
  }

}

export default Cart;