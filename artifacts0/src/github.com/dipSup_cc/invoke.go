package main

import (
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
	"strings"
)



//Adds a request by a user to the university to publish his DS
// PubRequests will be added using as key : The combination of  userEid + university
// New requests will replace old ones as a user might want to publish a newly obtained DS
func (t *SimpleChaincode) RequestSupplementPublication(stub shim.ChaincodeStubInterface, args []string)  pb.Response {
		if len(args) != 8 {
			return SendErrorEvent(stub,"Incorrect number of arguments. Expecting 8, the first is the userEid")
		}

		userEid := args[0]
		//name,eid,uniId,email,userEid,university
		name := args[1]
		eid := args[2]
		uniId := args[3]
		email  := args[4]
		eidHash := args[5]
		university := args[6]
		bday := args[7]

		//build the new key to put the PubRequest in the db (state)
		key := userEid + university

		isIssuedBySender  :=	( userEid == eid)
		if isIssuedBySender {
			request := PublishRequest{
				Name  : name,
				Eid : eid,
				Email : email,
				UniId : uniId,
				EidHash : eidHash,
				University : university,
 				DateOfBirth: bday }
			encodedReq,err  := json.Marshal(request)
			if err != nil {
				return SendErrorEvent(stub,"Could not Marshal PubRequest")
			}
			// put the asset in the state
			err = stub.PutState(key, []byte(encodedReq))
			if err != nil {
				SendErrorEvent(stub,"Could not put request to state")
			}

			//Execution of chaincode finishe successfully
			SendSuccessEvent(stub,request,"Tx chaincode finished OK.")
		}else{
			SendErrorEvent(stub,"Could not put assets to state")
		}

		return shim.Success(nil)
	}


