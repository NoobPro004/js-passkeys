 const express = require("express");
 const crypto = require('node:crypto')
 const {generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions,verifyAuthenticationResponse} = require("@simplewebauthn/server")

 if(!globalThis.crypto){
    globalThis.crypto=crypto;
 }
 const PORT = 8000;
 const app =  express();

 app.use(express.static('./public'))
 app.use(express.json())

 const userStore={}
 const challengeStore = {}

 app.post('/register-challenge',async (req,res)=>{
    const {userId} = req.body;
    if(!userStore[userId])return res.status(404).json({'error': "user doesn't exists!"});
    const user = userStore[userId];
    const challengePayload = await generateRegistrationOptions({
        rpID : "localhost",
        rpName : 'My local machine',
        userName : user.username,
    })

    challengeStore[userId] = challengePayload.challenge

    return res.json({"options" : challengePayload})
 })

 app.post('/register',(req, res)=>{
    const {username, password} = req.body;
    const id = `user_${Date.now()}`

    const user={
        id,
        username,
        password
    }

    userStore[id]=user

    return res.json({id})
 })

 app.post('/register-verify',async (req,res)=>{
    const { userId, cred } = req.body
    if(!userStore[userId])return res.status(404).json({'error': "user doesn't exists!"});
    const challengeGiven = challengeStore[userId]
    const verificationResult = await verifyRegistrationResponse({
        expectedChallenge : challengeGiven,
        expectedOrigin : 'http://localhost:8000/',
        expectedRPID : 'localhost',
        response : cred,
    })

    if(!verificationResult.verified){
        return res.status(401).json({"error" : "could not verify!"});
    }

    userStore[userId].passkey = verificationResult.registrationInfo

    return res.json(
        {"verified":true}
    )
 })

 app.post('/login-challenge',async (req,res)=>{
    const {userId} = req.body;
    if(!userStore[userId])return res.status(404).json({'error': "user doesn't exists!"});
   
    const opts = await generateAuthenticationOptions({
        rpID :"localhost",
    })

    challengeStore[userId] = opts.challenge

    return res.json({"options":opts})

 })

 app.post('/login-verify',async (req,res)=>{
    const { userId, cred } = req.body
    const user = userStore[userId]
    if(!userStore[userId])return res.status(404).json({'error': "user doesn't exists!"});
    const challengeGiven = challengeStore[userId]
    const result = await verifyAuthenticationResponse({
        expectedChallenge : challengeGiven,
        expectedOrigin : 'http://localhost:8000/',
        expectedRPID : "localhost",
        response : cred,
        authenticator : user.passkey
    })

    if(!result.verified){
        res.status(403).json({"error" : "not verified!"})
    }

    res.json({"success":true, userId})

 })

 app.listen(PORT,()=>console.log("Server started on 8000"))