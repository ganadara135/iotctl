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
//  app.post('/login/:IDname',jsonParser, function(req, res){
app.post('/login',urlencodedParser, function(req, res){
//  app.post('/login',urlencodedParser, function(req, res){
      var sess = req.session;

      if (!req.body)
        console.log("bodyParser is not working!!!!");


      console.log("req.body  : ", req.body);

      fs.readFile(__dirname + "/../data/user.json", "utf8", function(err, data){
          var users = JSON.parse(data);
          var IDname = req.body.IDname;
          var password = req.body.password;
          var result = {};
          if(!users[IDname]){
              // USERNAME NOT FOUND
              result["success"] = 0;
              result["error"] = "ID incorrect";
              res.json(result);
              return;
          }

          if(users[IDname]["password"] == password){
              result["success"] = 1;
              result["IDname"]= "Successfully login";

              var tenMinute = 60000 * 10;
              // expires 는 쿠키생존기간 설정변수
              req.session.cookie.expires = new Date(Date.now() + tenMinute);
              //maxAge 는 expires 설정후 지난 시간을 나타냄
              req.session.cookie.maxAge = tenMinute;
      //        sess.IDname = users[IDname]["IDname"];
              res.json(result);
/*                res.redirect('choice', {
                  title: "MY HOMEPAGE",
                  length: 5,
                  IDname: req.body.IDname,
                  amount: 0
              })
*/
          }else{
              result["success"] = 0;
              result["error"] = "PW incorrect";
              res.json(result);
          }
      })
});

app.get('/logout', function(req, res){
      sess = req.session;
      if(sess.IDname){
          req.session.destroy(function(err){
              if(err){
                  console.log(err);
              }else{
                  res.redirect('/');
              }
          })
      }else{
          res.redirect('/');
      }
});

app.post('/createDeviceAddress',function(req,res){
      var sess = req.session;
      var IDofUser = req.body.username;

      var result = {};
      var iotDataFrom;

//      let addressMy, pubkeyMy, privkeyMy;

      // CHECK REQ VALIDITY
      if(!req.body.password || !req.body.username){
      //     if(!req.body["password"] || !req.body["name"]){
          result["success"] = 0;
          result["error"] = "invalid request";
          res.json(result);
          return;
      }

      // LOAD DATA & CHECK DUPLICATION
      fs.readFile( __dirname + "/../data/device.json", 'utf8',  function(err, data){
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
          users[IDofUser].secureGrade = "0";    // 보안등급 0- guest, 1 - 승인된 장치
          users[IDofUser].deviceManager = "8769uyjhmn";
//          users[IDofUser].iotPubkey = "pubx8769uyjhmn";
//          users[IDofUser].iotPubkey = "등록날짜";

//          iotDataFrom = users[IDofUser].iotAddress;


          // SAVE DATA
          fs.writeFile(__dirname + "/../data/device.json", JSON.stringify(users, null, '\t'), "utf8", function(err, data){
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

                // this.address1 = addrPubPri[0]["address"];
                // this.pubkey = addrPubPri[0]["pubkey"];
                // this.privkey = addrPubPri[0]["privkey"];

                result["address"] = addrPubPri[0]["address"];
                result["pubkey"] = addrPubPri[0]["pubkey"];
                result["privkey"] = addrPubPri[0]["privkey"];

                return multichain.importAddressPromise({
                  address: result["address"],
                  rescan: false
                })
            })
            .then(() => {
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

/*
  let confirmCallbackEnroll = (result_return,res) => {
      bluebird.bind(this)   // this is not working????
      .then(() => {

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
        result_return["dateOfenroll"] = new Buffer(Date.now().toString()).toString("hex");
        return multichain.createRawSendFromPromise({
              from: result_return["address"],
              to: {},
//              to: arrOfme,
              msg : [{"for":"BookingStream","key":"bookingTime","data":result_return["dateOfenroll"]}],
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
};
*/
app.post('/createUserAddress',function(req,res){
      var sess = req.session;
      var IDofUser = req.body.username;

      var result = {};
      var iotDataFrom;

//      let addressMy, pubkeyMy, privkeyMy;

      // CHECK REQ VALIDITY
      if(!req.body.password || !req.body.username){
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
          users[IDofUser].secureGrade = "0";    // 보안등급 0- guest, 1 - 직원, 2 - 관리자
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

                // this.address1 = addrPubPri[0]["address"];
                // this.pubkey = addrPubPri[0]["pubkey"];
                // this.privkey = addrPubPri[0]["privkey"];

                result["address"] = addrPubPri[0]["address"];
                result["pubkey"] = addrPubPri[0]["pubkey"];
                result["privkey"] = addrPubPri[0]["privkey"];

                return multichain.importAddressPromise({
                  address: result["address"],
                  rescan: false
                })
            })
            .then(() => {
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
        result_return["dateOfenroll"] = new Buffer(Date.now().toString()).toString("hex");
        return multichain.createRawSendFromPromise({
              from: result_return["address"],
              to: {},
//              to: arrOfme,
              msg : [{"for":"BookingStream","key":"bookingTime","data":result_return["dateOfenroll"]}],
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
//  app.post('/checkID/:username', function(req, res){
  app.post('/checkID', function(req, res){

     var result = {  };
     var IDname = req.body.username;

//     console.log("chk req.params   : ", req.params);
     console.log("chk req.body   : ", req.body);
     console.log("chk IDname   : ", IDname);

     // CHECK REQ VALIDITY
     if(!IDname){
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
    console.log("call main()");
    res.render('main');
  })
  app.get('/signup',function(req,res){   // 사용자 등록화면
    res.render('signup');
  })
  app.get('/devices',function(req,res){
    res.render('devices');
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