/*
  Puts a new DiplomaSupplement to the state
  args[0] the DiplomaSupplement JSON string

	Requires that there exist a PubRequest with
	(request.EidHash == suplement.Owner) &&
 	(request.University == suplement.University)
*/
func (t *SimpleChaincode) Publish(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 2 {
	return SendErrorEvent(stub,  "Incorrect number of arguments. Expecting 2. The DS JSON and UserEid"  )
	}
	//encode into a DiplomaSupplement strct the argument
	suplementString := args[0]
	userEid := args[1]
	suplement := DiplomaSupplement{}
	json.Unmarshal([]byte(suplementString), &suplement)


	// invokerId, _ := stub.GetCreator()
	isIssuedBySender  :=	( userEid == suplement.University)

	if isIssuedBySender{
			//get the publication Request if it exists (key is userEid + university)
			pubRequestKey := suplement.Owner+suplement.University
			requestBytes, err := stub.GetState(pubRequestKey)
			if err != nil {
				return SendErrorEvent(stub,"{\"Error\":\"Failed to get state for key"+pubRequestKey+"  }" )
			}
			request := PublishRequest{}
			json.Unmarshal([]byte(requestBytes), &request)

			// assetBytes, err := stub.GetState("assets")
			// if err != nil {
			// 	return SendErrorEvent(stub,"{\"Error\":\"Failed to get state for key"+pubRequestKey+"  }" )
			// }
			// assets := Assets{}
			// json.Unmarshal([]byte(assetBytes), &assets)
			//
			// //apend the received supplement to the assets
			// supplementSlice := assets.Supplements
			// supplementSlice = append(supplementSlice,suplement)
			// assets.Supplements = supplementSlice

			//update the state with the new assets
			encodedSupplement,err  := json.Marshal(suplement)
			if err != nil {
				return SendErrorEvent(stub, "Could not  marshal Supplement")
			}
			//the key of the supplement is its Id
			err = stub.PutState(suplement.Id, []byte(encodedSupplement))
			if err != nil {
				return SendErrorEvent(stub,"Could not place Supplement in the state" )
			}

			//add a composite key in the sate for easy query
			// this composite key will be suplement.Id ~ suplement.Owner
			// this will allow us to query supplements based on Owner
			indexName := "Owner~Id"
			idOwnerIndexKey, err := stub.CreateCompositeKey(indexName, []string{suplement.Owner,suplement.Id})
			if err != nil {
				return SendErrorEvent(stub,"Could not  make composite key for values " + suplement.Id +"::"+ suplement.Owner )
			}
			//  Save index entry to state. Only the key name is needed, no need to store a duplicate copy of the DS.
			//  Note - passing a 'nil' value will effectively delete the key from state, therefore we pass null character as value
			value := []byte{0x00}
			stub.PutState(idOwnerIndexKey, value)

			//remove the PublicationRequest from the state since it was satisfied
			err = stub.DelState(pubRequestKey)
			//Execution of chaincode finished successfully
			return SendSuccessEvent(stub,PublishRequest{},"Tx chaincode finished OK.")
		}else{
			return SendErrorEvent(stub," Identities not match, expecting " + suplement.University + " found " + userEid )
		}
		return shim.Success(nil)
}



		// Puts a new DSMAp to the state
		// args[0] the DSMAP  JSON string
		// Only a user that has the attribute typeOfUser = Student can invoke this transaction with success
		// and he has to be the owner of the supplment as that is identified by the DSId fieled of the DSMAP struct
		//
		// The invites are stored in teh state using teh DSHash value (which is unique)
		func (t *SimpleChaincode) AddDiplomaSupplementInvite(stub shim.ChaincodeStubInterface, args []string)  pb.Response {
			if len(args) != 2 {
				return SendErrorEvent(stub,"Incorrect number of arguments. Expecting 2. DSInvite and UserEid")
			}

			//encode into a DiplomaSupplementInvite from strct the argument
			dsinviteString := args[0]
			dsinvite := DiplomaSupplementInvite{}
			json.Unmarshal([]byte(dsinviteString), &dsinvite)
			senderEid := args[1]


			suplementId := dsinvite.DSId


			assetBytes, err := stub.GetState("assets")
			if err != nil {
				return SendErrorEvent(stub, "Error, Failed to get state for key \"assets\"" )
			}
			assets := Assets{}
			json.Unmarshal([]byte(assetBytes), &assets)
			//
			supplementBytes,err := stub.GetState(suplementId)
			if err != nil{
				return SendErrorEvent(stub, "Error, No Supplement Found with the given ID:: " + suplementId + ".")
			}
			supplement := DiplomaSupplement{}
			json.Unmarshal([]byte(supplementBytes), &supplement)
			//
			// //check if the supplement is issued by the user sending the transaction
			// isIssuedBySender, _ := stub.VerifyAttribute("eID", []byte(supplement.Owner))
			//
			if senderEid == supplement.Owner{
		 		encodedInvite,err := json.Marshal(dsinvite)
				if err != nil {
					return SendErrorEvent(stub, "Error, Marshaling Invite" )
				}
				//put the invite in the state
				err = stub.PutState(dsinvite.DSHash, []byte(encodedInvite))
				if err != nil {
					return SendErrorEvent(stub,  "Error,putting INVITE back in state" )
				}
			// 	//Execution of chaincode finishe successfully
				return SendSuccessEvent(stub,PublishRequest{},"Tx chaincode finished OK.")
			}else{
				return SendErrorEvent(stub,  "Owner and sender do not match " + senderEid +","+ supplement.Owner)
			}
			return shim.Success(nil)
		}



		/*
		Adds the given recepientEid (args[1]) as the the Recepient of the DiplomaSupplementInvite
		which is identified by the give DSHash (args[0]) and updates the authorized users of
		the actual diplpoma supplement
		*/
		func (t *SimpleChaincode) AddRecepientToDSInvite(stub shim.ChaincodeStubInterface, args []string) pb.Response {
			if len(args) != 3 {
				return SendErrorEvent(stub,"Wrong number of arguments, Expecting 3")
			}
			// //encode into a DiplomaSupplementInvite from strct the argument
			dsHash := args[0]
			recepientEid := args[1]
			emailedCode := args[2]

			//
			//find the DSInvite in the state
			dsInvBytes,err:= stub.GetState(dsHash)
			if err == nil {
				dsInv := DiplomaSupplementInvite{}
				json.Unmarshal([]byte(dsInvBytes), &dsInv)
				if dsInv.Recipient != "" {
					return SendErrorEvent(stub, "Error, DiplomaSupplementInvite is already finalized! Cannot add new Recipient!")
				}else{
						if dsInv.Code != emailedCode {
							return SendErrorEvent(stub,  "Error, Wrong Authorization code!")
						}else{
			// 					//update the DSInvite
								dsInv.Recipient = recepientEid
								encodedInvite,err := json.Marshal(dsInv)
								if err != nil {
									return SendErrorEvent(stub,"Error, Marshaling invite")
								}
								err = stub.PutState(dsHash, []byte(encodedInvite))
								if err != nil {
									return SendErrorEvent(stub,"Error, putting invite")
								}

								suplementId := dsInv.DSId
								supToUpdateBytes,err := stub.GetState(suplementId)
								if err != nil {
									return SendErrorEvent(stub,"Error, No supplement found for the given ID::" +suplementId+".")
								}
								supToUpdate := DiplomaSupplement{}
								json.Unmarshal([]byte(supToUpdateBytes), &supToUpdate)

								authorizedUserEntry  := AuthorizedUser{Email:dsInv.Email, Eid: recepientEid}
								supToUpdate.Authorized = append(supToUpdate.Authorized,authorizedUserEntry)

								encodedSupplement,err  := json.Marshal(supToUpdate)
								if err != nil {
									return SendErrorEvent(stub,"Error, Marshaling Supplement")
								}
								err = stub.PutState(suplementId, []byte(encodedSupplement))
								if err != nil {
									return SendErrorEvent(stub,"Error, putting assets")
								}
			// 					//Execution of chaincode finishe successfully
								return SendSuccessEvent(stub,PublishRequest{},"Tx chaincode finished OK.")
							}
				}
		}else{
				return SendErrorEvent(stub, "Error, No DiplomaSupplementInvite Found with the given hash " + dsHash)
	}
	return  shim.Success(nil)
}



