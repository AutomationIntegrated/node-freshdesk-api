/**
 * @module Index of API client
 * @author Arjun Komath <arjunkomath@gmail.com>
 */

"use strict";

const request = require('request');
const debug = require('debug')('freshdesk-api');


const createResponseHandler = function (cb) {
	return function (error, response, body) {
		if (error) {
			debug(`Unexpected status [${error}], req path [${response.request.path}] raw body: ${response.request.body}`);
			return cb(error);
		}

		let data = null;

		switch(response.statusCode) {
		// SUCCESS
		// https://httpstatuses.com/200 OK
		// https://httpstatuses.com/201 Created
		case 200:
		case 201:
			try {
				data = JSON.parse(body);
			} catch (err) {
				// TODO: catch only JSON-parse errors!!!
				debug(`Not a JSON resp with valid status [${response.statusCode}], req path [${response.request.path}] raw body: ${response.request.body}`);
				return cb(new FreshdeskError('Not a JSON response from API', data));
			}
			return cb(null, data);

		// SUCCESS for DELETE operations
		// https://httpstatuses.com/204 No Content
		case 204:
			return cb(null, null);

		// https://httpstatuses.com/409 Conflict  - NOT UNIQUE, where unique required
		case 409:
		default:
			try {
				data = JSON.parse(body);
			} catch (err) {
				// TODO: catch only JSON-parse errors!!!

				// probably, data is not a JSON, so lets return it "AS IS"
				debug(`Not a JSON resp for unexpected status [${response.statusCode}], req path [${response.request.path}] raw body: ${response.request.body}`);
				return cb(new FreshdeskError('Not a JSON response from API', data));
			}

			debug(`Unexpected/Error status [${response.statusCode}], req path [${response.request.path}] raw body: ${response.request.body}`);
			return cb(new FreshdeskError(data.description, data));
		}
	}
}

const makeRequest = function (method, auth, url, qs, data, cb) {
	var options = {
		method: method,
		headers: {
			'Content-Type': 'application/json',
			'Authorization': auth
		},
		url: url, // for debugging set to: "https://httpbin.org/get"
		qs: qs
	}

	if(data) {
		options.body = JSON.stringify(data);
	}

	request(options, createResponseHandler(cb))
}


/**
 * Freshdesk APIv2 client
 * @class
 * @param {string} baseUrl    Base URL for the API calls, for example `https://demo.freshdesk.com`
 * @param {string} apiKey     API key
 * @public
 */
const Freshdesk = function (baseUrl, apiKey) {
	this.baseUrl = baseUrl;

	this._auth = 'Basic ' + new Buffer(apiKey + ":X").toString('base64');
}

