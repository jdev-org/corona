{
    mviewer.customLayers.corona = {};
    var cl = mviewer.customLayers.corona;
    var max = null;
    var maxValue = function(features) {
        var vals = [];
        features.forEach(e => {
            vals.push(parseFloat(e.getProperties().properties.confirmed));
        })   
        return Math.max.apply(null, vals);
    }
    cl.layer = new ol.layer.Heatmap({
        source: new ol.source.Vector({
            format: new ol.format.GeoJSON()
        }),
        blur: 30,
        radius: 18,
        weight: function(feature) {
            var prop = feature.getProperties().properties;
            var confirmed = prop.confirmed;            
            confirmed = parseFloat(confirmed);
            return confirmed;
        }
    });
}