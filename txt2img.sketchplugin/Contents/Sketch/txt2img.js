@import 'pluginDefaults.js'

var presets = {
    setting: 0
}
var userDefaults = initDefaults("com.wuwa.sketch.txt2img", presets)

function changeAPI(context){

    var dialog = buildDialog(context);
    userDefaults.setting = handleAlertResponse(dialog, dialog.runModal());
    saveDefaults(userDefaults);
    //log(userDefaults.setting);

}

function createSelect (options) {

  var select = NSPopUpButton.alloc().initWithFrame(NSMakeRect(0, 0, 200, 28));
  select.addItemsWithTitles(options);
  select.selectItemAtIndex(userDefaults.setting);
  return select;

}

function buildDialog(context) {
  var dialogWindow = COSAlertWindow.new();

  dialogWindow.setMessageText('Image Source Settings');
  dialogWindow.setInformativeText('Please select the API which you want to pull images from:');

  var ops = ["SVG Icons 8","Giphy","Flickr"];

  var apiselect = createSelect(ops);
  dialogWindow.addAccessoryView(apiselect);

  dialogWindow.addButtonWithTitle('OK');
  dialogWindow.addButtonWithTitle('Cancel');

  dialogWindow.setIcon(NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("txt2img@2x.png").path()));

  return dialogWindow;
}

function handleAlertResponse (dialog, responseCode) {
  if (responseCode == "1000") {
    return dialog.viewAtIndex(0).indexOfSelectedItem();
  } else {
    return dialog.viewAtIndex(0).indexOfSelectedItem();
    // crashes if null on cancel?
    //return null;
  }
}


function getImage(context) {
  
  // var doc = context.document;
  // var selection = context.selection;
  switch(parseInt(userDefaults.setting)) {
    case 0:
        log("icon8");
        setSVG(context);
        break;
    case 1:
        log("giphy");
        setImage(context);
        break;
    case 2:
        log("flickr");
        setImage(context);
        break;
    default:
        log("none");
    }

} // end main

 function apiCall(url, setting, context) {
  
  switch(setting) {
    case 0:
        var queryURL = 'https://api.icons8.com/api/iconsets/v3/search?term='+ encodeURI(url) +'&amount=3';
        break;
    case 1:
        var queryURL = 'https://api.giphy.com/v1/gifs/search?q=' + encodeURI(url) + '&api_key=dc6zaTOxFJmzC&limit=10';
        break;
    case 2:
        var queryURL = "https://api.flickr.com/services/feeds/photos_public.gne?format=json&nojsoncallback=1&tags=" + encodeURI(url);
        break;
    default:
        log("none");
    }

    var request = NSMutableURLRequest.new();
    [request setHTTPMethod:@"GET"];
    [request setURL:[NSURL URLWithString:queryURL]];

    var error = NSError.new();
    var responseCode = null;

    var oResponseData = [NSURLConnection sendSynchronousRequest:request returningResponse:responseCode error:error];
    var dataString = [[NSString alloc] initWithData:oResponseData encoding:NSUTF8StringEncoding];

    //var pattern = new RegExp("\\\\'", "g");
    //var validJSONString = dataString.replace(pattern, "'");
    //var images = JSON.parse(validJSONString);
    
    var images = JSON.parse(dataString);

    //log(images);

    try {

      switch(setting) {
        case 0:
          var imageUrl = images.result.search[0].svg;
          //var imageUrl = images.result.search[Math.floor(Math.random() * images.result.search.length)].svg;
          break;
        case 1:
          var imageUrl = images.data[Math.floor(Math.random() * images.data.length)].images.downsized_still.url;
          break;
        case 2:
          var imageUrl = images.items[Math.floor(Math.random() * images.items.length)].media.m;
          imageUrl = imageUrl.replace("_m", "_b");
          break;
        default:
          log("none");
          return;
      }
      return imageUrl;

    }
    catch(err) {
      var doc = context.document;
      var errMessage = "Unfortunately, the API did not send back any results for " + url;
      [doc showMessage:errMessage];
    }

} 



