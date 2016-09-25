/**
 * Created by peyman on 9/16/16.
 */

const each = require('foreach');

var EventIDs = {
  OnStudyYearFieldFilterChanged: 'OnStudyYearFieldFilterChanged',
  OnBookPackableUpdated: 'OnBookPackableUpdated'
};

var EventDispatcher = {
  listeners: {
  },
  dispatch(event, params) {
    if (this.listeners.hasOwnProperty(event)) {
      each(this.listeners[event], function (element, index, next) {
        element(params);
      });
    }
  },
  register(event, callback) {
    if (!this.listeners.hasOwnProperty(event)) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },
  unRegister(event, callback) {
    if (this.listeners.hasOwnProperty(event)) {
      let indexof = this.listeners[event].indexOf(callback);
      if (indexof >= 0) {
        this.listeners[event].splice(indexof, 1);
      }
    }
  }
};

module.exports = { EventDispatcher, EventIDs };