func (t *SimpleChaincode) AddCodeForDSInvite(stub shim.ChaincodeStubInterface, args []string) pb.Response {
		if len(args) != 2 {
			return SendErrorEvent(stub,"Incorrect number of arguments. Expecting 2")
		}
		dsHash := args[0]
		emailCode := args[1]
		// //get the assets from the state
		assetBytes, err := stub.GetState("assets")
		if err != nil {
			return SendErrorEvent(stub,"{Error : Failed to get state for key  assets}")
		}
		assets := Assets{}
		json.Unmarshal([]byte(assetBytes), &assets)
		//
		// //find the DSInvite in the state
		dsInvBytes,err := stub.GetState(dsHash)

		if err == nil {
			dsInv := DiplomaSupplementInvite{}
			json.Unmarshal([]byte(dsInvBytes), &dsInv)

			if dsInv.Recipient != "" {
				return SendErrorEvent(stub,"Error, DiplomaSupplementInvite is already finalized! Cannot add new Recipient!")
			}else{
				dsInv.Code = emailCode
			// //update the assets and put them in the state
			// //update the DSInvite
				encodedInvite,err := json.Marshal(dsInv)
				if err != nil {
					return SendErrorEvent(stub,"Error, encoding invite")
				}
				err = stub.PutState(dsHash, []byte(encodedInvite))

				if err != nil {
					return SendErrorEvent(stub,"Error,putting invite back in state")
				}
			// //Execution of chaincode finishe successfully
			 	return SendSuccessEvent(stub,PublishRequest{},"Tx chaincode finished OK.")
				}
		}else{
			return SendErrorEvent(stub,"Error, No DiplomaSupplementInvite Found with the given hash " + dsHash )
		}
	return shim.Success(nil)
}




//takes as input the supplementID and
// a list of users that will be removed from the authorizedUsers
//of that supplement
func (t *SimpleChaincode) UninviteUsers(stub shim.ChaincodeStubInterface, args []string)  pb.Response {
		if len(args) != 3 {
			return SendErrorEvent(stub,"Incorrect number of arguments. Expecting 3")
		}
		// //the DiplomaSupplement id
		suplementId := args[0]
		emailsString := args[1]
		sender := args[2]

		emailsArray := strings.Split(emailsString,";")

		//
		//get the supplement
		supplementBytes, err := stub.GetState(suplementId)
		if err != nil {
			return SendErrorEvent(stub,"Failed to get state for key \""+suplementId+"\"")
		}
		//get the supplements from the assets
		supToUpdate := DiplomaSupplement{}
		json.Unmarshal([]byte(supplementBytes), &supToUpdate)

		if supToUpdate.Owner == sender {
		// // authorizedUsers := supToUpdate.Authorized
		for _, mail := range emailsArray{
			for index, authUser := range supToUpdate.Authorized {
				if mail == authUser.Email {
					supToUpdate.Authorized = RemoveAuthUserFromSlice(supToUpdate.Authorized,index)
					break
				}
			}
		}

		// //update the state with the updated supplement
		encodedSupplement,err  := json.Marshal(supToUpdate)
		if err != nil {
			return SendErrorEvent(stub,"Error Marshaling Supplement")
		}
		err = stub.PutState(suplementId, []byte(encodedSupplement))
		if err != nil {
			return SendErrorEvent(stub,"Error putting supplement")
		}
		// //Execution of chaincode finishe successfully
			return SendSuccessEvent(stub,PublishRequest{},"Tx chaincode finished OK.")
		}else{
			return SendErrorEvent(stub,"User not allowed to do this action")
		}
	return shim.Success(nil)
}
