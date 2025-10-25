
// Koala Map

var KOALA_FC = ee.FeatureCollection('projects/mitchell-catlin/assets/KML');               
var PARKS_FC = ee.FeatureCollection('projects/mitchell-catlin/assets/National_Parks');    
var LGA_FC   = ee.FeatureCollection('projects/mitchell-catlin/assets/nsw_lga');           

var NSW_GEOM = LGA_FC.union().geometry().simplify(2000); 


Map.setOptions('HYBRID');                
Map.setCenter(147, -32, 6);               




var lgaStyle   = {color: 'ffffff', fillColor: '00000000', width: 0.8};   
var parksStyle = {color: '00ff00', fillColor: '00000000', width: 1.2};  


var kPal       = ee.List(['ffffcc','ffeda0','feb24c','fd8d3c','fc4e2a','e31a1c','800026']); 
var kPalLegend = ['#ffffcc','#ffeda0','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#800026'];   
var kLabels    = ['Very Low','Low','Moderate','Medium-High','High','Very High','Extreme'];







var koalaStyledImage = KOALA_FC.map(function (f) {
  var kma = f.get('KMA'); 
  var color = ee.Algorithms.If(
    kma,
    kPal.get(ee.Number(kma).subtract(1).max(0).min(6).int()),
    'ffa500' 
  );
  return f.set('style', {color: color, fillColor: color, width: 0.5, fillOpacity: 0.45});
}).style({styleProperty: 'style'});





var wc = ee.ImageCollection('ESA/WorldCover/v200').first().select('Map');
var wcClipped = wc.clip(NSW_GEOM);

var wcPal = [
  '006400','FFBB22','FFFF4C','F096FF','FA0000',
  'B4B4B4','F0F0F0','0064C8','0096A0','00CF75','FAE6A0'
];
var wcVis = {min: 10, max: 100, palette: wcPal};
var wcLegendItems = [
  {label:'10 Tree cover',         color:'#006400'},
  {label:'20 Shrubland',          color:'#FFBB22'},
  {label:'30 Grassland',          color:'#FFFF4C'},
  {label:'40 Cropland',           color:'#F096FF'},
  {label:'50 Built-up',           color:'#FA0000'},
  {label:'60 Bare / Sparse',      color:'#B4B4B4'},
  {label:'70 Snow / Ice',         color:'#F0F0F0'},
  {label:'80 Permanent water',    color:'#0064C8'},
  {label:'90 Herbaceous wetland', color:'#0096A0'},
  {label:'95 Mangroves',          color:'#00CF75'},
  {label:'100 Moss / Lichen',     color:'#FAE6A0'}
];





var koalaLayer = ui.Map.Layer(koalaStyledImage, {}, 'Koala Likelihood', true);
var wcLayer    = ui.Map.Layer(wcClipped, wcVis, 'ESA WorldCover (NSW)', false); wcLayer.setOpacity(0.45);
var lgaLayer   = ui.Map.Layer(LGA_FC.style(lgaStyle), {}, 'LGA Boundaries', true);
var parksLayer = ui.Map.Layer(PARKS_FC.style(parksStyle), {}, 'National Parks', true);
Map.layers().reset([koalaLayer, wcLayer, lgaLayer, parksLayer]);





var leftPanel = ui.Panel({
  style: {position: 'top-left', padding: '8px', width: '300px', height: '420px', backgroundColor: 'white'}
});
leftPanel.add(ui.Label('NSW Koala Likelihood & Protected Areas', {
  fontWeight: 'bold', fontSize: '18px', margin: '6px 6px 10px 6px'
}));




var cbKoala = ui.Checkbox({
  label:'Koala Likelihood', value:true,
  onChange:function(v){ koalaLayer.setShown(v); updateLegendOnToggle('koala', v); }
});
var cbESA = ui.Checkbox({
  label:'ESA WorldCover (NSW)', value:false,
  onChange:function(v){ wcLayer.setShown(v); updateLegendOnToggle('esa', v); }
});
var cbParks = ui.Checkbox({
  label:'National Parks', value:true,
  onChange:function(v){ parksLayer.setShown(v); }
});
var cbLGA = ui.Checkbox({
  label:'LGA Boundaries', value:true,
  onChange:function(v){ lgaLayer.setShown(v); }
});

