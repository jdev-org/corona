mviewer.customControls.corona = (function() {
    /*
     * Private
     */
    var _idlayer = 'corona';

    // play anim
    var _play = true;
    var _intervalId = null;
    var _intervalMs = 3;

    var _firstDay = "2020/01/23";

    // stock data
    var _data = [];
    var _orderedDate = [];
    var _dateObj = {};

    var _formatDate = function(date) {
        var d = date.getDate();
        var m = date.getMonth() + 1;
        var year = date.getFullYear();
        var day = d < 10 ? ("0" + d) : d;
        var month = m < 10 ? ("0" + m) : m;
        var formatedDate = [year, month, day].join("/");
        return formatedDate;
    };

    var _formatUTCDate = function(fdate, delimiter) {
        var Y = fdate.getUTCFullYear();
        var D = fdate.getUTCDate() > 9 ? fdate.getUTCDate() : `0${fdate.getUTCDate()}`
        var M = fdate.getUTCMonth() + 1 > 9 ? fdate.getUTCMonth() + 1 : `0${fdate.getUTCMonth()+1}`
        return [Y, M, D].join(delimiter);
    };

    // update layer from date
    var _updateLayer = function(type) {
        var dateInput = $('.coronaInput').val() || _firstDay;
        var date = new Date(dateInput);
        date = _formatDate(date, '');
        // get layer source
        var _source = mviewer.getLayers()[_idlayer].layer.getSource();
        
        // get data for a date
        if (type === 0 && _play) { // update by range
            _invervalId = null;
            var toRead = [];
            var inRange = false;
            // get every calendar days from input to today
            _orderedDate.forEach((e, n) => {
                if (date === e) {
                    inRange = true;
                }
                if (inRange) {
                    toRead.push(e);
                }
            })
            // update map for each day
            var counterLimit = toRead.length;            
            counter = 0;
            if(!inRange) {
                // to display alert message
                mviewer.alert("Aucune données pour cette date : " + dateInput, "alert-danger");
                mviewer.alert("Choisir une date entre le " + _firstDay + " et aujourd\'hui", "alert-warning");
                // to hide alert auto
                setTimeout(function(){
                     $('.alert-dismissible').hide();
                }, 3000);
            } else {
                if(_intervalId) {
                    clearInterval(_intervalId);
                }
                function updateMap() {
                    // while counter
                    if (counter != counterLimit) {
                        _source.clear();
                        if (_dateObj[toRead[counter]].features) {
                            var fDate = toRead[counter];
                            _source.addFeatures(_dateObj[fDate].features);
                            _source.refresh();
                            var time = new Date(_dateObj[fDate].features[0].values_.properties.date);
                            $(".coronaInput.datepicker").val(_formatDate(time,'/'));
                        }
                    } else {
                        // stop counter
                        clearInterval(_intervalId);
                    }
                    counter++;
                }
                function start() {
                    _intervalId = setInterval(updateMap, _intervalMs*1000);
                }
                start();
            }
        } else { // init first display without animation for today
            if (_dateObj[date] && $('.coronaInput').val()) {
                _source.clear();
                _source.addFeatures(_dateObj[date].features);
                _source.refresh();
                $(".coronaInput.datepicker").val(date);
            }
        }
    }
    _getWMSParams = function() {
        // getFeatures
        return {
            "test":"test",
            "service": "WFS",
            "version": "1.0.0",
            "request": "GetFeature",
            "typenames": "corona:datacorona",
            "srsname": "EPSG:3857",
            "outputformat": "application/json"
        }     
    }    

    // get every days from date to now
    _getEveryDays = function(from, to) {
        from = _formatDate(from);
        to = _formatDate(to);
        var date = new Date(from)
        var dates = [];
        while (_formatDate(date) != to) {
            // request
            dates.push(_formatDate(date));
            // up date
            date.setUTCDate(date.getUTCDate() + 1);
        }
        return dates;
    }

    // get numbers of day between to date where dateStart is given as 2020/01/20
    _countDays = function(dateStart) {
        dateStart = new Date(dateStart);
        dateStop = new Date();
        var differenceTime = dateStop.getTime() - dateStart.getTime();
        if (dateStop < dateStart) {
            differenceTime = dateStop.getTime() - dateStart.getTime(); 
        }
        var differenceDays = Difference_In_Time / (1000 * 3600 * 24);
        return differenceDays;
    }

    _initSlider = function () {
        $("#ex16a").slider({ min: 1, max: 5, value: 2, focus: true });
        // slider behavior
        if($("#ex16a").slider()) {
            $("#ex16a").slider().on('slideStop', function(ev) {
                _intervalMs = $('#ex16a').slider('getValue');
                if(_intervalId) {
                    clearInterval(_intervalId);
                }
                setTimeout(function(){
                    _updateLayer(0);
               }, 1000);                
            });
        }        
        // slider width and
        if($('.coronaControl').children('.slider').length) {
            $('.coronaControl').children('.slider').attr('style','margin-top:9px; width:160px;');
        }
    }

    return {
        /*
         * Public
         */
        init: function() {
            // mandatory - code executed when panel is opened
            // set first datepicker value
            $(".coronaInput.datepicker").val(_firstDay);
            // slider init
            _initSlider();
            // datepicker
            $(".coronaInput.datepicker").datepicker({
                todayHighlight: true,
                language: "fr",
                todayBtn: "linked"
            });
            $('.play-corona').on('click', function(e) {
                _play = true;
                if(_intervalId) {
                    clearInterval(_intervalId);
                }   
                if(_orderedDate.length) {
                    _updateLayer(0)
                }
            });
            $('.replay-corona').on('click', function(e) {
                _play = true;
                $(".coronaInput.datepicker").val(_firstDay);  
                if(_orderedDate.length) {
                    _updateLayer(0)
                }
            });             
            $('.pause-corona').on('click', function(e) {
                if(_intervalId) {
                    clearInterval(_intervalId);
                }
            });            
            $('.hand-corona').on('click', function(e) {
                _play = false;
                if(_intervalId) {
                    clearInterval(_intervalId);
                }                
                if(_orderedDate.length) {
                    _updateLayer(1)
                }
            });                        
            var resultJson;
            $.ajax({
                type: "GET",
                url: "https://gis.jdev.fr/geoserver/corona/ows",
                data: _getWMSParams(),
                crossDomain: true,
                dataType: "json",
                success: function(result) {
                    if (!_data.length) {
                        _data = result.features;
                        resultJson = result;
                        _data.forEach(e => {
                            var fdate = new Date(e.properties.date);
                            fdate = _formatDate(fdate, '');
                            var newData = e;
                            var prop = [e.properties.country, e.properties.state].join('-');
                            var addFeature = true;
                            // create index into json
                            if (_orderedDate.indexOf(fdate) < 0) {
                                _orderedDate.push(fdate);
                                _dateObj[fdate] = {
                                    features: []
                                }
                            } else {
                                // directly add feature if not already exist
                                // else, just keep biggest confirmed value if already exist
                                _dateObj[fdate].features.forEach((e, i) => {
                                    parsedProp = [e.getProperties().properties.country, e.getProperties().properties.state].join('-');
                                    if (parsedProp === prop) {
                                        var oldConfirmed = newData.properties.confirmed;
                                        var newConfirmed = e.getProperties().properties.confirmed;
                                        if (oldConfirmed <= newConfirmed) {
                                            _dateObj[fdate].features.splice(i, 1); // remove old element because value is not biggest
                                            addFeature = true;
                                        } else {
                                            addFeature = false;
                                        }
                                    }
                                });
                            }
                            // add feature
                            if (addFeature) {
                                var feature = new ol.Feature({
                                    id: e.id,
                                    properties: e.properties,
                                    geometry: new ol.geom.Point(e.geometry.coordinates)
                                });
                                _dateObj[fdate].features.push(feature);
                            }
                            
                        });
                        _orderedDate.sort();
                        _updateLayer(0);
                    }
                }
            });
            // Update map with animation when user select calendar date
            $(".corona-date-values").change(function(e) {
                _updateLayer(0);
            });
        },

        destroy: function() {
            // mandatory - code executed when panel is closed

        }
    };
}());
