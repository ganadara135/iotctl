"use strict";


const connection = {
      port: 7206,     //rpc port
      host: '220.230.112.30',
      pass: "AxNpbxmkLN4Hey4AkV4VeC964ndGQMxmfizwH9Y56znT",
//      host: '127.0.0.1',
//      pass: "973MVcjrxbwyKdCWN6mMeCKUXZGRXgAFB4g4xr3PkcME"
      user: "multichainrpc"
}
//curl --user multichainrpc --data-binary '{"jsonrpc": "1.0", "id":"curltest", "method": "getinfo", "params": [] }' -H 'content-type: text/plain;' http://220.230.112.30:7206
//curl --user multichainrpc --data-binary '{"jsonrpc": "1.0", "id":"curltest", "method": "liststreampublisheritems", "params": ["BookingStream", "1NWaAocGQBBRo3WwWCj5Fyps253NHqoJRWR9Ku", false, 20] }' -H 'content-type: text/plain;' http://220.230.112.30:7206
//multichain-cli MyMultichain liststreampublisheritems BookingStream 1NWaAocGQBBRo3WwWCj5Fyps253NHqoJRWR9Ku
// multichain-cli MyMultichain -rpcconnect=220.230.112.30 -rpcport=7206 -rpcuser=multichainrpc -rpcpassword=AxNpbxmkLN4Hey4AkV4VeC964ndGQMxmfizwH9Y56znT getinfo

const assert = require('assert');
const bluebird = require("bluebird");
const multichain = bluebird.promisifyAll(require("multichain-node")(connection), {suffix: "Promise"});


