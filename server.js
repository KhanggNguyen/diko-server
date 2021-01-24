const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const cheerio = require("cheerio");
const {
  requestToGetBodyAsync,
  getRelationsAsync,
  getWordsFromMongoDB,
} = require("./utils");
const {
  parserURL,
  parserSpace,
  parserWordsList,
  parserWordsListMongoDB,
  parserWordToList
} = require("./parser");

require("./utils");
require("dotenv").config(); //process.env.

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

const MongoClient = require("mongodb").MongoClient;
const uri = process.env.MONGOLAB_URI;
const client = new MongoClient(
  uri,
  { useUnifiedTopology: true },
  { useNewUrlParser: true },
  { connectTimeoutMS: 30000 },
  { keepAlive: 1 }
);

client.connect();

app.get("/definition/:mot/:rel?", async (req, res) => {
  let mot = req.params.mot;
  let rel = req.params.rel;
  let url = parserURL(mot, rel);
  console.log("/definition/" + mot + "/" + rel);
  let array_relation = [],
    array_entite = [],
    array_relation_type = [];

  let body = await requestToGetBodyAsync(url);
  let $ = cheerio.load(body);
  let code = $("code");
  let def = $("def");
  let array_string = code.text().split("\n");

  for (i = 0; i < array_string.length; i++) {
    array_temp = array_string[i].split(";");

    if (array_temp[0] == "e") {
      //e;eid;'name';type;w;'formated name'
      array_entite.push(array_temp);
    }

    if (array_temp[0] == "r") {
      //r;rid;node1;node2;type;w
      array_relation.push(array_temp);
    }

    if (array_temp[0] == "rt") {
      //rt;rtid;'trname';'trgpname';'rthelp'
      array_relation_type.push(array_temp);
    }
  }
  await getRelationsAsync(
    array_relation,
    array_entite,
    array_relation_type,
    mot
  ).then((resultat) => {
    let data = resultat;
    data["definition"] = { def: def.text().trim().normalize() };
    res.send(resultat);
  });
});

app.get("/list", async (req, res) => {
  console.log("/list?mot=" + req.query.mot);
  words = [];
  if (req.query.mot && req.query.mot.includes("#")) {
    
    words = await parserWordsListMongoDB(req.query.mot, client);
    res.send(words);
  } else {
    return res
      .status(400)
      .json({ status: 400, message: "Parameters must contain #" });
  }
});

app.get("/list/refinement", async (req, res) => {
  let mot = req.query.mot;
  let rel = req.query.rel;
  let url = parserURL(mot, rel);
  console.log("/list/refinement?mot="+mot+"&rel="+rel);
  let body = await requestToGetBodyAsync(url);
  let $ = cheerio.load(body);
  let code = $("code");
  let array_string = code.text().split("\n");

  let array_relation = [],
    array_entite = [],
    array_relation_type = [];

  for (i = 0; i < array_string.length; i++) {
    array_temp = array_string[i].split(";");
    if(array_temp[0] == "e"){
      //e;eid;'name';type;w;'formated name'
      array_entite.push(array_temp);
    }

    if (array_temp[0] == "r") {
      //r;rid;node1;node2;type;w
      array_relation.push(array_temp);
    }

    if (array_temp[0] == "rt") {
      //rt;rtid;'trname';'trgpname';'rthelp'
      array_relation_type.push(array_temp);
    }
    
  }

  await getRelationsAsync(
    array_relation,
    array_entite,
    array_relation_type,
    mot
  ).then((resultat) => {
    res.send(resultat);
    console.log("renvoyé resultat");
  });
  
  
});

app.get("/search", async (req, res) => {
  let searchValue = req.query.searchValue;
  console.log(searchValue);
  let words = [];
  if (searchValue) {
    words = await getWordsFromMongoDB(searchValue, client);
  }
  if (words.length > 0) {
    console.log(words.length);
    res.send(words);
  } else {
    return res.status(404).json({
      status: 404,
      message: "Impossible de se connecter à la base de données",
    });
  }
});

let port = process.env.PORT || 8000;
let host = process.env.HOST;

app.listen(port, host, () => {
  console.log(`Le serveur demarre sur ${host}:${port}`);
});
