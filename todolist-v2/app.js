//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://ecn32:test@cluster0.mkknvn7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/todolistDB");

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<--- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}).then(function (foundItems) {
    if(foundItems.length == 0){
      Item.insertMany(defaultItems).then(function () {
        console.log("Successfully saved default items to DB");
      })
      .catch(function (err) {
        console.log(err);
      });
      res.redirect("/");
    }
    else{
    res.render("list", {listTitle: "Today", newListItems: foundItems});      
    }

  });

});

app.get("/:customListName", function(req,res)
{
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}).then(function(foundList) {
    if (!foundList) 
    {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);

    } else 
    {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }).catch(function(err) {
    console.log(err);
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  // server catches the post request from the input request, and checks to see if the list where the user is trying to add the item to is "Today"
  if (listName === "Today"){
    item.save();
    res.redirect("/");
  }
  // otherwise it finds the custom lists and adds the item, then redirects back to the custom list
  // this way lists are kept separated and items stay where they are meant to be
  else 
  {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(item);
        foundList.save()
        res.redirect("/" + listName);
      }).catch((err) => 
      {
            console.log(err);
      });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndDelete(checkedItemId).then(function(){
      console.log("Successfully deleted checked item.");
      res.redirect("/");
    })
    .catch(function (err) {
      console.log(err);
    });    
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function(){
      res.redirect("/" + listName);
    })
    .catch(function(err){
      console.log(err);
    })
  } 

});

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started.");
});
