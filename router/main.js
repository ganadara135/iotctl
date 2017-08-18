"use strict";


const connection = {
      port: 7206,     //rpc port
      host: '220.230.112.30',
      pass: "AxNpbxmkLN4Hey4AkV4VeC964ndGQMxmfizwH9Y56znT",
//      host: '127.0.0.1',
//      pass: "973MVcjrxbwyKdCWN6mMeCKUXZGRXgAFB4g4xr3PkcME"
      user: "multichainrpc"
}
const assert = require('assert');
const bluebird = require("bluebird");
const multichain = bluebird.promisifyAll(require("multichain-node")(connection), {suffix: "Promise"});


module.exports = function(app, fs, jsonParser, urlencodedParser, client_token_arg ,address_param )
{
  //console.log("this   : ", this);
//  console.log("thisVar   : ", thisVar);
//  const client = new chain.Client(address_param,client_token_arg);

//module.exports = require("multichain-node");

/*
let confirmCallbackForthis = () => {
    bluebird.bind(this)
    console.log(" confirmCallbackForthis   ==> ", this);
}
*/
// XMLHttpRequest communication
app.post('/createAddressPrivateKey/:IDname',function(req,res){
      var sess = req.session;
      var IDofUser = req.params.IDname;
      var result = {};
      var iotDataFrom;

//      let addressMy, pubkeyMy, privkeyMy;

      // CHECK REQ VALIDITY
      if(!req.body.password || !req.body.IDname){
      //     if(!req.body["password"] || !req.body["name"]){
          result["success"] = 0;
          result["error"] = "invalid request";
          res.json(result);
          return;
      }

      // LOAD DATA & CHECK DUPLICATION
      fs.readFile( __dirname + "/../data/user.json", 'utf8',  function(err, data){
          var users = JSON.parse(data);
          if(users[IDofUser]){
              // DUPLICATION FOUND
              result["success"] = 0;
              result["error"] = "duplicate";
              res.json(result);
              return;
          }
          // ADD TO DATA
          users[IDofUser] =  req.body;
          users[IDofUser].iotAddress = "8769uyjhmn";
          users[IDofUser].iotPubkey = "pubx8769uyjhmn";
          users[IDofUser].iotPubkey = "등록날짜";

//          iotDataFrom = users[IDofUser].iotAddress;


          // SAVE DATA
          fs.writeFile(__dirname + "/../data/user.json", JSON.stringify(users, null, '\t'), "utf8", function(err, data){
            if(err){
                throw err;
            }

//            confirmCallbackForthis.call(this);
            console.log("call createkeypairs()");
//        return multichain.validateAddressPromise({address: this.address1})
            multichain.createKeyPairsPromise()
            .then(addrPubPri => {
                assert(addrPubPri);
                console.log("addrPubPri : " , addrPubPri);
//                this = {};
                console.log("this  ===> ", this);
/*
                this.address1 = addrPubPri[0]["address"];
                this.pubkey = addrPubPri[0]["pubkey"];
                this.privkey = addrPubPri[0]["privkey"];
                */

                result["address"] = addrPubPri[0]["address"];
                result["pubkey"] = addrPubPri[0]["pubkey"];
                result["privkey"] = addrPubPri[0]["privkey"];

                return multichain.importAddressPromise({
                  address: result["address"],
                  rescan: false
                })
            })
            .then(() => {
    //            assert(privateKey)

                console.log("TEST: GRANT")
                return multichain.grantPromise({
                    addresses: result["address"],
//                    permissions: "send,receive,create"
                    permissions: "connect,send,receive,issue,mine,admin,activate,create"
                })
            })
            .then(txid => {
                listenForConfirmations(txid, (err, confirmed) => {
                    if(err){
                        throw err;
                    }
                    if(confirmed == true){
                        //confirmCallbackEnroll.call(result);
                        confirmCallbackEnroll(result,res);
                    }
                })
            })
          .catch(err => {
                console.log(err)
                throw err;
            })
          })   // fs.writeFile
      })  // fs.readFile
  });


  let listenForConfirmations = (txid, cb) => {
      console.log("WAITING FOR CONFIRMATIONS")
      var interval = setInterval(() => {
          getConfirmations(txid, (err, confirmations) => {
              if(confirmations > 0){
                  clearInterval(interval);
                  return cb(null, true);
              }
              return cb(null, false);
          })
      }, 5000)
  }

  let getConfirmations = (txid, cb) => {
      multichain.getWalletTransactionPromise({
          txid: txid
      }, (err, tx) => {
          if(err){
              console.log("look for confirmed state", err)
              return cb(err)
          }
          return cb(null, tx.confirmations);
      })
  }


  let confirmCallbackEnroll = (result_return,res) => {
      bluebird.bind(this)   // this is not working????
      .then(() => {

//  console.log("result_return : ", result_return)
//  console.log("result_return[address] : ", result_return["address"])
//  console.log("this : ", this)
  //console.log("this.addrPubPri[0]['address']  : ", this.addrPubPri[0]["address"]);
          console.log("TEST: LIST STREAMS")
          return multichain.listStreamsPromise({
            streams: "BookingStream"
          })
      })
      .then(stream => {
  //       console.log("stream : ", stream)
          assert.equal(stream.length, 1)

          console.log("TEST: SUBSCRIBE STREAM")
          return multichain.subscribePromise({
              stream: "BookingStream"
          })
      })
      .then(() => {
  //      console.log("subscribed  : ", subscribed);
        console.log("TEST: CRATE RAW SEND FROM");
//var objOfme = {};
//var arrOfme = [];
//arrOfme[0] = '{"for":"BookingStream","key":"bookingTime","data":"'+ new Buffer(Date.now().toString()).toString("hex")+'"}';
//arrOfme[0] = {"for":"BookingStream","key":"bookingTime","data":"5554584f732046545721"};
        return multichain.createRawSendFromPromise({
              from: result_return["address"],
              to: {},
//              to: arrOfme,
              msg : [{"for":"BookingStream","key":"bookingTime","data":new Buffer(Date.now().toString()).toString("hex")}],
//              msg : arrOfme,
//              action: "send"
            })
      })         // signrawtransaction [paste-hex-blob] '[]' '["privkey"]'
      .then(hexstringblob => {
          console.log("hexstringblob  : ", hexstringblob);

          assert(hexstringblob)

          return multichain.signRawTransactionPromise({
              hexstring: hexstringblob,
      //        parents: [],
              privatekeys: [result_return["privkey"]]
          })
      })      //  sendrawtransaction [paste-bigger-hex-blob]
      .then(hexvalue => {
          console.log("hexvalue.hex  : ", hexvalue.hex);

          assert(hexvalue)

          console.log("Finished Successfully")
          return multichain.sendRawTransactionPromise({
              hexstring: hexvalue.hex
          })
      })
      .then(tx_hex => {
          console.log("tx_hex  : ", tx_hex);

          assert(tx_hex)

          console.log("Finished Successfully");
          res.json(result_return);
      })
      .catch(err => {
          console.log(err)
          throw err;
      })
  }


  // XMLHttpRequest communication
  app.post('/checkID/:IDname', function(req, res){

     var result = {  };
     var IDname = req.params.IDname;


     // CHECK REQ VALIDITY
     if(!req.params.IDname){
  //     if(!req.body["password"] || !req.body["name"]){
         result["success"] = 0;
         result["error"] = "invalid request";
         res.json(result);
         return;
     }

     // LOAD DATA & CHECK DUPLICATION
     fs.readFile( __dirname + "/../data/user.json", 'utf8',  function(err, data){
         var users = JSON.parse(data);
         if(users[IDname]){
             // DUPLICATION FOUND
             result["success"] = 0;
             result["error"] = "duplicate";
         }else {
             result["success"] = 1;
         }
         res.json(result);
     })
  });

  app.get('/',urlencodedParser,function(req,res){
      var sess = req.session;

      res.render('index', {
          title: "인덱스화면",
          length: 5,
          IDname: sess.IDname
      })
  });

  app.get('/login',function(req,res){
    res.render('login');
  })
  app.get('/main',function(req,res){
    res.render('main');
  })
  app.get('/signup',function(req,res){
    res.render('signup');
  })
  app.get('/devices',function(req,res){
    res.render('devices');
  })
  app.get('/device_detail',function(req,res){
    res.render('device_detail');
  })
  app.get('/device_add',function(req,res){
    res.render('device_add');
  })
  app.get('/device_add2',function(req,res){
    res.render('device_add2');
  })
  app.get('/enroll/:lang',function(req,res){
      var sess = req.session;

//      console.log("xptmxmxm")

      res.render('enroll', {
          title: "Enrollment",
          length: 5,
          IDname: sess.IDname,
          lang: req.params.lang
      })
  });
}
