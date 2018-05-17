/*jslint es6,  node:true */
'use strict';
const mailHelper = require('../utils/emailClient');
const auth = require('../auth');
const graph = require('../graph');
const express = require('express');
const router = express.Router();
module.exports = router;


// /**
//  * takes as input a JSON containing the attributes of the users
//  *
//  * @type {[type]}
//  */
// router.get('/register', (req,res) =>{
//   //save the user in the db...
//    let email = req.query.email; //"smartclassguest1@outlook.com"
//    auth.getUserAccessToken().then( token =>{
//       // Get all of the users in the tenant.
//       //graph.createUser(token);
//       graph.sendInvite(token,email,"https://teams.microsoft.com").then( resp => {
//         console.log("the id is " + resp);
//         graph.add2Group(token,"a13c289e-3b38-4e24-9776-df96c59b26e5").then(resp => {
//             return  res.json("OK");
//         });
//       }).catch(err =>{
//         console.log("error");
//         console.log(err);
//         return res.json("NOK");
//       });
//     }
//   );
// });


//TODO
router.post("/createUser",(req,res) =>{
 //(token, displayName,mailNickname,givenName,surname,userPrincipalName,password)
  let displayName = req.body.displayName;
  let mailNickname = req.body.mailNickname;
  let givenName = req.body.givenName;
  let surname = req.body.surname;
  let userPrincipalName = req.body.userPrincipalName +"@i4mlabUAegean.onmicrosoft.com";
  let password = req.body.password;
  let eId = req.body.eId;
  let uAegeanId = req.body.uAegeanId;
  console.log("Creating user with :")
  console.log("displayName" + displayName);
  console.log("givenName" + givenName);
  console.log("userPrincipalName" + userPrincipalName);

 let userId = "";

  auth.getUserAccessToken().then( token =>{
    graph.createUser(token, displayName,mailNickname,givenName,surname,userPrincipalName,password,eId)
    .then(resp =>{
      try{
        let userDetails = JSON.parse(resp);
        userId = userDetails.id;
        if(userId){
          console.log("user created with ID " + userId);
          mailHelper.sendEmail("triantafyllou.ni@gmail.com; adanar@atlantis-group.gr;pkavassalis@atlantis-group.gr",JSON.stringify(userDetails));
        }
        return graph.createUserSchema(token,userDetails.id, "eIDAS_ID");
      }catch(err){
          console.log("ERROR",resp);
          return {"status":"NOK"};
      };
    }).then( resp =>{
      return graph.updateUserSchema(token,userId,"eIDAS_ID",eId);
    })
    .then(resp =>{
      return graph.createUserSchema(token,userId, "UAegeanID");
    })
    .then(resp =>{
      return graph.updateUserSchema(token,userId,"UAegeanID", uAegeanId);
    })
    .then(resp =>{
      console.log("final response");
      // console.log(resp);
      if(userId !== ""){
          res.json({"status":"OK","id":userId});
      }else{
        res.json({"status":"NOK"});
      }
    })
    .catch( err =>{
      console.log(err);
      res.json({"status":"NOK"});
    });
  });
});



//DONE
router.get("/getExtendedAttr",(req,res) =>{
    let userId = req.query.userId;
    let attr = req.query.attr;
    auth.getUserAccessToken().then( token =>{
        graph.getUserSchema(token,userId,attr).then(resp => {
          console.log("Extended Attributes RESPONSE:");
          console.log(resp);
          res.send(resp.attribute);
        })
        .catch(err =>{
          console.log(err);
        });
    });
});



//TODO
router.post("/createUserSafe",(req,res) =>{
 //(token, displayName,mailNickname,givenName,surname,userPrincipalName,password)
  let displayName = req.body.displayName;
  let mailNickname = req.body.mailNickname;
  let givenName = req.body.givenName;
  let surname = req.body.surname;
  let userPrincipalName = req.body.userPrincipalName +"@i4mlabUAegean.onmicrosoft.com";
  let password = req.body.password;
  console.log("displayName" + displayName);
  console.log("givenName" + givenName);

  auth.getUserAccessToken().then( token =>{
    graph.getUsers(token).then( users => {
       users.forEach( user => {
         console.log(user);
         // console.log("comparing " + user.displayName + "  with " + displayName);
         if(user.displayName === displayName){
           res.json({"status":"NOK","id":user.id});
         }
       });
       graph.createGroup(token,displayName,mailNickname)
       .then(resp =>{
         let result = {};
         result.id= resp;
         if(result.id){
           result.status = "OK";
         }else{
           result.status = "NOK";
         }
          console.log("Response ::");
          console.log(resp);
         res.json( result );
       })
       .catch( err =>{
         console.log(err);
         res.json({"status":"NOK"});
       });

    });
  });


});


