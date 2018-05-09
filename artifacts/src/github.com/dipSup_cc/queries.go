package main

import (
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
	)


/**
  Get all supplements that belong to a user submitting  the query
  If the user is a University all the supplements of teh University will be returned
  else, the supplements that denote him as the owner will only be returned
**/
func (t *SimpleChaincode) GetSupplements(stub shim.ChaincodeStubInterface, args []string) pb.Response {

  if len(args) != 1 {
    return shim.Error("Expectiong one argument! The userId")
  }

  userEid := args[0]

  //get all supplements from the state
  assetBytes, err := stub.GetState("assets")
  if err != nil {
    return shim.Error("{\"Error\":\"Failed to get state for key \"assets\"}")
  }
  res := Assets{}
  json.Unmarshal([]byte(assetBytes), &res)


  matchingSupplements := make([]DiplomaSupplement,0)

	// Query the "Owner~Id" index by Owner
	// This will execute a key range query on all keys starting with 'Owner'
	supplementsResultsIterator, err := stub.GetStateByPartialCompositeKey("Owner~Id", []string{userEid})
	if err != nil{
		return shim.Error(err.Error())
	}
	defer supplementsResultsIterator.Close()


	for  supplementsResultsIterator.HasNext() {
		responseRange, err := supplementsResultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// get the Id and Owner from Owner~Id composite key
		_, compositeKeyParts, err := stub.SplitCompositeKey(responseRange.Key)
		if err != nil {
			return shim.Error(err.Error())
		}
		returnedId := compositeKeyParts[1] //the supplementID
		// returnedOwner := compositeKeyParts[0]

    // element is the element from someSlice for where we are
		supBytes, err := stub.GetState(returnedId)
		if err != nil {
			return shim.Error("{\"Error\":\"Failed to get state for key \""+returnedId+"\"}")
		}
		element := DiplomaSupplement{}
		json.Unmarshal([]byte(supBytes), &element)
    // if element.University == userEid  || element.Owner == userEid {
    matchingSupplements = append(matchingSupplements,element)
    // }

	}

  encodedSupps,_ := json.Marshal(matchingSupplements)
  return shim.Success([]byte(encodedSupps))
}




	/**
			Get all the DiplomaSupplementInvites using its key (i.e. DS hash)
	**/
	func (t *SimpleChaincode) GetDiplomaSupplementInvitesByHash(stub shim.ChaincodeStubInterface, args []string) pb.Response {

		if len(args) != 1 {
			return shim.Error("Incorrect number of arguments. Expecting the hash of the diplomaSupplement")
		}
		dsHash := args[0]
		inviteBytes, err := stub.GetState(dsHash)
		if err != nil {
			return shim.Error("{\"Error\":\"Failed to get state for key \""+dsHash+"\"}")
		}
		res := DiplomaSupplementInvite{}
		json.Unmarshal([]byte(inviteBytes), &res)

		encodedRes,_ := json.Marshal(res)
		return shim.Success([]byte(encodedRes))

}




    /**
    Get the supplement by the given id, if the user
    belongs to the Authorized Users for the supplemnt, or the user
    is the owner of the supplement
    **/
    func (t *SimpleChaincode) GetSupplementById(stub shim.ChaincodeStubInterface, args []string) pb.Response {

      if len(args) != 2 {
        return shim.Error("Incorrect number of arguments. Expecting the SupplementId and UserEid to query")
      }
      suplementId := args[0]
      userEid := args[1]

      supplementBytes, err := stub.GetState(suplementId)
      if err != nil {
        return shim.Error("{\"Error\":\"Failed to get state for key \""+suplementId+"\"}")
      }
      supplement := DiplomaSupplement{}
      json.Unmarshal([]byte(supplementBytes), &supplement)
      authorizedUsers   := supplement.Authorized
      isAllowed := false

      if userEid == supplement.Owner || userEid == supplement.University{
        isAllowed = true
        }	else{
          for _,element := range authorizedUsers {
            // element is the element from someSlice for where we are
            if userEid == element.Eid {
              isAllowed = true
            }
          }
        }

        if isAllowed{
          encodedResult,err  := json.Marshal(supplement)
          if err != nil {
            return shim.Error("error marshalling supplement")
          }
          return shim.Success([]byte(encodedResult))
          }else{
            return shim.Error("User not Authorized to see this supplement")
          }
        }
