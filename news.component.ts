import { Component, OnInit, Directive } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit {
  //base_url = "http://csci571-haoxinwa-hw8.us-west-1.elasticbeanstalk.com/";
  //base_url = "http://localhost:8081/";
  base_url = '';
  isLeftVisible = true; // For sliding
  myControl: FormControl;
  tab1_show = false;
  tab2_show = false;
  p: number = 1;
  has_submit = false;
  wishlist_show = false;
  show_progress_bar = false;
  
  zipcode_options = []

  resultOrWishList = "Result";

  info = {
    keyword: '',
    category_list: ['All categories', 'Art', 'Baby', 'Books', 
                'Clothing, Shoes & Accessories', 'Computers/Tablets & Networking', 'Health & Beauty', 'Music', 'Video Games & Consoles'],
    category: 'All categories',
    conditions: [false, false, false],
    shippings: [false, false],
    mile: '',
    from: 'cur',
    zipcode: '',
    id: ""
  }

  itemShow = "Product";
  keyword_change = false;
  zipcode_change = false;

  tab1_data = [];
  item_product = {};

  photos_url = [];
  shipping_info = {};
  seller_info = {};
  similar_info = [];
  old_similar_info = [];
  cur_id = "";
  fb_src = "";
  no_record_tab1 = false;
  no_record_similar = false;
  no_record_photo = false;
  show_more = "Show More";

  sortBy = "Default";
  sortBy_list = ["Default", "Product Name", "Days Left", "Price", "Shipping Cost"];
  sort_flag = "Ascending";
  sort_flag_list = ["Ascending", "Descending"];
  seller_star_color = ["yellow", "blue", "turquoise", "purple", "red", "green"];

  wish_list = [];
  pictureUrls = [];
  isMobile = false;
  click_from = 'result';
  tab1_and_tab2 = false;

  constructor(private http: HttpClient) {
    if(localStorage.getItem("wish_list") != null){
      var arr: Array<string> = localStorage.getItem("wish_list").split('^');
      this.wish_list = [];
      for(var i=0; i < arr.length; i++){
        try{
          this.wish_list.push(JSON.parse(arr[i]));
        }
        catch(err){
          break;
        }
      }
    }
    this.myControl = new FormControl();
    this.myControl.valueChanges.subscribe(newValue=>{
      this.filterZip(newValue);
    })

    this.isMobile = this.detectmob();
    
   }

  ngOnInit() {
  }

  detectmob() {
    if(window.innerWidth <= 800) {
      return true;
    } else {
      return false;
    }
 }

  isValidZip(){
    var zip:string = this.info.zipcode;
    const pattern = new RegExp(/^\d{5}(?:\d{2})?$/)
    if(zip.length == 5){
      if(zip.match(pattern))
        return true;
    }
    return false;
  }

  disable_check(){
    if((this.isValidZip() == false && this.info.from == "use_zip") || this.info.keyword.length == 0)
      return true;
    return false;
  }

  filterZip(search: string) {
    var l = search.length;
    if(l > 5 || l < 3){
      this.zipcode_options = [];
      return;
    }
    var arr = [];
    var request_url = this.base_url + "getZip?zipcode=" + search;
    this.http.get(request_url).subscribe(
      (data) => {
        try{
          data = JSON.parse(data["body"]);
          for(var i=0; i < 5; i++){
            arr.push(data["postalCodes"][i]["postalCode"]);
          }
        }
        catch{
          arr = [];
        }
      },
      (err) => {
        arr = [];
      }
    );
    this.zipcode_options = arr;
  }

  load_progress_bar(){
    this.show_progress_bar = true;
    setTimeout(() => {
      this.show_progress_bar = false;
    }, 1000);
  }

  zipcodeDisabled(): boolean {
    if(this.info.from == 'cur')
      return true;
    return null;
  }

  onSubmit() {
    // Server runs on 8888 port.
    this.load_progress_bar();
    this.has_submit = true;
    this.tab1_and_tab2 = true;
    var request_url = this.base_url + "showTab1?";
    request_url += "keyword=" + this.info.keyword.split(" ").join("%2B");

    var cate2id = {'All categories': 0, 'Art': '550', 'Baby': '2984', 'Books': '267', 
    'Clothing, Shoes & Accessories': '11450', 'Computers/Tablets & Networking': '58058', 'Health & Beauty': '26395', 'Music': '11233', 'Video Games & Consoles': '1249'};
    request_url += "&categoryId=" + cate2id[this.info.category];

    request_url += "&cond1=" + this.info.conditions[0] + "&cond2=" + this.info.conditions[1] + "&cond3=" + this.info.conditions[2];
    request_url += "&shipping1=" + this.info.shippings[0] + "&shipping2=" + this.info.shippings[1];

    var mile = this.info.mile;
    if(mile == '')
      mile = '10';
    request_url += "&mile=" + mile;

    if(this.info.from == "cur"){
      // Use IP API here.
      this.http.get("http://ip-api.com/json").subscribe(
        (data_ip) => {
          request_url += "&zipcode=" + data_ip["zip"];
          this.http.get(request_url).subscribe(
            (data) => {
              this.showTable(JSON.parse(data["body"]));
            }, //For Success Response
            (err) => {
              console.error(err);
            } //For Error Response
          );
        },
        (err) => {
          request_url += "&zipcode=90007";
          this.http.get(request_url).subscribe(
            (data) => {
              this.showTable(JSON.parse(data["body"]));
            }, //For Success Response
            (err) => {
              console.error(err);
            } //For Error Response
          );
        }
      );
    }
    else{
      request_url += "&zipcode=" + this.info.zipcode;
      this.http.get(request_url).subscribe(
          (data) => {
            this.showTable(JSON.parse(data["body"]));
          }, //For Success Response
          (err) => {
            console.error(err);
          } //For Error Response
      );
    }
  }

  changeFB() {
    var fb_quote = "Buy " + this.item_product["title"] + " at " + this.item_product["price"] + " from link below";
    fb_quote = encodeURI(fb_quote.split('&').join('')) // Get rid of &
    this.fb_src = "https://www.facebook.com/dialog/share?app_id=184484190795&channel_url=https%3A%2F%2Fstaticxx.facebook.com%2Fconnect%2Fxd_arbiter%2Fr%2Fd_vbiawPdxB.js%3Fversion%3D44%23cb%3Df11de2fb7abea48%26domain%3Dwww.fbrell.com%26origin%3Dhttp%253A%252F%252Fwww.fbrell.com%252Ff293e4de6c31828%26relation%3Dopener&display=popup&e2e=%7B%7D&fallback_redirect_uri=http%3A%2F%2Fwww.fbrell.com%2Fsaved%2F809b6c409f3c8dd307023cd78cdb6111&href=" + this.item_product["viewItemUrl"] + 
    "&locale=en_US&mobile_iframe=true&next=https%3A%2F%2Fstaticxx.facebook.com%2Fconnect%2Fxd_arbiter%2Fr%2Fd_vbiawPdxB.js%3Fversion%3D44%23cb%3Df393279322d1074%26domain%3Dwww.fbrell.com%26origin%3Dhttp%253A%252F%252Fwww.fbrell.com%252Ff293e4de6c31828%26relation%3Dopener%26frame%3Df3339a6abe8ad4%26result%3D%2522xxRESULTTOKENxx%2522&quote=" + fb_quote + "&sdk=joey";
    console.log(this.fb_src)
  }

  showProduct(data) {
    var title = data["Item"]["Title"];
    var subtitle = data["Item"]["Subtitle"];
    var price = '$' + data["Item"]["CurrentPrice"]["Value"];
    var location = data["Item"]["Location"];
    var policy = data["Item"]["ReturnPolicy"]["ReturnsAccepted"] + " Within " + data["Item"]["ReturnPolicy"]["ReturnsWithin"];
    this.pictureUrls = data["Item"]["PictureURL"];

    var itemSpecific = [];
    try{
      var nameval_list = data["Item"]["ItemSpecifics"]["NameValueList"];
    }
    catch(err) {
      nameval_list = null;
    }
    if(nameval_list != null){
      for (var i = 0; i < nameval_list.length; i++) {
        var each_obj = nameval_list[i];
        itemSpecific.push({name: each_obj["Name"], value: each_obj["Value"][0]})
      }
    }

    // For more seller information.
    var feedbackScore;
    try{
      feedbackScore = data["Item"]["Seller"]["FeedbackScore"];
    }
    catch(err){
      feedbackScore = null;
    }
    var popularity;
    try{
      popularity = data["Item"]["Seller"]["PositiveFeedbackPercent"];
    }
    catch(err){
      popularity = null;
    }
    var star;
    try{
      star = data["Item"]["Seller"]["FeedbackRatingStar"];
    }
    catch(err){
      star = null;
    }
    var topRated = data["Item"]["Seller"]["TopRatedSeller"];
    var storeName;
    try{
      storeName = data["Item"]["Storefront"]["StoreName"];
    }
    catch(err){
      storeName = null;
    }
    var storeUrl;
    try{
      storeUrl = data["Item"]["Storefront"]["StoreURL"];
    }
    catch(err){
      storeUrl = null;
    }

    this.item_product = {title: title, subtitle: subtitle, price: price, location: location, policy: policy, itemSpecific: itemSpecific, viewItemUrl: data["Item"]["ViewItemURLForNaturalSearch"],
                        feedbackScore: feedbackScore, popularity: popularity, star: star, topRated: topRated, storeName: storeName, storeUrl: storeUrl};
  }

  showPhotos() {
    var title = this.item_product["title"].split(" ").join("%2B");
    var request_url = this.base_url + "showPhoto?title=" + title;
    this.http.get(request_url).subscribe(
      (data) => {
        var result = JSON.parse(data["body"]);
        if(result['items'] == null || result['items'].length == 0){
          // No records for photos.
          this.no_record_photo = true;
          return;
        }
        this.no_record_photo = false;
        for(var i=0; i < result['items'].length; i++){
          this.photos_url.push(result['items'][i]["link"]);
        }
      }, //For Success Response
      (err) => {
        console.error(err);
        this.no_record_photo = true;
      } //For Error Response
    );
  }

  showShipping() {
    for(var i=0; i < this.tab1_data.length; i++){
      if(this.tab1_data[i].id == this.cur_id){
        this.shipping_info = {};
        this.shipping_info["cost"] = this.tab1_data[i].shipping;
        this.shipping_info["shipping_loc"] = this.tab1_data[i].shipping_loc;
        this.shipping_info["handle"] = this.tab1_data[i].handle;
        this.shipping_info["expedited"] = this.tab1_data[i].expedited;
        this.shipping_info["oneday"] = this.tab1_data[i].oneday;
        this.shipping_info["returnAcc"] = this.tab1_data[i].returnAcc;
        break;
      }
    }
  }

  showSeller() {
    this.seller_info = {};
    this.seller_info["score"] = this.item_product["feedbackScore"];
    this.seller_info["popularity"] = this.item_product["popularity"];
    this.seller_info["star"] = this.item_product["star"];
    this.seller_info["topRated"] = this.item_product["topRated"];
    this.seller_info["storeName"] = this.item_product["storeName"];
    this.seller_info["storeUrl"] = this.item_product["storeUrl"];
    for(var i=0; i < this.tab1_data.length; i++){
      if(this.tab1_data[i].id == this.cur_id){
        this.seller_info["sellerUserName"] = this.tab1_data[i].seller;
        break;
      }
    }
  }

  showSimilarProducts() {
    var request_url = this.base_url + "showSimilar?itemId=" + this.cur_id;
    this.http.get(request_url).subscribe(
      (data) => {
        var result = JSON.parse(data["body"]);
        var arr = result["getSimilarItemsResponse"]["itemRecommendations"]["item"];
        if(arr == null || arr.length == 0){
          this.no_record_similar = true;
          return;
        }
        for(var i=0; i < arr.length; i++) {
          var each_obj = arr[i];
          var name = each_obj["title"];
          var price = '$' + each_obj["buyItNowPrice"]["__value__"];
          var shippingCost = '$' + each_obj["shippingCost"]["__value__"];
          var s:string = each_obj["timeLeft"];
          var timeleft = s.substring(s.indexOf('P') + 1, s.indexOf('D'));
          var img_url = each_obj["imageURL"];
          var view_url = each_obj["viewItemURL"]
          this.similar_info.push({name: name, price: price, shippingCost: shippingCost, timeleft: timeleft, img_url: img_url, view_url: view_url});
          this.old_similar_info.push({name: name, price: price, shippingCost: shippingCost, timeleft: timeleft, img_url: img_url, view_url: view_url});
        }
      }, //For Success Response
      (err) => {
        this.no_record_similar = true;
        console.error(err);
      } //For Error Response
    );
  }

  clickDetail() {
    // User clicks detail button.
    this.load_progress_bar();
    this.tab1_show = false;
    this.wishlist_show = false;
    if(this.tab1_and_tab2){ // Click from result tab.
      this.click_from = "result";
    }
    else{
      this.click_from = "wishlist";
    }
    this.tab1_and_tab2 = true;
    this.tab2_show = true;
    this.has_submit = true;
    this.isLeftVisible = !this.isLeftVisible;
  }

  goBack(){
    // Go back from table2 to table1/wishlist.
    this.load_progress_bar();
    this.tab2_show = false;
    if(this.tab1_data.length != 0)
      this.tab1_show = true;
    if(this.click_from == "result"){
      this.tab1_and_tab2 = true;
    }
    else{
      this.wishlist_show = true;
      this.tab1_and_tab2 = false;
    }
    this.isLeftVisible = !this.isLeftVisible; 
  }

  showItem(itemId) {
    this.load_progress_bar()
    this.cur_id = itemId;
    this.isLeftVisible = !this.isLeftVisible;
    this.tab1_show = false;
    this.wishlist_show = false;
    if(this.tab1_and_tab2){ // Click from result tab.
      this.click_from = "result";
    }
    else{
      this.click_from = "wishlist";
    }
    this.has_submit = true;
    this.tab1_and_tab2 = true;
    this.tab2_show = true;
    // 从wishlist里点进去会有问题，还没做
    var request_url = this.base_url + "showDetail?itemId=" + itemId;
    this.http.get(request_url).subscribe(
      (data) => {
        var result = JSON.parse(data["body"]);
        this.showProduct(result);
        this.showPhotos();
        this.showShipping();
        this.showSeller();
        this.showSimilarProducts();
        this.changeFB();
      }, //For Success Response
      (err) => {
        console.error(err);
      } //For Error Response
    );

  }

  showTable(data) {
    this.has_submit = true;
    this.tab2_show = false;
    this.tab1_show = true;
    this.isLeftVisible = true;
    this.tab1_data = [];
    data = data["findItemsAdvancedResponse"][0]["searchResult"][0]["item"];
    if(data == null){
      // 这里需要判断data是否为空
      this.no_record_tab1 = true;
      return;
    }
    
    for(var i=0; i < data.length; i++){
      var row_obj = data[i];
      var image = row_obj["galleryURL"][0];
      var title_text = "";
      var whole_title = row_obj['title'][0];
      try{
        title_text = row_obj['title'][0];
        if(title_text.length > 35) {
          if(title_text[34] != ''){
            title_text = title_text.substring(0, title_text.substring(0, 34).lastIndexOf(' '));
          }
          title_text += "...";
        }
      }
      catch(e) {
        title_text = null;
      }
      var price;
      try{
        price = '$' + row_obj["sellingStatus"][0]["currentPrice"][0]["__value__"];
      }
      catch(e) {
        price = null;
      }

      var shipping;
      try {
        shipping = "$" + row_obj["shippingInfo"][0]["shippingServiceCost"][0]["__value__"];
        if (shipping == "$0.0" || shipping == "$0")
          shipping = "Free Shipping";
      }
      catch (err) {
        shipping = null;
      }
      var zipcode;
      try {
        zipcode = row_obj["postalCode"][0];
      }
      catch (err) {
        zipcode = null;
      }
      var seller;
      try{
        seller = row_obj["sellerInfo"][0]["sellerUserName"][0];
      }
      catch(err) {
        seller = null;
      }
      
      // For More Shipping Info.
      var shipping_loc;
      try{
        shipping_loc = row_obj["shippingInfo"][0]["shipToLocations"][0]
      }
      catch(err) {
        shipping_loc = null;
      }
      var handle;
      try{
        handle = row_obj["shippingInfo"][0]["handlingTime"][0];
        if(handle == '1' || handle == '0'){
          handle += " Day";
        }
        else{
          handle += " Days";
        }
      }
      catch(err) {
        handle = null;
      }
      var expedited;
      try{
        expedited = row_obj["shippingInfo"][0]["expeditedShipping"][0];
      }
      catch(err) {
        expedited = null;
      }
      var oneday;
      try{
        oneday = row_obj["shippingInfo"][0]["oneDayShippingAvailable"][0];
      }
      catch(err) {
        oneday = null;
      }
      var returnAcc;
      try{
        returnAcc = row_obj["returnsAccepted"][0];
      }
      catch(err) {
        returnAcc = null;
      }

      this.tab1_data.push({image: image, title: title_text, price: price, shipping: shipping, zipcode: zipcode, seller: seller, id: row_obj['itemId'][0],
                          shipping_loc: shipping_loc, handle: handle, expedited: expedited, oneday: oneday, returnAcc: returnAcc, whole_title: whole_title});
    }

  }

  sortBy_change() {
    //{name: name, price: price, shippingCost: shippingCost, timeleft: timeleft, img_url: img_url, view_url: view_url}
    if(this.sortBy == "Default"){
      this.similar_info = [];
      for(var i=0; i < this.old_similar_info.length; i++){
        this.similar_info.push(this.old_similar_info[i]);
      }
    }
    else if(this.sortBy == "Product Name"){
      this.similar_info = this.similar_info.sort((n1, n2) => {
        if(n1.name <= n2.name){
          return -1;
        }
        return 1;
      });
      if(this.sort_flag == "Descending")
      this.similar_info.reverse();
    }
    else if(this.sortBy == "Days Left"){
      this.similar_info = this.similar_info.sort((n1, n2) => {
        if(n1.timeleft <= n2.timeleft){
          return -1;
        }
        return 1;
      });
      if(this.sort_flag == "Descending")
      this.similar_info.reverse();
    }
    else if(this.sortBy == "Price"){
      this.similar_info = this.similar_info.sort((n1, n2) => {
        if(n1.price <= n2.price){
          return -1;
        }
        return 1;
      });
      if(this.sort_flag == "Descending")
      this.similar_info.reverse();
    }
    else if(this.sortBy == "Shipping Cost"){
      this.similar_info = this.similar_info.sort((n1, n2) => {
        if(n1.shippingCost <= n2.shippingCost){
          return -1;
        }
        return 1;
      });
      if(this.sort_flag == "Descending")
      this.similar_info.reverse();
    }
  }
  sort_flag_change() {
    this.similar_info.reverse();
  }

  changeWishList(cur_id) {
    console.log(cur_id);
    if(this.existInWishList(cur_id)){
      for(var i=0; i < this.wish_list.length; i++){
        if(this.wish_list[i].id == cur_id){
          this.wish_list.splice(i, 1);
          break;
        }
      }
      var tmp = [];
      for(var i=0; i < this.wish_list.length; i++){
        tmp.push(JSON.stringify(this.wish_list[i]));
      }
      if(tmp.length == 0){
        localStorage.removeItem("wish_list");
      }
      else{
        localStorage.setItem("wish_list", tmp.join('^'));
      }
    }
    else{
      // this.item_product = {title: title, subtitle: subtitle, price: price, location: location, policy: policy, itemSpecific: itemSpecific, viewItemUrl: data["Item"]["ViewItemURLForNaturalSearch"]};
      for(var i=0; i < this.tab1_data.length; i++){
        if(this.tab1_data[i].id == cur_id){
          var row_obj = this.tab1_data[i];
          var cur = {id: cur_id, price: row_obj['price'], title: row_obj['title'], shipping: row_obj["shipping"], seller: row_obj['seller'], imgUrl: row_obj['image'], whole_title: row_obj['whole_title']};
          if(localStorage.getItem("wish_list") === null){
            this.wish_list = [];
          }
          else{
            var arr = localStorage.getItem("wish_list").split('^');
            this.wish_list = [];
            for(var i=0; i < arr.length; i++){
              try{
                this.wish_list.push(JSON.parse(arr[i]));
              }
              catch(err){

              }
            }
          }
          this.wish_list.push(cur);

          var tmp = [];
          for(var i=0; i < this.wish_list.length; i++){
            tmp.push(JSON.stringify(this.wish_list[i]));
          }
          localStorage.setItem("wish_list", tmp.join('^'));
          break;
        }
      }
    }
  }
  existInWishList(cur_id) {
    for(var i=0; i < this.wish_list.length; i++){
      if(this.wish_list[i].id == cur_id){
        return true;
      }
    }
    return false;
  }

  clearWishList() {
    localStorage.removeItem('wish_list');
    this.wish_list = [];
  }
  
  clearAll() {
    this.show_progress_bar = false;
    this.tab1_show = false;
    this.tab2_show = false;
    this.p = 1;
    this.has_submit = false;
    this.wishlist_show = false;
    this.zipcode_options = []
  
    this.resultOrWishList = "Result";

    this.info = {
      keyword: '',
      category_list: ['All categories', 'Art', 'Baby', 'Books', 
                  'Clothing, Shoes & Accessories', 'Computers/Tablets & Networking', 'Health & Beauty', 'Music', 'Video Games & Consoles'],
      category: 'All categories',
      conditions: [false, false, false],
      shippings: [false, false],
      mile: '',
      from: 'cur',
      zipcode: '',
      id: ""
    }
  
    this.itemShow = "Product";
    this.keyword_change = false;
    this.zipcode_change = false;
  
    this.tab1_data = [];
    this.item_product = {};
  
    this.photos_url = [];
    this.shipping_info = {};
    this.seller_info = {};
    this.similar_info = [];
    this.old_similar_info = [];
    this.cur_id = "";
    this.fb_src = "";
    this.no_record_tab1 = false;
    this.no_record_similar = false;
    this.no_record_photo = false;
  
    this.sortBy = "Default";
    this.sortBy_list = ["Default", "Product Name", "Days Left", "Price", "Shipping Cost"];
    this.sort_flag = "Ascending";
    this.sort_flag_list = ["Ascending", "Descending"];
    this.seller_star_color = ["yellow", "blue", "turquoise", "purple", "red", "green"];
    this.show_more = "Show More";
    this.pictureUrls = [];
    this.isLeftVisible = true;
    this.isMobile = false;
    this.click_from = 'result';
    this.tab1_and_tab2 = false;
  }
}

