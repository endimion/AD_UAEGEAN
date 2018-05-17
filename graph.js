/*
* Copyright (c) Microsoft All rights reserved. Licensed under the MIT license.
* See LICENSE in the project root for license information.
*/

var request = require('request');
var Q = require('q');
const config = require('./config')


// The graph module object.
var graph = {};

// @name getUsers
// @desc Makes a request to the Microsoft Graph for all users in the tenant.
graph.getUsers = function (token) {
  var deferred = Q.defer();

  // Make a request to get all users in the tenant. Use $select to only get
  // necessary values to make the app more performant.
  request.get('https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName', {
    auth: {
      bearer: token
    }
  }, function (err, response, body) {

    var parsedBody = {};
    try{
      parsedBody =JSON.parse(body);
    }catch(err){
      console.log("ERROR",err);
      deferred.reject(err);
    };

    if (err) {
      deferred.reject(err);
    } else if (parsedBody.error) {
      deferred.reject(parsedBody.error.message);
    } else {
      // The value of the body will be an array of all users.
      deferred.resolve(parsedBody.value);
    }
  });

  return deferred.promise;
};


/**
*   GET PARAMETERS displayName, mailNickname, givenName, surname, userPrincipalName, password
* @param  {[type]} token [description]
* @return {[type]}       [description]
*/
graph.createUser = function (token, displayName,mailNickname,givenName,surname,userPrincipalName,password,eId)
{
  const newUser =
  {
    "accountEnabled": true,
    // "userType": "Guest",
    "displayName": displayName,
    "mailNickname": mailNickname,
    "givenName": givenName,
    "surname": surname,
    "userPrincipalName": userPrincipalName,//"smartclassguest1@i4mlabUAegean.onmicrosoft.com",
    "passwordProfile" :
    {
      "forceChangePasswordNextSignIn": true,
      "password": password//"6^magick"
    }
  };
  return new Promise( (resolve,reject) =>{
    request.post(
      {
        url: 'https://graph.microsoft.com/v1.0/users',
        headers:
        {
          'content-type': 'application/json',
          authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(newUser)
      },
      function (err, response, body)
      {
        // // console.log(body);
        // let userId ="";
        try{
            userId = JSON.parse(body).id;
            resolve(body);
        }catch(err){
          console.log("ERROR",err);
          reject(err);
        }
        if(err) reject(err);
    });

  });
}


    /**
    *
    * @param  {[type]} token       [description] -- hardcoded
    * @param  {[type]} userEmail   [description]
    * @param  {[type]} redirectURL [description]
    * @return {[type]}             [description]
    */
    graph.sendInvite = function (token, userEmail, redirectURL,invitedUserDisplayName)
    {
      newUser =
      {
        // "invitedUserEmailAddress": "smartclassguest1@outlook.com",
        "invitedUserEmailAddress" : userEmail,
        // "inviteRedirectUrl": "https://teams.microsoft.com",
        "inviteRedirectUrl": redirectURL,
        "invitedUserDisplayName":invitedUserDisplayName,
        "sendInvitationMessage": true
      };

      return new Promise( (resolve,reject) =>{
        request.post(
          {
            url: 'https://graph.microsoft.com/v1.0/invitations',
            headers:
            {
              'content-type': 'application/json',
              authorization: 'Bearer ' + token,
            },
            body: JSON.stringify(newUser)
          },
          function (err, response, body)
          {
            if(err){
              reject(err);
            }
            try{
              let result = JSON.parse(body).invitedUser.id;
              if(result.error) reject(result.error);
              resolve(result);
            }catch(err){
              console.log("ERROR",err);
              reject(err);
            }

          });
        });
      };


      /**
      * @param  {[type]} token  [description]
      * @param  {[type]} userId [description]
      * @return {[type]}        [description]
      */
      graph.add2Group = function (token,userId,groupName,owner)
      {
        //groupID 3b0a7d5e-c464-4f82-87c2-87e6c1053a14
        //userID a13c289e-3b38-4e24-9776-df96c59b26e5
        //
        newUser =
        {
          "@odata.id": "https://graph.microsoft.com/v1.0/directoryObjects/"+ userId // +a13c289e-3b38-4e24-9776-df96c59b26e5"
        };

        //value displayName: id
        let isOwner = owner == 'true';
        return new Promise( (resolve,reject) =>{

          graph.getGroups(token).then(res => {
            let groups = res.value;
            groups.forEach( group =>{
              console.log("comparing " +  group.displayName + " with " + groupName);
              if(group.displayName === groupName){
                let theUrl = "";
                if(!isOwner){
                  // theUrl = 'https://graph.microsoft.com/v1.0/groups/'+group.id+'/members/$ref';
                  theUrl = 'https://graph.microsoft.com/beta/groups/'+group.id+'/members/$ref';
                }else{
                  // theUrl = 'https://graph.microsoft.com/v1.0/groups/'+group.id+'/owners/$ref';
                  theUrl = 'https://graph.microsoft.com/beta/groups/'+group.id+'/owners/$ref';
                }
                request.post(
                  {
                    url: theUrl,//'https://graph.microsoft.com/v1.0/groups/'+group.id+'/members/$ref', //3b0a7d5e-c464-4f82-87c2-87e6c1053a14
                    headers:
                    {
                      'content-type': 'application/json',
                      authorization: 'Bearer ' + token,
                    },
                    body: JSON.stringify(newUser)
                  },
                  function (err, response, body)
                  {
                    console.log(body);
                    console.log(response);
                    if(err){reject(err);}

                    resolve(body);
                  });
                }
              });
            })
            .catch(err =>{
              reject(err);
            })
          });
        };



        /**
        * @param  {[type]} token  [description]
        * @param  {[type]} userId [description]
        * @return {[type]}        [description]
        */
        graph.add2GroupById = function (token,userId,groupId,isOwner)
        {
          newUser =
          {
            "@odata.id": "https://graph.microsoft.com/v1.0/directoryObjects/"+ userId // +a13c289e-3b38-4e24-9776-df96c59b26e5"
          };

          let owner = isOwner == 'true';
          // console.log("isOwner", owner);
          // console.log("check : ",  owner ==  true);
          if( owner ){
            // theUrl = 'https://graph.microsoft.com/v1.0/groups/'+groupId+'/owners/$ref';
            theUrl = 'https://graph.microsoft.com/beta/groups/'+groupId+'/owners/$ref';
          }else{
            // theUrl = 'https://graph.microsoft.com/v1.0/groups/'+groupId+'/members/$ref';
            theUrl = 'https://graph.microsoft.com/beta/groups/'+groupId+'/members/$ref';
          }

          return new Promise( (resolve,reject) =>{
            request.post(
              {
                url: theUrl,//'https://graph.microsoft.com/v1.0/groups/'+group.id+'/members/$ref', //3b0a7d5e-c464-4f82-87c2-87e6c1053a14
                headers:
                {
                  'content-type': 'application/json',
                  authorization: 'Bearer ' + token,
                },
                body: JSON.stringify(newUser)
              },
              function (err, resp, body)
              {
                if(err){reject(err);}
                 if(resp.statusCode == 204){
                   resolve(resp.statusCode);
                 }else{
                   try{
                     let error = JSON.parse(body).error;
                     if(error){
                       reject(error);
                     }else{
                       // console.log(body);
                       throw("response not a json");
                     }
                   }catch(error){
                     reject({"message":"expected Http status 204 but was " + resp.statusCode});
                   }
                 }
              });
            });
          };



          graph.getGroups = function (token)
          {

            return new Promise( (resolve,reject) =>{
              request.get('https://graph.microsoft.com/v1.0/groups', {
                auth: {
                  bearer: token
                }
              }, function (err, response, body) {
                let parsedBody ="";
                try{
                   parsedBody= JSON.parse(body)
                }catch(error){
                    console.log("ERROR",error);
                    reject(error);
                }
                if(err) reject(err);
                resolve(parsedBody);
              });
            });
          };


          graph.listMembers = function (token, groupId)
          {
            return new Promise( (resolve,reject) =>{
              request.get('https://graph.microsoft.com/v1.0/groups/'+groupId+'/members', {
                auth: {
                  bearer: token
                }
              }, function (err, response, body) {
                console.log("body: ",body);
                let parsedBody ="";
                try{
                   parsedBody= JSON.parse(body)
                   if(parsedBody.error){
                     reject(parsedBody.error);
                   }else{
                     resolve(parsedBody);
                   }
                }catch(error){
                    reject(error);
                }
                if(err) reject(err);
              });
            });
          };


          graph.listOwners = function (token, groupId)
          {
            return new Promise( (resolve,reject) =>{
              request.get('https://graph.microsoft.com/v1.0/groups/'+groupId+'/owners', {
                auth: {
                  bearer: token
                }
              }, function (err, response, body) {
                let parsedBody ="";
                try{
                   parsedBody= JSON.parse(body)
                }catch(error){
                    console.log("ERROR",error);
                    reject(error);
                }
                if(err) reject(err);
                resolve(body);
              });
            });
          };



          graph.updateUser = function (token, userId, attributeName, attributeValue)
          {
            let updateObject={};
            updateObject[attributeName]=attributeValue;
            updateJson = JSON.stringify(updateObject);
              console.log("updateUser userId", userId);
             console.log("update User Request",updateJson);
            return new Promise( (resolve,reject) =>{
              request.patch(
                {
                  url: 'https://graph.microsoft.com/v1.0/users/'+userId,
                  headers:
                  {
                    'content-type': 'application/json',
                    authorization: 'Bearer ' + token,
                  },
                  body: JSON.stringify(updateObject)
                },
                function (err, response, body)
                {
                   console.log("Update User Response", body);

                  if (err) {reject(err);}
                  if(response.statusCode === 204){
                    resolve(response.statusCode);
                  }else{
                    let error = JSON.parse(body).error;
                    if(error){
                      reject(error);
                    } else{
                      reject({"message":"expected Http status 204 but was " + response.statusCode});
                    }
                  }
                });
              });
            };


            graph.createGroup = function (token, displayName, mailNickname) {
              newTeam =
              {
                "displayName": displayName,
                "mailNickname": mailNickname,
                "groupTypes": [
                  "Unified"
                ],
                "securityEnabled": true,
                "mailEnabled": false
              };

              return new Promise( (resolve,reject) =>{
                request.post(
                  {
                    url: 'https://graph.microsoft.com/beta/groups',
                    headers:
                    {
                      'content-type': 'application/json',
                      authorization: 'Bearer ' + token,
                    },
                    body: JSON.stringify(newTeam)
                  },
                  function (err, response, body)
                  {
                    if (err) {reject(err);}
                    let theBody ={};
                    try{
                      theBody=JSON.parse(body);
                      if(theBody.error){reject(theBody.error);}
                    }catch(err){
                      console.log("ERROR",err);
                      reject(err);
                    }
                    resolve(theBody.id);
                  });
                });
              };

              graph.createTeam = function (token, groupId) {
                // console.log(token);
                // console.log(groupId);

                newTeam =
                {
                  "memberSettings": {
                    "allowCreateUpdateChannels": true
                  },
                  "messagingSettings": {
                    "allowUserEditMessages": true,
                    "allowUserDeleteMessages": true
                  },
                  "funSettings": {
                    "allowGiphy": true,
                    "giphyContentRating": "strict"
                  }
                };

                return new Promise( (resolve,reject) =>{
                  request.put(
                    {
                      url: 'https://graph.microsoft.com/beta/groups/'+groupId+'/team',
                      headers:
                      {
                        'content-type': 'application/json',
                        authorization: 'Bearer ' + token,
                      },
                      body: JSON.stringify(newTeam)
                    },
                    function (err, response, body)
                    {
                      if (err) {reject(err);}
                      let theBody ={};
                      try{
                        theBody=JSON.parse(body);
                        if(theBody.error) throw(theBody.error);
                      }catch(err){
                        reject(err);
                      }
                      resolve(theBody.id);
                    });
                  });
                };

                /**
                * token userPrincipalName to check if the user exists
                */
                graph.checkUser = function(token,userPrincipalName){
                  let url  = 'https://graph.microsoft.com/v1.0/users/'+userPrincipalName;
                  return new Promise( (resolve,reject) =>{
                    request.get(url, {
                      auth: {
                        bearer: token
                      }
                    }, function (err, response, body) {
                      let parsedBody ={} ;//JSON.parse(body);
                      try{
                        parsedBody = JSON.parse(body);
                        if(parsedBody.error) reject(parsedBody.error)
                      }catch(error){
                        // console.log("ERROR",err);
                        reject(error);
                      }
                      if(err) reject(err);
                      resolve(parsedBody);
                    }
                  );
                });

              }







//
// graph.createUserSchema = function (token, userId, attributeName)
// {
//   let updateObject={};
//   updateObject["@odata.type"]="Microsoft.Graph.OpenTypeExtension";
//   updateObject["extensionName"]=attributeName;
//   updateObject["attribute"]="";
//   updateJson = JSON.stringify(updateObject);
//   console.log("CreateUserSchema userID" , userId);
//   console.log("CreateUserSchema Request",updateJson);
//   return new Promise( (resolve,reject) =>{
//     request.post(
//       {
//         url: 'https://graph.microsoft.com/v1.0/users/'+userId+'/extensions',
//         headers:
//         {
//           'content-type': 'application/json',
//           authorization: 'Bearer ' + token,
//         },
//         body: JSON.stringify(updateObject)
//       },
//       function (err, response, body)
//       {
//         console.log("CreateUserSchemaResponse",body);
//         if (err) {reject(err);}
//         resolve(body);
//       });
//     });
//   };

graph.updateUserSchema = function (token, userId, extensionName, eIDASValue, uAegeanValue)
{
  let updateObject={};
  updateObject["@odata.type"]="Microsoft.Graph.OpenTypeExtension";
  updateObject["extensionName"]=extensionName;
  updateObject["eIDAS_ID"]=eIDASValue;
  updateObject["UAegeanID"]=uAegeanValue;
  updateJson = JSON.stringify(updateObject);


  console.log("Update User Schema Reqyest", updateJson);
  return new Promise( (resolve,reject) =>{
    request.post(
      {
        url: 'https://graph.microsoft.com/v1.0/users/'+userId+'/extensions',
        headers:
        {
          'content-type': 'application/json',
          authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(updateObject)
      },
      function (err, response, body)
      {
        console.log("Update User Schema Response",body);
        if (err) {reject(err);}
        resolve(body);
      });
    });
  };

graph.getUserSchema = function (token, userId, attributeName)
{
  return new Promise( (resolve,reject) =>{
    request.get(
      {
        url: 'https://graph.microsoft.com/v1.0/users/'+userId+'/extensions/'+attributeName,
        headers:
        {
          'content-type': 'application/json',
          authorization: 'Bearer ' + token,
        },
      },
      function (err, response, body)
      {
        // console.log(JSON.parse(body));
        if (err) {reject(err);}
        let parseBody = {};
        try{
          parseBody=JSON.parse(body);
        }catch(err){
          reject(err);
        }
        resolve(JSON.parse(body));
      });
    });
  };



  graph.getSkus = function (token)
  {
    return new Promise( (resolve,reject) =>{
      request.get(
        {
          url: 'https://graph.microsoft.com/beta/subscribedSkus',
          headers:
          {
            'content-type': 'application/json',
            authorization: 'Bearer ' + token,
          },
        },
        function (err, response, body)
        {
          // console.log(JSON.parse(body));
          if (err) {reject(err);}
          let parseBody = {};
          try{
            parseBody=JSON.parse(body);
          }catch(err){
            reject(err);
          }
          resolve(JSON.parse(body));
        });
      });
    };





graph.addLicenses = function (token, principal)
{
  let postData={};
  let skuId = config.defaultSku;
  // {
  //   "addLicenses": [
  //     {
  //       "disabledPlans": [ "11b0131d-43c8-4bbb-b2c8-e80f9a50834a" ],
  //       "skuId": "skuId-value-1"
  //     },
  //     {
  //       "disabledPlans": [ "a571ebcc-fqe0-4ca2-8c8c-7a284fd6c235" ],
  //       "skuId": "skuId-value-2"
  //     }
  //   ],
  //   "removeLicenses": []
  // }

  postData.addLicenses = [{
    "disabledPlans":[],
    "skuId": skuId
  }];
  postData.removeLicenses = []


  console.log(postData);
  return new Promise( (resolve,reject) =>{
    request.post(
      {
        url: ' https://graph.microsoft.com/beta/users/'+ principal +'/assignLicense',
        headers:
        {
          'content-type': 'application/json',
          authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(postData)
      },
      function (err, response, body)
      {
        console.log(body);
        if (err) {reject(err);}
        resolve(body);
      });
  });
};


graph.removeLicenses = function (token, principal)
{
  let postData={};
  let skuId = config.defaultSku;
  postData.addLicenses = [];
  postData.removeLicenses = [skuId]
  console.log(postData);
  return new Promise( (resolve,reject) =>{
    request.post(
      {
        url: ' https://graph.microsoft.com/beta/users/'+ principal +'/assignLicense',
        headers:
        {
          'content-type': 'application/json',
          authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(postData)
      },
      function (err, response, body)
      {
        console.log(body);
        if (err) {reject(err);}
        resolve(body);
      });
  });
};





module.exports = graph;