//(token, displayName, mailNickname)
router.post("/createGroup",(req,res) =>{
 //(token, displayName,mailNickname,givenName,surname,userPrincipalName,password)
  let displayName = req.body.displayName;
  let mailNickname = req.body.mailNickname;
  auth.getUserAccessToken().then( token =>{
    graph.createGroup(token,displayName,mailNickname)
    .then(resp =>{
      let result = {};
      result.id= resp;
      if(result.id){
        result.status = "OK";
      }else{
        result.status = "NOK";
      }
       console.log("Response ::");
       console.log(resp);
      res.json( result );
    })
    .catch( err =>{
      console.log(err);
      res.json({"status":"NOK"});
    });
  });
});



//(token, displayName, mailNickname)
router.post("/createTeam",(req,res) =>{
 //(token, displayName,mailNickname,givenName,surname,userPrincipalName,password)
 //(cons
  console.log("hey from normal api");
  let groupId = req.body.groupId;
  auth.getUserAccessToken().then( token =>{
    graph.createTeam(token,groupId)
    .then(resp =>{
      let result = {};
      result.id= resp;
      if(result.id){
        result.status = "OK";
      }else{
        result.status = "NOK";
      }
       console.log("Response ::");
       console.log(resp);
      res.json( result );
    })
    .catch( err =>{
      console.log(err);
      res.json({"status":"NOK"});
    });
  });
});


router.post("/sendInvite",(req,res) =>{
  let userEmail = req.body.userEmail;
  let redirectURL = req.body.redirectURL;
  let invitedUserDisplayName = req.body.invitedUserDisplayName;
  auth.getUserAccessToken().then( token =>{
    graph.sendInvite(token,userEmail,redirectURL,invitedUserDisplayName)
    .then(resp =>{
      res.json( {"status":"OK"});
    })
    .catch( err =>{
      console.log(err);
      res.json({"status":"NOK"});
    });
  });
});

//TODO
router.post("/add2Group",(req,res) =>{
  let userId = req.body.userId;
  let groupName = req.body.groupName;
  let isOwner = req.body.isOwner;
  auth.getUserAccessToken().then( token =>{
    graph.add2Group(token,userId,groupName,isOwner)
    .then(resp =>{
      res.json( {"status":"OK"});
    })
    .catch( err =>{
      console.log(err);
      res.json({"status":"NOK"});
    });
  });
});

router.post("/add2GroupById",(req,res) =>{
  let userId = req.body.userId;
  let groupId = req.body.groupId;
  let isOwner = req.body.isOwner;
  auth.getUserAccessToken().then( token =>{
    graph.add2GroupById(token,userId,groupId,isOwner)
    .then(resp =>{
      res.json( {"status":"OK"});
    })
    .catch( err =>{
      console.log(err);
      res.json({"status":"NOK"});
    });
  });
});


router.post("/updateUser",(req,res) =>{
  let userId = req.body.userId;
  let attributeName = req.body.attributeName
  let attributeValue = req.body.attributeValue;
  auth.getUserAccessToken().then( token =>{
    graph.updateUser(token,userId,attributeName,attributeValue)
    .then(resp =>{
      res.json( {"status":"OK"});
    })
    .catch( err =>{
      console.log(err);
      res.json({"status":"NOK"});
    });
  });
});


router.get("/getGroups",(req,res) =>{

  auth.getUserAccessToken().then( token =>{
    graph.getGroups(token)
    .then(resp =>{
      res.json( {"status":"OK", "groups" :resp});
    })
    .catch( err =>{
      console.log(err);
      res.json({"status":"NOK"});
    });
  });
});


router.get("/findUserByPrincipalName",(req,res) =>{
    let userPrincipalName = req.query.userPrincipalName + "@i4mlabUAegean.onmicrosoft.com";
    auth.getUserAccessToken().then( token =>{
        graph.checkUser(token,userPrincipalName).then( resp => {
            if(!resp.error){
              res.json({"status":"OK", details:resp});
            }
            res.json({"status":"NOK", "error":resp});
        }).catch(
           err =>{
              res.json({"status":"NOK", "error":err});
           }
        );
  });
});



/*
  get all users belonging to the given group, identified by group id
 */
