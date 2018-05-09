/*
Copyright IBM Corp. 2016 All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main

import (
	"fmt"
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
	"crypto/rand"
)



// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}
//Diploma Suplement Structure
type DiplomaSupplement struct {
	Owner string
	Name string
	Surname string
	University string
	Authorized []AuthorizedUser
	Id string
	Signature string
	Holder_Info HolderInfo
	Qualification_Info QualificationInfo
	Qualification_Level QualificationLevel
	Content_Info ContentInfo
	Qualification_Function QualificationFunction
	Additional_Info AdditionalInfo
	Supplement_Certification SupplementCertification
	HigherEducationSystem_Info HigherEducationSystemInfo
}


type HolderInfo struct{
	Name string
	DateOfBirth string
	StudentId string
}


type QualificationInfo struct{
	Name string
	FieldsOfStudy string
	InstitutionName string
	InstitutionStatus string
	InstructionLanguage string
}

type QualificationLevel struct{
	Level string
	ProgrammeLength string
	AccecssRequirements string
}

type ContentInfo struct{
	ModeOfStudy string
	ProgrammeRequirements string
	ProgrammeDetails  Programme_Details
	GradingScheme string
	OverallClassificationOfQualification string
}

type Programme_Details struct{
	Description string
	Modules []ModuleType
	Legend string
}


type ModuleType struct{
  ModuleCode string
  NameOfTheModule string
  TypeOfModule string
  ExamPeriod string
  Grade string
  InWriting string
}

type QualificationFunction struct{
	AccessToFurtherStudy string
	ProfessionalStatus string
}

type AdditionalInfo struct{
	AdditionalInfo string
	InfoSources string
}

type SupplementCertification struct{
	Date string
	Name string
	Capacity string
	Signature string
	Stamp string
}

type HigherEducationSystemInfo struct{
	HigherEductaionSystemInfo string
}



type SupplementsAsset struct{
	Supplements []DiplomaSupplement
}




type DiplomaSupplementInvitesAsset struct{
	DiplomaSupplementInvites map[string]DiplomaSupplementInvite
}


type DiplomaSupplementInvite struct {
	DSHash string
	DSId string
	Email string
	Code string
	Recipient string
}

// Structure that holds all the assets of the app
type Assets struct{
	// Supplements []DiplomaSupplement
	// DiplomaSupplementInvite map[string]DiplomaSupplementInvite
	//PublishRequests []PublishRequest
}

type AuthorizedUser struct{
	Email string
	Eid   string
}

type PublishRequest struct{  //name,eid,uniId,email,userEid
	Name  string
	Eid string
	Email string
	UniId string
	EidHash string
	University string
	DateOfBirth string
}

type PubRequestsAsset struct{
	Requests []PublishRequest
}


type CustomEvent struct{
	Message string
	Body   PublishRequest
	TxId   string
}



func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}


func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response  {

	// _, args := stub.GetFunctionAndParameters()

	// "list", slice in golang, that will hold the DiplomaSupplements as strings
	// var supplements = make([]DiplomaSupplement,0)

	//map that will hold the diplomasupplmet-hash-recipient map
	// var diplomaSupplementInvites = make(map[string]DiplomaSupplementInvite)

//  DiplomaSupplementInvite:diplomaSupplementInvites,
	assets := Assets{}
		//  Supplements:supplements}
	encodedAssets,err  := json.Marshal(assets)
	err = stub.PutState("assets", []byte(encodedAssets))
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}


func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {

	function, args := stub.GetFunctionAndParameters()

	if function == "publish"{
		return t.Publish(stub, args)
	}

	// if function == "addAuthorizedUser"{
	// 	return t.AddAuthorizedUser(stub, args)
	// }

	if function == "addDiplomaSupplementInvite"{
		return t.AddDiplomaSupplementInvite(stub,args)
	}

	if function == "addRecepientToDSInvite"{
		return t.AddRecepientToDSInvite(stub,args)
	}

	if function == "addCodeForDSInvite"{
		return t.AddCodeForDSInvite(stub,args)
	}

	if function == "uninvite"{
		return t.UninviteUsers(stub,args)
	}

	if function == "requestSupplementPublication"{
		return t.RequestSupplementPublication(stub,args)
	}

	//queries
	if function == "getSupplements" {
		return t.GetSupplements(stub, args)
	}

	if function == "getSupplementById"{
		return t.GetSupplementById(stub,args)
	}

	if function == "getDiplomaSupplementInvitesByHash" {
		return t.GetDiplomaSupplementInvitesByHash(stub,args)
	}



	return shim.Error(fmt.Sprintf("Unknown action. Got: %v", args[0]))
}

// ************************** QUERIES ***************************************************
















// --------------------------INVOKE TRANSACTIONS -----------------------------------------------------






	func SendSuccessEvent(stub shim.ChaincodeStubInterface, pubRequest PublishRequest, message string) pb.Response{
			event := CustomEvent{Message: message, Body: pubRequest, TxId : stub.GetTxID()}
			eventJSON,err := json.Marshal(event)
			if err != nil{
				SendErrorEvent(stub,"could not marshal event")
			}
			tosend := string(eventJSON)
			err = stub.SetEvent("evtsender", []byte(tosend))
			if err != nil {
				shim.Error(err.Error())
			}
			return shim.Success(nil);
	}


		//sends an errorEvent Message and returns the error
		func SendErrorEvent(stub shim.ChaincodeStubInterface, message string) pb.Response{
			tosend := message + "." + stub.GetTxID()
			err := stub.SetEvent("evtsender", []byte(tosend))
			if err != nil {
				shim.Error(err.Error())
			}
			return shim.Error(tosend)
		}


		func FindSupplementInSlice(s []DiplomaSupplement, supplementId string) (res DiplomaSupplement, pos int){
			pos = -1
			for index,element := range s {
				// element is the element from someSlice for where we are
				if element.Id == supplementId {
					res = element
					pos = index
				}
			}
			return res, pos
		}


		func FindDipSupInvInSlice(s []DiplomaSupplementInvite, dsHash string) (res DiplomaSupplementInvite, pos int){
			pos = -1
			for index,element := range s {
				// element is the element from someSlice for where we are
				if element.DSHash == dsHash {
					res = element
					pos = index
				}
			}
			return res, pos
		}





		/**
		A DiplomaSupplement slice, s
		The position of the supplement to remove, i
		**/
		func RemoveFromSupSlice(s []DiplomaSupplement, i int) []DiplomaSupplement {
			s[len(s)-1], s[i] = s[i], s[len(s)-1]
			return s[:len(s)-1]
		}


		/**
		A DiplomaSupplement slice, s
		The position of the supplement to remove, i
		**/
		func RemoveFromReqSlice(s []PublishRequest, i int) []PublishRequest {
			s[len(s)-1], s[i] = s[i], s[len(s)-1]
			return s[:len(s)-1]
		}

		/**
		A DiplomaSupplementInvite slice, s
		The position of the dsInv to remove, i
		**/
		func RemoveDipSupInvFromSlice(s []DiplomaSupplementInvite, i int) []DiplomaSupplementInvite {
			s[len(s)-1], s[i] = s[i], s[len(s)-1]
			return s[:len(s)-1]
		}

		/**
		A AuthorizedUser slice, s
		The position of the supplement to remove, i
		**/
		func RemoveAuthUserFromSlice(s []AuthorizedUser, i int) []AuthorizedUser {
			s[len(s)-1], s[i] = s[i], s[len(s)-1]
			return s[:len(s)-1]
		}


		/*
		make and return a random string of n-length
		*/
		func GetRandString(n int) string {
			b := make([]byte, n)
			if _, err := rand.Read(b); err != nil {
				fmt.Printf("Error making random string: %s", err)
			}
			return fmt.Sprintf("%X", b)
		}
