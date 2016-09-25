/**
 * Created by peyman on 8/26/16.
 */

import { createFetch, base, accept, parseJSON, parseText } from 'http-client'

const fetch = createFetch(
  base('http://127.0.0.1/kaman-rerested/public/'),  // Prefix all request URLs
  accept('application/json'),         // Set "Accept: application/json" in the request headers
  parseJSON()
);

var RestKit = {

  isDebugMode: true,
  StudyYearsOrder : ["16", "32", "64", "1", "2", "4", "8"],
  StudyYears: {
    16: 'ششم',
    32: 'هفتم',
    64: 'هشتم',
    1: 'نهم',
    2: 'دهم',
    4: 'سوم دبیرستان',
    8: 'پیش دانشگاهی',
  },
  StudyFields: {
    1: 'ریاضی',
    2: 'تجربی',
    4: 'انسانی',
    8: 'هنر',
    16: 'زبان'
  },
  QualityLabel: ['پایین', 'خوب', 'مناسب', 'عالی', 'HD'],
  QualityKey: ['base', 'low', 'main', 'high', 'hd'],
  BaseURL: 'http://127.0.0.1/kaman-rerested/public/',
  getURL: function (method) {
    return this.BaseURL + method;
  },

  LoadBooks: function (study_year, study_field, callback) {
    this.GET("book/year/"+study_year+"/field/"+study_field, callback);
  },

  LoadBookMetaData: function(bookid, quality, callback) {
    this.GET("package/"+bookid+"/user/1/quality/"+quality, callback);
  },

  GET: function(method, callback) {
    if (this.isDebugMode) {
      console.log("--- RestKit GET: " + method);
    }
    fetch(method).then(function (response) {
      if (this.isDebugMode) {
        console.log("--- RestKit GET: " + method + " Response:" + JSON.stringify(response.jsonData).substring(0, 100)+"...");
      }

      if (response.jsonData.hasOwnProperty('error')) {
        callback(false, response.jsonData.error.message);
      } else {
        callback(true, response.jsonData);
      }
    }.bind(this));
  }
};
module.exports = RestKit;

