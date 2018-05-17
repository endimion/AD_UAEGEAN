/*jslint es6,  node:true */
'use strict';
const mailHelper = require('../utils/emailClient');
const auth = require('../auth');
const graph = require('../graph');
const express = require('express');
const router = express.Router();
const Rx = require('rxjs/Rx');

module.exports = router;


/**
* returns all group
* example:
* {
"status": "OK",
"groups": [
{
"id": "0ea60411-5d94-4ed3-9143-780c152890f6",
"deletedDateTime": null,
"classification": null,
"createdDateTime": "2018-04-28T17:16:27Z",
"description": "P2Pcommunities Atlantis Group",
"displayName": "P2Pcommunities Atlantis Group",
"groupTypes": [
"Unified"
],
"mail": "bG9jYWwubmV0L3MrVW5aS1FLcjEzbUo@i4mlabUAegean.onmicrosoft.com",
"mailEnabled": true,
"mailNickname": "bG9jYWwubmV0L3MrVW5aS1FLcjEzbUo",
"onPremisesLastSyncDateTime": null,
"onPremisesProvisioningErrors": [],
"onPremisesSecurityIdentifier": null,
"onPremisesSyncEnabled": null,
"preferredDataLocation": null,
"proxyAddresses": [
"SMTP:bG9jYWwubmV0L3MrVW5aS1FLcjEzbUo@i4mlabUAegean.onmicrosoft.com"
],
"renewedDateTime": "2018-04-28T17:16:27Z",
"resourceBehaviorOptions": [],
"resourceProvisioningOptions": [],
"securityEnabled": true,
"visibility": "Public"
},...
]
}}

error:
{
"status": "NOK",
"error": {
"code": "InvalidAuthenticationToken",
"message": "CompactToken parsing failed with error code: 80049217",
"innerError": {
"request-id": "b444cbec-9d3a-48cd-8b86-9ea19b5c186a",
"date": "2018-05-11T06:22:55"
}
}
}
* @type {[JSON]}
*/
router.get("/getGroups",(req,res) =>{

  auth.getUserAccessToken().then( token =>{
    graph.getGroups(token)
    .then(resp =>{
      if(resp.error){
        throw(resp.error);
      }
      res.json( {"status":"OK", "groups" :resp.value});
    })
    .catch( err =>{
      res.json({"status":"NOK",error:err});
    });
  });
});




/*
{
"status": "OK",
"attr": "GR/GR/ERMIS-23800397"
}

{
"status": "NOK",
"error": {
"code": "ResourceNotFound",
"message": "Extension with given id not found.",
"innerError": {
"request-id": "1b123f21-0a55-4cde-a094-5e61850db62a",
"date": "2018-05-11T06:32:51"
}
}
}
*/
router.get("/getExtendedAttr",(req,res) =>{
  let userId = req.query.userId;
  let attr = req.query.attr;
  auth.getUserAccessToken().then( token =>{
    graph.getUserSchema(token,userId,attr).then(resp => {
      if(resp.error){
        throw(resp.error);
      }
      res.send({"status":"OK","attr":resp.attribute});
    })
    .catch(err =>{
      res.send({"status":"NOK","error":err});
    });
  });
});





/*
{
"status": "OK",
"groupId": "de1dc65e-0e30-4cff-8ada-aad55761c0e7"
}

{
"status": "NOK",
"error": {
"code": "Request_BadRequest",
"message": "Another object with the same value for property mailNickname already exists.",
"innerError": {
"request-id": "92e0069a-9f0f-4ed4-879b-877336188087",
"date": "2018-05-11T07:09:51"
},
"details": [
{
"target": "mailNickname",
"code": "ObjectConflict"
}
]
}
}
*/
router.post("/createGroup",(req,res) =>{
  //(token, displayName,mailNickname,givenName,surname,userPrincipalName,password)
  let displayName = req.body.displayName;
  let mailNickname = req.body.mailNickname;
  auth.getUserAccessToken().then( token =>{
    graph.createGroup(token,displayName,mailNickname)
    .then(resp =>{
      console.log("response", resp);
      if(resp.error){
        throw(resp.error);
      }
      let result = {};
      result.id= resp;
      if(result.id){
        res.json({"status":"OK","groupId":result.id});
      }else{
        throw("no group-id found on response")
      }
    })
    .catch( err =>{
      res.json({"status":"NOK","error":err});
    });
  });
});


