(function (App) {
	'use strict';

	var Q = require('q');
	var request = require('request');
	var inherits = require('util').inherits;
	var results = [];
	var show_count = 0;
	var _filters = {};
	
	function IWOTV() {
		if (!(this instanceof IWOTV)) {
			return new IWOTV();
		}

		App.Providers.Generic.call(this);
	}
	inherits(IWOTV, App.Providers.Generic);

	IWOTV.prototype.extractIds = function (items) {
		return _.pluck(items.results, 'imdb_id');
	};

	//filtering
	var filterring_func = function(arr) {
		var filterred = [];
		arr.forEach(function(val) {
			if (val.genre) {
				for (var i = 0; i < val.genre.length; i ++) {
					if (_filters.genre === "All" || _filters.genre === undefined) {
						filterred.push(val);
						break;
					} else if (val.genre[i] === _filters.genre) {
						filterred.push(val);
						break;
					}
				}
			}
		});
		return filterred;
	};
		
	//sorting
	var sorting_func = function(arr, key) {
		if (key === "Popularity" || key === "seeds")
			return arr;
		if (key === "updated")
			return _.sortBy(arr, 'created');
		if (key === "year")	
			return _.sortBy(arr, 'year');
		if (key === "rating")
			return _.sortBy(arr, 'rating');
		if (key === "name")
			return _.sortBy(arr, 'title');
		
		return [];
	}
	
	//searching 
	var search_func = function(arr, key) {
		if (key === undefined || key === "")
			return arr;
		
		var searched = [];
		arr.forEach(function (val) {
			if (val.title.indexOf(key) > -1)
				searched.push(val);
		});
		
		return searched;
	}
	
	var format = function (show) {
		var genres = [];
		var genres_func = function(arr) {
			arr.forEach(function(val) {
				genres.push(val.gen_name);
			});
			return genres;
		};
		
		var linkIds = [];
		var links_func = function(arr) {
			arr.forEach(function(val) {
				linkIds.push(val.link_id);
			});
			return linkIds;
		};
		
		var seasonInfos = {};
		var seasons_func = function(json) {
			seasonInfos = _.clone(json);
			return seasonInfos;
		}
		
		//check if "seasons" key exists
		var keys = Object.keys(show.seasons);
		if (keys.length == 0 || keys[0] === undefined || keys[0] === "") {
			return {
				results: results,
				hasMore: false//data.movie_count > data.page_number * data.limit
			};
		}
			
		//if the keys exist, extract it one by one
		
		var torrents = {};
		_.each(show.seasons, function(value, currentEpisode) {
			_.each(value, function(item) {
				if (!torrents[item.season]) torrents[item.season] = {};
				torrents[item.season][item.episode] = item;
			});
		});
		
		_.each(torrents, function(value, season) {
			var s = season;
			var v = value;
		});
					
		var bg = {};
		bg.fanart = AdvSettings.get('iwoEndpoint').image_url + show.image;
		bg.poster = AdvSettings.get('iwoEndpoint').image_url + show.image;
		
		var item = {
					type: 'show',
					id: show.id,
					tvdb_id: show.id,
					imdb_id: show.imdb,
					title: show.title,
					year: show.year,
					genre: genres_func(show.geners),
					rating: show.pg_rating,
					duration: show.duration,
					synopsis: show.description,
					images: bg,
					episodes: seasons_func(show.seasons),
					status: show.status,
					created: show.created
				};
		
		if (typeof item.rating === 'string')
			item.rating = 0;
			
		results.push(item);
		
		return {
			results: results,
			hasMore: false//data.movie_count > data.page_number * data.limit
		};
	};

	var requestIWO = function(defer, params) {
	
		request({
			url: 'http://www.iwatchonline.to/api.json',
			form: params,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			method: 'POST',
			strictSSL: false,
			json: true,
			timeout: 10000
		}, function (err, res, data) {
			if (err || res.statusCode >= 400) {
				return defer.reject(err || 'Status Code is above 400');
			} else if (!data || data.status === 'error' || data.imdb === undefined) {
				//err = data ? data.status_message : 'No data returned';
				//return defer.reject(err);
				return;
			} else {
				var formatted = format(data);
				if (show_count > 0 && show_count % 50 === 0) {
					formatted.hasMore = true;
					formatted.results = filterring_func(formatted.results);
					formatted.results = sorting_func(formatted.results, _filters.sort_by);
					formatted.results = search_func(formatted.results, _filters.query_term);
					return defer.resolve(formatted);
				}
				//return defer.resolve(format(data));
			}
		});
	};
	
	IWOTV.prototype.fetch = function (filters) {
		var params = {
			'IWO-API-KEY': App.Config.api_key,
			type: 'show',
			iwo_id: 1,
			tvrage_id: '',
			sort_by: 'seeds',
			limit: 50,
			with_rt_ratings: true
		};

		if (filters.page) {
			params.page = filters.page;
		}

		if (filters.keywords) {
			params.query_term = filters.keywords;
		}

		if (filters.genre) {
			params.genre = filters.genre;
		}

		if (filters.order === 1) {
			params.order_by = 'asc';
		}

		if (filters.sorter && filters.sorter !== 'popularity') {
			params.sort_by = filters.sorter;
		}

		if (Settings.movies_quality !== 'all') {
			params.quality = Settings.movies_quality;
		}

		_filters = _.clone(params);
		
		var defer = Q.defer();

		if (show_count > 10000000) show_count = 0;
		
		var next_show_pos = show_count;
		for (var i = next_show_pos; i < next_show_pos + 50; i ++) {
			show_count = params.iwo_id = i + 1;
			requestIWO(defer, params);
		}

		return defer.promise;
	};
	
	IWOTV.prototype.detail = function (torrent_id, old_data) {
		return Q(old_data);
	};

	App.Providers.Iwotv = IWOTV;

})(window.App);
