"use strict";

var dry_run = !confirm("Do you want to bid for real? Hit cancel to simulate it");

var start_bidding_at_seconds_remaining = 1.5;

// ask the user
var username = localStorage.getItem('username');
username = window.prompt('What is your username?', username) || username;
localStorage.setItem('username', username);

var max_spending = localStorage.getItem('max') || 10;

var min_bidding = localStorage.getItem('min') || 0;
min_bidding = window.prompt('What is your opening bid?', `${min_bidding}`) || min_bidding;
localStorage.setItem('min', min_bidding);
min_bidding = parseInt(min_bidding);

if(min_bidding > max_spending){

	throw new Error('Your opening bid cannot be more then your maximum bid.');
}

var service_fee = parseInt(5);

// TODO: Bid fully automated based on a list of urls and settings.
// TODO: Monitor the auction and store historical data for analysis.
// TODO: Just do an emotional bidding every now and then

/**
 * Bookmarklets:
 * - `javascript:(function(){setMaxBidding()})()`
 */

(function(){

	"use strict";

	let doc_title = document.title;
	let cur_bidding;

	if(dry_run){

		console.log('Running in SIMULATION mode.')
	}

	let setMaxBidding = function(max){

		if(!max){

			max = window.prompt('What do you want to spend?', `${max_spending}`) || max_spending;
			localStorage.setItem('max', max);
			max_spending = parseInt(max);
		}

		return max_spending;
	};

	setMaxBidding();

	/**
	 * Get the auctions history.
	 * TODO: use history to estimate the next increment.
	 */
	let getHistory = function(){

		let biddings = [{
			time: _timeToSeconds(document.getElementById('timeOfHighestBid').innerText),
			name: document.getElementById('highestBidder').innerText,
			amount: parseInt(document.getElementById('jsMainLotCurrentBid').innerText)
		}];

		document.querySelectorAll('.history-list-item').forEach(function(el){

			let time = el.querySelector('.bidhistory-time').innerText.trim();
			let name = el.querySelector('.bidhistory-name').innerText.trim();
			let amount = parseInt(el.querySelector('.bidhistory-bid').innerText.replace('€', '').trim());

			biddings.push({
				time: _timeToSeconds(time),
				name: name,
				amount: amount,
			})
		});

		console.log(biddings);
	};

	/**
	 * Convert time string to seconds.
	 * @param {string} hms hh:mm:ss
	 * @returns {number} Seconds
	 */
	let _timeToSeconds = function(hms){

		let a = hms.split(':'); // split it at the colons

		let hh = parseInt(a[0]);
		let mm = parseInt(a[1]);
		let ss = parseInt(a[2]);

		return (hh * 60 * 60 + mm * 60 + ss);
	};

	/**
	 * How long does the auction still last?
	 * @returns {string} hh:mm:ss
	 * @private
	 */
	let _getRemainingTime = function(){

		let times = document.querySelectorAll('#biddingBlock .jsDisplayedTimeValue .time-value');
		if(!times){

			return 0;
		}
		let hh = times[0].innerText;
		let mm = times[1].innerText;
		let ss = times[2].innerText;

		return `${hh}:${mm}:${ss}`;
	};

	/**
	 * How many seconds does the auction still last?
	 * @private
	 * @returns {int} seconds
	 */
	let _getRemainingSeconds = function(){

		return _timeToSeconds(_getRemainingTime());
	};

	/**
	 * The the highers budding
	 * @returns {Number} Euro's
	 */
	let _getHighestBidding = function(){

		return parseInt(document.getElementById('jsMainLotCurrentBid').innerText);
	};

	/**
	 * Is this user the highest bidder?
	 * @param {string} [user=window.username]
	 * @returns {boolean}
	 * @private
	 */
	let _isUserHighestBidder = function(user){

		user = user || username;
		return document.getElementById('highestBidder').innerText.trim() === user;
	};

	/**
	 * Does is exceed the max bidding?
	 *
	 * @param {int} amount
	 * @returns {boolean}
	 * @private
	 */
	let _exceedsMaxBidding = function(amount){

		return amount > _getMaxBidding();
	};

	let _getMaxBidding = function(){

		return max_spending - service_fee;
	};

	let _random = function(start, end){

		let length = end - start;
		return Math.ceil(Math.random() * length) + start;
	};

	/**
	 * Returns the bidding increment.
	 * @returns {Number}
	 * @private
	 */
	let _getBiddingIncrement = function(){

		let highest_bidding = _getHighestBidding();

		if(highest_bidding > 100){

			return _random(4, 6);
		}

		if(highest_bidding > 50){

			// Random between 2 and 4.
			return _random(2, 4);
		}

		// default increment.
		return _random(1, 2);
	};

	/**
	 * @returns {int}
	 * @private
	 */
	let _getNexSmartBid = function(){

		let newBidding = _getHighestBidding() + _getBiddingIncrement();

		/*
		Smart bidding.
		Most people bid emotionally, so for instance they use `nice` numbers like 5, 10, 15, 20 etc.
		It's better to just add one euro when we are on a `emotional` number.
		 */
		if(newBidding % 5 === 0){

			// But only increment if we don't exceed the max bidding, otherwise it would be foolish.
			if(!_exceedsMaxBidding(newBidding + 1)){

				newBidding++;
			}
		}

		if(_exceedsMaxBidding(newBidding)){

			throw new Error('Max bidding exceeded');
		}

		return newBidding;
	};

	/**
	 * Raise the amount you are going to bid.
	 *
	 * Note that this function does not actually push the button to persist your bid.
	 *
	 * @param {int} [amount] - Defaults to next smallest, but 'smart', increment
	 * @returns {int}
	 * @private
	 */
	let _raise = function(amount){

		let newBidding = amount || _getNexSmartBid();
		let now = new Date();

		if(cur_bidding !== newBidding){

			console.log(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()} Raise € ${newBidding}`);
			cur_bidding = newBidding;
		}

		return newBidding;
	};

	/**
	 * Perform the bidding.
	 * @param {int} [amount] - Defaults to next smallest, but 'smart', increment
	 */
	let bid = function(amount){

		document.getElementById('jsActiveBidInput').value = _raise(amount);

		if(_isUserHighestBidder(username)){

			console.log(`You are already the highest bidder.`);
			return;
		}

		_simulateClick(document.getElementById('jsActiveBidButton'));
	};

	/**
	 * Simulate a click event.
	 *
	 * @private
	 * @param {Element} el  the element to simulate a click on
	 */
	let _simulateClick = function(el){

		if(dry_run){

			return;
		}

		let evt = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			view: window
		});

		el.dispatchEvent(evt);
	};

	/**
	 * Is the auction closing?
	 * @returns {boolean}
	 * @private
	 */
	let _isAuctionClosing = function(){

		return (_getRemainingSeconds() <= start_bidding_at_seconds_remaining);
	};

	/**
	 * Run loop.
	 * @private
	 */
	let _execute = function(){

		let timeRemaining = _getRemainingSeconds();

		if(timeRemaining <= 0){

			throw new Error('Bidding expired');
		}

		document.title = `${_getNexSmartBid()}/${max_spending - service_fee} ${timeRemaining}; ${doc_title}`;

		_raise();

		if(_isAuctionClosing()){

			bid();
		}

		setTimeout(_execute, 0.6 * 1000);
	};

	if(min_bidding > _getHighestBidding()){

		// Do an opening bid.
		bid(min_bidding);
	}

	_execute();

	window.bid = bid;
	window.setMaxBidding = setMaxBidding;
	window.getHistory = getHistory;
})();