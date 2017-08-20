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
  app.post('/requestMyDeviceList',urlencodedParser, function(req, res){
    var sess = req.session;
    var userAddress = req.body.userAddress;
    var result = {};

    fs.readFile( __dirname + "/../data/device.json", 'utf8',  function(err, data){
        var devicesOf = JSON.parse(data);
        if(err){
            throw err;    // device가 하나도 없거나, 읽을때 에러 발생
        }
        fs.readFile( __dirname + "/../data/relationship.json", 'utf8',  function(err, data){
            var relationshipOf = JSON.parse(data);
            var x,y;

            if(err){
                throw err;   // relationship 이 하나도 없거나, 에러 발생시
            }
            for(x in devicesOf){
              for(y in relationshipOf){
                if(relationshipOf[y].userAddress == userAddress){
//                console.log(" relationshipOf[x].userAddress.   --> : ", relationshipOf[y].userAddress)
                  result[x] = devicesOf[x];
//                  result[x].myDevice = 1;   // 내 장치 임
                }
              }
            }
//          console.log("result  : ", result);
            res.json(result);
        })   // fs.readFile  relationship.json
      })// fs.readFile  device.json
});

app.post('/requestAllDeviceList',urlencodedParser, function(req, res){
  var sess = req.session;
  var userAddress = req.body.userAddress;
  var result = {};

  fs.readFile( __dirname + "/../data/device.json", 'utf8',  function(err, data){
      var devicesOf = JSON.parse(data);
      if(err){
          throw err;    // device가 하나도 없거나, 읽을때 에러 발생
      }
      fs.readFile( __dirname + "/../data/relationship.json", 'utf8',  function(err, data){
          var relationshipOf = JSON.parse(data);
          var x,y;

          if(err){
              throw err;   // relationship 이 하나도 없거나, 에러 발생시
          }
          for(x in devicesOf){
            result[x] = devicesOf[x];
            result[x].myDevice = 0;     // 내 장치가 아님
            for(y in relationshipOf){
              if(relationshipOf[y].userAddress == userAddress){
//                console.log(" relationshipOf[x].userAddress.   --> : ", relationshipOf[y].userAddress)
                result[x].myDevice = 1;   // 내 장치 임
              }
            }
          }
//          console.log("result  : ", result);
          res.json(result);
      })   // fs.readFile  relationship.json
    })// fs.readFile  device.json
});
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
      var deviceName = req.body.deviceName;
      var devicePurpose = req.body.devicePurpose;
      var deviceInputerAddress = req.body.deviceInputerAddress;

      var result = {};
      var resultOfrelation = {};

      // CHECK REQ VALIDITY
      if(!req.body.deviceName || !req.body.deviceInputerAddress){
      //     if(!req.body["password"] || !req.body["name"]){
          result["success"] = 0;
          result["error"] = "invalid request";
          res.json(result);
          return;
      }

      // LOAD DATA & CHECK DUPLICATION
      fs.readFile( __dirname + "/../data/device.json", 'utf8',  function(err, data){
          var devices = JSON.parse(data);

          if(devices[deviceName]){
              // DUPLICATION FOUND
              result["success"] = 0;
              result["error"] = "duplicate";
              res.json(result);
              return;
          }

          // LOAD DATA & CHECK DUPLICATION
          fs.readFile( __dirname + "/../data/relationship.json", 'utf8',  function(err, data){
              var relationshipOf = JSON.parse(data);

              if(err){
                  throw err;
              }

              console.log("call createkeypairs()");
    //        return multichain.validateAddressPromise({address: this.address1})
              multichain.createKeyPairsPromise()
              .then(addrPubPri => {
                assert(addrPubPri);
                console.log("addrPubPri : " , addrPubPri);
                console.log("this  ===> ", this);

                result["address"] = addrPubPri[0]["address"];
                result["pubkey"] = addrPubPri[0]["pubkey"];
                result["privkey"] = addrPubPri[0]["privkey"];

                // store device's info into IOT server  without privkey
                devices[deviceName] =  req.body;
//                users[deviceName].tele = "0";    // 보안등급    0 - 자체통신불가, 1 - 자체통신가능
                devices[deviceName].address = result["address"];
                devices[deviceName].pubkey = result["pubkey"];
                devices[deviceName].enrolledDate = Date.now();

                // relationshiop.json 은  장치관리자주소 + 장지주소 로 고유번호부여
                relationshipOf[deviceInputerAddress+result["address"]] = {"deviceAddress": result["address"],
                 "userAddress": deviceInputerAddress,
                 "enrolledDate": devices[deviceName].enrolledDate};

                // SAVE DATA
                fs.writeFile(__dirname + "/../data/device.json", JSON.stringify(devices, null, '\t'), "utf8", function(err, data){
                  if(err){
                      throw err;
                  }           // relationshiop.json 은  장치관리자주소 + 장지주소 로 고유번호부여
                  fs.writeFile(__dirname + "/../data/relationship.json", JSON.stringify(relationshipOf, null, '\t'), "utf8", function(err, data){
                    if(err){
                        throw err;
                    }
                  }) // fs.writeFile relationship.json
               })   // fs.writeFile device.json


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
            assert(txid)

            console.log("TEST: SUBSCRIBE STREAM")
            return multichain.subscribePromise({
                stream: "BookingStream"
            })
          })
          .then(() => {
          //      console.log("subscribed  : ", subscribed);
              console.log("TEST: CREATE RAW SEND FROM");
    //                result_return["dateOfenroll"] = new Buffer(Date.now().toString()).toString("hex");

              var textvall = new Buffer(JSON.stringify(devices[deviceName])).toString("hex")
              const buf222 = new Buffer(textvall, 'hex');
              console.log("buf222.toString()   :  ", buf222.toString());


              return multichain.createRawSendFromPromise({
                from: result["address"],
                to: {},
                msg : [{"for":"BookingStream","key":"bookingTime","data":new Buffer(JSON.stringify(devices[deviceName])).toString("hex")},
                      {"for":"BookingStream","key":"bookingTime","data":new Buffer(JSON.stringify( relationshipOf[deviceInputerAddress+result["address"]]  )).toString("hex")}],
          //              action: "send"
              })
          })         // signrawtransaction [paste-hex-blob] '[]' '["privkey"]'
          .then(hexstringblob => {
            console.log("hexstringblob  : ", hexstringblob);

            assert(hexstringblob)

            return multichain.signRawTransactionPromise({
                hexstring: hexstringblob,
          //        parents: [],
                privatekeys: [result["privkey"]]
            })
          })      //  sendrawtransaction [paste-bigger-hex-blob]
          .then(hexvalue => {
            console.log("hexvalue.hex  : ", hexvalue.hex);

            assert(hexvalue)

            return multichain.sendRawTransactionPromise({
                hexstring: hexvalue.hex
            })
          })
          .then(tx_hex => {
              console.log("tx_hex  : ", tx_hex);

              assert(tx_hex)

              console.log("Finished Successfully");
              res.json(result);
          })
          .catch(err => {
              console.log(err)
              throw err;
          })
        })  // fs.readFile  relationship.json
      })  // fs.readFile
  });