/*

{
"status": "OK",
"teamId": "8fda6320-fed4-4839-bd1c-ba83f2c79458"
}

{
"status": "NOK",
"error": {
"code": "Request_BadRequest",
"message": "A value is required for property 'displayName' of resource 'Group'.",
"innerError": {
"request-id": "09762f06-0406-4c71-979e-9199882611a7",
"date": "2018-05-11T07:22:43"
}
}
}
*/
router.post("/createTeam",(req,res) =>{
  let groupId = req.body.groupId;
  // console.log(groupId);
  // console.log("HHEEEEYYYY");
  auth.getUserAccessToken().then( token =>{
    graph.createTeam(token,groupId)
    .then(resp =>{
      if(resp.error){
        throw(resp.error);
      }
      let result = {};
      result.id= resp;
      if(result.id){
        res.json({"status":"OK","teamId":result.id});
      }else{
        throw("no team-id found on response")
      }
    })
    .catch( err =>{
      res.json({"status":"NOK","error":err});
    });
  });
});




/*
TODO how to test this
*/
router.post("/sendInvite",(req,res) =>{
  let userEmail = req.body.userEmail;
  let redirectURL = req.body.redirectURL;
  let invitedUserDisplayName = req.body.invitedUserDisplayName;
  auth.getUserAccessToken().then( token =>{
    graph.sendInvite(token,userEmail,redirectURL,invitedUserDisplayName)
    .then(resp =>{
      console.log(resp);
      res.json( {"status":"OK"});
    })
    .catch( err =>{
      console.log(err);
      res.json({"status":"NOK"});
    });
  });
});




/*
{
"status": "OK",
"result": 204
}

{
"status": "NOK",
"error": {
"code": "Request_BadRequest",
"message": "Invalid object identifier 'undefined'.",
"innerError": {
"request-id": "72011b73-bff2-41e4-9939-30e41d2f528c",
"date": "2018-05-11T08:19:46"
}
}
}

*/
router.post("/add2GroupById",(req,res) =>{
  let userId = req.body.userId;
  let groupId = req.body.groupId;
  let isOwner = req.body.isOwner;
  auth.getUserAccessToken().then( token =>{
    graph.add2GroupById(token,userId,groupId,isOwner)
    .then(resp =>{
      res.json( {"status":"OK","result":resp} );
    })
    .catch( err =>{
      res.json({"status":"NOK", "error":err} );
    });
  });
});




/*
{
"status": "OK",
"result": 204
}

{
"status": "NOK",
"error": {
"code": "Request_BadRequest",
"message": "One or more property values specified are invalid.",
"innerError": {
"request-id": "461e7826-6247-4d7b-84f5-1548abe63161",
"date": "2018-05-11T10:34:04"
}
}
},


*/
router.post("/updateUser",(req,res) =>{
  let userId = req.body.userId;
  let attributeName = req.body.attributeName
  let attributeValue = req.body.attributeValue;
  console.log(userId,attributeName,attributeValue);
  auth.getUserAccessToken().then( token =>{
    graph.updateUser(token,userId,attributeName,attributeValue)
    .then(resp =>{
      // console.log("resp",resp);
      // if(JSON.parse(resp).error)throw(JSON.parse(resp).error);
      res.json( {"status":"OK","result":resp});
    })
    .catch( err =>{
      console.log(err);
      res.json({"status":"NOK","error":err});
    });
  });
});