router.get("/listMembers",(req,res) =>{
  let groupId = req.query.groupId;
  auth.getUserAccessToken().then( token =>{
    graph.listMembers(token,groupId)
    .then(resp =>{
      let members={};
        try{
        members=JSON.parse(resp);
        }catch(err){
          console.log("ERROR",err);
          res.json( { "status":"NOK",
                      "members": members.value
                    });
        };
        res.json( { "status":"OK",
                    "members": members.value
                  });
  })
  .catch( err =>{
    console.log(err);
    res.json({"status":"NOK"});
  });
});
});








/*
  get all users belonging to the given group, identified by group id
 */
//TODO
router.get("/listOwners",(req,res) =>{
  let groupId = req.query.groupId;
  auth.getUserAccessToken().then( token =>{
    graph.listOwners(token,groupId)
    .then(resp =>{
      let members={};
        try{
          members=JSON.parse(resp);
        }catch(err){
          console.log("ERROR",err);
          res.json( { "status":"NOK",
                      "members": members.value
                    });
        };
        res.json( { "status":"OK",
                    "members": JSON.parse(resp).value
                  });
  })
  .catch( err =>{
    console.log(err);
    res.json({"status":"NOK"});
  });
});
});


/*
  get all users of the system
 */
//TODO
router.get("/listAllUsers",(req,res) =>{
  let users = [] ;
  let promises = [];

  auth.getUserAccessToken().then( token =>{
   graph.getGroups(token)
    .then(resp =>{
        resp.value.forEach( group => {
            promises.push(graph.listMembers(token,group.id));
          });
          Promise.all(promises)
          .then( resp =>{
              resp.map(result =>{
                let userGroup =[];
                try{
                  userGroup= JSON.parse(result).value;
                }catch(err){
                  consol.log("ERROR",err);
                  res.json({"status":"NOK"})
                };
                 return userGroup;
              }).forEach( userGroup => {
                 userGroup.forEach(user => {users.push(user);});
              });

              console.log("users!!!");
              console.log(users);
              let eIDASPromises =
                    users.map( usr => {
                      return new Promise( (resolve,reject) =>{
                          graph.getUserSchema(token,usr.id,"eIDAS_ID")
                          .then(resp =>{
                              usr.eIDAS_ID = resp.attribute?resp.attribute:null;
                              console.log(usr);
                              resolve(usr);
                          }).catch(err => {
                            usr.eIDAS_ID = null;
                            resolve(usr);
                          });
                        });
                    });

                    let UAegeanPromises =
                    users.map( usr => {
                      return new Promise( (resolve,reject) =>{
                          graph.getUserSchema(token,usr.Id,"UAegeanID")
                          .then(resp =>{
                             // console.log("UAEGEAN_ID " + resp.attribute);
                              usr.UAegeanID = resp.attribute?resp.attribute:null;
                              resolve(usr);
                          })
                          .catch(err => {
                            console.log(err);
                            usr.UAegeanID = null
                            resolve(usr);
                          });
                        });
                      });
                    //

                    Promise.all(eIDASPromises,UAegeanPromises)
                    .then( resp =>{
                      console.log("All promises finished!")
                      res.json({"status":"OK","users":resp});
                    });


      })
  })
  .catch( err =>{
    console.log(err);
    res.json({"status":"NOK", "error":err});
  });
});
});

 /**
  * token userPrincipalName to check if the user exists
  */



/*
  get all users belonging to the given group, identified by group id
 */
//TODO
router.get("/skus",(req,res) =>{
  auth.getUserAccessToken().then( token =>{
    graph.getSkus(token)
    .then(resp =>{
        res.json(resp);
    })
    .catch( err =>{
      console.log(err);
      res.json({"status":"NOK", "error":err});
    });
  });
});




//TODO
router.post("/addLicenses",(req,res) =>{
  let principal = req.body.principal;
  auth.getUserAccessToken().then( token =>{
    graph.addLicenses(token,principal)
    .then(resp =>{
        res.json(resp);
    })
    .catch( err =>{
      console.log(err);
      res.json({"status":"NOK", "error":err});
    });
  });
});

//TODO
router.post("/removeLicenses",(req,res) =>{
  let principal = req.body.principal;
  auth.getUserAccessToken().then( token =>{
    graph.removeLicenses(token,principal)
    .then(resp =>{
        res.json(resp);
    })
    .catch( err =>{
      console.log(err);
      res.json({"status":"NOK", "error":err});
    });
  });
});