leftPanel.add(cbKoala);
leftPanel.add(cbESA);
leftPanel.add(cbParks);
leftPanel.add(cbLGA);



var legendPanel = ui.Panel({
  style: {margin: '10px 0 0 0', padding: '8px', border: '1px solid #ddd',
          height: '250px', backgroundColor: 'white'}
});
leftPanel.add(legendPanel);

function addLineEntry(hex, labelText){
  var sw = ui.Label('', {
    backgroundColor:'#ffffff00', border:'2px solid '+hex,
    width:'24px', height:'0px', margin:'0 8px 6px 0'
  });
  var lab = ui.Label(labelText, {margin:'-4px 0 6px 0'});
  legendPanel.add(ui.Panel([sw, lab], ui.Panel.Layout.Flow('horizontal')));
}

function setLegendForKoala() {
  legendPanel.clear();
  legendPanel.add(ui.Label('Legend – Koala Likelihood (KMA)', {fontWeight:'bold', margin:'0 0 8px 0'}));
  for (var i = 0; i < 7; i++) {
    var row = ui.Panel({
      widgets: [
        ui.Label('', {backgroundColor: kPalLegend[i], padding:'10px', margin:'0 8px 6px 0'}),
        ui.Label((i+1) + ' ' + kLabels[i], {margin:'0 0 6px 0'})
      ],
      layout: ui.Panel.Layout.Flow('horizontal')
    });
    legendPanel.add(row);
  }
  legendPanel.add(ui.Label('Overlays', {fontWeight:'bold', margin:'10px 0 6px 0'}));
  addLineEntry('#00ff00','National Parks (outline)');
  addLineEntry('#ffffff','LGA Boundaries (outline)');
}

function setLegendForESA() {
  legendPanel.clear();
  legendPanel.add(ui.Label('Legend – ESA WorldCover', {fontWeight:'bold', margin:'0 0 8px 0'}));
  wcLegendItems.forEach(function(it){
    var row = ui.Panel({
      widgets: [
        ui.Label('', {backgroundColor: it.color, padding:'10px', margin:'0 8px 6px 0'}),
        ui.Label(it.label, {margin:'0 0 6px 0'})
      ],
      layout: ui.Panel.Layout.Flow('horizontal')
    });
    legendPanel.add(row);
  });
  legendPanel.add(ui.Label('Overlays', {fontWeight:'bold', margin:'10px 0 6px 0'}));
  addLineEntry('#00ff00','National Parks (outline)');
  addLineEntry('#ffffff','LGA Boundaries (outline)');
}

var activeLegend = 'koala';
function updateLegend() {
  if (activeLegend === 'esa' && wcLayer.getShown()) {
    setLegendForESA();
  } else if (koalaLayer.getShown()) {
    setLegendForKoala();
  } else if (wcLayer.getShown()) {
    setLegendForESA();
  } else {
    legendPanel.clear();
    legendPanel.add(ui.Label('Legend', {fontWeight:'bold', margin:'0 0 8px 0'}));
    legendPanel.add(ui.Label('Overlays', {fontWeight:'bold', margin:'0 0 6px 0'}));
    addLineEntry('#00ff00','National Parks (outline)');
    addLineEntry('#ffffff','LGA Boundaries (outline)');
  }
}
function updateLegendOnToggle(which, isOn){
  if (isOn) {
    activeLegend = which;  
  } else if (activeLegend === which) {
    activeLegend = (which === 'koala') ? 'esa' : 'koala';
  }
  updateLegend();
}
updateLegend();


var scalePanel = ui.Panel({style:{position:'bottom-left', padding:'8px', backgroundColor:'white'}});
var scaleLabel = ui.Label('Scale', {fontSize:'12px'});
scalePanel.add(scaleLabel);
Map.add(scalePanel);

function updateScale() {
  var z = Map.getZoom();
  var lat = -33; 
  try { lat = Map.getCenter().coordinates().get(1).getInfo(); } catch (e) {}
  var mPerPx = 156543.03392 * Math.cos(lat * Math.PI/180) / Math.pow(2, z);
  var kmFor100px = Math.max(1, Math.round((mPerPx * 100) / 1000));
  scaleLabel.setValue('~' + kmFor100px + ' km');
}
Map.onChangeZoom(updateScale);
Map.onChangeCenter(updateScale);
updateScale();


Map.add(leftPanel);