Freshdesk.prototype = Object.create({
	/**
	 * This callback is called on API call ended.
	 * @name Freshdesk.requestCallback
	 * @callback Freshdesk.requestCallback
	 * @param {*}      error  Indicates, that error occured during call
	 * @param {Object} [data] Contains actual data
	 */

	/**
	 * Filter-settings for {@link listAllTickets}
	 * @name  Freshdesk.TicketsFilter
	 * @typedef {Object}    Freshdesk.TicketsFilter
	 * @property {string} [filter]          Predefined filters, one of `new_and_my_open`, `watching`, `spam`, `deleted`
	 * @property {string} [requester_id]    Requester
	 * @property {string} [email]           Requester
	 * @property {string} [company_id]      Company ID
	 * @property {string} [updated_since]   Updated since.
	 */

	/**
	 * listAllTickets API method
	 * {@link http://developers.freshdesk.com/api/#list_all_tickets}
	 * @param  {Freshdesk.TicketsFilter}            params  Dictionary with request parameters for the API method, for example : `{"company_id": "YOUR_ID"}`
	 * @param  {Freshdesk.requestCallback}          cb      Callback function {@link Freshdesk.requestCallback}
	 * @return {Array.<Freshdesk.Tickets>}                  The array of tickets found
	 */
	listAllTickets (params, cb) {
		makeRequest('GET', this._auth, `${this.baseUrl}/api/v2/tickets`, params, null, cb)
	},

	listAllTicketFields(cb) {
		makeRequest('GET', this._auth, `${this.baseUrl}/api/v2/ticket_fields`, null, null, cb)
	},

	createTicket(data, cb) {
		makeRequest('POST', this._auth, `${this.baseUrl}/api/v2/tickets`, null, data, cb)
	},

	getTicket(id, cb) {
		makeRequest('GET', this._auth, `${this.baseUrl}/api/v2/tickets/${id}`, null, null, cb)
	},

	updateTicket(id, data, cb) {
		makeRequest('PUT', this._auth, `${this.baseUrl}/api/v2/tickets/${id}`, null, data, cb)
	},

	deleteTicket(id, cb) {
		makeRequest('DELETE', this._auth, `${this.baseUrl}/api/v2/tickets/${id}`, null, null, cb)
	},

	restoreTicket(id, cb) {
		makeRequest('PUT', this._auth, `${this.baseUrl}/api/v2/tickets/${id}/restore`, null, null, cb)
	},

	listAllConversations(id, cb) {
		makeRequest('GET', this._auth, `${this.baseUrl}/api/v2/tickets/${id}/conversations`, null, cb)
	},

	listAllTimeEntries(id, cb) {
		makeRequest('GET', this._auth, `${this.baseUrl}/api/v2/tickets/${id}/time_entries`, null, null, cb)
	},

	//Conversations

	createReply(id, data, cb) {
		makeRequest('POST', this._auth, `${this.baseUrl}/api/v2/tickets/${id}/reply`, null, data, cb)
	},

	createNote(id, data, cb) {
		makeRequest('POST', this._auth, `${this.baseUrl}/api/v2/tickets/${id}/notes`, null, data, cb)
	},

	updateConversation(id, data, cb) {
		makeRequest('PUT', this._auth, `${this.baseUrl}/api/v2/conversations/${id}`, null, data, cb)
	},

	deleteConversation(id, cb) {
		makeRequest('DELETE', this._auth, `${this.baseUrl}/api/v2/conversations/${id}`, null, null, cb)
	},

	//Contacts

	createContact(data, cb) {
		makeRequest('POST', this._auth, `${this.baseUrl}/api/v2/contacts`, null, data, cb)
	},

	getContact(id, cb) {
		makeRequest('GET', this._auth, `${this.baseUrl}/api/v2/contacts/${id}`, null, null, cb)
	},

	listAllContacts(params, cb) {
		makeRequest('GET', this._auth, `${this.baseUrl}/api/v2/contacts`, params, null, cb)
	},

	updateContact(id, data, cb) {
		makeRequest('PUT', this._auth, `${this.baseUrl}/api/v2/contacts/${id}`, null, data, cb)
	},

	deleteContact(id, cb) {
		makeRequest('DELETE', this._auth, `${this.baseUrl}/api/v2/contacts/${id}`, null, null, cb)
	},

	makeAgent(id, cb) {
		makeRequest('PUT', this._auth, `${this.baseUrl}/api/v2/contacts/${id}/make_agent`, null, null, cb)
	},

	listAllContactFields(cb) {
		makeRequest('GET', this._auth, `${this.baseUrl}/api/v2/contact_fields`, null, null, cb)
	},

	// Companies

	/**
	 * Company settings, for {@link updateCompany} and {@link createCompany}
	 *
	 * @category Companies
	 *
	 * @name Freshdesk.CompanyData
	 * @typedef {Object}
	 * @property {Object.<string, Object>}   [custom_fields]   Key value pairs containing the names and values of custom fields. Only dates in the format YYYY-MM-DD are accepted as input for custom date fields. Read more here
	 * @property {string}                    [description]     Description of the company
	 * @property {Array.<string>}            [domains]         Domains of the company. Email addresses of contacts that contain this domain will be associated with that company automatically.
	 * @property {string}                    [name]            **UNIQUE** Name of the company
	 * @property {string}                    [note]            Any specific note about the company
	 */

	/**
	 * Company settings, returned by view-methods
	 *
	 * @category Companies
	 *
	 * @name Freshdesk.CompanyViewData
	 * @typedef {Object}
	 * @property {string}                    name              **UNIQUE** Name of the company
	 * @property {string}                    description       Description of the company
	 * @property {Array.<string>}            domains           Domains of the company. Email addresses of contacts that contain this domain will be associated with that company automatically.
	 * @property {string}                    note              Any specific note about the company
	 * @property {Date}                      created_at        Creation date
	 * @property {Date}                      updated_at        Last update date
	 * @property {Object.<string, Object>}   custom_fields     Key value pairs containing the names and values of custom fields. Only dates in the format YYYY-MM-DD are accepted as input for custom date fields. Read more here
	 */

	/**
	 * Creates company
	 *
	 * {@link http://developer.freshdesk.com/api/#create_company}
	 *
	 * @category Companies
	 *
	 * @param  {Object}                             data    [description]
	 * @param  {Freshdesk.requestCallback}          cb      Callback function {@link Freshdesk.requestCallback}
	 * @return {void}          `void`
	 */
	createCompany(data, cb) {
		makeRequest('POST', this._auth, `${this.baseUrl}/api/v2/companies`, null, data, cb);
	},

	/**
	 * View a Company
	 *
	 * {@link http://developer.freshdesk.com/api/#view_company}
	 *
	 * @category Companies
	 *
	 * @param  {integer}                            id      Company ID
	 * @param  {Freshdesk.requestCallback}          cb      Callback function {@link Freshdesk.requestCallback}
	 * @return {Freshdesk.CompanyViewData}                  Company information
	 */
	getCompany(id, cb) {
		makeRequest('GET', this._auth, `${this.baseUrl}/api/v2/companies/${id}`, null, null, cb)
	},

	/**
	 * List All Companies
	 *
	 * {@link http://developer.freshdesk.com/api/#list_all_companies}
	 * @category Companies
	 *
	 * @param  {Freshdesk.requestCallback}          cb      Callback function {@link Freshdesk.requestCallback}
	 * @return {Array.<Freshdesk.CompanyViewData>}          Company information
	 */
	listAllCompanies(cb) {
		makeRequest('GET', this._auth, `${this.baseUrl}/api/v2/companies`, null, null, cb)
	},

	/**
	 * Updates company
	 *
	 * {@link http://developer.freshdesk.com/api/#update_company}
	 *
	 * @category Companies
	 *
	 * @param  {integer}                            id      Company ID
	 * @param  {Freshdesk.UpdateCompanyData}        data    New settings for company
	 * @param  {Freshdesk.requestCallback}          cb      Callback function {@link Freshdesk.requestCallback}
	 * @return {void}          `void`
	 */
	updateCompany(id, data, cb) {
		makeRequest('PUT', this._auth, `${this.baseUrl}/api/v2/companies/${id}`, null, data, cb);
	},

	/**
	 * Delete a Company
	 *
	 * Note:
	 *   1. Deleting a company does not delete the contacts that are associated with it. However the association will be removed.
	 *   2. Once deleted, a company cannot be restored.
	 *
	 * {@link http://developer.freshdesk.com/api/#delete_company}
	 *
	 * @category Companies
	 *
	 * @param  {integer}                            id      Company ID
	 * @param  {Freshdesk.requestCallback}          cb      Callback function {@link Freshdesk.requestCallback}
	 */
	deleteCompany(id, data, cb) {
		makeRequest('DELETE', this._auth, `${this.baseUrl}/api/v2/companies/${id}`, null, null, cb);
	},

});

/**
 * Freshdesk's API protocol violations
 *
 * @param {[type]} message [description]
 * @param {[type]} data    [description]
 */
function FreshdeskError(message, data) {
  this.name = 'FreshdeskError';
  this.message = message || 'Error in Freshdesk\'s client API';
  this.stack = (new Error()).stack;
  this.data = data;
}
FreshdeskError.prototype = Object.create(Error.prototype);
FreshdeskError.prototype.constructor = FreshdeskError;

/* EXPORT SECTION */
module.exports = Freshdesk;

module.exports.FreshdeskError = FreshdeskError;
