$(document).ready(function(){

  searchAndPrint("hot","2","pics");

  $("#button").click(function() {
    loadPage();
  });
  $("#filter").change(function() {
    loadPage();
  });
  $("#resolutions").change(function() {
    loadPage();
  });
  $("#subreddit").keypress(function(e) {
    if(e.which==13){
        loadPage();
        return false;
    }
  });
});

function loadPage(){
  $(".images").empty();
  resolutions = $("#resolutions").val();
  filter = $("#filter").val();
  subreddit = $("#subreddit").val();
  searchAndPrint(filter,resolutions, subreddit);
  scrollToAnchor('anchor');
}
function scrollToAnchor(aid){
  var aTag = $("a[id='"+ aid +"']");
  $('html,body').animate({scrollTop: aTag.offset().top},'slow');
};
function searchAndPrint(filter,resolutions, subreddit){
  if(subreddit !=""){
    redditUrl = "https://www.reddit.com/r/"+subreddit+"/"+filter+"/.json?limit=100";
  }
  else{
    redditUrl = "https://www.reddit.com/r/pics/"+filter+"/.json?limit=100";
  }
  $.ajax({
    url: redditUrl,
    dataType: "json",
    error: function(){
      $("#subreddit").val("This subReddit doesn't exist :S");
    },
    jsonp: 'jsonp',
    success: function(data) {
      printPics(data,resolutions);
    }
  });
};
function printPics(data,resolutions){
  option = resolutions;
  for(i = 0;i<100;i++){
    if((typeof data.data.children[i].data.preview != "undefined")&&(typeof data.data.children[i].data.preview.images[0].resolutions[option] != "undefined")){
      preview = data.data.children[i].data.preview;
      image = data.data.children[i].data.preview.images[0].resolutions[option];
      title = data.data.children[i].data.title;
      $(".images").append("<div class='tourImg'><div class='image imgSizeLon"+option+" imgSizeLar"+option+"' id='img" + i+"'><a href='"+image.url+"'><img class='imgSizeLon"+option+ "' src='"+image.url+"' alt='"+title+"'/></a></div><span>"+title+"</span></div>");
    }
  }
};
