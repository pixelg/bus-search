/**
 * Created by blee on 11/08/2017.
 */

function busSearch(originGeohash, originCityName, destinationGeohash, destinationCityName, departureDateString, adults, cities) {

  var myDate = function () {
    var now = new Date();
    now.setDate(now.getDate() + 1);
    var month = (now.getMonth() + 1);
    var day = now.getDate();
    month = month.toString().length < 2 ? '0' + month : month;
    day = day.toString().length < 2 ? '0' + day : day;
    return now.getFullYear() + '-' + month + '-' + day;
  }();

  var accentMatcher =
    function(item){
      var accentMap = {
        'ã':'a',
        'á':'a',
        'à':'a',
        'â':'a',
        'ç':'c',
        'é':'e',
        'ê':'e',
        'í':'i',
        'õ':'o',
        'ó':'o',
        'ô':'o',
        'ú':'u',
        'ü':'u',
        'Ã':'A',
        'Á':'A',
        'À':'A',
        'Â':'A',
        'Ç':'C',
        'É':'E',
        'Ê':'E',
        'Í':'I',
        'Õ':'O',
        'Ó':'O',
        'Ô':'O',
        'Ú':'U',
        'Ü':'U'
      };

      var s = new RegExp(this.query, 'i');
      var matched = s.test(item.name) || s.test(
        function(term){
          var ret = '';
          for(var i = 0; i < term.length; i++){
            ret += accentMap[term.charAt(i)] || term.charAt(i);
          }

          return ret;
        }(item.name));

      return matched;
  };

  var myFormattedDate = departureDateString ? moment(departureDateString).format('MMM DD, YYYY') : moment().add(1, 'days').format('MMM DD, YYYY');

  var store = {
    state: {
      originCityName: originCityName || null,
      originGeoHash: originGeohash || null,
      destinationCityName: destinationCityName || null,
      destinationGeoHash: destinationGeohash || null,
      departureDateFormatted: myFormattedDate,
      departureDate: departureDateString || myDate,
      adults: adults || 2,
      searchFilter: "",
      searchResults: []
    },
    setOrigin: function(origin){
      this.state.originGeoHash = origin.geohash;
      this.state.originCityName = origin.name;
      // this.getSearchResults();
    },
    setDestination: function(destination){
      this.state.destinationGeoHash = destination.geohash;
      this.state.destinationCityName = destination.name;
      // this.getSearchResults();
    },
    setDepartureDate: function (departureDate) {
      this.state.departureDate = departureDate;
      // this.getSearchResults();
    },
      setDepartureDateFormatted: function (departureDateFormatted) {
          this.state.departureDateFormatted = departureDateFormatted;
          // this.getSearchResults();
      },
    setAdults: function (adults) {
      this.state.adults = adults;
      // this.getSearchResults();
    },
    getSearchResults: function () {

      if (!this.state.originGeoHash || !this.state.destinationGeoHash){
        return;
      }

      var self = this;
      spinme();

      $.get('/buses/searchAjax/' +
        this.state.originGeoHash + '/' +
        encodeURI(this.state.originCityName) + '/' +
        this.state.destinationGeoHash + '/' +
        encodeURI(this.state.destinationCityName) + '/' +
        this.state.departureDate + '/' +
        this.state.adults)
        .done(function (response) {
          try{
            self.state.searchResults = response;
          }catch(e){
            console.error(e);
          }
        })
        .always(function () {
            goaway();
        });
    }
  };

  Vue.directive('origin-city-typeahead', {
    bind: function (el) {
      var clickCount = 0;
      $(el).typeahead({
        source: cities,
        autoSelect: true,
        fitToElement: true,
        matcher: accentMatcher,
        afterSelect: function(item){
          if (clickCount === 1){
            store.setOrigin(item);
            clickCount = 0;
            return;
          }
          clickCount++;
        }
      });
    }
  });

  Vue.directive('destination-city-typeahead', {
    bind: function (el) {
      var clickCount = 0;
      $(el).typeahead({
        source: cities,
        autoSelect: true,
        fitToElement: true,
        matcher: accentMatcher,
        afterSelect: function(item){
          if (clickCount === 1){
            store.setDestination(item);
            clickCount = 0;
            return;
          }
          clickCount++;
        }
      });
    }
  });

  Vue.directive('datepicker', {
    bind: function (el) {
      $(el).datepicker(
        {
          format: 'M dd, yyyy',
          autoclose: true,
          todayHighlight: true
        })
          .on(
            'changeDate', function(e){
                store.setDepartureDate(moment(e.date).format("YYYY-MM-DD"));
                store.setDepartureDateFormatted(moment(e.date).format('MMM DD, YYYY'));
            }
          );

      $(el).datepicker('setDate', store.state.departureDateFormatted);
    }
  });

  Vue.filter('moment', function (value) {
    return moment("1981-02-22 " + value).format("h:mm a");
  });

  var app = new Vue({
    el: '#app',
    data: store.state,
    computed: {
      filteredSearchResults: function () {
        var match = new RegExp(this.searchFilter, "i");
        if (!this.searchResults || this.searchResults.length === 0) {
          return [];
        }

        var filtered = this.searchResults.filter(function (item) {
          return match.exec(item.amenities.display_name) || match.exec(item.operator.name);
        });

        return filtered;
      }
    },
    methods: {
      filteredSearchResults: function () {
      },
      search: function(){
        store.getSearchResults();
      },
      selectAdults: function () {
        // store.getSearchResults();
      },
      clearFilter: function () {
        this.searchFilter = "";
      },
      filterAM: function(){
        var match = new RegExp("AM", "i");
        filteredSearchResults = this.searchResults.filter(function(item){
          return match.exec(item.departure_time_formatted);
        });
      },
      filterPM: function(){
        var match = new RegExp("PM", "i");
        filteredSearchResults = this.searchResults.filter(function(item){
          return match.exec(item.departure_time_formatted);
        });
      }
    },
    mounted: function () {
      // store.getSearchResults();
    }
  });
}
