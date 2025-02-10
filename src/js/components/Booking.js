import {select, settings, templates, classNames} from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(bookingWidget){
    const thisBooking = this;
    
    thisBooking.render(bookingWidget);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.dom.wrapper.addEventListener('submit', function(event){
      event.preventDefault();
      thisBooking.sendBooking(event);
    });
  }

  getData(){
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],  
    };
    

    const urls = {
      booking:       settings.db.url + '/' + settings.db.bookings  + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events    + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:   settings.db.url + '/' + settings.db.events   + '?' + params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),  
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);    
      });
  }
  
  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }  
    }

    thisBooking.updateDOM();
  }
  
  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }
    
    const startHour = utils.hourToNumber(hour);

    if (typeof thisBooking.booked[date][startHour] == 'undefined'){
      thisBooking.booked[date][startHour] = [];
    }

    thisBooking.booked[date][startHour].push(table);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){

      if (typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);  
    }
  }
  
  updateDOM(){
    const thisBooking = this;
    
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);
    
    let allAvailable = false;
    
    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }
    
    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }
      
      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }  
    
  render(bookingWidget){
    const thisBooking = this;
    
    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = bookingWidget;
    bookingWidget.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = bookingWidget.querySelector(select.widgets.booking.peopleAmount);
    thisBooking.dom.hoursAmount = bookingWidget.querySelector(select.widgets.booking.hoursAmount);
    thisBooking.dom.datePicker = bookingWidget.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = bookingWidget.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = bookingWidget.querySelectorAll(select.widgets.booking.tables);
    thisBooking.dom.tablesWrapper = bookingWidget.querySelector(select.containerOf.floorPlan);

  }

  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.resetSelectedTable();
      thisBooking.updateDOM();
    });

    thisBooking.dom.tablesWrapper.addEventListener('click', (event) => thisBooking.initTables(event));
  }

  initTables(event) {
    const thisBooking = this;
    const clickedElement = event.target;

    if (!clickedElement.classList.contains('table')) {
      return;
    }

    const tableId = clickedElement.getAttribute(settings.booking.tableIdAttribute);

    if (clickedElement.classList.contains(classNames.booking.tableBooked)) {
      alert('This table is already booked');
      return;
    }

    if (thisBooking.selectedTable === tableId) {
      clickedElement.classList.remove(classNames.booking.selected);
      thisBooking.selectedTable = null;
      return;
    }

    thisBooking.dom.tables.forEach(table => table.classList.remove(classNames.booking.selected));

    thisBooking.selectedTable = tableId;
    clickedElement.classList.add(classNames.booking.selected);
  }

  resetSelectedTable() {
    const thisBooking = this;
    
    if (thisBooking.selectedTable) {
      const selectedTableElement = thisBooking.dom.tablesWrapper.querySelector(`.table[data-table="${thisBooking.selectedTable}"]`);
      if (selectedTableElement) {
        selectedTableElement.classList.remove(classNames.booking.selected);
      }
    }

    thisBooking.selectedTable = null;
  }

  sendBooking(event) {
    event.preventDefault();
    
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.bookings;
    

    if (!thisBooking.selectedTable) {
      alert('Please select a table before making a reservation.');
      return;
    }
  

    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value, 
      table: parseInt(thisBooking.selectedTable),
      duration: thisBooking.hoursAmount.value, 
      ppl: thisBooking.peopleAmount.value, 
      starters: [],
      phone: thisBooking.dom.wrapper.querySelector('input[name="phone"]').value,
      address: thisBooking.dom.wrapper.querySelector('input[name="address"]').value,
    };
  

  
    const starterCheckboxes = thisBooking.dom.wrapper.querySelectorAll('input[name="starter"]:checked');
    starterCheckboxes.forEach(starter => {
      payload.starters.push(starter.value);
    });
  
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
  
    fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error sending booking data');
        }
        return response.json();
      })
      .then(parsedResponse => {
        alert('Your reservation has been confirmed!');
        
        thisBooking.makeBooked(
          parsedResponse.date,
          parsedResponse.hour,
          parsedResponse.duration,
          parsedResponse.table
        );
        
        thisBooking.resetSelectedTable();
        
        thisBooking.updateDOM();
      })
      .catch(error => {
        alert('Something went wrong, please try again.');
      });
  }
  

  
  


}

export default Booking;