/*
{
"status": "OK",
"user": {
"@odata.context": "https://graph.microsoft.com/v1.0/$metadata#users/$entity",
"id": "66d247e6-67bf-485b-a2ac-111551b9a05d",
"businessPhones": [],
"displayName": "testDisp",
"givenName": "testgiven",
"jobTitle": null,
"mail": "testPrincipal9@i4mlabUAegean.onmicrosoft.com",
"mobilePhone": null,
"officeLocation": null,
"preferredLanguage": null,
"surname": "testsurname",
"userPrincipalName": "testPrincipal9@i4mlabUAegean.onmicrosoft.com"
}
}

{
"status": "NOK",
"error": {
"code": "Request_ResourceNotFound",
"message": "Resource 'testPrincipal91@i4mlabUAegean.onmicrosoft.com' does not exist or one of its queried reference-property objects are not present.",
"innerError": {
"request-id": "a0b460b2-3893-4ee6-abe0-35abbe2c7338",
"date": "2018-05-11T18:38:10"
}
}
}

*/
router.get("/findUserByPrincipalName",(req,res) =>{
  let userPrincipalName = req.query.userPrincipalName + "@i4mlabUAegean.onmicrosoft.com";
  auth.getUserAccessToken().then( token =>{
    graph.checkUser(token,userPrincipalName).then( resp => {
      if(!resp.error){
        res.json({"status":"OK", user:resp});
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
{
"status": "NOK",
"error": {
"code": "Request_ResourceNotFound",
"message": "Resource '07ca2176-c384-4b10-a00b-64de8432d6d6' does not exist or one of its queried reference-property objects are not present.",
"innerError": {
"request-id": "5f2cd43c-d8a2-4226-997f-f7d63d2b2574",
"date": "2018-05-11T18:52:26"
}
}
}

{
"status": "OK",
"members": [
{
"@odata.type": "#microsoft.graph.user",
"id": "9ac5eac1-01a5-4be0-ba81-a10295356d47",
"businessPhones": [],
"displayName": "adanar",
"givenName": "Harris",
"jobTitle": null,
"mail": "adanar@atlantis-group.gr",
"mobilePhone": null,
"officeLocation": null,
"preferredLanguage": null,
"surname": "Papadakis",
"userPrincipalName": "adanar_atlantis-group.gr#EXT#@i4mlabUAegean.onmicrosoft.com"
},...
]}

*/
router.get("/listMembers",(req,res) =>{
  let groupId = req.query.groupId;
  auth.getUserAccessToken().then( token =>{
    graph.listMembers(token,groupId)
    .then(resp =>{
      res.json( { "status":"OK",
      "members": resp.value
    });
  })
  .catch( err =>{
    res.json({"status":"NOK","error":err});
  });
});
});









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
  console.log("displayName: " + displayName);
  console.log("givenName: " + givenName);
  console.log("userPrincipalName:" + userPrincipalName);

  let userId = "";

  const token$ = Rx.Observable.fromPromise(auth.getUserAccessToken()).share();

  const [error$, result$] =
  token$
  .flatMap( token => graph.createUser(token, displayName,mailNickname,givenName,surname,userPrincipalName,password,eId)   )
  .share() //if we dont share this observable then on the subscibtions it will be fired twice
  .partition( resp => JSON.parse(resp).error);

  const eID$ =
  Rx.Observable.combineLatest(token$, result$)
  // .do( value => {console.log(value); return value;})
  .flatMap(values => Rx.Observable.combineLatest( Rx.Observable.of(values[0]),
                                                  graph.updateUserSchema(values[0],JSON.parse(values[1]).id, "eIDAS_ID",eId, uAegeanId),
                                                  Rx.Observable.of(JSON.parse(values[1]).id)) ) ;

  error$.merge(eID$)
  .do( value => {console.log(value); return value;})
  .subscribe(result => {
    if(!Array.isArray(result) && JSON.parse(result).error){
      res.json({"status":"NOK", "error":JSON.parse(result).error})
    }else{
      res.json({"status":"OK", "id":result[2],"info":result[1]});
    }
  });




  });