app.post('/createUserAddress',function(req,res){
      var sess = req.session;
      var IDofUser = req.body.username;

      var result = {};
      var iotDataFrom;

//      let addressMy, pubkeyMy, privkeyMy;

      // CHECK REQ VALIDITY
      if(!req.body.password || !req.body.username){
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
          users[IDofUser].secureGrade = "0";    // 보안등급 0- 일반인, 1 - 관리자
          users[IDofUser].dateOfenroll = Date.now();
//          result_return["dateOfenroll"]


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
                result["dateOfenroll"] = users[IDofUser].dateOfenroll;

                console.log(" result['dateOfenroll']   :   ", result["dateOfenroll"]);


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
        console.log("TEST: CREATE RAW SEND FROM");
//var objOfme = {};
//var arrOfme = [];
//arrOfme[0] = '{"for":"BookingStream","key":"bookingTime","data":"'+ new Buffer(Date.now().toString()).toString("hex")+'"}';
//arrOfme[0] = {"for":"BookingStream","key":"bookingTime","data":"5554584f732046545721"};
//        result_return["dateOfenroll"] = new Buffer(Date.now()).toString("hex");
        return multichain.createRawSendFromPromise({
              from: result_return["address"],
              to: {},
//              to: arrOfme,
              msg : [{"for":"BookingStream","key":"bookingTime","data":new Buffer(result_return["dateOfenroll"].toString()).toString("hex")}],
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

//      var testval = new Buffer("문자 변환 테스트 ").toString("hex");
      var testval = new Buffer("test converting by me   한글도 가능혀 ").toString("hex");
      console.log("testval hex  : ", testval);
      console.log("testval toString(utf8) : ", testval.toString("utf8"));
      console.log("testval toString(ascii) : ", testval.toString("ascii"));
      console.log("testval toString() : ", testval.toString());
      console.log("testval toString(hex) : ", testval.toString("hex"));

      const buf2 = new Buffer(testval, 'hex');
      console.log("buf2.toString()   :  ", buf2.toString());



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
  // app.get('/main/:username/:useraddress',function(req,res){
  //   console.log("call main()");
  //   res.render('main');
  // })
  app.get('/signup',function(req,res){   // 사용자 등록화면
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