module.exports = function(app, fs, jsonParser, urlencodedParser, client_token_arg ,address_param )
{

app.post('/approveBooking',function(req,res){
  var sess = req.session;
  var userAddress = req.body.userAddress;
  var deviceAddress = req.body.deviceAddress;
  var userPrivkey = req.body.userPrivkey;   // 관리자 비밀키
  var bookingTime = new Number(req.body.bookingTime);
  var result = {};

  console.log("req.body  : ", req.body);

  // 1. 보내준 값 유효범위 체크
  // 2. 해당 예약내역 있는지 체크
  // 3. BookingApproval.json  및 블록체인에 기록


  // 1. 보내준 값 유효범위 체크
  if(!req.body.userAddress || !req.body.userAddress){
      result["success"] = 0;
      result["error"] = "invalid request";
      res.json(result);
      return;
  }

  // 2. 해당 예약내역 있는지 체크
  fs.readFile( __dirname + "/../data/relationship.json", 'utf8',  function(err, data){
    var relationshipOf = JSON.parse(data);
    var y;

    if(err){
       throw err;
    }

    for(y in relationshipOf){

      if(relationshipOf[y].bookingTime > Date.now() && relationshipOf[y].userAddress == userAddress
            && relationshipOf[y].deviceAddress == deviceAddress){

          var bookingApproval = {};
          bookingApproval[y] =  relationshipOf[y];
          bookingApproval[y].approvalTime = Date.now();

          fs.writeFile(__dirname + "/../data/approveBooking.json", JSON.stringify(bookingApproval, null, '\t'), "utf8", function(err, data){
            if(err){
                throw err;
            }
          }) // fs.writeFile approveBooking.json

          console.log("call createRawSendFrom()");
  //        return multichain.validateAddressPromise({address: this.address1})
          multichain.createRawSendFromPromise({
              from: userAddress,
              to: {},
              msg : [{"for":"BookingStream","key":"bookingTime","data":new Buffer(JSON.stringify(
                      bookingApproval)).toString("hex")}],
        //              action: "send"
          })         // signrawtransaction [paste-hex-blob] '[]' '["privkey"]'
          .then(hexstringblob => {
            console.log("hexstringblob  : ", hexstringblob);

            assert(hexstringblob)

            return multichain.signRawTransactionPromise({
              hexstring: hexstringblob,
        //        parents: [],
              privatekeys: [userPrivkey]
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
            result["success"] = 1;
            result["error"] = "Approval Completed";
            // res.json(result);
            // return true;   // to stop send  res.json(result) again behind
        })
        .catch(err => {
            console.log(err)
            throw err;
        })
      }  // if
    }   // for


    console.log("Object.keys(result).length : ", Object.keys(result).length)

    if(Object.keys(result).length == 0){
      result["success"] = 0;
      result["errror"] = "No Booking List";

    }
    res.json(result);
  }) //fs.readFile   relationship.json
});


app.post('/getBookingListByManager',function(req,res){
  var sess = req.session;   // sess.loginUser,  sess.userAddress
  var userAddress = req.body.userAddress;
  var deviceAddress = req.body.deviceAddress;
  var result = {};
//  console.log("Object.keys(result).length : ", Object.keys(result).length)
  console.log("req.body  : ", req.body);
  // 1. 보내준 값 유효범위 체크
  // 2. 매니저 권한이 있는지 체크
  // 3. relationship.json 에서 관련 데이터 목록화하여 던저줌

  // 1. 보내준 값 유효범위 체크
  if(!req.body.userAddress || !req.body.deviceAddress){
      result["success"] = 0;
      result["error"] = "invalid request";
      res.json(result);
      return;
  }

  // 2. 매니저 권한이 있는지 체크
//  var managerAuthorityCheck = false;
  fs.readFile( __dirname + "/../data/user.json", 'utf8',  function(err, data){
      var userOf = JSON.parse(data);
      var x;

//      for(x in userOf){
        // 하드코딩함
      console.log("userOf[admin]  : ", userOf["admin"]);

      if(userOf["admin"] != undefined && userOf["admin"].address == userAddress){
          //managerAuthorityCheck = true;

          // 3. relationship.json 엔 있고 approvalBooking.json에 없는 데이터를 목록화하여 던저줌
          fs.readFile( __dirname + "/../data/relationship.json", 'utf8',  function(err, data){
            if(err){
               console.log("err    :    ", err)
               throw err;
            }
//            console.log("data  relationship.json -> ", data)
            var relationshipOf = JSON.parse(data);
//            var approvalBookingOf = {};

            fs.readFile( __dirname + "/../data/approveBooking.json", 'utf8',  function(err, data){
              var approveBookingOf;
              if(err){
                approveBookingOf = {};
                if(err["code"] != "ENOENT"){
                  throw err;
                }
              }else {
                approveBookingOf = JSON.parse(data);
              }
              var y,z;

              for(y in relationshipOf){
                 for(z in approveBookingOf){
                   if((relationshipOf[y].bookingTime > Date.now()) && (y != z) ){
                    result[y] = relationshipOf[y];
                   }
                 }
              }
              console.log("Object.keys(result).length : ", Object.keys(result).length)

              if(Object.keys(result).length == 0){
                result["success"] = 0;
                result["error"] = "No Booking List";
              }
              res.json(result);
              return true;
            });  //   fs.readFile( approvalBooking.json.
          });  //fs.readFile  relationship.json
        }else {
          result["success"] = 0;
          result["error"] = "No Manager Authority";
          res.json(result);
          return true;
        }
  })  //fs.readFile  user.json
});

  app.post('/bookingDevice',function(req,res){
    var sess = req.session;
    var userAddress = req.body.userAddress;
    var deviceAddress = req.body.deviceAddress;
    var deviceName = req.body.deviceName;
    var userPrivkey = req.body.userPrivkey;
    var bookingTime = new Number(req.body.bookingTime);
    var result = {};

    console.log("req.body  : ", req.body);

    // 1. 보내준 값 유효범위 체크
    // 2. 해당 디바이스가 있는지 체크
    // 3. 권한 요청 승인 기록 (RDB relationship,  Blockchain 각각에)
    //    3.1. 예약유효기간은 예약시각의 30분이내
    //    3.2. relationship.approvalBooking = true, false. (default=false)

    // 1. 보내준 값 유효범위 체크
    if(!req.body.deviceName || !req.body.userAddress){
        result["success"] = 0;
        result["error"] = "invalid request";
        res.json(result);
        return;
    }

    fs.readFile( __dirname + "/../data/device.json", 'utf8',  function(err, data){
        if(err){
            throw err;
        }
        var devices = JSON.parse(data);
        // 2. 해당 디바이스가 있는지 체크
        if(!devices[deviceName]){
            result["success"] = 0;
            result["error"] = "No device";
            res.json(result);
            return;
        }

        // 3. 권한 요청 승인 기록 (RDB relationship,  Blockchain 각각에)
        //    3.1. 예약유효기간은 예약시각의 30분이내
        //    3.2. relationship.approvalBooking = true, false. (default=false)
         fs.readFile( __dirname + "/../data/relationship.json", 'utf8',  function(err, data){
             if(err){
                 throw err;
             }
             var relationshipOf = JSON.parse(data);

             // relationshiop.json 은  장치관리자주소 + 장치주소 + bookingTime 로 고유번호부여
             relationshipOf[userAddress+deviceAddress+bookingTime] = {};
             relationshipOf[userAddress+deviceAddress+bookingTime].deviceAddress = deviceAddress;
             relationshipOf[userAddress+deviceAddress+bookingTime].userAddress = userAddress;
             relationshipOf[userAddress+deviceAddress+bookingTime].enrolledDate = Date.now();
//             relationshipOf[userAddress+deviceAddress+bookingTime].approvalBooking = false;
             relationshipOf[userAddress+deviceAddress+bookingTime].bookingTime = bookingTime;

//          console.log("relationshipOf[userAddress+deviceAddress+bookingTime]  : " ,relationshipOf[userAddress+deviceAddress+bookingTime]);
          fs.writeFile(__dirname + "/../data/relationship.json", JSON.stringify(relationshipOf, null, '\t'), "utf8", function(err, data){
            if(err){
                throw err;
            }
          }) // fs.writeFile relationship.json

          console.log("call createRawSendFrom()");
  //        return multichain.validateAddressPromise({address: this.address1})
          multichain.createRawSendFromPromise({
              from: userAddress,
              to: {},
              msg : [{"for":"BookingStream","key":"bookingTime","data":new Buffer(JSON.stringify(
                      relationshipOf)).toString("hex")}],
        //              action: "send"
          })         // signrawtransaction [paste-hex-blob] '[]' '["privkey"]'
          .then(hexstringblob => {
            console.log("hexstringblob  : ", hexstringblob);

            assert(hexstringblob)
                // 이 부분만 curl 로 클라이언트에서 직접 처리 할 수 있다.
                //  curl --user myusername --data-binary '{"jsonrpc": "1.0", "id":"curltest", "method": "MyMultichain signrawtransaction", "params": ["myhex"] }' -H 'content-type: text/plain;' http://127.0.0.1:7206
            return multichain.signRawTransactionPromise({
              hexstring: hexstringblob,
        //        parents: [],
              privatekeys: [userPrivkey]
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
            result["success"] = 1;
            result["error"] = "Booking Completed";
            res.json(result);
        })
        .catch(err => {
            console.log(err)
            throw err;
        })

      }) //fs.readFile relationship.json
    })  //fs.readFile device.json
  });


  app.post('/requestAllUserList',urlencodedParser, function(req, res){
    var sess = req.session;
    var result = {};

    fs.readFile( __dirname + "/../data/user.json", 'utf8',  function(err, data){
        if(err){
            throw err;    // device가 하나도 없거나, 읽을때 에러 발생
        }
        var userOf = JSON.parse(data);
        var x;
        for(x in userOf){
          result[x] = userOf[x];
          delete  result[x].password;
        }
        res.json(result);
      })// fs.readFile  device.json
  });


app.post('/requestAllDeviceList',urlencodedParser, function(req, res){
  var sess = req.session;
  var userAddress = req.body.userAddress;
  var result = {};

  console.log("call  requestAllDeviceList() ");

  fs.readFile( __dirname + "/../data/device.json", 'utf8',  function(err, data){
    if(err){
        console.log("err[code]    :    ", err["code"])
        if(err["code"] == "ENOENT"){
          result["success"] = 0;
          result["error"] = "Server Internal Error";
          res.json(result);
          return;
        }else {
          throw err;   // relationship 이 하나도 없거나, 에러 발생시
        }
    }
      var devicesOf = JSON.parse(data);
      fs.readFile( __dirname + "/../data/relationship.json", 'utf8',  function(err, data){
        if(err){
              throw err;   // relationship 이 하나도 없거나, 에러 발생시
        }

        var relationshipOf = JSON.parse(data);
        fs.readFile( __dirname + "/../data/approveBooking.json", 'utf8',  function(err, data){
          var approveBookingOf;
          if(err){
            approveBookingOf = {};
            if(err["code"] != "ENOENT"){
              throw err;
            }
          }else {
            approveBookingOf = JSON.parse(data);
          }


              //var approveBookingOf = JSON.parse(data);
              var x,y,z;
              for(x in devicesOf){
                result[x] = devicesOf[x];
                result[x].myDevice = 0;     // 내 장치가 아님
              }
              for(y in relationshipOf){
              //  console.log(relationshipOf[y].userAddress)
                if(relationshipOf[y].userAddress == userAddress){
              //    console.log(relationshipOf[y].deviceAddress);
                  for(x in devicesOf){
                    if(devicesOf[x].address == relationshipOf[y].deviceAddress){ // && relationshipOf[y].bookingTime > Date.now()){
                      result[x].myDevice = 1;   // 승인 안된 내 장치 목록.
                      for(z in approveBookingOf){
                        if(y == z){
                            result[x].myDevice = 2;  // 승인된 사용가능 장치
                        }
                      }
                    }
                  }
                }
              }
              res.json(result);
          })   // fs.readFile  approveBooking.json
      })   // fs.readFile  relationship.json
    })// fs.readFile  device.json
});
//  app.post('/login/:IDname',jsonParser, function(req, res){
app.post('/login',urlencodedParser, function(req, res){
//  app.post('/login',urlencodedParser, function(req, res){
      var sess = req.session;
      var result = {};


      if (!req.body)
        console.log("bodyParser is not working!!!!");


      console.log("req.body  : ", req.body);

        fs.readFile(__dirname + "/../data/user.json", "utf8", function(err, data){
          if(err){
              console.log("err[code]    :    ", err["code"])
              if(err["code"] == "ENOENT"){
                result["success"] = 0;
                result["error"] = "Server Internal Error";
                res.json(result);
                return;
              }else {
                throw err;   // relationship 이 하나도 없거나, 에러 발생시
              }
          }
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

              // var tenMinute = 60000 * 10;
              // // expires 는 쿠키생존기간 설정변수
              // req.session.cookie.expires = new Date(Date.now() + tenMinute);
              // //maxAge 는 expires 설정후 지난 시간을 나타냄
              // req.session.cookie.maxAge = tenMinute;
      //        sess.IDname = users[IDname]["IDname"];
              sess.loginUser = users[IDname]["username"];
              sess.userAddress = users[IDname]["address"];
              console.log("sess.loginUser :  ", sess.loginUser)
              console.log("sess.userAddress :  ", sess.userAddress)

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
      var sess = req.session;
      if(sess.loginUser){
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

                // relationshiop.json 은  장치관리자주소 + 장치주소 + 등록날짜 로 고유번호부여
                relationshipOf[deviceInputerAddress+result["address"]+devices[deviceName].enrolledDate] =
                 {"deviceAddress": result["address"],
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
                msg : [{"for":"BookingStream","key":"bookingTime","data":new Buffer(JSON.stringify(
                        devices[deviceName])).toString("hex")},
                      {"for":"BookingStream","key":"bookingTime","data":new Buffer(JSON.stringify(
                        relationshipOf[deviceInputerAddress+result["address"]+devices[deviceName].enrolledDate]).toString() ).toString("hex")}]

                // msg : [{"for":"BookingStream","key":"bookingTime","data":new Buffer(JSON.stringify(
                //         devices[deviceName])).toString("hex")},
                //       {"for":"BookingStream","key":"bookingTime","data":new Buffer(JSON.stringify(
                //         relationshipOf[deviceInputerAddress+result["address"]]  )).toString("hex")}],
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
      var username = req.body.username;

      var result = {};

      console.log("req.body  ===> ", req.body);


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
          if(users[username]){
              // DUPLICATION FOUND
              result["success"] = 0;
              result["error"] = "duplicate";
              res.json(result);
              return;
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

              // ADD TO DATA
              users[username] =  req.body;
              users[username].address =  result["address"];
              users[username].pubkey =  result["pubkey"];
//              users[username].secureGrade = 0;    // 보안등급 0- 일반인, 1 - 관리자
              users[username].enrolledDate = Date.now();
              result["dateOfenroll"] = users[username].dateOfenroll;
              console.log("*********  users[username]  : " , users[username]);

              // SAVE DATA
              fs.writeFile(__dirname + "/../data/user.json", JSON.stringify(users, null, '\t'), "utf8", function(err, data){
                if(err){
                    throw err;
                }
              })   // fs.writeFile


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
              msg : [{"for":"BookingStream","key":"bookingTime","data":new Buffer(new String(
                result_return["dateOfenroll"])).toString("hex")}],
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
//
// //      var testval = new Buffer("문자 변환 테스트 ").toString("hex");
// var testval= "7b22314e5761416f6347514242526f33577757436a35467970733235334e48716f4a525752394b75315935627857555a7a59653464665663614a6d734e3236454479393676713667654e4b697756223a7b2264657669636541646472657373223a22315935627857555a7a59653464665663614a6d734e3236454479393676713667654e4b697756222c227573657241646472657373223a22314e5761416f6347514242526f33577757436a35467970733235334e48716f4a525752394b75222c22656e726f6c6c656444617465223a313530333330323933363332302c22617070726f76616c426f6f6b696e67223a66616c73652c22626f6f6b696e6754696d65223a2231353033333035383830303030227d2c22314e5761416f6347514242526f33577757436a35467970733235334e48716f4a525752394b75315935627857555a7a59653464665663614a6d734e3236454479393676713667654e4b69775631353033333037303830303030223a7b2264657669636541646472657373223a22315935627857555a7a59653464665663614a6d734e3236454479393676713667654e4b697756222c227573657241646472657373223a22314e5761416f6347514242526f33577757436a35467970733235334e48716f4a525752394b75222c22656e726f6c6c656444617465223a313530333330333337363436382c22617070726f76616c426f6f6b696e67223a66616c73652c22626f6f6b696e6754696d65223a2231353033333037303830303030227d7d";
//
//
// //      var testval = new Buffer("test converting by me   한글도 가능혀 ").toString("hex");
//       console.log("testval hex  : ", testval);
//       console.log("testval toString(utf8) : ", testval.toString("utf8"));
//       console.log("testval toString(ascii) : ", testval.toString("ascii"));
//       console.log("testval toString() : ", testval.toString());
//       console.log("testval toString(hex) : ", testval.toString("hex"));
//
//       const buf2 = new Buffer(testval, 'hex');
//       console.log("buf2.toString()   :  ", buf2.toString());
//


      res.render('index', {
          title: "인덱스화면",
          length: 5,
          loginUser: sess.loginUser,
          userAddress: sess.userAddress
      })
  });

  // app.get('/login',function(req,res){
  //   res.render('login');
  // })
  app.get('/main',function(req,res){
    var sess = req.session;
    console.log("call main()");
    res.render('main', {
        title: "main 페이지",
        length: 5,
        loginUser: sess.loginUser,
        userAddress: sess.userAddress
    })
  })
  // app.get('/main/:username/:useraddress',function(req,res){
  //   console.log("call main()");
  //   res.render('main');
  // })
  app.get('/signup',function(req,res){   // 사용자 등록화면
    var sess = req.session;
    console.log("call signup()");
    res.render('signup', {
        title: "signup 페이지",
        length: 5,
        loginUser: sess.loginUser,
        userAddress: sess.userAddress
    })
  })
  app.get('/devices',function(req,res){
    var sess = req.session;
    console.log("call devices()");
    res.render('devices', {
        title: "devices 페이지",
        length: 5,
        loginUser: sess.loginUser,
        userAddress: sess.userAddress
    })
  })

  app.get('/booking',function(req,res){
    var sess = req.session;
    console.log("req.query  : ", req.query);
    res.render('booking',{
      deviceName : req.query.deviceName,
      deviceAddress : req.query.deviceAddress,
      loginUser: sess.loginUser,
      userAddress: sess.userAddress
    })
  });
  app.get('/device_detail',function(req,res){
    var sess = req.session;
    console.log("req.query  : ", req.query);
    res.render('device_detail',{
      deviceName : req.query.deviceName,
      deviceAddress : req.query.deviceAddress,
      loginUser: sess.loginUser,
      userAddress: sess.userAddress
    })
  });

  app.get('/device_add',function(req,res){
    var sess = req.session;
    console.log("call device_add()");
    res.render('device_add', {
        title: "device_add 페이지",
        length: 5,
        loginUser: sess.loginUser,
        userAddress: sess.userAddress
    })
  })
  app.get('/device_add2',function(req,res){
    var sess = req.session;
    console.log("call device_add2()");
    res.render('device_add2', {
        title: "device_add2 페이지",
        length: 5,
        loginUser: sess.loginUser,
        userAddress: sess.userAddress
    })
  });
  app.get('/users',function(req,res){
    var sess = req.session;
    console.log("call users()");
    res.render('users', {
        title: "users 페이지",
        length: 5,
        loginUser: sess.loginUser,
        userAddress: sess.userAddress
    })
  });
  app.get('/booking_list',function(req,res){
    var sess = req.session;
    console.log("call booking_list()");
    res.render('booking_list', {
        title: "booking_list 페이지",
        length: 5,
        loginUser: sess.loginUser,
        userAddress: sess.userAddress
    })
  });
};
