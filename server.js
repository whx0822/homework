var express = require('express');
var app = express(); // app has all functions of express
var request = require('request');

var appid = "HaoxinWa-csci571h-PRD-ea6d6c7c3-65fcb57b";
var search_api_key = "AIzaSyCLeKJYJZwm--Pjp-s2nHDxu-jLQ1X44is";
var search_engine_id = "009173011032544904040:qmcn-awwy1k";

//app.set('view engine', 'ejs');

var message = {title: 'Success'};

var message = { title: 'Success' };
app.use(express.static(__dirname));

// Retrieve main table information.
app.get("/showTab1", function(req, res) {
    res.setHeader('Content-Type', "application/json");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var query = req.query;
    var keyword = query.keyword;
    var categoryId = query.categoryId;
    var zipcode = query.zipcode;
    var mile = query.mile;
    var cond1 = query.cond1;
    var cond2 = query.cond2;
    var cond3 = query.cond3;
    var shipping1 = query.shipping1;
    var shipping2 = query.shipping2;

    var cnt = 1, cond_count = 0;

    var request_url = "http://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsAdvanced&SERVICE-VERSION=1.0.0" +
    "&SECURITY-APPNAME=" + appid + 
    "&RESPONSE-DATA-FORMAT=JSON" + 
    "&REST-PAYLOAD&outputSelector(0)=SellerInfo&outputSelector(1)=StoreInfo" + 
    "&paginationInput.entriesPerPage=50" + 
    "&keywords=" + keyword;

    if(categoryId != "0")
        request_url += "&categoryId=" + categoryId;

    request_url += "&buyerPostalCode=" + zipcode + 
    "&itemFilter(0).name=MaxDistance&itemFilter(0).value=" + mile;

    if(shipping2 == "true"){
        request_url += "&itemFilter(" + cnt + ").name=FreeShippingOnly&itemFilter(" + cnt + ").value=true";
        cnt += 1;
    }
    if(shipping1 == "true"){
        request_url += "&itemFilter(" + cnt + ").name=LocalPickupOnly&itemFilter(" + cnt + ").value=true";
        cnt += 1;
    }
    request_url += "&itemFilter(" + cnt + ").name=HideDuplicateItems&itemFilter(" + cnt + ").value=true";
    cnt += 1;

    if(cond1 == "true" || cond2 == "true" || cond3 == "true"){
        request_url += "&itemFilter(" + cnt + ").name=Condition";
    }
    if(cond1 == "true"){
        request_url += "&itemFilter(" + cnt + ").value(" + cond_count + ")=New";
        cond_count += 1;
    }
    if(cond2 == "true"){
        request_url += "&itemFilter(" + cnt + ").value(" + cond_count + ")=Used";
        cond_count += 1;
    }
    if(cond3 == "true"){
        request_url += "&itemFilter(" + cnt + ").value(" + cond_count + ")=Unspecified";
        cond_count += 1;
    }

    console.log(request_url);

    request(request_url, function (err, response, body) {
        if (!err && response.statusCode == 200) {
            res.json(response);
        }
        else{
            console.log(err);
        }
    })
});

// Retrieve a single item's information.
app.get("/showDetail", function(req, res) {
    res.setHeader('Content-Type', "application/json");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var query = req.query;
    var itemId = query.itemId;

    var request_url = "http://open.api.ebay.com/shopping?callname=GetSingleItem&responseencoding=JSON&appid=" + appid + 
    "&siteid=0&version=967&ItemID=" + itemId + "&IncludeSelector=Description,Details,ItemSpecifics";

    console.log(request_url);

    request(request_url, function (err, response, body) {
        if (!err && response.statusCode == 200) {
            res.json(response);
        }
        else{
            console.log(err);
        }
    })
});

// Retrieve single item's photo.
app.get("/showPhoto", function(req, res) {
    res.setHeader('Content-Type', "application/json");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var query = req.query;
    var title = query.title;

    var request_url = "https://www.googleapis.com/customsearch/v1?q=" + title + "&cx=" + search_engine_id + 
    "&imgSize=huge&imgType=news&num=8&searchType=image&key=" + search_api_key;
    request_url = encodeURI(request_url);
    console.log(request_url);

    request(request_url, function (err, response, body) {
        if (!err && response.statusCode == 200) {
            res.json(response);
        }
        else{
            console.log(err);
        }
    })
});

// Retrieve similar items.
app.get("/showSimilar", function(req, res) {
    res.setHeader('Content-Type', "application/json");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var query = req.query;
    var itemId = query.itemId;

    var request_url = "http://svcs.ebay.com/MerchandisingService?OPERATION-NAME=getSimilarItems&SERVICE-NAME=MerchandisingService&SERVICE-VERSION=1.1.0" + 
    "&CONSUMER-ID=" + appid + "&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD&itemId=" + itemId + "&maxResults=20";
    
    console.log(request_url);

    request(request_url, function (err, response, body) {
        if (!err && response.statusCode == 200) {
            res.json(response);
        }
        else{
            console.log(err);
        }
    })
});

// Retrieve Autocompleted zip code
app.get("/getZip", function(req, res) {
    res.setHeader('Content-Type', "application/json");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var query = req.query;
    var zipcode = query.zipcode;

    var request_url = "http://api.geonames.org/postalCodeSearchJSON?postalcode_startsWith=" + zipcode + "&username=haoxinwa&country=US&maxRows=5"
    
    console.log(request_url);

    request(request_url, function (err, response, body) {
        if (!err && response.statusCode == 200) {
            res.json(response);
        }
        else{
            console.log(err);
        }
    })
});

app.listen(8081);