function setImage(context){
    
    var doc = context.document;
    var selection = context.selection;

  if (selection.length > 0) {

    for (var i = 0; i < [selection count]; i++) {
      var layer = selection[i];

      var imageurl = apiCall(layer.name(),parseInt(userDefaults.setting),context);

      var imageurl_nsurl = NSURL.alloc().initWithString(imageurl);
      var imageData = NSImage.alloc().initByReferencingURL(imageurl_nsurl);

      if ([layer class] == MSTextLayer) {

        var rectangle = MSShapeGroup.shapeWithRect({origin:{x:layer.frame().x(), y:layer.frame().y()-100}, size:{width:200, height:200}});
        var fill = rectangle.style().addStylePartOfType(0);
        fill.color = MSColor.colorWithRed_green_blue_alpha(0, 0, 0, 1);
        context.document.currentPage().currentArtboard().addLayer(rectangle);
        rectangle.setName(layer.name());

        layerStyle = rectangle.style().fills().firstObject();
        layerStyle.isEnabled = true;
        layerStyle.setFillType(4);
        layerStyle.patternFillType = 1;

        /* ////// old sketch versions
         if (MSApplicationMetadata.metadata().appVersion < 47) {
            layerStyle.setImage(MSImageData.alloc().initWithImage_convertColorSpace(imageData, false));
          } else {
            layerStyle.setImage(MSImageData.alloc().initWithImage(imageData));
          }
        */

        layerStyle.setImage(MSImageData.alloc().initWithImage(imageData));
         
        layer.removeFromParent();

      } else if ([layer class] == MSShapeGroup) {

        layerStyle = layer.style().fills().firstObject();
        layerStyle.isEnabled = true;
        layerStyle.setFillType(4);
        layerStyle.patternFillType = 1;
        layerStyle.setImage(MSImageData.alloc().initWithImage(imageData));
        

      } //end if

    } // end loop of layers

    } else {
     [doc showMessage:"Please select at least one TEXT or SHAPE layer."];
  } //end no selection

}

function setSVG(context){

  var doc = context.document;
  var selection = context.selection;
  if (selection.length > 0) {

    for (var i = 0; i < [selection count]; i++) {
      var layer = selection[i];

      var imageurl = apiCall(layer.name(),parseInt(userDefaults.setting),context);

      //var imageurl_nsurl = NSURL.alloc().initWithString(imageurl);
      //var imageData = NSImage.alloc().initByReferencingURL(imageurl_nsurl);

      if ([layer class] == MSTextLayer) {

       var rectangle = MSShapeGroup.shapeWithRect({origin:{x:layer.frame().x(), y:layer.frame().y()-25}, size:{width:50, height:50}});
        //var fill = rectangle.style().addStylePartOfType(0);
        //fill.color = MSColor.colorWithRed_green_blue_alpha(0, 0, 0, 1);
        //context.document.currentPage().currentArtboard().addLayer(rectangle);
        //rectangle.setName(layer.name());

        var selectedFrame = rectangle.frame();
        //rectangle.removeFromParent();
         
      } else if ([layer class] == MSShapeGroup) {

        var selectedFrame = layer.frame();

      } //end if

        var svgdata = [[NSString stringWithString:imageurl] dataUsingEncoding:4];

        var svgImporter = MSSVGImporter.svgImporter();
        svgImporter.prepareToImportFromData(svgdata);
        var importedSVGLayer = svgImporter.importAsLayer();
        importedSVGLayer.name = layer.name();


        // Scale SVG to selection frame
        var svgFrame = importedSVGLayer.frame();
        var ratio = svgFrame.width() / svgFrame.height();
        var newWidth = selectedFrame.width();
        var newHeight = newWidth / ratio;
        if (newHeight > selectedFrame.height()) {
          newHeight = selectedFrame.height();
          newWidth = newHeight * ratio;
        }

        // Center in selection frame
        [svgFrame setX:selectedFrame.x() + selectedFrame.width() / 2 - newWidth / 2];
        [svgFrame setY:selectedFrame.y() + selectedFrame.height() / 2 - newHeight / 2];
        [svgFrame setWidth:newWidth];
        [svgFrame setHeight:newHeight];

        // Add label layer
        var page = doc.currentPage();
        var canvas = page.currentArtboard() || page;
        canvas.addLayers([importedSVGLayer]);

        // get rid of useless groups inside the svg
        //unrollGroupsInLayer(importedSVGLayer);

        //log(importedSVGLayer.layers().firstObject().name)
        importedSVGLayer.layers().firstObject().name = layer.name();
        importedSVGLayer.ungroup();

        // Remove selection frame
        layer.removeFromParent();
    
    } // end loop of layers
     } else {
    [doc showMessage:"Please select at least one text or shape layer."];
  } //end no selection

    
} // end setSVG


function unrollGroupsInLayer(layer){
  log("unrollGroupsInLayer: " + layer);

  if (layer.className() == "MSLayerGroup" || layer.className() == "MSArtboardGroup") {
    if(layer.layers().count() == 0) {
      layer.removeFromParent()
    }
    if(layer.layers().count() == 1 && layer.layers().firstObject().className() == "MSLayerGroup") {
      // Group contains just another group, so let's call ourselves again
      var newLayer = layer.ungroup()
      unrollGroupsInLayer(newLayer.firstObject())
    } else {
      var layers = layer.layers()
      for (var i=0; i < [layers count]; i++) {
        var layer = [layers objectAtIndex:i]
        if(layer.className() == "MSLayerGroup"){
          unrollGroupsInLayer(layer)
        }
      }
    }
  }
}

