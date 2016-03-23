(function (App) {
	'use strict';

	var Q = require('q');
	var request = require('request');
	var inherits = require('util').inherits;
	var results = [];
	var movie_count = 0;
	var _filters = {};
	
	function IWO() {
		if (!(this instanceof IWO)) {
			return new IWO();
		}

		App.Providers.Generic.call(this);
	}
	inherits(IWO, App.Providers.Generic);

	IWO.prototype.extractIds = function (items) {
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
		if (key === "last added")
			return _.sortBy(arr, 'created');
		if (key === "year")	
			return _.sortBy(arr, 'year');
		if (key === "rating")
			return _.sortBy(arr, 'rating');
		if (key === "title")
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
	
	var format = function (movie) {
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
		
		//sorting
		
		if (movie.imdb === undefined || movie.links === null) {
			return {
				results: results,
				hasMore: false//data.movie_count > data.page_number * data.limit
			};
		}
			
		var item = {
					type: 'movie',
					imdb_id: movie.imdb,
					title: movie.title,
					year: movie.year,
					genre: genres_func(movie.geners),
					rating: movie.pg_rating,
					image: AdvSettings.get('iwoEndpoint').image_url + movie.image,
					link: AdvSettings.get('iwoEndpoint').link_url + movie.links[0].link_id,
					link_type: movie.links[0].link_type,	//1:DVD, 2:HD
					duration: movie.duration,
					synopsis: movie.description,
					created: movie.created,
					linkIds: links_func(movie.links)
				};
		
		if (item.rating === "Unrated")
			item.rating = 0;
			
		results.push(item);
				
		return {
			results: results,
			hasMore: false//data.movie_count > data.page_number * data.limit
		};
	};

	var requestIWO = function(defer, params) {
	
		var condition = _.clone(params);
		
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
				if (movie_count > 0 && movie_count % 30 === 0) {
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
	
	IWO.prototype.fetch = function (filters) {
		var params = {
			'IWO-API-KEY': App.Config.api_key,
			type: 'movie',
			iwo_id: 1,
			imdb_id: 'ttxxxxxxxx',
			sort_by: 'seeds',
			limit: 30,
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

		var next_movie_pos = movie_count;
		for (var i = next_movie_pos; i < next_movie_pos + 30; i ++) {
			movie_count = params.iwo_id = i + 1;
			requestIWO(defer, params);
		}

		return defer.promise;
	};
	
	IWO.prototype.detail = function (torrent_id, old_data) {
		return Q(old_data);
	};

	App.Providers.Iwo = IWO;

})(window.App);
